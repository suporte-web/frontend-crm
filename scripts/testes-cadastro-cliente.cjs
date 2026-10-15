const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const caminho = 'src/app/clientes/[id]/components/detalhes-cliente/AbaCadastroCliente.tsx';
function montar(opcoes = {}) {
 const cliente = { company: 'Empresa', document: '123', status: 'ATIVO', city: 'Curitiba', notes: 'Contato preferencial pela manhã', contacts: [], createdAt: '2026-10-14', taxRegime: 'REGIME_NORMAL', taxation: 'LUCRO_REAL' };
 const inicial = { companyName: 'Empresa', document: '123', legalName: '', tradeName: '', cnae: '', stateRegistration: '', businessActivity: '', taxRegime: 'REGIME_NORMAL', taxation: 'LUCRO_REAL', segment: 'Logística', phone: '41999999999', registrationDate: '2026-10-14', status: 'ATIVO', zipCode: '80000', street: 'Rua', number: '1', complement: '', neighborhood: 'Centro', city: 'Curitiba', state: 'PR', notes: cliente.notes };
 let formulario = { ...inicial }, editando = true, erro = 'Erro anterior', contatos;
 const props = { currentLead: cliente, canEditClient: true, clientForm: formulario, isEditingClient: editando, savingClient: false, clientFormError: '', setFormularioCliente: valor => { formulario = typeof valor === 'function' ? valor(formulario) : valor; }, setIsEditingClient: valor => { editando = typeof valor === 'function' ? valor(editando) : valor; }, setFormularioClienteError: valor => { erro = valor; }, setClientContacts: valor => { contatos = valor; }, handleUpdateClient: () => {}, ...opcoes };
 const contexto = { exports: {}, require(nome) {
  if (nome === 'react/jsx-runtime') return require(nome);
  if (nome === '@mui/material/styles') return { alpha: cor => cor };
  if (nome.startsWith('@mui/material/')) return { __esModule: true, default: nome.split('/').at(-1) };
  if (nome === '@mui/material/styles') return { alpha: cor => cor };
  if (nome.startsWith('@mui/icons-material/')) return { __esModule: true, default: 'Icone' };
  if (nome === 'lucide-react') return new Proxy({}, { get: (_, chave) => chave });
  if (nome === '@/components/mui/crm-primitives') return { CrmSection: 'CrmSection', crmPalette: { border: '#e2e8f0', orange: '#ff5805', muted: '#64748b' } };
  if (nome === '@/services/crm.service') return { formatLeadStatus: valor => valor };
  if (nome === './detalhes-cliente-compartilhado') return { clienteParaFormularioCliente: () => ({ ...inicial }), contatosClienteParaFormulario: () => ['contato original'], UF_OPTIONS: ['PR', 'SP'], formatarData: valor => valor, TituloSecaoFormulario: 'TituloSecaoFormulario', CabecalhoSecao: 'CabecalhoSecao', addressGridSx: {}, editFormSectionSx: {}, textFieldSx: {} };
  throw Error(nome);
 } };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(caminho, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, contexto);
 function expandir(no) { if (Array.isArray(no)) return no.map(expandir); if (!no || typeof no !== 'object') return no; if (typeof no.type === 'function') return expandir(no.type(no.props)); return { ...no, props: { ...no.props, children: expandir(no.props?.children) } }; }
 const arvore = expandir(contexto.exports.AbaCadastroCliente(props));
 return { arvore, props, estado: () => ({ formulario, editando, erro, contatos }) };
}
function elementos(no) { if (Array.isArray(no)) return no.flatMap(elementos); if (!no || typeof no !== 'object') return []; return [no, ...elementos(no.props?.children)]; }
function campo(arvore, nome) { return elementos(arvore).find(n => n.type === 'TextField' && n.props.label === nome); }
test('edição oferece cada campo apenas uma vez e mantém formulário e tamanhos padronizados', () => {
 const { arvore, props } = montar();
 const campos = elementos(arvore).filter(n => n.type === 'TextField');
 for (const nome of ['Segmento', 'Telefone', 'Data do cadastro', 'CEP', 'Rua / Logradouro', 'CNPJ']) assert.equal(campos.filter(n => n.props.label === nome).length, 1, nome);
 assert.ok(campos.every(n => n.props.size === 'small' && n.props.fullWidth));
 assert.equal(elementos(arvore).find(n => n.props.component === 'form').props.onSubmit, props.handleUpdateClient);
});
test('tributação é obrigatória no regime normal e é limpa ao sair dele', () => {
 const instancia = montar();
 assert.equal(campo(instancia.arvore, 'Tributação').props.required, true);
 campo(instancia.arvore, 'Regime tributário').props.onChange({ target: { value: 'SIMPLES_NACIONAL' } });
 assert.equal(instancia.estado().formulario.taxRegime, 'SIMPLES_NACIONAL');
 assert.equal(instancia.estado().formulario.taxation, '');
 const outro = montar({ clientForm: { ...instancia.estado().formulario } });
 assert.equal(campo(outro.arvore, 'Tributação'), undefined);
});
test('cancelar edição restaura cadastro, contatos e limpa erro sem salvar', () => {
 let salvamentos = 0;
 const instancia = montar({ handleUpdateClient: () => { salvamentos++; } });
 const botao = elementos(instancia.arvore).find(n => n.type === 'Button' && n.props.children === 'Cancelar edição');
 assert.equal(botao.props.type, 'button');botao.props.onClick();
 assert.equal(instancia.estado().editando, false);
 assert.equal(instancia.estado().erro, '');
 assert.equal(instancia.estado().contatos[0], 'contato original');
 assert.equal(salvamentos, 0);
});
test('permissões, erro e estado de salvamento permanecem ativos', () => {
 const semPermissao = montar({ canEditClient: false, isEditingClient: false });
 assert.ok(!elementos(semPermissao.arvore).some(n => n.type === 'Button'));
 const instancia = montar({ savingClient: true, clientFormError: 'Falha ao salvar' });
 assert.ok(elementos(instancia.arvore).some(n => n.type === 'Alert' && n.props.children === 'Falha ao salvar'));
 const botao = elementos(instancia.arvore).find(n => n.type === 'Button' && n.props.type === 'submit');
 assert.equal(botao.props.disabled, true);
});
