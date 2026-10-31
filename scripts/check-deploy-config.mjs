import { assertDeploymentTarget } from './deployment-target.mjs';
const required = ['RENDER_DEPLOY_HOOK_URL', 'RENDER_API_KEY', 'BACKEND_HEALTH_URL', 'VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) throw new Error(`Falta configuracion del ambiente: ${missing.join(', ')}`);
const hook = new URL(process.env.RENDER_DEPLOY_HOOK_URL);
if (hook.protocol !== 'https:' || hook.hostname !== 'api.render.com' || !hook.pathname.startsWith('/deploy/srv-')) {
  throw new Error('El deploy hook debe ser una URL HTTPS oficial de Render.');
}
if (new URL(process.env.BACKEND_HEALTH_URL).protocol !== 'https:') throw new Error('El health check cloud requiere HTTPS.');
assertDeploymentTarget(process.env);
console.log('Destinos de despliegue verificados; valores secretos omitidos.');
