import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const profile = __ENV.K6_PROFILE;
const base = (__ENV.K6_QA_BASE_URL || '').replace(/\/$/, '');
const token = __ENV.K6_AUTH_TOKEN;
if (!['rnf20', 'load50'].includes(profile)) throw new Error('K6_PROFILE debe ser rnf20 o load50.');
if (!/^https:\/\/citaweb-api-qa(?:-[a-z0-9]+)?\.onrender\.com\/api$/.test(base)) {
  throw new Error('K6_QA_BASE_URL debe identificar la API de QA desplegada.');
}
if (!token) throw new Error('Falta K6_AUTH_TOKEN de un usuario exclusivo de QA.');

const slotsDuration = new Trend('slots_duration_ms', true);
const appointmentsDuration = new Trend('appointments_duration_ms', true);
const slotsRequests = new Counter('slots_requests');
const appointmentsRequests = new Counter('appointments_requests');
const slotsErrors = new Rate('slots_errors');
const appointmentsErrors = new Rate('appointments_errors');
const target = profile === 'rnf20' ? 20 : 50;
const hold = profile === 'rnf20' ? '1m' : '5m';
const thresholds = {
  checks: ['rate==1'],
  slots_errors: ['rate==0'],
  appointments_errors: ['rate==0'],
};
if (profile === 'rnf20') {
  thresholds.slots_duration_ms = ['p(95)<=2000'];
  thresholds.appointments_duration_ms = ['p(95)<=2000'];
}

export const options = {
  scenarios: {
    [profile]: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target },
        { duration: hold, target },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
      gracefulStop: '15s',
    },
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

const params = endpoint => ({
  headers: { Authorization: `Bearer ${token}` },
  tags: { endpoint, profile },
  timeout: '20s',
});

export function setup() {
  const health = http.get(`${base}/health`, { timeout: '60s' });
  if (health.status !== 200) fail('QA no está saludable; no se inicia la carga.');
  const identity = http.get(`${base}/auth/me`, params('preflight'));
  if (identity.status !== 200) fail('El token de QA no es válido; no se inicia la carga.');
  const date = new Date(Date.now() - 6 * 60 * 60 * 1000);
  date.setUTCDate(date.getUTCDate() + 1);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  return { date: date.toISOString().slice(0, 10) };
}

export default function (context) {
  const slots = http.get(`${base}/slots?date=${context.date}`, params('slots'));
  let slotsOk = false;
  try {
    const body = slots.json();
    slotsOk = slots.status === 200 && body.date === context.date && Array.isArray(body.available);
  } catch { /* A non-JSON response is recorded as a functional error. */ }
  slotsDuration.add(slots.timings.duration);
  slotsRequests.add(1);
  slotsErrors.add(!slotsOk);
  check(slots, { 'disponibilidad válida': () => slotsOk });

  const appointments = http.get(`${base}/appointments`, params('appointments'));
  let appointmentsOk = false;
  try {
    appointmentsOk = appointments.status === 200 && Array.isArray(appointments.json().appointments);
  } catch { /* The failed response remains in the error rate. */ }
  appointmentsDuration.add(appointments.timings.duration);
  appointmentsRequests.add(1);
  appointmentsErrors.add(!appointmentsOk);
  check(appointments, { 'listado de citas válido': () => appointmentsOk });
  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  function endpoint(prefix) {
    const durations = metrics[`${prefix}_duration_ms`]?.values;
    const requests = metrics[`${prefix}_requests`]?.values;
    return {
      requests: requests?.count || 0,
      throughput_requests_per_second: requests?.rate ?? null,
      average_ms: durations?.avg ?? null,
      p95_ms: durations?.['p(95)'] ?? null,
      error_rate: metrics[`${prefix}_errors`]?.values?.rate ?? null,
    };
  }
  const endpoints = { slots: endpoint('slots'), appointments: endpoint('appointments') };
  const report = {
    measuredAt: new Date().toISOString(), profile, baseUrl: base,
    targetVUs: target, scheduledHoldSeconds: profile === 'rnf20' ? 60 : 300,
    activeVUsObserved: metrics.vus?.values?.max ?? null,
    endpoints,
    rnf01: profile === 'rnf20' ? {
      criterion: 'P95 <= 2000 ms hasta 20 usuarios concurrentes',
      latencyMet: Object.values(endpoints).every(value => value.requests > 0 && value.p95_ms <= 2000),
    } : { criterion: 'Escenario adicional E14 de 50 VUs; RNF-01 se evalúa con rnf20.' },
  };
  return {
    [`artifacts/load-${profile}-summary.json`]: JSON.stringify(data, null, 2),
    [`artifacts/load-${profile}-report.json`]: JSON.stringify(report, null, 2),
    stdout: JSON.stringify(report, null, 2) + '\n',
  };
}
