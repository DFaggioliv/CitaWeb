import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const manifest = JSON.parse(readFileSync('docs/fase2/baseline-source-sha256.json', 'utf8'));
const sources = Object.keys(manifest).filter(path => /^(backend|frontend)\/src\//.test(path));
for (const path of sources) {
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual !== manifest[path]) {
    throw new Error(`El código original cambió: ${path}. No se sobrescribe la línea base. Use la copia original para repetirla.`);
  }
}
const execution = spawnSync(process.execPath, [
  'backend/node_modules/vitest/vitest.mjs', 'run',
  '--config', 'vitest.baseline.config.mjs', '--coverage',
], { encoding: 'utf8' });
process.stdout.write(execution.stdout || '');
process.stderr.write(execution.stderr || '');
if (execution.error) throw execution.error;
if (execution.status !== 0) process.exit(execution.status || 1);
writeFileSync('coverage/baseline/execution.txt', (execution.stdout || '') + (execution.stderr || ''));
writeFileSync('coverage/baseline/metadata.json', JSON.stringify({
  measuredAt: new Date().toISOString(),
  timezone: 'America/Guatemala',
  sourceCommit: 'addbcaa10645c35cf92caebae286b34ae72fb2e2',
  method: 'Retrospective measurement: no original application test suite; one infrastructure-only check.',
  node: process.version,
  framework: JSON.parse(readFileSync('backend/node_modules/vitest/package.json', 'utf8')).version,
  sourceHashes: Object.fromEntries(sources.map(path => [path, manifest[path]])),
}, null, 2));
