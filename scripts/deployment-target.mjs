const targets = {
  QA: { serviceId: 'srv-dbihe2cipgvc73bj88h0', health: 'https://citaweb-api-qa.onrender.com/api/health', projectId: 'prj_wIvc5leqYY7U7iHaKK2nZKJ1tjF9' },
  main: { serviceId: 'srv-darl517pn0mc73d12n2g', health: 'https://citaweb-api.onrender.com/api/health', projectId: 'prj_ARshwiB7v0ImmPxPDqXudpy088GA' },
};
export function assertDeploymentTarget(env) {
  const target = targets[env.GITHUB_REF_NAME === 'PROD' ? 'main' : env.GITHUB_REF_NAME];
  if (!target) throw new Error('El ambiente no tiene destinos de despliegue verificados.');
  const hook = new URL(env.RENDER_DEPLOY_HOOK_URL || '');
  if (hook.protocol !== 'https:' || hook.hostname !== 'api.render.com' || hook.pathname !== `/deploy/${target.serviceId}`) throw new Error('El deploy hook no corresponde al servicio del ambiente.');
  if (env.BACKEND_HEALTH_URL !== target.health) throw new Error('El health check no corresponde al ambiente.');
  if (env.VERCEL_PROJECT_ID !== target.projectId || env.VERCEL_ORG_ID !== 'team_7fXvITC9Uh6gunKUv0q6qGCQ') throw new Error('El proyecto Vercel no corresponde al ambiente.');
  return target;
}
