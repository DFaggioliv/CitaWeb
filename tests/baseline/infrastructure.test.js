import { test, expect } from '../../backend/node_modules/vitest/dist/index.js';

// Infrastructure check only: this is not an application unit test.
// The original archive contains no application tests. Coverage includes all
// declared source files, without executing the server, seed or real database.
test('baseline harness runs without accessing application services', () => {
  expect(process.versions.node).toBeDefined();
});
