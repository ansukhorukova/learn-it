const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    // The backend is plain CommonJS (no "type": "module" in package.json),
    // and vitest's own package refuses to be `require()`'d — so import its
    // test API as ambient globals (describe/it/expect/...) instead of
    // requiring 'vitest' at the top of each CJS test file.
    globals: true,
    include: ['test/concurrency/**/*.test.js'],
    setupFiles: ['./test/concurrency/env.js'],
    globalSetup: ['./test/concurrency/globalSetup.js'],
    // Real Postgres round-trips (several sequential locking queries per
    // case, some deliberately held open for `wait()`) are slower than
    // in-memory unit tests.
    testTimeout: 20000,
    hookTimeout: 20000,
    // These tests assert on real lock queues/deadlock behavior between
    // transactions against one shared test database — running files in
    // parallel workers would let unrelated files' rows and locks interleave
    // and make failures nondeterministic, so force one file at a time.
    fileParallelism: false,
  },
});
