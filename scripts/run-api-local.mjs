import { createRequire, registerHooks } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { newDb, DataType } = require('pg-mem');
const newman = require('newman');
const bcrypt = require('bcryptjs');
const database = newDb();
for (const type of [DataType.date, DataType.time]) {
  database.public.registerFunction({
    name: 'to_char', args: [type, DataType.text], returns: DataType.text,
    implementation: (value, format) => {
      if (format === 'YYYY-MM-DD') return new Date(value).toISOString().slice(0, 10);
      if (format === 'HH24:MI') return String(value).slice(0, 5);
      throw new Error(`Unsupported test formatting: ${format}`);
    },
  });
}
database.public.none(readFileSync('backend/sql/init.sql', 'utf8'));
const { Pool } = database.adapters.createPg();
const pool = new Pool();
const adminEmail = 'qa-admin@example.invalid';
const adminPassword = randomBytes(24).toString('hex');
await pool.query(
  "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",
  ['Admin API QA', adminEmail, await bcrypt.hash(adminPassword, 10)],
);
globalThis.__citawebTestPool = pool;
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './db.js' && context.parentURL?.endsWith('/backend/src/app.js')) {
      return { url: 'data:text/javascript,export const pool = globalThis.__citawebTestPool;', shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
let server;
try {
  const { default: app } = await import('../backend/src/app.js');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const summary = await new Promise((resolve, reject) => newman.run({
    collection: JSON.parse(readFileSync('tests/api/CitaWeb.postman_collection.json', 'utf8')),
    envVar: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'adminEmail', value: adminEmail },
      { key: 'adminPassword', value: adminPassword },
    ],
    reporters: ['cli'], timeoutRequest: 10000,
  }, (error, result) => error ? reject(error) : resolve(result)));
  const report = {
    measuredAt: new Date().toISOString(),
    environment: 'Local HTTP API with pg-mem (simulated PostgreSQL; no Neon connection).',
    versions: {
      node: process.version,
      newman: require('newman/package.json').version,
      pgMem: require('pg-mem/package.json').version,
    },
    stats: summary.run.stats,
    failures: summary.run.failures.map(f => ({ source: f.source?.name, message: f.error?.message })),
    executions: summary.run.executions.map(e => ({
      name: e.item.name, method: e.request.method, statusCode: e.response?.code,
      responseTimeMs: e.response?.responseTime,
      assertions: e.assertions?.map(a => ({ name: a.assertion, passed: !a.error })),
    })),
  };
  mkdirSync('docs/fase2/api', { recursive: true });
  writeFileSync('docs/fase2/api/resultado-local.json', JSON.stringify(report, null, 2));
  if (summary.run.failures.length) process.exitCode = 1;
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  hooks.deregister();
  await pool.end();
  delete globalThis.__citawebTestPool;
}
