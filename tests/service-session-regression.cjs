const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = resolve(process.argv[2] || '.');
const cases = [
  ['auth', 'getUsers', []],
  ['users', 'getUsers', []],
  ['users', 'getScreenPermissions', []],
  ['help-center', 'getHelpArticles', []],
  ['portal-content', 'getPortalContents', []],
  ['portal-content', 'getPublishedPortalContents', []],
  ['portal-content', 'uploadPortalContentMedia', [new Blob(['image'])]],
];

for (const [service, method, args] of cases) {
  test(`${service}.${method}: uses tab credentials and never falls back to old credentials`, async () => {
    let token = 'current-tab-token';
    const requests = [];
    const exports = {};
    const source = ts.transpileModule(readFileSync(resolve(root, `src/services/${service}.service.ts`), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(source, {
      exports, process, FormData, window: {},
      sessionStorage: { getItem: () => token },
      localStorage: { getItem: () => 'obsolete-persistent-token' },
      require: (name) => {
        if (name === '@/services/api') return { API_BASE_URL: 'http://localhost:3001/api' };
        throw new Error(`Unexpected runtime dependency: ${name}`);
      },
      fetch: async (_url, options) => {
        requests.push(options.headers?.Authorization);
        return { ok: true, json: async () => [] };
      },
    });
    await exports[method](...args);
    token = null;
    await exports[method](...args);
    assert.deepEqual(requests, ['Bearer current-tab-token', undefined]);
  });
}
