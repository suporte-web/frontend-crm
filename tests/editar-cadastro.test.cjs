const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const jsx = require('react/jsx-runtime');
function montar() {
  const estados = []; let indice = 0, efeito; const chamadas = [];
  const formulario = { companyName: 'Empresa', legalName: 'Razão', tradeName: '', phone: '', document: '12345678000199', cnae: '', stateRegistration: '', businessActivity: '', taxRegime: '', address: 'Rua original', city: 'Curitiba', bankDetails: '', modality: '', registrationDate: '2026-10-16', segment: '', status: 'ATIVO', notes: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', state: '' };
  const cadastro = { id: 'c1', company: 'Empresa', modalidadeCadastro: 'CLIENTE', contacts: [{ name: 'Maria', email: 'maria@example.invalid', notes: 'WhatsApp: 41999999999\nLinkedIn: perfil' }], documents: [{ id: 'doc-antigo' }] };
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync('src/components/cadastros/editar-cadastro-dialog.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const registrar = nome => async (...args) => { chamadas.push({ nome, args }); };
  const carregar = nome => {
    if (nome === 'react/jsx-runtime') return jsx;
    if (nome === 'react') return { useState: inicial => { const pos = indice++; if (!(pos in estados)) estados[pos] = typeof inicial === 'function' ? inicial() : inicial; return [estados[pos], valor => { estados[pos] = typeof valor === 'function' ? valor(estados[pos]) : valor; }]; }, useEffect: acao => { efeito ??= acao; } };
    if (nome === '@mui/material') return new Proxy({}, { get: (_, prop) => prop });
    if (nome === 'lucide-react') return { X: 'icone-fechar' };
    if (nome.includes('client-form')) return { ClientForm: 'ClientForm', emptyClientContact: () => ({ name: '', role: '', email: '', phone: '', notes: '' }) };
    if (nome.includes('campos-complementares')) return { CamposComplementaresCadastro: 'CamposComplementaresCadastro' };
    if (nome.includes('cadastros.service')) return { obterDadosLead: async () => ({ status: 'cotacao', metadata: { nextAction: 'Enviar proposta', responsible: 'MCG', monthlyEstimatedValue: '12.500,00', logoUrl: 'foto-original' } }), alterarModalidade: registrar('modalidade'), atualizarEtapaCadastro: registrar('comerciais') };
    if (nome.includes('crm.service')) return { updateClient: registrar('cadastro'), uploadClientDocuments: registrar('documentos') };
    if (nome.includes('lead-funnel')) return { normalizeLeadFunnelStage: valor => valor };
    if (nome.includes('detalhes-cliente-compartilhado')) return { clienteParaFormularioCliente: () => ({ ...formulario }), montarEnderecoCliente: dados => dados.address };
    throw Error(nome);
  };
  vm.runInNewContext(codigo, { module: modulo, exports: modulo.exports, require: carregar });
  const props = { cadastro, token: 'sessao', aoSalvar: registrar('recarregar'), aoFechar: () => chamadas.push({ nome: 'fechar' }) };
  const renderizar = () => { indice = 0; return modulo.exports.EditarCadastroDialog(props); };
  const carregarDados = async () => { renderizar(); efeito(); await new Promise(setImmediate); return renderizar(); };
  return { chamadas, renderizar, carregarDados };
}
function elementos(no) {
  if (Array.isArray(no)) return no.flatMap(elementos);
  if (!no || !no.props) return [];
  return [no, ...elementos(no.props.children)];
}
test('edição usa o formulário do cadastro e preenche contatos e dados comerciais existentes', async () => {
  const tela = montar(); const arvore = await tela.carregarDados();
  const form = elementos(arvore).find(no => no.type === 'ClientForm');
  assert.equal(form.props.form.companyName, 'Empresa');
  assert.equal(form.props.contacts[0].notes, 'WhatsApp: 41999999999\nLinkedIn: perfil');
  const extras = elementos(form.props.camposIniciais).find(no => no.type === 'CamposComplementaresCadastro');
  assert.equal(extras.props.etapa, 'cotacao'); assert.equal(extras.props.comerciais.responsavel, 'MCG'); assert.equal(extras.props.foto, 'foto-original');
  form.props.onCancel(); assert.deepEqual(tela.chamadas.map(item => item.nome), ['fechar']);
});
test('salvar mantém contatos e foto intactos e atualiza o mesmo cadastro', async () => {
  const tela = montar(); const arvore = await tela.carregarDados();
  const form = elementos(arvore).find(no => no.type === 'ClientForm');
  await form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(tela.chamadas.map(item => item.nome), ['cadastro', 'comerciais', 'recarregar', 'fechar']);
  assert.equal(tela.chamadas[0].args[0], 'c1');
  assert.equal(tela.chamadas[0].args[1].contacts[0].notes, 'WhatsApp: 41999999999\nLinkedIn: perfil');
  assert.equal(tela.chamadas[1].args[3].responsavel, 'MCG');
  assert.equal('fotoUrl' in tela.chamadas[1].args[3], false);
});
