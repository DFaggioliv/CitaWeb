import { coverage } from './vitest.config.mjs';

export default {
  test: {
    environment: 'node',
    include: ['tests/baseline/**/*.test.js'],
    coverage: { ...coverage, reportsDirectory: './coverage/baseline' },
  },
};
