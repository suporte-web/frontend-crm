const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const anexo = { id: 'arquivo-1', leadId: 'lead-1', nome: '#33420.pdf', tipo: 'application/pdf', tamanho: 20, comentario: null, criadoEm: '2026-10-09T13:17:00Z', usuario: { id: 'user-1', name: 'Caroline' } };
function mount(file, services = {}, globals = {}) {
 const values = [], deps = [], cleanups = [];
 let cursor = 0, effects = [];
 const hooks = {
  useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
  useCallback(fn) { return fn; },
  useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((v, j) => !Object.is(v, deps[i][j]))) { deps[i] = next; effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); } },
 };
 const context = { exports: {}, Date, Error, Blob, console, ...globals, require(name) {
  if (name === 'react') return hooks;
  if (name === 'react/jsx-runtime') return require(name);
  if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
  if (name.startsWith('@mui/icons-material/')) return { __esModule: true, default: name.split('/').at(-1) };
  if (name === '@/services/anexos.api') return { obterArquivoAnexo: (token, caminho) => services.obterArquivoAnexoLead(token, 'lead-1', { ...anexo, id: caminho.split('/').at(-1) }), baixarAnexo: (token, caminho, nome) => services.baixarAnexoLead(token, 'lead-1', { ...anexo, id: caminho.split('/').at(-1), nome }) };
  if (name === '@/services/lead-anexos.service') return { listarAnexosLead: async () => [anexo], ...services };
  if (name.startsWith('./')) return new Proxy({}, { get: (_, key) => key });
  throw new Error('Import inesperado: ' + name);
 } };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, context);
 return {
  render(name, props) { cursor = 0; return context.exports[name](props); },
  async effects() { const pending = effects; effects = []; pending.forEach(fn => fn()); await new Promise(resolve => setTimeout(resolve, 0)); },
  unmount() { cleanups.forEach(fn => fn?.()); },
 };
}
function nodes(node) { if (Array.isArray(node)) return node.flatMap(nodes); if (!node || typeof node !== 'object') return []; return [node, ...nodes(node.props?.children)]; }
function find(tree, type, predicate = () => true) { const node = nodes(tree).find(n => n.type === type && predicate(n.props)); assert.ok(node, 'Elemento ausente: ' + type); return node; }
test('lista de anexos oferece Visualizar e conserva Baixar e upload', async () => {
 const downloads = [];
 const instance = mount('src/components/attachments/LeadAttachments.tsx', { baixarAnexoLead: async (...args) => downloads.push(args) });
 const render = () => instance.render('LeadAttachments', { token: 'jwt', leadId: 'lead-1' });
 render(); await instance.effects();
 let tree = render();
 find(tree, 'Button', p => p.children === 'Visualizar').props.onClick();
 tree = render();
 assert.equal(find(tree, 'LeadAttachmentPreview').props.anexo.id, 'arquivo-1');
 await find(tree, 'Button', p => p.children === 'Baixar').props.onClick();
 assert.deepEqual(downloads[0], ['jwt', 'lead-1', anexo]);
 find(tree, 'UploadAnexos');
});


function urlTracker() {
 const created = [], revoked = [];
 return { created, revoked, URL: { createObjectURL(blob) { const url = 'blob:anexo-' + created.length; created.push({ blob, url }); return url; }, revokeObjectURL(url) { revoked.push(url); } } };
}
test('PDF abre no Dialog com download e libera a URL ao fechar', async () => {
 const tracker = urlTracker();
 const downloads = [];
 const instance = mount('src/components/anexos/VisualizadorDocumento.tsx', {
  obterArquivoAnexoLead: async (token, id, selected) => { assert.equal(token, 'jwt'); assert.equal(id, 'lead-1'); assert.equal(selected.id, 'arquivo-1'); return new Blob(['pdf'], { type: 'application/pdf' }); },
  baixarAnexoLead: async (...args) => downloads.push(args),
 }, { URL: tracker.URL });
 const props = { token: 'jwt', caminho: '/leads/lead-1/anexos/' + anexo.id, anexo, onClose: () => {} };
 instance.render('VisualizadorDocumento', props); await instance.effects();
 const tree = instance.render('VisualizadorDocumento', props);
 assert.equal(find(tree, 'Dialog').props.open, true);
 assert.equal(find(tree, 'DialogTitle').props.children, '#33420.pdf');
 const frame = find(tree, 'Box', p => p.component === 'iframe');
 assert.equal(frame.props.src, 'blob:anexo-0');
 assert.equal(frame.props.title, 'Pré-visualização: #33420.pdf');
 await find(tree, 'Button', p => p.children === 'Baixar').props.onClick();
 assert.deepEqual(downloads[0], ['jwt', 'lead-1', anexo]);
 instance.render('VisualizadorDocumento', { ...props, anexo: null }); await instance.effects();
 assert.deepEqual(tracker.revoked, ['blob:anexo-0']);
});
test('PNG e JPG aparecem como imagem, com nome acessivel', async () => {
 for (const tipo of ['image/png', 'image/jpeg']) {
  const tracker = urlTracker();
  const instance = mount('src/components/anexos/VisualizadorDocumento.tsx', { obterArquivoAnexoLead: async () => new Blob(['image'], { type: tipo }) }, { URL: tracker.URL });
  const selected = { ...anexo, tipo, nome: 'foto-cliente' };
  const props = { token: 'jwt', caminho: '/leads/lead-1/anexos/' + anexo.id, anexo: selected, onClose: () => {} };
  instance.render('VisualizadorDocumento', props); await instance.effects();
  const image = find(instance.render('VisualizadorDocumento', props), 'Box', p => p.component === 'img');
  assert.equal(image.props.alt, 'foto-cliente');
  assert.equal(image.props.src, 'blob:anexo-0');
  instance.unmount();
  assert.deepEqual(tracker.revoked, ['blob:anexo-0']);
 }
});
test('trocar de documento ignora resposta atrasada, fechar evita criar URLs', async () => {
 const tracker = urlTracker();
 const pending = new Map();
 const instance = mount('src/components/anexos/VisualizadorDocumento.tsx', { obterArquivoAnexoLead: (_token, _id, item) => new Promise(resolve => pending.set(item.id, resolve)) }, { URL: tracker.URL });
 const props = item => ({ token: 'jwt', caminho: '/leads/lead-1/anexos/' + item.id, anexo: item, onClose: () => {} });
 instance.render('VisualizadorDocumento', props(anexo)); await instance.effects();
 const second = { ...anexo, id: 'arquivo-2', nome: 'segundo.pdf' };
 instance.render('VisualizadorDocumento', props(second)); await instance.effects();
 pending.get('arquivo-1')(new Blob(['old'], { type: 'application/pdf' })); await new Promise(resolve => setTimeout(resolve, 0));
 assert.equal(tracker.created.length, 0);
 pending.get('arquivo-2')(new Blob(['new'], { type: 'application/pdf' })); await new Promise(resolve => setTimeout(resolve, 0));
 assert.equal(find(instance.render('VisualizadorDocumento', props(second)), 'Box', p => p.component === 'iframe').props.title, 'Pré-visualização: segundo.pdf');
 const third = { ...anexo, id: 'arquivo-3' };
 instance.render('VisualizadorDocumento', props(third)); await instance.effects();
 assert.deepEqual(tracker.revoked, ['blob:anexo-0']);
 instance.unmount();
 pending.get('arquivo-3')(new Blob(['closed'], { type: 'application/pdf' })); await new Promise(resolve => setTimeout(resolve, 0));
 assert.equal(tracker.created.length, 1);
});
test('falha de acesso e formato nao suportado mostram mensagem e mantem download', async () => {
 for (const scenario of [
  { request: async () => { throw new Error('Sem permissao'); }, want: 'Sem permissao' },
  { request: async () => new Blob(['html'], { type: 'text/html' }), want: 'Este formato não permite pré-visualização. Use Baixar para abrir o arquivo.' },
 ]) {
  const tracker = urlTracker();
  const instance = mount('src/components/anexos/VisualizadorDocumento.tsx', { obterArquivoAnexoLead: scenario.request }, { URL: tracker.URL });
  const props = { token: 'jwt', caminho: '/leads/lead-1/anexos/' + anexo.id, anexo, onClose: () => {} };
  instance.render('VisualizadorDocumento', props); await instance.effects();
  const tree = instance.render('VisualizadorDocumento', props);
  assert.equal(find(tree, 'Alert', p => p.severity === 'error').props.children, scenario.want);
  find(tree, 'Button', p => p.children === 'Baixar');
  assert.equal(tracker.created.length, 0);
 }
});
function service(globals) {
 const context = { exports: {}, Error, ...globals, require(name) { if (name === './api') return { API_BASE_URL: 'https://crm.example/api' }; throw new Error(name); } };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(root, 'src/services/lead-anexos.service.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
 return context.exports;
}
test('visualizar e baixar usam arquivo protegido; download mantem o nome original', async () => {
 const requests = [], tracker = urlTracker();
 const link = { click() { this.clicked = true; }, remove() { this.removed = true; } };
 const blob = new Blob(['pdf'], { type: 'application/pdf' });
 const api = service({ URL: tracker.URL, fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, blob: async () => blob }; }, document: { createElement: () => link, body: { appendChild: () => {} } }, setTimeout: fn => fn() });
 assert.equal(await api.obterArquivoAnexoLead('jwt', 'lead-1', anexo), blob);
 await api.baixarAnexoLead('jwt', 'lead-1', anexo);
 for (const request of requests) {
  assert.equal(request.url, 'https://crm.example/api/leads/lead-1/anexos/arquivo-1');
  assert.equal(request.options.headers.Authorization, 'Bearer jwt');
 }
 assert.equal(link.download, '#33420.pdf');
 assert.equal(link.clicked, true);
 assert.equal(link.removed, true);
 assert.deepEqual(tracker.revoked, ['blob:anexo-0']);
});
test('arquivo negado pelo backend nao retorna blob nem inicia download', async () => {
 let blobRead = false;
 const api = service({ fetch: async () => ({ ok: false, json: async () => ({ message: 'Sem permissao para acessar o arquivo' }), blob: async () => { blobRead = true; } }) });
 await assert.rejects(() => api.obterArquivoAnexoLead('jwt', 'lead-1', anexo), /Sem permissao/);
 assert.equal(blobRead, false);
});

test('PDF com resposta binária recebe o tipo correto para abrir sem download automático', async () => {
 const tracker = urlTracker();
 const instancia = mount('src/components/anexos/VisualizadorDocumento.tsx', { obterArquivoAnexoLead: async () => new Blob(['pdf'], { type: 'application/octet-stream' }) }, { URL: tracker.URL });
 const props = { token: 'jwt', caminho: '/clients/cliente/documents/arquivo/download', anexo, onClose: () => {} };
 instancia.render('VisualizadorDocumento', props); await instancia.effects();
 const arvore = instancia.render('VisualizadorDocumento', props);
 assert.equal(find(arvore, 'Box', p => p.component === 'iframe').props.src, 'blob:anexo-0');
 assert.equal(tracker.created[0].blob.type, 'application/pdf');
 instancia.unmount();
});
