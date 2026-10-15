const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const fixture = { id: 's1', tipo: 'COTACAO', nome: 'Contato', empresa: 'Empresa', email: 'c@test.com', cnpj: '12345678000190',
 etapaCotacao: 'PROSPECT', responsavelId: 'comercial', responsavel: { id: 'comercial', name: 'Vendedor' }, leadId: 'l1', prospectId: 'p1',
 criadoEm: '2026-10-09T12:00:00Z', atualizadoEm: '2026-10-09T12:00:00Z', status: 'EM_ATENDIMENTO', origem: 'SITE' };
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

test('operações autenticadas usam os endpoints de qualificação e exibem erros do backend', async () => {
 const requests = [];
 const service = load('src/services/solicitacoes-site.service.ts', {
  localStorage: { getItem: () => 'token' },
  fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ sucesso: true, solicitacao: fixture }) }; },
 });
 await service.direcionarCotacaoSite('s1', 'comercial');
 await service.atualizarCotacaoSite('s1', { empresa: 'Outra' });
 await service.converterCotacaoSiteCliente('s1', '12345678000190');
 assert.equal(requests[0].url, '/api/integracoes/site/solicitacoes/s1/direcionar');
 assert.deepEqual(JSON.parse(requests[0].options.body), { responsavelId: 'comercial' });
 assert.equal(requests[1].options.method, 'PATCH');
 assert.equal(requests[2].url, '/api/integracoes/site/solicitacoes/s1/converter-cliente');
 for (const req of requests) assert.equal(req.options.headers.Authorization, 'Bearer token');
 const denied = load('src/services/solicitacoes-site.service.ts', { localStorage: { getItem: () => 'token' },
  fetch: async () => ({ ok: false, json: async () => ({ message: 'Esta cotação não está atribuída a você.' }) }) });
 await assert.rejects(denied.converterCotacaoSiteCliente('s1', '12345678000190'), /não está atribuída/);
});

test('fila inclui cotações e tela Prospects filtra por classificação', async () => {
 const filters = [];
 const rows = [{ ...fixture, id: 'lead', etapaCotacao: 'LEAD' }, fixture, { ...fixture, id: 'cliente', etapaCotacao: 'CLIENTE' }];
 const services = { listarSolicitacoesSite: async filter => { filters.push(filter); return { solicitacoes: rows }; } };
 const queue = mount('src/components/solicitacoes-site/SolicitacoesSiteLista.tsx', { role: 'MARKETING' }, services, { mode: 'queue' });
 queue.render(); await flush(); queue.render();
 assert.ok(!filters[0]?.excluirTipo);
 const prospects = mount('src/components/solicitacoes-site/SolicitacoesSiteLista.tsx', { role: 'COMERCIAL' }, services, { mode: 'prospects' });
 prospects.render(); await flush();
 let tree = prospects.render();
 const table = walk(tree, n => n.type === 'SolicitacoesSiteTabela')[0];
 assert.equal(table.props.solicitacoes.length, 1);
 assert.equal(table.props.solicitacoes[0].etapaCotacao, 'PROSPECT');
 const search = walk(tree, n => n.type === 'TextField' && n.props.label === 'Buscar')[0];
 search.props.onChange({ target: { value: 'inexistente' } });
 tree = prospects.render();
 assert.equal(walk(tree, n => n.type === 'SolicitacoesSiteTabela')[0].props.solicitacoes.length, 0);
});

test('Marketing pode direcionar, mas não converter em Cliente', async () => {
 const page = mount('src/components/solicitacoes-site/CotacaoSiteWorkflow.tsx', { role: 'MARKETING' },
  { listarComerciaisCotacaoSite: async () => [{ id: 'comercial', name: 'Vendedor' }] }, { solicitacao: fixture, onChange() {} });
 let tree = page.render(); await flush(); tree = page.render();
 assert.ok(button(tree, 'Direcionar'));
 assert.equal(button(tree, 'Converter em Cliente'), undefined);
});

test('Comercial só tem ações nos seus Prospects', () => {
 const own = mount('src/components/solicitacoes-site/CotacaoSiteWorkflow.tsx', { id: 'comercial', role: 'COMERCIAL' }, {}, { solicitacao: fixture, onChange() {} }).render();
 assert.ok(button(own, 'Converter em Cliente')); assert.equal(button(own, 'Direcionar'), undefined);
 const other = mount('src/components/solicitacoes-site/CotacaoSiteWorkflow.tsx', { id: 'outro', role: 'COMERCIAL' }, {}, { solicitacao: fixture, onChange() {} }).render();
 assert.equal(button(other, 'Converter em Cliente'), undefined); assert.equal(button(other, 'Editar dados'), undefined);
});

test('conversão exige diálogo e evita envio repetido enquanto processa', async () => {
 let calls = 0, resolve;
 const converted = [];
 const page = mount('src/components/solicitacoes-site/CotacaoSiteWorkflow.tsx', { id: 'comercial', role: 'COMERCIAL' },
  { converterCotacaoSiteCliente: async () => { calls++; return new Promise(done => { resolve = done; }); } },
  { solicitacao: fixture, onChange: s => converted.push(s) });
 button(page.render(), 'Converter em Cliente').props.onClick();
 let tree = page.render();
 assert.ok(walk(tree, n => n.type === 'Dialog' && n.props.open).length);
 assert.match(text(tree), /Empresa/);
 const confirm = button(tree, 'Confirmar conversão');
 const pending = confirm.props.onClick(); confirm.props.onClick();
 assert.equal(calls, 1);
 resolve({ sucesso: true, solicitacao: { ...fixture, etapaCotacao: 'CLIENTE', clientId: 'c1' } });
 await pending;
 assert.equal(converted[0].clientId, 'c1');
});

test('tabela apresenta empresa principal, contato secundário, classificação e responsável', () => {
 const { SolicitacoesSiteTabela } = load('src/components/solicitacoes-site/SolicitacoesSiteTabela.tsx');
 const tree = SolicitacoesSiteTabela({ solicitacoes: [fixture], mode: 'prospects' });
 const texts = walk(tree, n => n.type === 'Typography').map(text);
 assert.ok(texts.indexOf('Empresa') >= 0 && texts.indexOf('Empresa') < texts.indexOf('Contato'));
 assert.ok(walk(tree, n => n.type === 'Chip' && n.props.label === 'Prospect').length);
 assert.match(text(tree), /Vendedor/);
 assert.ok(walk(tree, n => n.type === 'Button' && n.props.href === '/prospects/s1').length);
});

test('tabela usa contato como alternativa quando empresa estiver vazia', () => {
 const { SolicitacoesSiteTabela } = load('src/components/solicitacoes-site/SolicitacoesSiteTabela.tsx');
 const tree = SolicitacoesSiteTabela({ solicitacoes: [{ ...fixture, empresa: '  ' }], mode: 'prospects' });
 const texts = walk(tree, n => n.type === 'Typography').map(text);
 assert.equal(texts.filter(t => t === 'Contato').length, 1);
});
