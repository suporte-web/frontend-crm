const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, bindings = {}) {
  const context = { exports: {}, Error, AbortController, AbortSignal, encodeURIComponent, ...bindings, require(name) {
    if (bindings.imports && name in bindings.imports) return bindings.imports[name];
    if (name === '@/services/api') return { API_BASE_URL: '/api' };
    if (name === '@/services/cnpj.service') return load('src/services/cnpj.service.ts', bindings);
    if (name === '@/lib/nome-cadastro') return load('src/lib/nome-cadastro.ts');
    if (name === '@/lib/cnpj-form') return load('src/lib/cnpj-form.ts');
    return {};
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, context);
  return context.exports;
}
const data = { cnpj: '00000000000191', legalName: 'Empresa API', tradeName: '',
  cnae: '', cnaeDescription: '', phone: '', email: '', simpleNational: null, provider: 'minhareceita',
  address: { zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: 'BRASILIA', state: 'DF' } };
const form = { document: '00.000.000/0001-91', companyName: 'Nome manual', legalName: 'Razão manual',
  tradeName: 'Fantasia manual', cnae: '1234567', taxRegime: 'Lucro Real', street: 'Rua manual', city: 'Cidade manual', phone: '11999999999' };
test('campos vazios da API preservam os valores manuais', () => {
  const { mesclarDadosCnpj } = load('src/lib/cnpj-form.ts');
  const result = mesclarDadosCnpj(form, data, form);
  for (const field of ['tradeName', 'cnae', 'taxRegime', 'street', 'phone']) assert.equal(result[field], form[field]);
  assert.equal(result.legalName, 'Empresa api'); assert.equal(result.city, 'BRASILIA');
});
test('edições feitas durante a consulta e troca de CNPJ não são sobrescritas', () => {
  const { mesclarDadosCnpj } = load('src/lib/cnpj-form.ts');
  const edited = { ...form, legalName: 'Digitado enquanto aguardava' };
  assert.equal(mesclarDadosCnpj(edited, data, form).legalName, edited.legalName);
  const other = { ...form, document: '33.683.111/0002-80' };
  assert.equal(mesclarDadosCnpj(other, data, form), other);
});
test('consulta autenticada chama apenas o backend e preserva o status final', async () => {
  let request;
  const api = load('src/services/cnpj.service.ts', { fetch: async (url, options) => {
    request = { url, options }; return { ok: true, json: async () => data };
  } });
  await api.consultarCnpj(form.document, 'token');
  assert.equal(request.url, '/api/cnpj/00000000000191');
  assert.equal(request.options.headers.Authorization, 'Bearer token');
});
test('503 sem JSON orienta preenchimento manual', async () => {
  const api = load('src/services/cnpj.service.ts', { fetch: async () => ({ ok: false, status: 503,
    json: async () => { throw new Error('HTML'); } }) });
  await assert.rejects(api.consultarCnpj(form.document, 'token'), /manualmente/);
});
test('conexão travada expira e informa que o preenchimento manual está disponível', async () => {
  const timeout = new AbortController();
  const api = load('src/services/cnpj.service.ts', {
    AbortSignal: { timeout: () => timeout.signal, any: AbortSignal.any.bind(AbortSignal) },
    fetch: async (_, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }),
  });
  const pending = api.consultarCnpj(form.document, 'token');
  timeout.abort();
  await assert.rejects(pending, /tempo.*manualmente/i);
});
function mountHook(request) {
  const slots = []; let cursor = 0; const cleanups = [];
  let current = { ...form };
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useEffect(effect) { const i = cursor++; if (!(i in slots)) { slots[i] = true; cleanups.push(effect()); } },
  };
  const module = load('src/hooks/use-cnpj-lookup.ts', { imports: { react,
    '@/services/cnpj.service': { consultarCnpj: request } } });
  return { render() { cursor = 0; return module.useCnpjLookup('token', current,
    updater => { current = updater(current); }); }, get form() { return current; },
    unmount() { cleanups.forEach(fn => fn?.()); } };
}
test('trava síncrona impede dois cliques antes de renderizar loading', async () => {
  let calls = 0, resolve;
  const view = mountHook(() => { calls++; return new Promise(r => { resolve = r; }); });
  const hook = view.render(); const first = hook.searchCnpj(); const second = hook.searchCnpj();
  assert.equal(calls, 1); assert.equal(view.render().searchingCnpj, true);
  resolve(data); await Promise.all([first, second]);
  assert.equal(view.render().searchingCnpj, false); assert.equal(view.form.legalName, 'Empresa api');
});
test('falha final libera o botão, mantém dados e oferece cadastro manual', async () => {
  const view = mountHook(async () => { throw new Error('Serviço indisponível'); });
  await view.render().searchCnpj();
  assert.equal(view.form.legalName, form.legalName);
  assert.equal(view.render().searchingCnpj, false);
  assert.match(view.render().cnpjError, /manualmente/);
});
test('formulário mantém botão, loading e Alert Material UI sem bloquear cadastro manual após falha', () => {
  const componentNames = ['Alert', 'Box', 'Button', 'Chip', 'CircularProgress', 'Divider', 'MenuItem', 'Paper', 'Stack', 'TextField', 'Typography'];
  const imports = Object.fromEntries(componentNames.map(name => [`@mui/material/${name}`, { __esModule: true, default: name }]));
  imports['react/jsx-runtime'] = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  imports['lucide-react'] = new Proxy({}, { get: (_, key) => key });
  imports['@/components/mui/crm-primitives'] = { crmPalette: {} };
  const { ClientForm } = load('src/components/clientes/client-form.tsx', { imports });
  const props = { form, setForm() {}, contacts: [], setContacts() {}, documentFiles: [], setDocumentFiles() {},
    loading: false, searchingCnpj: false, onSearchCnpj() {}, onCancel() {}, onSubmit() {},
    cnpjError: 'Consulta indisponível. Preencha manualmente.' };
  function nodes(tree) { if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    return [tree, ...nodes(tree.props?.children)]; }
  const idle = nodes(ClientForm(props));
  assert.ok(idle.some(node => node.type === 'Alert' && node.props.severity === 'warning' && /manualmente/.test(node.props.children)));
  assert.equal(idle.find(node => node.type === 'Button' && node.props.children === 'Buscar CNPJ').props.disabled, false);
  const busy = nodes(ClientForm({ ...props, searchingCnpj: true }));
  assert.equal(busy.find(node => node.type === 'Button' && node.props.children === 'Buscando...').props.disabled, true);
});
