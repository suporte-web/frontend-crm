const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const raiz = path.resolve(__dirname, '..');
function avaliar(fonte, contexto = {}) {
  const ambiente = { exports: {}, Error, Number, ...contexto };
  vm.runInNewContext(ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, ambiente);
  return ambiente.exports;
}
const valores = avaliar(fs.readFileSync(path.join(raiz, 'src/lib/valor-oportunidade.ts'), 'utf8'));
function extrair(arquivo, nome) {
  const fonte = fs.readFileSync(path.join(raiz, arquivo), 'utf8');
  const ast = ts.createSourceFile('componente.tsx', fonte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let resultado;
  function visitar(no) {
    if ((ts.isFunctionDeclaration(no) || ts.isVariableDeclaration(no)) && no.name?.getText(ast) === nome) resultado = ts.isFunctionDeclaration(no) ? no.getText(ast).replace(/^export\s+/, '') : no.initializer.getText(ast);
    ts.forEachChild(no, visitar);
  }
  visitar(ast);
  assert.ok(resultado, `Função ${nome} encontrada`);
  return resultado;
}
const arquivoPagina = 'src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx';
const arquivoFormulario = 'src/app/clientes/[id]/components/detalhes-cliente/detalhes-cliente-compartilhado.tsx';
function preparar(valorTotal, edicao = false) {
  const chamadas = [], mensagens = [];
  const formulario = { title: 'Operação Curitiba', proposalType: 'ARMAZENAGEM', storageOptions: ['Armazenagem'], transportOptions: [], transportValues: {}, valorTotal };
  const noop = () => {};
  const ambiente = {
    ...valores, token: 'token-teste', lead: { id: 'c-1', opportunities: [{ id: 'o-1', status: 'OPEN' }] },
    opportunityProposalForm: formulario, editingOpportunityForm: formulario,
    setSavingOpportunityProposal: noop, setOpportunityProposalError: mensagem => mensagens.push(mensagem),
    setToast: mensagem => mensagens.push(mensagem), setFormularioPropostaOportunidade: noop,
    setSavingEditingOpportunityId: noop, setEditingOpportunityId: noop, setEditingOpportunityForm: noop,
    formularioPropostaOportunidadeVazio: () => ({}), reloadClient: async () => {},
    montarObservacoesProposta: () => 'Observações preservadas',
    criarOportunidade: async (dados, token) => chamadas.push({ dados, token }),
    atualizarOportunidade: async (id, dados, token) => chamadas.push({ id, dados, token }),
  };
  const nome = edicao ? 'handleUpdateOpportunity' : 'handleCreateOpportunityProposal';
  const executar = avaliar(`exports.executar = ${extrair(arquivoPagina, nome)}`, ambiente).executar;
  return { chamadas, mensagens, executar: () => edicao ? executar('o-1', { preventDefault: noop }) : executar({ preventDefault: noop }) };
}

test('converte moeda brasileira sem confundir milhar e centavos', () => {
  for (const [texto, esperado] of [['1.234,56', 1234.56], ['1234,56', 1234.56], ['1234.56', 1234.56], ['1.234', 1234], ['0,00', 0], ['', null]]) {
    assert.equal(valores.converterValorTotalOportunidade(texto), esperado);
  }
});
test('rejeita negativos, texto inválido e mais de duas casas decimais', () => {
  for (const texto of ['-10', 'abc', '12,345', '1.23,45', '1,2,3']) assert.throws(() => valores.converterValorTotalOportunidade(texto), /Informe um valor total/i);
});
test('criação envia valor total à rota existente junto das informações comerciais', async () => {
  const fluxo = preparar('1.234,56'); await fluxo.executar();
  assert.equal(fluxo.chamadas.length, 1);
  const { dados, token } = fluxo.chamadas[0];
  assert.equal(dados.value, 1234.56); assert.equal(dados.clientId, 'c-1'); assert.equal(token, 'token-teste');
  assert.match(dados.preContractNotes, /Armazenagem/);
});
test('edição envia valor total e preserva as observações', async () => {
  const fluxo = preparar('2.500,00', true); await fluxo.executar();
  assert.equal(fluxo.chamadas.length, 1); assert.equal(fluxo.chamadas[0].id, 'o-1');
  assert.equal(fluxo.chamadas[0].dados.value, 2500);
  assert.equal(fluxo.chamadas[0].dados.preContractNotes, 'Observações preservadas');
});
test('edição permite limpar o valor e zero explícito é salvo', async () => {
  const limpar = preparar('', true); await limpar.executar(); assert.equal(limpar.chamadas[0]?.dados.value, null);
  const zero = preparar('0,00'); await zero.executar(); assert.equal(zero.chamadas[0]?.dados.value, 0);
});
test('valor inválido bloqueia criação e edição antes da requisição', async () => {
  for (const edicao of [false, true]) {
    const fluxo = preparar('valor incorreto', edicao); await fluxo.executar();
    assert.equal(fluxo.chamadas.length, 0); assert.ok(fluxo.mensagens.some(m => typeof m === 'string' ? m : m.variant === 'error'));
  }
});
test('edição carrega o valor já salvo mesmo sem observações', () => {
  const fabricar = avaliar(`exports.fabricar = ${extrair(arquivoFormulario, 'formularioPropostaOportunidadeVazio')}`, { TRANSPORT_PRICE_ITEMS: [] }).fabricar;
  const converter = avaliar(`exports.converter = ${extrair(arquivoFormulario, 'propostaParaFormulario')}`, { ...valores, formularioPropostaOportunidadeVazio: fabricar }).converter;
  assert.equal(converter({ title: 'Proposta', value: 1234.56, preContractNotes: '' }).valorTotal, '1.234,56');
  assert.equal(converter({ title: 'Proposta', value: null, preContractNotes: '' }).valorTotal, '');
});
