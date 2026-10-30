vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
vi.mock('node:fs', () => ({ mkdirSync: vi.fn(), writeFileSync: vi.fn() }));
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const sha = 'a'.repeat(40);
const head = 'b'.repeat(40);
let gate;
let runs;
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('GITHUB_REPOSITORY', 'DFaggioliv/CitaWeb');
  vi.stubEnv('GITHUB_SHA', sha);
  vi.stubEnv('GITHUB_REF_NAME', 'QA');
  execFileSync.mockReturnValue('identical-tree');
  gate = 'OK';
  runs = [{ path: '.github/workflows/quality.yml', conclusion: 'success', id: 123, pull_requests: [{ number: 7 }] }];
  vi.stubGlobal('fetch', vi.fn(async url => {
    const target = String(url);
    const body = target.includes('/pulls?')
      ? [{ merged_at: '2026-10-30', base: { ref: 'QA' }, merge_commit_sha: sha, head: { sha: head }, number: 7 }]
      : target.includes('/actions/runs?') ? { workflow_runs: runs } : { projectStatus: { status: gate } };
    return { ok: true, json: async () => body };
  }));
});
it('exige PR aprobado, árbol idéntico y gate OK', async () => {
  await import('../../scripts/verify-promoted-sonar.mjs');
  expect(writeFileSync).toHaveBeenCalledOnce();
  const evidence = JSON.parse(writeFileSync.mock.calls[0][1]);
  expect(evidence).toMatchObject({ commit: sha, analyzedHead: head, pullRequest: 7, mode: 'approved-pr-identical-tree' });
});
it('bloquea contenido diferente al analizado', async () => {
  execFileSync.mockReturnValueOnce('merge-tree').mockReturnValueOnce('head-tree');
  await expect(import('../../scripts/verify-promoted-sonar.mjs')).rejects.toThrow('difiere');
  expect(writeFileSync).not.toHaveBeenCalled();
});
it('bloquea una ejecución fallida del PR', async () => {
  runs[0].conclusion = 'failure';
  await expect(import('../../scripts/verify-promoted-sonar.mjs')).rejects.toThrow('ejecución aprobada');
});
it('bloquea un quality gate rechazado', async () => {
  gate = 'ERROR';
  await expect(import('../../scripts/verify-promoted-sonar.mjs')).rejects.toThrow('no está aprobado');
});
it('bloquea consultas fallidas al proveedor', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 403 });
  await expect(import('../../scripts/verify-promoted-sonar.mjs')).rejects.toThrow('HTTP 403');
});
