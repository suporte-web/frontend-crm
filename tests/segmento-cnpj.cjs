const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');
const { mesclarDadosCnpj } = createSourceLoader()('src/lib/cnpj-form.ts');
const base = { document: '00000000000191', cnae: '', segment: '', companyName: '', legalName: '', tradeName: '' };
const dados = { cnpj: base.document, legalName: 'Empresa', tradeName: '', cnae: '2063100', cnaeDescription: 'Descrição detalhada da atividade', segmento: { id: 's', nome: 'Cosméticos' }, address: {} };
test('CNPJ usa o segmento padronizado e conserva a descrição em atividade comercial', () => {
  const atual = mesclarDadosCnpj({ ...base, segmentoAutomatico: true }, dados, base);
  assert.equal(atual.segment, 'Cosméticos'); assert.equal(atual.segmentoId, 's');
  assert.equal(atual.businessActivity, dados.cnaeDescription);
});
test('CNPJ não substitui uma escolha manual, inclusive durante requisição pendente', () => {
  const manual = { ...base, segment: 'Embalagens', segmentoAutomatico: false };
  assert.equal(mesclarDadosCnpj(manual, dados, base).segment, 'Embalagens');
});
test('CNAE sem regra permanece sem segmento, sem copiar a descrição livre', () => {
  assert.equal(mesclarDadosCnpj(base, { ...dados, segmento: null }, base).segment, '');
});
