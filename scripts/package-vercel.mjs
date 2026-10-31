import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';

if (!existsSync('frontend/dist/index.html')) throw new Error('Falta el frontend compilado y aprobado por CI.');
mkdirSync('frontend/.vercel/output', { recursive: true });
cpSync('frontend/dist', 'frontend/.vercel/output/static', { recursive: true });
writeFileSync('frontend/.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [{ handle: 'filesystem' }, { src: '/.*', dest: '/index.html' }],
}, null, 2));
console.log('Artefacto Vercel preparado a partir del frontend compilado por CI.');
