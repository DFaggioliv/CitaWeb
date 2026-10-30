import { readFileSync } from 'node:fs';

const baseline = JSON.parse(readFileSync('coverage/baseline/coverage-summary.json', 'utf8'));
const current = JSON.parse(readFileSync(process.argv[2] || 'coverage/ci/coverage-summary.json', 'utf8'));
const initial = baseline.total.lines.pct;
const final = current.total.lines.pct;
const difference = Number((final - initial).toFixed(2));
const requiredFiles = ['backend/src/auth.js', 'backend/src/utils.js', 'backend/src/db.js', 'frontend/src/api.js', 'frontend/src/main.jsx'];
const normalized = Object.keys(current).map(key => key.replaceAll('\\', '/'));
for (const file of requiredFiles) {
  if (!normalized.some(key => key.endsWith('/' + file))) throw new Error(`Falta un archivo del alcance: ${file}`);
}
const hasOldServer = normalized.some(key => key.endsWith('/backend/src/server.js'));
const hasNewApp = normalized.some(key => key.endsWith('/backend/src/app.js'));
if (!hasOldServer || !hasNewApp) throw new Error('Falta el alcance completo de las rutas y el arranque.');
console.log(`Cobertura de líneas: ${initial}% -> ${final}% (${difference} puntos porcentuales).`);
if (difference < 20) throw new Error('No se alcanzó el incremento mínimo de 20 puntos porcentuales.');
