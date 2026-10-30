import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
  throw new Error('Este ejecutor solo usa la API local de CI.');
}
if (!process.env.API_ADMIN_EMAIL || !process.env.API_ADMIN_PASSWORD) {
  throw new Error('Faltan credenciales del administrador de CI.');
}
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const newman = require('newman');
const summary = await new Promise((resolve, reject) => newman.run({
  collection: JSON.parse(readFileSync('tests/api/CitaWeb.postman_collection.json', 'utf8')),
  envVar: [
    { key: 'baseUrl', value: baseUrl },
    { key: 'adminEmail', value: process.env.API_ADMIN_EMAIL },
    { key: 'adminPassword', value: process.env.API_ADMIN_PASSWORD },
  ],
  reporters: ['cli'], timeoutRequest: 10000,
}, (error, result) => error ? reject(error) : resolve(result)));
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/api-ci.json', JSON.stringify({
  measuredAt: new Date().toISOString(),
  environment: 'Local Express API with real disposable PostgreSQL in CI',
  commit: process.env.GITHUB_SHA || null,
  stats: summary.run.stats,
  failures: summary.run.failures.map(f => ({ source: f.source?.name, message: f.error?.message })),
  executions: summary.run.executions.map(e => ({
    name: e.item.name, method: e.request.method, statusCode: e.response?.code,
    assertions: e.assertions?.map(a => ({ name: a.assertion, passed: !a.error })),
  })),
}, null, 2));
if (summary.run.failures.length || summary.run.stats.requests.total < 15 || summary.run.stats.assertions.total < 45) {
  process.exitCode = 1;
}
