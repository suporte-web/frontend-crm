const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const fixture = { id: 'lead-1', company: 'Empresa Aurora', name: 'Maria Contato', email: 'maria@example.com', phone: '41999999999', source: 'manual', status: 'entrada_leads', notes: 'Solicitou armazenagem', createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-02T12:00:00Z', timeline: [{ id: 'evento-1', leadId: 'lead-1', type: 'NOTE_ADDED', title: 'Contato registrado', description: 'Solicitou retorno na sexta', createdAt: '2026-10-02T12:00:00Z', updatedAt: '2026-10-02T12:00:00Z' }], observations: [{ id: 'obs-1', leadId: 'lead-1', content: 'Prefere contato por email', stage: 'entrada_leads', createdAt: '2026-10-02T12:00:00Z', updatedAt: '2026-10-02T12:00:00Z' }] };
function load(file, lead = fixture) {
 const resolved = [file, file + '.ts', file + '.tsx'].find(fs.existsSync);
 if (!resolved) throw new Error('Arquivo ausente: ' + file);
 let hookIndex = 0;
 const context = { exports: {}, process: { env: {} }, URLSearchParams, Intl, Date, require(name) {
  if (name === 'react' && resolved.endsWith('ListaLeads.tsx')) return { ...React, useState(initial) { const index = hookIndex++; return React.useState(index === 0 ? [lead] : index === 3 ? false : initial); } };
  if (name === '@/context/auth-context') return { useAuth: () => ({ user: { role: 'ADMIN' }, token: 'test-token' }) };
  if (name === '@/components/layout/app-layout') return { AppLayout: ({ children }) => React.createElement('main', null, children) };
  if (name.startsWith('@/')) return load(path.resolve(root, 'src', name.slice(2)), lead);
  if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name), lead);
  return require(name);
 } };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, context);
 return context.exports;
}
for (const source of ['manual', 'import_csv', 'site']) {
 test('listagem mostra empresa, email e contato nessa ordem para ' + source, () => {
  const lead = Object.freeze({ ...fixture, source, company: '  Empresa Aurora  ' });
  const Page = load(path.resolve(root, 'src/app/leads/componentes/ListaLeads'), lead).default;
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.ok(html.indexOf('Empresa Aurora') < html.indexOf('Maria Contato'), 'Empresa deve aparecer antes do contato');
  assert.ok(html.indexOf('Empresa Aurora') < html.indexOf('maria@example.com'), 'Empresa deve aparecer acima do email');
  assert.ok(html.indexOf('maria@example.com') < html.indexOf('Maria Contato'), 'Contato deve aparecer abaixo do email');
  assert.ok(html.includes('href="/leads/lead-1"'));
  assert.ok(html.includes('Buscar') && html.includes('Origem') && html.includes('Etapa'));
  assert.equal(lead.name, 'Maria Contato');
  assert.equal(lead.company, '  Empresa Aurora  ', 'Apresentacao nao altera dados do lead');
 });
 test('listagem usa contato como titulo quando empresa nao foi informada para ' + source, () => {
  for (const company of [null, undefined, '', '   ']) {
   const lead = Object.freeze({ ...fixture, source, company });
   const Page = load(path.resolve(root, 'src/app/leads/componentes/ListaLeads'), lead).default;
   const html = renderToStaticMarkup(React.createElement(Page));
   const textContent = html.replace(/<style[^>]*>[^]*?<\/style>/g, '').replace(/<[^>]+>/g, '');
   assert.ok(html.includes('Maria Contato'));
   assert.equal((textContent.match(/Maria Contato/g) || []).length, 1, 'Nao duplicar o contato quando ele e o titulo');
   assert.ok(!html.includes('undefined'));
   assert.equal(lead.company, company);
   assert.equal(lead.name, 'Maria Contato');
  }
 });
}

test('pre-visualizacao mostra dados, observacoes e historico sem campos de edicao', () => {
 const { LeadPreviewContent } = load(path.resolve(root, 'src/components/leads/lead-preview-dialog'));
 const html = renderToStaticMarkup(React.createElement(LeadPreviewContent, { lead: fixture }));
 for (const value of ['Empresa Aurora', 'Maria Contato', 'maria@example.com', '41999999999', 'Solicitou armazenagem', 'Prefere contato por email', 'Contato registrado', 'Solicitou retorno na sexta']) assert.ok(html.includes(value), value);
 assert.ok(!html.includes('<input') && !html.includes('<textarea'));
});

// Mesmo harness de hooks utilizado pelos testes de interface SAC do projeto.
// Simula o ciclo do componente; rede e navegacao sao as fronteiras substituidas.
function mount(file, services = {}) {
 const values = [], deps = [], cleanups = [];
 let cursor = 0, effects = [], navigations = [];
 const hooks = {
  useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i]; },
  useMemo(fn) { return fn(); },
  useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((value, j) => !Object.is(value, deps[i][j]))) { deps[i] = next; effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); } },
 };
 const context = { exports: {}, Date, Intl, Error, console, require(name) {
  if (name === 'react') return hooks;
  if (name === 'react/jsx-runtime') return require(name);
  if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
  if (name.startsWith('@mui/material/')) return { __esModule: true, default: name.split('/').at(-1) };
  if (name === '@/context/auth-context') return { useAuth: () => ({ user: { role: 'ADMIN' }, token: 'test-token' }) };
  if (name === 'next/navigation') return { useParams: () => ({ id: 'lead-1' }), useRouter: () => ({ push: route => navigations.push(route), refresh: () => {} }) };
  if (name === 'next/link') return { __esModule: true, default: 'Link' };
  if (name === '@/services/leads.service') return { getLeadById: async () => fixture, getLeadObservations: async () => [], ...services };
  if (name.startsWith('@/constants/') || name.startsWith('@/lib/')) return load(path.resolve(root, 'src', name.slice(2)));
  if (name === '@/components/leads/lead-timeline') return load(path.resolve(root, 'src/components/leads/lead-timeline'));
  if (name.startsWith('@/components/') || name.startsWith('./')) return new Proxy({}, { get: (_, key) => key });
  return require(name);
 } };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, context);
 return {
  render(name = 'default', props) { cursor = 0; return context.exports[name](props); },
  async effects() { const pending = effects; effects = []; pending.forEach(fn => fn()); await new Promise(resolve => setTimeout(resolve, 0)); },
  navigations,
 };
}
function nodes(node) {
 if (Array.isArray(node)) return node.flatMap(nodes);
 if (!node || typeof node !== 'object') return [];
 return [node, ...nodes(node.props?.children)];
}
function find(tree, type, predicate = () => true) {
 const found = nodes(tree).find(node => node.type === type && predicate(node.props));
 assert.ok(found, 'Elemento ausente: ' + type);
 return found;
}
test('exclusao exige confirmacao, cancelar nao exclui e repeticao nao duplica a requisicao', async () => {
 const calls = [];
 let finish;
 const instance = mount('src/app/leads/[id]/componentes/DetalhesLead.tsx', { excluirLead: (id, token) => { calls.push([id, token]); return new Promise(resolve => { finish = resolve; }); } });
 instance.render(); await instance.effects();
 let tree = instance.render();
 find(tree, 'IconButton', p => p['aria-label'] === 'Excluir lead').props.onClick();
 tree = instance.render();
 assert.equal(find(tree, 'Dialog', p => p['aria-labelledby'] === 'delete-lead-title').props.open, true);
 assert.equal(calls.length, 0);
 const description = find(tree, 'Typography', p => p.id === 'delete-lead-description');
 assert.ok(JSON.stringify(description.props.children).includes('Empresa Aurora'));
 find(tree, 'Button', p => p.children === 'Cancelar' && p.autoFocus).props.onClick();
 assert.equal(find(instance.render(), 'Dialog', p => p['aria-labelledby'] === 'delete-lead-title').props.open, false);
 assert.equal(calls.length, 0);
 find(instance.render(), 'IconButton', p => p['aria-label'] === 'Excluir lead').props.onClick();
 const confirm = find(instance.render(), 'Button', p => p.children === 'Excluir').props.onClick;
 const pending = confirm();
 await confirm();
 assert.deepEqual(calls, [['lead-1', 'test-token']]);
 assert.equal(find(instance.render(), 'Button', p => p.children === 'Excluindo…').props.disabled, true);
 const dialog = find(instance.render(), 'Dialog', p => p['aria-labelledby'] === 'delete-lead-title');
 dialog.props.onClose();
 assert.equal(find(instance.render(), 'Dialog', p => p['aria-labelledby'] === 'delete-lead-title').props.open, true);
 finish({ message: 'Excluido' }); await pending;
 assert.deepEqual(instance.navigations, ['/leads']);
});
test('falha na exclusao preserva lead e permite tentar novamente', async () => {
 const instance = mount('src/app/leads/[id]/componentes/DetalhesLead.tsx', { excluirLead: async () => { throw new Error('Sem permissao para excluir'); } });
 instance.render(); await instance.effects();
 find(instance.render(), 'IconButton', p => p['aria-label'] === 'Excluir lead').props.onClick();
 await find(instance.render(), 'Button', p => p.children === 'Excluir').props.onClick();
 const tree = instance.render();
 assert.equal(find(tree, 'Dialog', p => p['aria-labelledby'] === 'delete-lead-title').props.open, true);
 assert.equal(find(tree, 'Button', p => p.children === 'Excluir').props.disabled, false);
 assert.equal(find(tree, 'FeedbackToast').props.message, 'Sem permissao para excluir');
 assert.deepEqual(instance.navigations, []);
});
test('trocar de lead descarta resposta antiga e erros de acesso aparecem no Dialog', async () => {
 const pending = new Map();
 const instance = mount('src/components/leads/lead-preview-dialog.tsx', { getLeadById: (id, token) => { assert.equal(token, 'test-token'); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); } });
 const props = id => ({ leadId: id, token: 'test-token', onClose: () => {} });
 instance.render('LeadPreviewDialog', props('primeiro')); await instance.effects();
 instance.render('LeadPreviewDialog', props('segundo')); await instance.effects();
 pending.get('primeiro').resolve(fixture); await new Promise(resolve => setTimeout(resolve, 0));
 let tree = instance.render('LeadPreviewDialog', props('segundo'));
 assert.ok(nodes(tree).some(node => node.type === 'CircularProgress'));
 pending.get('segundo').reject(new Error('Acesso negado')); await new Promise(resolve => setTimeout(resolve, 0));
 tree = instance.render('LeadPreviewDialog', props('segundo'));
 assert.equal(find(tree, 'Alert', p => p.severity === 'error').props.children, 'Acesso negado');
});


test('pre-visualizacao carrega observacoes pelo endpoint usado na tela de detalhes', async () => {
 const instance = mount('src/components/leads/lead-preview-dialog.tsx', {
  getLeadById: async () => ({ ...fixture, observations: undefined }),
  getLeadObservations: async (id, token) => { assert.equal(id, 'lead-1'); assert.equal(token, 'test-token'); return fixture.observations; },
 });
 const props = { leadId: 'lead-1', token: 'test-token', onClose: () => {} };
 instance.render('LeadPreviewDialog', props); await instance.effects();
 const tree = instance.render('LeadPreviewDialog', props);
 const content = nodes(tree).find(node => typeof node.type === 'function' && node.props?.lead);
 assert.ok(content, 'Conteudo do lead deve aparecer');
 assert.equal(content.props.lead.observations?.[0]?.content, 'Prefere contato por email');
});

test('cancelar edição fecha o formulário sem salvar', () => {
 let cancelamentos = 0, salvamentos = 0;
 const instancia = mount('src/components/leads/lead-form.tsx');
 const arvore = instancia.render('LeadForm', { loading: false, onCancelar: () => { cancelamentos++; }, onSubmit: async () => { salvamentos++; return true; } });
 const botao = find(arvore, 'Button', p => p.children === 'Cancelar');
 assert.equal(botao.props.type, 'button');
 botao.props.onClick();
 assert.equal(cancelamentos, 1);
 assert.equal(salvamentos, 0);
});
