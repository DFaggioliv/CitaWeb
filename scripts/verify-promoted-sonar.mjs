import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const repo = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const branch = process.env.GITHUB_REF_NAME;
if (repo !== 'DFaggioliv/CitaWeb' || !/^[a-f0-9]{40}$/.test(sha || '') || !['DEV', 'QA', 'PROD'].includes(branch)) throw new Error('Contexto de promoción no permitido.');
async function github(path) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`No se pudo verificar promoción: HTTP ${response.status}.`);
  return response.json();
}
const prs = await github(`commits/${sha}/pulls?per_page=100`);
const pr = prs.find(item => item.merged_at && item.base.ref === branch && item.merge_commit_sha === sha);
if (!pr) throw new Error('El commit no corresponde a un PR integrado en este ambiente.');
const currentTree = execFileSync('git', ['rev-parse', `${sha}^{tree}`], { encoding: 'utf8' }).trim();
const headTree = execFileSync('git', ['rev-parse', `${pr.head.sha}^{tree}`], { encoding: 'utf8' }).trim();
if (currentTree !== headTree) throw new Error('El contenido integrado difiere del PR analizado.');
const runs = await github(`actions/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=100`);
const approved = runs.workflow_runs.find(run => run.path === '.github/workflows/quality.yml' && run.conclusion === 'success' && run.pull_requests.some(item => item.number === pr.number));
if (!approved) throw new Error('No existe ejecución aprobada del pipeline para el PR y su revisión exacta.');
const url = new URL('https://sonarcloud.io/api/qualitygates/project_status');
url.searchParams.set('projectKey', 'DFaggioliv_CitaWeb');
url.searchParams.set('pullRequest', String(pr.number));
const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.SONAR_TOKEN}` }, signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`No se pudo comprobar Sonar del PR: HTTP ${response.status}.`);
const gate = (await response.json()).projectStatus;
if (gate.status !== 'OK') throw new Error('El quality gate del PR no está aprobado.');
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/sonar-promotion.json', JSON.stringify({ measuredAt: new Date().toISOString(), commit: sha, branch, tree: currentTree, analyzedHead: pr.head.sha, pullRequest: pr.number, validatedRunId: approved.id, qualityGate: gate, mode: 'approved-pr-identical-tree', limitation: 'El plan Sonar no permite consultar ramas distintas de main; se verifica el análisis aprobado del PR y la identidad del contenido.' }, null, 2));
console.log(`Promoción verificada: PR #${pr.number}, contenido idéntico y quality gate OK.`);
