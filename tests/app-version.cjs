const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

const metadata = version => ({ version, buildDate: '2026-11-24T21:00:00.000Z', commit: 'abc1234' });
const flush = () => new Promise(setImmediate);

function ambiente() {
  let now = 0, next = 0, consultas = 0, reloads = 0, confirma = false;
  let resposta = async () => metadata('build-b');
  const timers = new Map();
  const document = new EventTarget(); document.visibilityState = 'visible';
  const window = new EventTarget();
  window.confirm = () => confirma;
  window.location = { reload() { reloads++; } };
  const adicionar = (callback, delay, repeat = false) => { const id = ++next; timers.set(id, { callback, at: now + delay, delay, repeat }); return id; };
  const load = createSourceLoader({ globals: {
    AbortController, window, document,
    Date: class extends Date { static now() { return now; } },
    setTimeout: (fn, delay) => adicionar(fn, delay), clearTimeout: id => timers.delete(id),
    setInterval: (fn, delay) => adicionar(fn, delay, true), clearInterval: id => timers.delete(id),
  }, mocks: { '@/stores/app-version/service': { AppVersionService: { getAvailableVersion: signal => { consultas++; return resposta(signal); } } } } });
  const { AppVersionMonitor } = load('src/lib/app-version-monitor.ts');
  const monitor = new AppVersionMonitor('build-a');
  return {
    monitor, timers, document, window,
    consultas: () => consultas, reloads: () => reloads,
    responder: value => { resposta = value; }, confirmar: value => { confirma = value; },
    async advance(ms) {
      const end = now + ms;
      while (true) {
        const entry = [...timers.entries()].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) break;
        const [id, item] = entry; now = item.at;
        if (item.repeat) item.at += item.delay; else timers.delete(id);
        item.callback(); await flush();
      }
      now = end;
    },
  };
}

test('builds geram IDs distintos e manifesto idêntico à versão incorporada, inclusive sem Git', () => {
  const load = createSourceLoader({ mocks: { 'node:child_process': { execFileSync() { throw Error('sem git'); } } } });
  const { appVersionPlugin } = load('config/app-version.ts');
  const first = appVersionPlugin(), second = appVersionPlugin();
  const define = JSON.parse(first.config().define.__APP_VERSION__);
  const other = JSON.parse(second.config().define.__APP_VERSION__);
  assert.notEqual(define.version, other.version);
  assert.equal(define.commit, null);
  assert.ok(Number.isFinite(Date.parse(define.buildDate)));
  let emitted;
  first.generateBundle.call({ emitFile(value) { emitted = value; } });
  assert.equal(emitted.fileName, 'version.json');
  assert.deepEqual(JSON.parse(emitted.source), define);
});

test('serviço lê arquivo estático sem cache e valida JSON, HTTP e estrutura', async () => {
  let args;
  let response = new Response(JSON.stringify(metadata('build-b')), { headers: { 'content-type': 'application/json' } });
  const load = createSourceLoader({ globals: { AbortController, __APP_VERSION__: metadata('build-a'), fetch: async (...values) => { args = values; return response; } } });
  const service = load('src/stores/app-version/service.ts');
  assert.equal(service.currentVersion, 'build-a');
  assert.equal((await service.AppVersionService.getAvailableVersion(new AbortController().signal)).version, 'build-b');
  assert.match(args[0], /^\/version\.json\?t=\d+$/);
  assert.equal(args[1].cache, 'no-store');
  assert.equal(args[1].headers, undefined);
  for (const invalid of [null, {}, { ...metadata('b'), buildDate: 'ontem' }, { ...metadata('b'), commit: '<html>' }, { ...metadata('b'), version: '' }]) {
    response = new Response(JSON.stringify(invalid), { headers: { 'content-type': 'application/json' } });
    await assert.rejects(() => service.AppVersionService.getAvailableVersion(new AbortController().signal));
  }
  response = new Response('<html>SPA</html>', { headers: { 'content-type': 'text/html' } });
  await assert.rejects(() => service.AppVersionService.getAvailableVersion(new AbortController().signal));
  response = new Response('{}', { status: 503 });
  await assert.rejects(() => service.AppVersionService.getAvailableVersion(new AbortController().signal));
});

test('timeout cancela a consulta sem deixar timers pendentes', async () => {
  let timeout, cleared = false;
  const load = createSourceLoader({ globals: {
    AbortController, __APP_VERSION__: metadata('a'),
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout() { cleared = true; },
    fetch: (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('timeout')))),
  } });
  const promise = load('src/stores/app-version/service.ts').AppVersionService.getAvailableVersion(new AbortController().signal);
  timeout();
  await assert.rejects(promise);
  assert.equal(cleared, true);
});

test('aba com bundle A detecta B ao iniciar, consulta a cada 60s e ao voltar/focar', async () => {
  const app = ambiente(); app.monitor.start(); await flush();
  assert.equal(app.monitor.getSnapshot().currentVersion, 'build-a');
  assert.equal(app.monitor.getSnapshot().availableVersion, 'build-b');
  assert.equal(app.monitor.getSnapshot().notificationVisible, true);
  await app.advance(60_000); assert.equal(app.consultas(), 2);
  app.document.visibilityState = 'hidden'; app.document.dispatchEvent(new Event('visibilitychange')); await flush();
  assert.equal(app.consultas(), 2);
  app.document.visibilityState = 'visible'; app.document.dispatchEvent(new Event('visibilitychange')); await flush();
  app.window.dispatchEvent(new Event('focus')); await flush(); assert.equal(app.consultas(), 4);
  app.monitor.stop(); assert.equal(app.timers.size, 0);
});

test('adiamento dura 10 minutos apesar das consultas e nova versão pode avisar antes', async () => {
  const app = ambiente(); app.monitor.start(); await flush(); app.monitor.deferUpdate();
  await app.advance(599_999); assert.equal(app.monitor.getSnapshot().notificationVisible, false);
  await app.advance(1); assert.equal(app.monitor.getSnapshot().notificationVisible, true);
  app.monitor.deferUpdate(); app.responder(async () => metadata('build-c'));
  await app.advance(60_000); assert.equal(app.monitor.getSnapshot().notificationVisible, true);
  assert.equal(app.monitor.getSnapshot().availableVersion, 'build-c'); app.monitor.stop();
});

test('não duplica requisições, timers ou resultados após desmontar e remontar (StrictMode)', async () => {
  const app = ambiente(); const pending = [];
  app.responder(signal => new Promise(resolve => pending.push({ signal, resolve })));
  app.monitor.start(); app.monitor.start(); app.monitor.checkForUpdate();
  assert.equal(app.consultas(), 1); assert.equal(app.timers.size, 1);
  app.monitor.stop(); assert.equal(pending[0].signal.aborted, true);
  app.monitor.start(); assert.equal(app.consultas(), 2);
  pending[0].resolve(metadata('antiga')); await flush();
  assert.equal(app.monitor.getSnapshot().availableVersion, null);
  pending[1].resolve(metadata('build-b')); await flush();
  assert.equal(app.monitor.getSnapshot().availableVersion, 'build-b');
  app.monitor.stop(); app.window.dispatchEvent(new Event('focus')); await app.advance(60_000);
  assert.equal(app.consultas(), 2); assert.equal(app.timers.size, 0);
});

test('rede indisponível mantém aviso anterior e a próxima consulta pode recuperar', async () => {
  const app = ambiente(); app.monitor.start(); await flush();
  app.responder(async () => { throw Error('offline'); }); await app.monitor.checkForUpdate();
  assert.equal(app.monitor.getSnapshot().notificationVisible, true);
  assert.equal(app.monitor.getSnapshot().isChecking, false);
  app.responder(async () => metadata('build-a')); await app.monitor.checkForUpdate();
  assert.equal(app.monitor.getSnapshot().updateAvailable, false); app.monitor.stop();
});

test('recarrega somente após confirmação sem apagar armazenamento ou alterar rota', () => {
  const app = ambiente(); app.monitor.reloadApplication(); assert.equal(app.reloads(), 0);
  app.confirmar(true); app.monitor.reloadApplication(); assert.equal(app.reloads(), 1);
});

test('notificação permanece aberta sem fechamento automático e expõe ambas as ações', () => {
  const elements = new Proxy({}, { get: (_, key) => key });
  const load = createSourceLoader({ mocks: { '@mui/material': elements, 'lucide-react': { RefreshCw: 'RefreshCw' }, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) } } });
  let later = 0, update = 0;
  const tree = load('src/components/app-version/UpdateAvailableNotification.tsx').UpdateAvailableNotification({ open: true, onLater: () => later++, onUpdate: () => update++ });
  assert.equal(tree.props.autoHideDuration, null); assert.equal(tree.props.open, true);
  function walk(node) { if (Array.isArray(node)) return node.forEach(walk); if (!node || typeof node !== 'object') return; if (node.type === 'Button') node.props.onClick(); walk(node.props?.children); }
  walk(tree); assert.equal(later, 1); assert.equal(update, 1);
});
