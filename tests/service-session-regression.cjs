const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { test } = require('node:test');
const axios = require('axios');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

const root = resolve(process.argv[2] || '.');
const cases = [
  ['login', 'getUsers', []],
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
    const load = createSourceLoader({
      globals: {
        window: {},
        sessionStorage: { getItem: () => token },
        localStorage: { getItem: () => 'obsolete-persistent-token' },
      },
      mocks: { axios: {
        isCancel: axios.isCancel,
        create(config) {
          const api = axios.create(config);
          api.defaults.adapter = async config => {
            requests.push(config.headers.get('Authorization'));
            return { config, status: 200, statusText: 'OK', headers: {}, data: config.responseType === 'arraybuffer' ? new TextEncoder().encode('[]').buffer : [] };
          };
          return api;
        },
      } },
    });
    const exports = load(resolve(root, `src/stores/${service}/service.ts`));
    await exports[method](...args);
    token = null;
    await exports[method](...args);
    assert.deepEqual(requests, ['Bearer current-tab-token', undefined]);
  });
}
