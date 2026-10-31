import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const base = 'https://citaweb-api-qa.onrender.com/api';
const revision = process.env.K6_TESTED_COMMIT;
if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Falta K6_TESTED_COMMIT verificado previamente en Render QA.');
const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(60000) });
if (!health.ok || (await health.json()).ok !== true) throw new Error('QA no está saludable.');
const created = await fetch(`${base}/auth/register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Prueba de carga QA', email: `load-${randomBytes(8).toString('hex')}@example.invalid`, password: randomBytes(24).toString('hex') }),
  signal: AbortSignal.timeout(60000),
});
if (created.status !== 201) throw new Error(`No se pudo crear la cuenta exclusiva QA: HTTP ${created.status}.`);
const identity = await created.json();
if (!identity.token || identity.user.role !== 'user') throw new Error('Identidad QA inesperada.');
mkdirSync('artifacts', { recursive: true });
mkdirSync('docs/fase2/carga', { recursive: true });
const execution = { startedAt: new Date().toISOString(), commit: revision, baseUrl: base, qaUserId: identity.user.id, profiles: [] };
for (const profile of ['rnf20', 'load50']) {
  const startedAt = new Date().toISOString();
  console.log(`Iniciando ${profile}: ${startedAt}`);
  const log = createWriteStream(`artifacts/load-${profile}.log`);
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(resolve('../tools/k6/k6.exe'), ['run', '--quiet', '--no-color', '--out', `json=artifacts/load-${profile}-timeseries.json`, 'tests/load/citaweb.js'], {
      env: { ...process.env, K6_PROFILE: profile, K6_QA_BASE_URL: base, K6_AUTH_TOKEN: identity.token }, windowsHide: true,
    });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('error', reject);
    child.on('close', code => log.end(() => resolveResult(code)));
  });
  const endedAt = new Date().toISOString();
  const report = JSON.parse(readFileSync(`artifacts/load-${profile}-report.json`, 'utf8'));
  execution.profiles.push({ profile, startedAt, endedAt, exitCode: result, report });
  writeFileSync('docs/fase2/carga/ejecucion.json', JSON.stringify(execution, null, 2));
  console.log(JSON.stringify({ profile, exitCode: result, endedAt, endpoints: report.endpoints, rnf01: report.rnf01 }));
}
console.log('Ambos perfiles terminaron. Resultados conservados sin credenciales.');

if (execution.profiles.some(profile => profile.exitCode !== 0)) process.exitCode = 1;
