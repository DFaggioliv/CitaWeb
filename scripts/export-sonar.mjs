import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const host = process.env.SONAR_HOST_URL || 'https://sonarcloud.io';
const projectKey = process.env.SONAR_PROJECT_KEY;
if (!projectKey || !process.env.SONAR_TOKEN) throw new Error('Falta configuracion Sonar para exportar evidencia.');
const scope = process.env.GITHUB_EVENT_NAME === 'pull_request'
  ? { pullRequest: String(JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).number) }
  : process.env.GITHUB_REF_NAME === 'main'
    ? { branch: 'main' }
    : { pullRequest: String(JSON.parse(readFileSync('artifacts/sonar-promotion.json', 'utf8')).pullRequest) };
async function get(path, params) {
  const url = new URL(path, host);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.SONAR_TOKEN}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Exportacion Sonar fallo: ${path}, HTTP ${response.status}.`);
  return response.json();
}
const measures = await get('/api/measures/component', {
  component: projectKey, ...scope,
  metricKeys: 'bugs,vulnerabilities,code_smells,duplicated_lines_density,sqale_index,coverage',
});
const gate = await get('/api/qualitygates/project_status', { projectKey, ...scope });
const issues = [];
for (let page = 1; ; page++) {
  const result = await get('/api/issues/search', {
    componentKeys: projectKey, ...scope, severities: 'BLOCKER,CRITICAL',
    resolved: 'false', p: String(page), ps: '100',
  });
  issues.push(...result.issues.map(issue => ({
    key: issue.key, rule: issue.rule, severity: issue.severity,
    type: issue.type, component: issue.component, line: issue.line,
    message: issue.message, status: issue.status,
  })));
  if (page * 100 >= result.paging.total) break;
}
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/sonar.json', JSON.stringify({
  measuredAt: new Date().toISOString(), commit: process.env.GITHUB_SHA,
  projectKey, scope, measures: measures.component.measures,
  qualityGate: gate.projectStatus, blockerCriticalIssues: issues,
}, null, 2));
console.log('Metricas, quality gate y hallazgos Blocker/Critical guardados sin credenciales.');
