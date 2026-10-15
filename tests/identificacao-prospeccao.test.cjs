const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
let user = null;
const contexto = {
  exports: {},
  require(name) {
    if (name === '@/context/auth-context') return { useAuth: () => ({ user }) };
    if (name === '@/lib/user-roles') return {
      hasAnyRole: (u, allowed) => (u?.roles?.length ? u.roles : u?.role ? [u.role] : []).some(r => allowed.includes(r)),
    };
    return require(name);
  },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/crm/prospeccao-consultora.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, contexto);
const componente = contexto.exports.IdentificacaoProspeccao;
function renderizar(perfil, roles) {
  user = perfil ? { role: perfil, roles } : null;
  return renderToStaticMarkup(componente({ registro: { prospectedByName: 'Consultora de teste' } }));
}
test('Consultora não vê o chip nem o nome da prospecção', () => {
  assert.equal(renderizar('CONSULTORA'), '');
  assert.equal(renderizar('CONSULTORA', ['CONSULTORA', 'ADMIN']), '');
  assert.equal(renderizar('ADMIN', ['CONSULTORA']), '');
});
test('Comercial, Gestão e Admin veem a identificação da prospecção', () => {
  for (const role of ['COMERCIAL', 'GESTAO', 'ADMIN']) {
    const html = renderizar(role);
    assert.match(html, /Prospecção da consultora/);
    assert.match(html, /Consultora de teste/);
  }
});
test('Sem sessão e outros perfis não veem a identificação', () => {
  for (const role of [null, 'MARKETING', 'CLIENTE', 'OPERACAO', 'ATENDIMENTO', 'LIDER_ATENDIMENTO']) {
    assert.equal(renderizar(role), '');
  }
});
test('Registro sem origem de consultora não exibe identificação', () => {
  user = { role: 'ADMIN' };
  assert.equal(renderToStaticMarkup(componente({ registro: {} })), '');
});
