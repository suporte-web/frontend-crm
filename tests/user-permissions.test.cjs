const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/config/screens.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { isPermissionEnabledForRole } = context.exports;
const screen = { key: 'test', label: 'Test', roles: ['GESTAO'] };
test('additional profile grants access even when the first profile disables the screen', () => {
  assert.equal(isPermissionEnabledForRole(screen, ['MARKETING', 'GESTAO'], [{ role: 'MARKETING', screenKey: 'test', isEnabled: false }]), true);
});
test('explicit permission on an additional profile grants access', () => {
  assert.equal(isPermissionEnabledForRole(screen, ['MARKETING', 'ATENDIMENTO'], [
    { role: 'MARKETING', screenKey: 'test', isEnabled: false },
    { role: 'ATENDIMENTO', screenKey: 'test', isEnabled: true },
  ]), true);
});
test('access is denied when all selected profiles disable the screen', () => {
  assert.equal(isPermissionEnabledForRole(screen, ['MARKETING', 'GESTAO'], [
    { role: 'MARKETING', screenKey: 'test', isEnabled: false },
    { role: 'GESTAO', screenKey: 'test', isEnabled: false },
  ]), false);
});
test('legacy single profiles retain default permissions', () => {
  assert.equal(isPermissionEnabledForRole(screen, 'GESTAO'), true);
  assert.equal(isPermissionEnabledForRole(screen, 'MARKETING'), false);
  assert.equal(isPermissionEnabledForRole(screen, undefined), false);
});

const roleContext = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/user-roles.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, roleContext);
test('chat internal visibility is granted by an additional Commercial profile', () => {
  assert.equal(roleContext.exports.canUseInternalChat?.({ role: 'LIDER_ATENDIMENTO', roles: ['LIDER_ATENDIMENTO', 'COMERCIAL'] }), true);
});
test('chat recognizes Gestão and secondary Marketing while excluding Atendimento alone', () => {
  assert.equal(roleContext.exports.canUseInternalChat?.({ role: 'GESTAO' }), true);
  assert.equal(roleContext.exports.canUseInternalChat?.({ role: 'OPERACAO', roles: ['OPERACAO', 'MARKETING'] }), true);
  assert.equal(roleContext.exports.canUseInternalChat?.({ role: 'ATENDIMENTO' }), false);
});
