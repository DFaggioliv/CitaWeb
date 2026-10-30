import { assertDeploymentTarget } from '../../scripts/deployment-target.mjs';
const qa = { GITHUB_REF_NAME: 'QA', RENDER_DEPLOY_HOOK_URL: 'https://api.render.com/deploy/srv-dbihe2cipgvc73bj88h0?key=fake', BACKEND_HEALTH_URL: 'https://citaweb-api-qa.onrender.com/api/health', VERCEL_PROJECT_ID: 'prj_wIvc5leqYY7U7iHaKK2nZKJ1tjF9', VERCEL_ORG_ID: 'team_7fXvITC9Uh6gunKUv0q6qGCQ' };
it('acepta únicamente el servicio, health y proyecto de QA verificados', () => {
  expect(assertDeploymentTarget(qa).serviceId).toBe('srv-dbihe2cipgvc73bj88h0');
});
it('bloquea el hook productivo antes de cualquier solicitud', () => {
  expect(() => assertDeploymentTarget({ ...qa, RENDER_DEPLOY_HOOK_URL: 'https://api.render.com/deploy/srv-darl517pn0mc73d12n2g?key=fake' })).toThrow('no corresponde');
});
it('bloquea health productivo y proyecto Vercel equivocado', () => {
  expect(() => assertDeploymentTarget({ ...qa, BACKEND_HEALTH_URL: 'https://citaweb-api.onrender.com/api/health' })).toThrow('health');
  expect(() => assertDeploymentTarget({ ...qa, VERCEL_PROJECT_ID: 'prj_ARshwiB7v0ImmPxPDqXudpy088GA' })).toThrow('Vercel');
});
it('bloquea ambientes sin destino verificado', () => {
  expect(() => assertDeploymentTarget({ ...qa, GITHUB_REF_NAME: 'DEV' })).toThrow('verificados');
});
