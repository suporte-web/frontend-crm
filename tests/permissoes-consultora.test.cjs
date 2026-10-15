const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function carregar(arquivo) {
 const contexto = { exports: {} };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, contexto);
 return contexto.exports;
}
const telas = carregar('src/config/screens.ts');
const perfis = carregar('src/lib/user-roles.ts');
test('Consultora usa Clientes e Leads por padrão e respeita telas adicionais e desativação', () => {
 assert.deepEqual(Array.from(telas.appScreens.filter(t=>telas.isScreenEnabledForRole(t,'CONSULTORA')),t=>t.key),['clients','leads']);
 const configuradas=[{screenKey:'entregas',isEnabled:true},{screenKey:'clients',isEnabled:false}];
 assert.equal(telas.podeAcessarRota('/entregas','CONSULTORA',configuradas),true);
 assert.equal(telas.podeAcessarRota('/clientes','CONSULTORA',configuradas),false);
 assert.equal(telas.podeAcessarRota('/usuarios','CONSULTORA',configuradas),false);
});

test('Gestão de Prospecções é exclusiva de Admin, Gestão e Comercial', () => {
 for(const role of ['ADMIN','GESTAO','COMERCIAL']) assert.equal(telas.podeAcessarRota('/gestao-prospeccoes',role),true);
 for(const role of ['CONSULTORA','MARKETING','CLIENTE','OPERACAO']) assert.equal(telas.podeAcessarRota('/gestao-prospeccoes',role,[{screenKey:'prospectingManagement',isEnabled:true}]),false);
});

test('Consultora bloqueia rotas desconhecidas e outras telas, mas permite detalhes de clientes e leads', () => {
 for (const rota of ['/clientes/123','/leads/123','/alterar-senha']) assert.equal(telas.podeAcessarRota?.(rota,'CONSULTORA'),true);
 for (const rota of ['/clientes-extra','/painel','/usuarios','/qualquer']) assert.equal(telas.podeAcessarRota?.(rota,'CONSULTORA'),false);
});
test('Rotas usam a tela de prefixo mais específico', () => {
 const permissoes=[{screenKey:'atendimentoSac',isEnabled:true},{screenKey:'visitas',isEnabled:false}];
 assert.equal(telas.podeAcessarRota?.('/atendimento/visitas/123','ATENDIMENTO',permissoes),false);
});
test('Selecionar Consultora remove outros perfis e selecionar outro perfil remove Consultora', () => {
 assert.deepEqual(Array.from(perfis.selecionarPerfis?.(['ADMIN'],['ADMIN','CONSULTORA']) ?? []),['CONSULTORA']);
 assert.deepEqual(Array.from(perfis.selecionarPerfis?.(['CONSULTORA'],['CONSULTORA','COMERCIAL']) ?? []),['COMERCIAL']);
 assert.equal(perfis.validarPerfis?.(['CONSULTORA','ADMIN']),false);
 assert.equal(perfis.validarPerfis?.(['GESTAO','MARKETING']),true);
});
test('Permissões por perfil tem uma tela própria após Usuários', () => {
 const indice=telas.appScreens.findIndex(tela=>tela.key==='users');
 assert.equal(telas.appScreens[indice+1]?.href,'/permissoes-por-perfil');
});
