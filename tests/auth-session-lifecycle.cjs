const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = resolve(process.argv[2] || '.');
const user = { id: '1', name: 'Test', email: 'test@example.com', role: 'ADMIN' };

function harness(fetch) {
  const stored = new Map([['crm_token', 'tab-token'], ['crm_user', JSON.stringify(user)]]);
  const states = [], effects = [], timers = new Map(), listeners = new Map(), redirects = [];
  let cursor = 0, timerId = 0;
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect: effect => effects.push(effect),
    useMemo: factory => factory(),
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(resolve(root, 'src/context/auth-context.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, fetch,
    sessionStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) },
    localStorage: { removeItem() {} },
    window: {
      location: { replace: path => redirects.push(path) },
      addEventListener: (name, callback, capture) => listeners.set(name, { callback, capture }),
      removeEventListener: name => listeners.delete(name),
    },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    require: name => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (_type, props) => props };
      if (name === '@/services/api') return { API_BASE_URL: 'http://localhost:3001/api' };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const render = () => { cursor = 0; effects.length = 0; return exports.AuthProvider({ children: null }).value; };
  render(); effects[0](); render();
  return { render, stored, effects: [...effects], timers, listeners, redirects };
}

for (const status of [404, 500, 503, 'network']) {
  test(`background user refresh preserves the session on ${status}`, async () => {
    const app = harness(async () => {
      if (status === 'network') throw new TypeError('Failed to fetch');
      return { ok: false, status, json: async () => ({ message: 'Unavailable' }) };
    });
    app.effects[1]();
    await new Promise(setImmediate);
    assert.equal(app.stored.get('crm_token'), 'tab-token');
    assert.equal(app.render().token, 'tab-token');
  });
}

test('background user refresh clears a session rejected with 401', async () => {
  const app = harness(async () => ({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) }));
  app.effects[1]();
  await new Promise(setImmediate);
  assert.equal(app.stored.has('crm_token'), false);
  assert.equal(app.render().token, null);
});

test('inactivity clears the session and navigates to the existing login route', () => {
  const app = harness();
  const cleanup = app.effects[2]();
  const timer = [...app.timers.values()][0];
  assert.equal(timer.delay, 15 * 60 * 1000);
  timer.callback();
  assert.equal(app.stored.has('crm_token'), false);
  assert.deepEqual(app.redirects, ['/entrar']);
  cleanup();
});

test('scrolling within a panel and pointer activity renew the inactivity timer', () => {
  const app = harness();
  const cleanup = app.effects[2]();
  const originalTimer = [...app.timers.keys()][0];
  const scroll = app.listeners.get('scroll');
  if (scroll.capture) scroll.callback();
  assert.equal(app.timers.has(originalTimer), false);
  const nextTimer = [...app.timers.keys()][0];
  app.listeners.get('pointermove')?.callback();
  assert.equal(app.timers.has(nextTimer), false);
  assert.equal(app.timers.size, 1);
  cleanup();
  assert.equal(app.timers.size, 0);
  assert.equal(app.listeners.size, 0);
});
