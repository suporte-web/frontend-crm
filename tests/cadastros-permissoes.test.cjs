const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const codigo = ts.transpileModule(fs.readFileSync('src/config/screens.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
}).outputText;
const modulo = { exports: {} };
vm.runInNewContext(codigo, { module: modulo, exports: modulo.exports });
const { appScreens, isScreenEnabledForRole, podeAcessarRota } = modulo.exports;
const cadastros = appScreens.find(tela => tela.key === 'cadastros');
const oportunidades = appScreens.find(tela => tela.key === 'opportunities');

test('mantém Cadastros acessível quando apenas Clientes está habilitado', () => {
  const permissoes = [{ role: 'COMERCIAL', screenKey: 'clients', isEnabled: true }, { role: 'COMERCIAL', screenKey: 'leads', isEnabled: false }];
  assert.equal(isScreenEnabledForRole(cadastros, 'COMERCIAL', permissoes), true);
  assert.equal(podeAcessarRota('/cadastros/registro', 'COMERCIAL', permissoes), true);
  assert.equal(podeAcessarRota('/leads/registro', 'COMERCIAL', permissoes), false);
});
test('oculta Cadastros quando as duas origens estão bloqueadas', () => {
  assert.equal(isScreenEnabledForRole(cadastros, 'COMERCIAL', [{ role: 'COMERCIAL', screenKey: 'clients', isEnabled: false }, { role: 'COMERCIAL', screenKey: 'leads', isEnabled: false }]), false);
});
test('respeita o bloqueio explícito de Cadastros', () => {
  assert.equal(isScreenEnabledForRole(cadastros, 'ADMIN', [{ role: 'ADMIN', screenKey: 'cadastros', isEnabled: false }]), false);
});
test('preserva o acesso da Consultora à navegação dos próprios cadastros', () => {
  assert.equal(isScreenEnabledForRole(cadastros, 'CONSULTORA', []), true);
  assert.equal(isScreenEnabledForRole(oportunidades, 'CONSULTORA', []), false);
});
test('aplica a permissão de oportunidades também às rotas de propostas', () => {
  assert.equal(podeAcessarRota('/oportunidades/cadastro/registro/propostas/proposta', 'COMERCIAL', [{ role: 'COMERCIAL', screenKey: 'opportunities', isEnabled: false }]), false);
  assert.equal(podeAcessarRota('/oportunidades/cadastro/registro', 'COMERCIAL', []), true);
});

test('mostra Cadastros e Oportunidades sem repetir as telas antigas na lista de perfis', () => {
  const chaves = Array.from(modulo.exports.profilePermissionItems, item => item.key);
  assert.ok(chaves.includes('cadastros'));
  assert.ok(chaves.includes('opportunities'));
  assert.equal(chaves.includes('clients'), false);
  assert.equal(chaves.includes('leads'), false);
});
test('salvar outra permissão mantém o bloqueio de Leads dentro de Cadastros', () => {
  const permissoes = modulo.exports.montarPermissoesPerfil('COMERCIAL', [
    { role: 'COMERCIAL', screenKey: 'clients', isEnabled: true },
    { role: 'COMERCIAL', screenKey: 'leads', isEnabled: false },
  ], 'opportunities');
  assert.equal(permissoes.find(item => item.screenKey === 'clients').isEnabled, true);
  assert.equal(permissoes.find(item => item.screenKey === 'leads').isEnabled, false);
  assert.equal(permissoes.find(item => item.screenKey === 'cadastros').isEnabled, true);
});
test('reativa Cadastros quando as duas modalidades estavam bloqueadas', () => {
  const permissoes = modulo.exports.montarPermissoesPerfil('COMERCIAL', [
    { role: 'COMERCIAL', screenKey: 'clients', isEnabled: false },
    { role: 'COMERCIAL', screenKey: 'leads', isEnabled: false },
  ], 'cadastros');
  assert.equal(permissoes.find(item => item.screenKey === 'cadastros').isEnabled, true);
  assert.equal(permissoes.find(item => item.screenKey === 'clients').isEnabled, true);
  assert.equal(permissoes.find(item => item.screenKey === 'leads').isEnabled, true);
  assert.equal(isScreenEnabledForRole(cadastros, 'COMERCIAL', permissoes), true);
});
test('desativar Cadastros preserva a escolha das modalidades para uma reativação', () => {
  const permissoes = modulo.exports.montarPermissoesPerfil('COMERCIAL', [
    { role: 'COMERCIAL', screenKey: 'clients', isEnabled: true },
    { role: 'COMERCIAL', screenKey: 'leads', isEnabled: false },
  ], 'cadastros');
  assert.equal(isScreenEnabledForRole(cadastros, 'COMERCIAL', permissoes), false);
  assert.equal(permissoes.find(item => item.screenKey === 'clients').isEnabled, true);
  assert.equal(permissoes.find(item => item.screenKey === 'leads').isEnabled, false);
});
