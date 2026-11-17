const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');
const load = createSourceLoader();
const { filtrarBiPorResponsavel, normalizarOportunidadesBi } = load('src/lib/bi-comercial.ts');
const { appScreens, isScreenEnabledForRole } = load('src/config/screens.ts');

test('filtro do BI usa ID, inclusive quando duas colaboradoras têm o mesmo nome', () => {
  const cadastros = [
    { id: 'a', responsavelId: 'usuario-a', responsavel: 'Maria' },
    { id: 'b', responsavelId: 'usuario-b', responsavel: 'Maria' },
    { id: 'c', responsavel: 'Maria', internalOwnerId: 'usuario-a' },
  ];
  const oportunidades = normalizarOportunidadesBi([{ id: 'o1', clientId: 'a' }, { id: 'o2', clientId: 'b' }, { id: 'o3', clientId: 'c' }]);
  const result = filtrarBiPorResponsavel(cadastros, oportunidades, 'usuario-a');
  assert.deepEqual(result.cadastros.map(item => item.id), ['a']);
  assert.deepEqual(Array.from(result.oportunidades, item => item.id), ['o1']);
  assert.deepEqual(filtrarBiPorResponsavel(cadastros, oportunidades, 'sem-responsavel').cadastros.map(item => item.id), ['c']);
});

test('Consultora pode ter acesso ao BI, mas bloqueios explícitos continuam valendo', () => {
  const tela = appScreens.find(item => item.key === 'commercialBi');
  assert.equal(isScreenEnabledForRole(tela, 'CONSULTORA'), true);
  assert.equal(isScreenEnabledForRole(tela, 'CONSULTORA', [{ role: 'CONSULTORA', screenKey: 'commercialBi', isEnabled: false }]), false);
  assert.equal(isScreenEnabledForRole(tela, 'CLIENTE', [{ role: 'CLIENTE', screenKey: 'commercialBi', isEnabled: true }]), false);
});
