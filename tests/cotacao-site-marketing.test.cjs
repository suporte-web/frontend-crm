const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const fixture = { id: 's1', tipo: 'COTACAO', nome: 'Contato', empresa: 'Empresa', email: 'contato@test.local',
  etapaCotacao: 'LEAD', status: 'NOVO', origem: 'SITE_PIZZATTOLOG' };
function load(file, bindings = {}) {
 const context = { exports: {}, URLSearchParams, Date, Error, Promise, Intl, console, ...bindings, require(name) {
  if (bindings.imports && name in bindings.imports) return bindings.imports[name];
  if (name === '@/lib/user-roles') return load('src/lib/user-roles.ts');
  if (name === 'react/jsx-runtime') return require(name);
  if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
  if (name === '@mui/material/styles') return require(name);
  if (name.startsWith('@mui/') || name.startsWith('lucide-react')) return new Proxy({}, { get: (_, key) => key });
  if (name === 'next/link') return { __esModule: true, default: 'Link' };
  if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key });
  if (name === '@/services/solicitacoes-site.service') return {};
  return require(name);
 } };
 const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
 } }).outputText;
 vm.runInNewContext(code, context);
 return context.exports;
}
function mount(file, user, services = {}, props = {}) {
 const states = [], deps = [], cleanup = [];
 let cursor = 0, pending = [];
 const hooks = {
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
   return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; },
  useRef(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
  useMemo(fn) { return fn(); },
  useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((v,j) => !Object.is(v, deps[i][j]))) {
   deps[i] = next; pending.push(() => { cleanup[i]?.(); cleanup[i] = fn(); }); } },
 };
 const component = load(file, { imports: { react: hooks, '@/context/auth-context': { useAuth: () => ({ user }) },
  '@/services/solicitacoes-site.service': services } });
 const fn = component.default || component.CotacaoSiteWorkflow || component.SolicitacoesSiteLista;
 return { render() { cursor = 0; const tree = fn(props); const effects = pending; pending = []; effects.forEach(fn => fn()); return tree; } };
}
function walk(node, match) {
 if (!node || typeof node !== 'object') return [];
 if (Array.isArray(node)) return node.flatMap(n => walk(n,match));
 return [...(match(node) ? [node] : []), ...walk(node.props?.children, match)];
}
function text(node) {
 if (Array.isArray(node)) return node.map(text).join('');
 if (typeof node === 'string' || typeof node === 'number') return String(node);
 return node && typeof node === 'object' ? text(node.props?.children) : '';
}
function button(tree, label) { return walk(tree, n => n.type === 'Button' && text(n).includes(label))[0]; }
const flush = () => new Promise(resolve => setImmediate(resolve));


const workflow = 'src/components/solicitacoes-site/CotacaoSiteWorkflow.tsx';
const owners = { listarComerciaisCotacaoSite: async () => [{ id: 'comercial', name: 'Vendedor' }] };

test('Marketing recebe as ações Reprovar e Enviar ao Comercial na etapa de lead', async () => {
  const page = mount(workflow, { role: 'MARKETING' }, owners, { solicitacao: fixture, onChange() {} });
  page.render(); await flush();
  const tree = page.render();
  assert.ok(button(tree, 'Enviar ao Comercial'));
  assert.ok(button(tree, 'Reprovar'));
  assert.equal(button(tree, 'Enviar ao Comercial').props.disabled, true);
  assert.equal(button(tree, 'Converter em Cliente'), undefined);
});

test('Comercial não decide a triagem e abre a oportunidade pelo cadastro existente', () => {
  const request = { ...fixture, etapaCotacao: 'OPORTUNIDADE', oportunidadeId: 'opp', cadastroId: 'cadastro', responsavel: { name: 'Vendedor' } };
  const tree = mount(workflow, { role: 'COMERCIAL' }, {}, { solicitacao: request, onChange() {} }).render();
  assert.equal(button(tree, 'Enviar ao Comercial'), undefined);
  assert.equal(button(tree, 'Reprovar'), undefined);
  assert.equal(button(tree, 'Abrir oportunidade').props.href, '/oportunidades/cadastro/cadastro');
});

test('reprovação pede motivo e preserva o registro devolvido pelo backend', async () => {
  const calls = [], updates = [];
  const page = mount(workflow, { role: 'MARKETING' }, { ...owners,
    reprovarCotacaoSite: async (...args) => { calls.push(args); return { solicitacao: { ...fixture, status: 'REPROVADO', motivoReprovacao: args[1] } }; },
  }, { solicitacao: fixture, onChange: value => updates.push(value) });
  button(page.render(), 'Reprovar').props.onClick();
  let tree = page.render();
  assert.equal(button(tree, 'Confirmar reprovação').props.disabled, true);
  walk(tree, node => node.type === 'TextField' && node.props.label === 'Motivo da reprovação')[0].props.onChange({ target: { value: ' Fora da área de atuação ' } });
  tree = page.render();
  await button(tree, 'Confirmar reprovação').props.onClick();
  assert.deepEqual(calls[0], ['s1', 'Fora da área de atuação']);
  assert.equal(updates[0].status, 'REPROVADO');
});

test('encaminhamento envia responsável uma só vez mesmo com clique repetido', async () => {
  let calls = 0, done;
  const updates = [];
  const page = mount(workflow, { role: 'MARKETING' }, { ...owners,
    direcionarCotacaoSite: async (id, owner) => {
      assert.equal(id, 's1'); assert.equal(owner, 'comercial'); calls++;
      return new Promise(resolve => { done = resolve; });
    },
  }, { solicitacao: fixture, onChange: value => updates.push(value) });
  page.render(); await flush();
  let tree = page.render();
  walk(tree, node => node.type === 'TextField' && node.props.label === 'Comercial responsável')[0].props.onChange({ target: { value: 'comercial' } });
  tree = page.render();
  const send = button(tree, 'Enviar ao Comercial');
  const pending = send.props.onClick(); send.props.onClick();
  assert.equal(calls, 1);
  done({ solicitacao: { ...fixture, etapaCotacao: 'OPORTUNIDADE', oportunidadeId: 'opp' } });
  await pending;
  assert.equal(updates[0].oportunidadeId, 'opp');
});

test('reprovação usa endpoint autenticado e propaga falhas sem confirmar a decisão', async () => {
  const calls = [];
  const service = load('src/services/solicitacoes-site.service.ts', {
    localStorage: { getItem: () => 'token' },
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: false, json: async () => ({ message: 'Sem permissão.' }) }; },
  });
  await assert.rejects(service.reprovarCotacaoSite('s1', 'Motivo'), /Sem permissão/);
  assert.equal(calls[0].url, '/api/integracoes/site/solicitacoes/s1/reprovar');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  assert.deepEqual(JSON.parse(calls[0].options.body), { motivo: 'Motivo' });
});
