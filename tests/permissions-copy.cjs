const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');
const load = createSourceLoader();
const rules = load('src/lib/permissoes-perfil.ts');
const catalog = rules.listarPermissoesPerfil([]);
const permission = (screenKey, isEnabled) => ({ screenKey, isEnabled });
const enabled = (key, role, base, draft) => rules.permissaoPerfilHabilitada(catalog.find(item => item.key === key), role, rules.permissoesEfetivasPerfil(base, draft));

test('cópia gera somente diferenças e não altera as permissões salvas', () => {
  const base = catalog.map(item => permission(item.key, false));
  const source = [...base.filter(item => item.screenKey !== 'chat'), permission('chat', true)];
  const snapshot = JSON.stringify({ base, source });
  const draft = rules.copiarPermissoesPerfil('GESTAO', base, 'GESTAO', source, catalog);
  assert.equal(JSON.stringify({ base, source }), snapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(draft.map(item => [item.screenKey, item.isEnabled]))), [['chat', true]]);
});

test('copiar para o mesmo estado não cria alterações pendentes', () => {
  assert.equal(rules.copiarPermissoesPerfil('ADMIN', [], 'ADMIN', [], catalog).length, 0);
});

test('cópia para Admin mantém usuários e permissões obrigatórias', () => {
  const source = catalog.map(item => permission(item.key, false));
  const draft = rules.copiarPermissoesPerfil('ADMIN', [], 'GESTAO', source, catalog);
  assert.equal(enabled('users', 'ADMIN', [], draft), true);
  assert.equal(enabled('profilePermissions', 'ADMIN', [], draft), true);
  assert.ok(!draft.some(item => ['users', 'profilePermissions'].includes(item.screenKey)));
});

test('cópia respeita restrições próprias de Consultora', () => {
  const source = catalog.map(item => permission(item.key, true));
  const draft = rules.copiarPermissoesPerfil('CONSULTORA', [], 'ADMIN', source, catalog);
  for (const key of ['prospectingManagement']) {
    assert.equal(enabled(key, 'CONSULTORA', [], draft), false);
    assert.ok(!draft.some(item => item.screenKey === key));
  }
});

test('Cadastros é habilitado antes de copiar as modalidades vinculadas', () => {
  const base = [permission('cadastros', false), permission('clients', false), permission('leads', false)];
  const source = [permission('cadastros', true), permission('clients', false), permission('leads', true)];
  const draft = rules.copiarPermissoesPerfil('GESTAO', base, 'ADMIN', source, catalog);
  assert.equal(enabled('cadastros', 'GESTAO', base, draft), true);
  assert.equal(enabled('clients', 'GESTAO', base, draft), false);
  assert.equal(enabled('leads', 'GESTAO', base, draft), true);
});

test('cópia conserva chaves adicionais devolvidas pelo backend', () => {
  const customCatalog = [...catalog, { key: 'custom', label: 'Adicional' }];
  const draft = rules.copiarPermissoesPerfil('GESTAO', [], 'ADMIN', [permission('custom', true)], customCatalog);
  assert.equal(draft.find(item => item.screenKey === 'custom')?.isEnabled, true);
});

test('rascunho copiado continua reversível com a alternância existente', () => {
  const base = [permission('chat', false)];
  const draft = rules.copiarPermissoesPerfil('GESTAO', base, 'GESTAO', [permission('chat', true)], catalog);
  const reverted = rules.alternarPermissaoPerfil('GESTAO', base, draft, 'chat', catalog);
  assert.ok(!reverted.some(item => item.screenKey === 'chat'));
});
