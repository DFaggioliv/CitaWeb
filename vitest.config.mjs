export const coverage = {
  provider: 'v8',
  include: ['backend/src/**/*.js', 'frontend/src/**/*.{js,jsx}'],
  exclude: ['backend/src/seed-admin.js'],
  reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
  // Each run has its own folder to avoid OneDrive locking a prior report.
  reportsDirectory: `./coverage/current/run-${Date.now()}`,
};

export default {
  test: {
    environment: 'node',
    globals: true,
    unstubGlobals: true,
    unstubEnvs: true,
    include: ['backend/tests/**/*.test.js', 'frontend/tests/**/*.test.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage,
  },
};
