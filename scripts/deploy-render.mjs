import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { assertDeploymentTarget } from './deployment-target.mjs';

assertDeploymentTarget(process.env);

const hook = new URL(process.env.RENDER_DEPLOY_HOOK_URL || '');
if (hook.protocol !== 'https:' || hook.hostname !== 'api.render.com' || !hook.pathname.startsWith('/deploy/srv-')) {
  throw new Error('Deploy hook de Render invalido.');
}
if (!process.env.RENDER_API_KEY || !process.env.BACKEND_HEALTH_URL || !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '')) {
  throw new Error('Faltan credenciales, health URL o commit exacto del pipeline.');
}
hook.searchParams.set('ref', process.env.GITHUB_SHA);
const trigger = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(30000) });
if (!trigger.ok) throw new Error(`Render rechazo el despliegue: HTTP ${trigger.status}.`);
const deployId = (await trigger.json()).deploy?.id;
if (!deployId) throw new Error('Render no devolvio un ID verificable del despliegue.');
const serviceId = hook.pathname.split('/').at(-1);
let live = false;
for (let attempt = 0; attempt < 80; attempt++) {
  const status = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys/${deployId}`, {
    headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!status.ok) throw new Error(`No se pudo consultar Render: HTTP ${status.status}.`);
  const deploy = await status.json();
  if (deploy.commit?.id !== process.env.GITHUB_SHA) throw new Error('Render no identifica el commit exacto aprobado.');
  console.log(`Render ${deployId}: ${deploy.status}`);
  if (deploy.status === 'live') {
    live = true;
    break;
  }
  if (['build_failed', 'update_failed', 'canceled', 'pre_deploy_failed', 'deactivated'].includes(deploy.status)) {
    throw new Error(`El despliegue termino con estado ${deploy.status}.`);
  }
  await delay(15000);
}
if (!live) throw new Error('Render no alcanzo estado live dentro del plazo.');
const health = await fetch(process.env.BACKEND_HEALTH_URL, { signal: AbortSignal.timeout(60000) });
if (!health.ok || (await health.json()).ok !== true) throw new Error('El health check del backend desplegado fallo.');
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/render-deploy.json', JSON.stringify({
  measuredAt: new Date().toISOString(), commit: process.env.GITHUB_SHA,
  branch: process.env.GITHUB_REF_NAME, deployId, status: 'live', health: 'passed',
}, null, 2));
