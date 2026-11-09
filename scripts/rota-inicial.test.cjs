const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const raiz=path.resolve(__dirname,'..');
function carregar(arquivo,imports={}){
 const ambiente={exports:{},Error,require:nome=>{
  if(nome in imports)return imports[nome];
  if(nome==='@/config/screens')return carregar('src/config/screens.ts');
  if(nome==='@/lib/rota-inicial')return carregar('src/lib/rota-inicial.ts');
  if(nome==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'};
  if(nome.startsWith('@mui/'))return{__esModule:true,default:nome.split('/').pop()};
  return{};
 }};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(raiz,arquivo),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,ambiente);
 return ambiente.exports;
}
const usuario=(role='ADMIN',outros={})=>({id:'u1',name:'Pessoa',email:'teste@exemplo.com',role,...outros});
test('Início é preferido à ordem dos itens do menu',()=>{
 const {getRotaInicial}=carregar('src/lib/rota-inicial.ts');
 for(const role of ['ADMIN','GESTAO','COMERCIAL','MARKETING','CLIENTE','ATENDIMENTO','LIDER_ATENDIMENTO'])assert.equal(getRotaInicial(usuario(role)),'/painel');
});
test('troca obrigatória de senha vem antes da página inicial',()=>assert.equal(carregar('src/lib/rota-inicial.ts').getRotaInicial(usuario('ADMIN',{mustChangePassword:true})),'/alterar-senha'));
test('permissões existentes continuam restringindo a página inicial',()=>{
 const {getRotaInicial}=carregar('src/lib/rota-inicial.ts');
 assert.equal(getRotaInicial(usuario('CONSULTORA')),'/cadastros');
 assert.equal(getRotaInicial(usuario('ADMIN',{screenPermissions:[{role:'ADMIN',screenKey:'dashboard',isEnabled:false}]})),'/cadastros');
 assert.equal(getRotaInicial(usuario('CONSULTORA',{screenPermissions:[{role:'CONSULTORA',screenKey:'dashboard',isEnabled:true}]})),'/painel');
});
test('ausência de usuário leva ao login',()=>assert.equal(carregar('src/lib/rota-inicial.ts').getRotaInicial(null),'/entrar'));
test('endereço principal encaminha ao Início protegido',()=>{
 const destinos=[];const Home=carregar('src/app/components/HomePage.tsx',{'next/navigation':{redirect:rota=>destinos.push(rota)}}).default;Home();assert.deepEqual(destinos,['/painel']);
});
function login(sessao){
 const efeitos=[],destinos=[];
 const imports={'react':{useState:inicial=>[inicial,()=>{}],useEffect:efeito=>efeitos.push(efeito)},'next/navigation':{useRouter:()=>({replace:rota=>destinos.push(rota),push:rota=>destinos.push(rota)})},'@/context/auth-context':{useAuth:()=>({...sessao,signIn:async()=>({user:usuario()})})}};
 carregar('src/app/entrar/components/LoginPage.tsx',imports).default();efeitos.forEach(executar=>executar());return destinos;
}
test('sessão já autenticada vai ao Início sem pedir login de novo',()=>assert.deepEqual(login({loading:false,token:'token',user:usuario()}),['/painel']));
test('espera restaurar a sessão e mantém login para pessoa não autenticada',()=>{
 assert.deepEqual(login({loading:true,token:'token',user:usuario()}),[]);assert.deepEqual(login({loading:false,token:null,user:null}),[]);
});
test('sessão com troca obrigatória também é encaminhada corretamente',()=>assert.deepEqual(login({loading:false,token:'token',user:usuario('ADMIN',{mustChangePassword:true})}),['/alterar-senha']));

test('login bem-sucedido aplica o destino inicial sem deixar login no histórico',async()=>{
 const fonte=fs.readFileSync(path.join(raiz,'src/app/entrar/components/LoginPage.tsx'),'utf8'),ast=ts.createSourceFile('login.tsx',fonte,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler;
 function visitar(no){if(ts.isFunctionDeclaration(no)&&no.name?.text==='handleSubmit')handler=no.getText(ast);ts.forEachChild(no,visitar);}visitar(ast);
 for(const obrigatoria of [false,true]){
  const destinos=[],ambiente={exports:{},Error,email:'teste@exemplo.com',password:'senha-ficticia',setLoading:()=>{},setError:()=>{},signIn:async()=>({user:usuario('ADMIN',{mustChangePassword:obrigatoria})}),router:{replace:rota=>destinos.push(rota)},getRotaInicial:carregar('src/lib/rota-inicial.ts').getRotaInicial};
  vm.runInNewContext(ts.transpileModule('exports.executar = '+handler,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ambiente);await ambiente.exports.executar({preventDefault:()=>{}});
  assert.deepEqual(destinos,[obrigatoria?'/alterar-senha':'/painel']);
 }
});
function proteger(caminho,user=usuario('COMERCIAL'),token='token'){
 const efeitos=[],destinos=[];
 carregar('src/components/layout/protected-route.tsx',{'react':{useEffect:executar=>efeitos.push(executar)},'next/navigation':{usePathname:()=>caminho,useRouter:()=>({replace:rota=>destinos.push(rota)})},'@/context/auth-context':{useAuth:()=>({loading:false,user,token})}}).ProtectedRoute({children:'Conteúdo protegido'});
 efeitos.forEach(executar=>executar());return destinos;
}
test('rota bloqueada retorna ao Início permitido em vez do primeiro item do menu',()=>assert.deepEqual(proteger('/logs'),['/painel']));
test('acesso autorizado por link direto continua na página solicitada',()=>assert.deepEqual(proteger('/oportunidades/cadastro/c1'),[]));
test('página protegida continua exigindo autenticação',()=>assert.deepEqual(proteger('/painel',null,null),['/entrar']));
test('proteção mantém troca obrigatória antes de liberar a página',()=>assert.deepEqual(proteger('/painel',usuario('ADMIN',{mustChangePassword:true})),['/alterar-senha']));
