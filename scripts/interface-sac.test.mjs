import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
const require=createRequire(import.meta.url);const ts=require('typescript');
function compilar(arquivo){return ts.transpileModule(readFileSync(new URL(arquivo,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;}
function montar(arquivo,mocks={}){
  const valores=[],deps=[];let posicao=0;let efeitos=[];
  const hooks={useState(inicial){const i=posicao++;if(!(i in valores))valores[i]=inicial;return[valores[i],v=>{valores[i]=typeof v==='function'?v(valores[i]):v;}];},useRef(inicial){const i=posicao++;if(!(i in valores))valores[i]={current:inicial};return valores[i];},useCallback(cb){posicao++;return cb;},useEffect(cb,novos){const i=posicao++;if(!deps[i]||novos.some((v,j)=>!Object.is(v,deps[i][j]))){deps[i]=novos;efeitos.push(cb);}}};
  const mui=new Proxy({},{get:(_,nome)=>nome});
  const modulos={react:hooks,'@mui/material':mui,'@/services/atendimento-sac.api':{},'@/components/layout/app-layout':{AppLayout:'AppLayout'},'@/components/ui/feedback-toast':{FeedbackToast:'FeedbackToast'},'next/link':{default:'Link'},'next/navigation':{useParams:()=>({id:'caso'})},'@/context/auth-context':{useAuth:()=>({token:'jwt-do-crm',user:{id:'atendente',role:'ATENDIMENTO'}})},...mocks};
  const cache={};function carregar(nome,caminho){const contexto={exports:{},require:n=>{if(n==='react/jsx-runtime')return require(n);if(n in modulos)return modulos[n];if(n==='@/types/atendimento-sac.types')return carregar(n,'../src/types/atendimento-sac.types.ts');if(n==='./ComponentesSac')return carregar(n,'../src/components/atendimento-sac/ComponentesSac.tsx');if(n==='./FormularioAcaoSac')return {FormularioAcaoSac:'FormularioAcaoSac'};if(n==='@/components/attachments/UploadAnexos')return carregar(n,'../src/components/attachments/UploadAnexos.tsx');if(n==='@/components/atendimento/HistoricoAtendimento')return carregar(n,'../src/components/atendimento/HistoricoAtendimento.tsx');throw new Error(`Import não previsto: ${n}`);},Date,JSON,URL,console,window:{location:{search:''}},setTimeout};if(!cache[nome]){vm.runInNewContext(compilar(caminho),contexto);cache[nome]=contexto.exports;}return cache[nome];}
  const componente=carregar('alvo',arquivo);
  function expandir(no){if(Array.isArray(no))return no.map(expandir);if(!no||typeof no!=='object')return no;if(typeof no.type==='function')return expandir(no.type(no.props));return {...no,props:{...no.props,children:expandir(no.props?.children)}};}
  const renderizar=(nome,props)=>{posicao=0;return expandir(componente[nome](props));};
  const executarEfeitos=async()=>{const atuais=efeitos;efeitos=[];atuais.forEach(cb=>cb());await new Promise(r=>setTimeout(r,0));};
  return {renderizar,executarEfeitos};
}
function elementos(no){if(Array.isArray(no))return no.flatMap(elementos);if(!no||typeof no!=='object')return[];return[no,...elementos(no.props?.children)];}
const buscar=(arvore,tipo,predicado=()=>true)=>elementos(arvore).find(no=>no.type===tipo&&predicado(no.props));

test('atalhos do SAC respeitam cada perfil e preservam a rota inicial e permissões antigas',()=>{
  const contexto={exports:{}};vm.runInNewContext(compilar('../src/config/screens.ts'),contexto);const {appScreens,isScreenEnabledForRole}=contexto.exports;
  for(const role of ['ADMIN','GESTAO','LIDER_ATENDIMENTO','ATENDIMENTO'])assert.ok(isScreenEnabledForRole(appScreens.find(s=>s.key==='atendimentoSac'),role));
  for(const role of ['COMERCIAL','OPERACAO','MARKETING','CLIENTE'])assert.equal(isScreenEnabledForRole(appScreens.find(s=>s.key==='atendimentoSac'),role),false);
  assert.ok(isScreenEnabledForRole(appScreens.find(s=>s.key==='acoesSac'),'OPERACAO'));
  assert.equal(appScreens.find(s=>s.href==='/atendimento/acoes'||'/atendimento/acoes'.startsWith(s.href+'/')).key,'acoesSac');
  assert.equal(appScreens.find(s=>isScreenEnabledForRole(s,'LIDER_ATENDIMENTO')).href,'/painel');
  assert.equal(appScreens.find(s=>isScreenEnabledForRole(s,'OPERACAO')).href,'/entregas');
  assert.equal(isScreenEnabledForRole(appScreens.find(s=>s.key==='chat'),'ATENDIMENTO'),false);
});
test('decisão RNC Não envia apenas o booleano, sem campos vazios inválidos',async()=>{
  const chamadas=[];const atendimento={id:'caso',protocolo:'SAC-2026-000001',status:'AGUARDANDO_AVALIACAO',tipo:'RECLAMACAO',nome:'Solicitante',relatoOriginal:{relato:'Original preservado'},anexos:[],historico:[],tarefas:[],criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
  const instancia=montar('../src/components/atendimento-sac/PaginaDetalheSac.tsx',{'@/services/atendimento-sac.api':{requisitarSac:async(_token,caminho,metodo,dados)=>{if(metodo==='POST')chamadas.push({caminho,dados});return caminho==='/participantes'?[]:atendimento;}}});
  const render=()=>instancia.renderizar('default');render();await instancia.executarEfeitos();render();await instancia.executarEfeitos();let arvore=render();buscar(arvore,'Tabs').props.onChange(null,3);arvore=render();buscar(arvore,'TextField',p=>p.label==='Gerou RNC?').props.onChange({target:{value:'false'}});arvore=render();await buscar(arvore,'Button',p=>p.children==='Registrar decisão sobre RNC').props.onClick();
  assert.equal(chamadas[0].caminho,'/caso/rnc');assert.equal(JSON.stringify(chamadas[0].dados),' {"gerou":false}'.trim());
});
test('atualizar anexos mantém o plano de ação ainda não salvo',async()=>{
  const instancia=montar('../src/components/atendimento-sac/FormularioAcaoSac.tsx');let acao={id:'caso',status:'EM_TRATATIVA',protocolo:'SAC-2026-000001',anexos:[],planoAcao:null,prazo:null};const props=()=>({acao,token:'jwt',permitido:true,atualizar:async()=>{},erro:()=>{},sucesso:()=>{}});const render=()=>instancia.renderizar('FormularioAcaoSac',props());render();await instancia.executarEfeitos();let arvore=render();buscar(arvore,'TextField',p=>p.label==='O que será feito?').props.onChange({target:{value:'Plano preenchido antes do upload'}});acao={...acao,anexos:[{id:'anexo',etapa:'ACAO_CORRETIVA',nome:'foto.png'}]};render();await instancia.executarEfeitos();arvore=render();assert.equal(buscar(arvore,'TextField',p=>p.label==='O que será feito?').props.value,'Plano preenchido antes do upload');
});
test('repetir envio de anexos após uma falha envia só os arquivos restantes',async()=>{
  const chamadas=[];let falhar=true;const instancia=montar('../src/components/atendimento-sac/ComponentesSac.tsx',{'@/services/atendimento-sac.api':{enviarAnexoSac:async(_t,_id,arquivo,_etapa,comentario)=>{chamadas.push([arquivo.name,comentario]);if(arquivo.name==='segundo.pdf'&&falhar){falhar=false;throw new Error('Falha temporária');}}}});const props={token:'jwt',id:'caso',etapa:'ACAO_CORRETIVA',concluido:async()=>{},erro:()=>{}};const render=()=>instancia.renderizar('UploadAnexosSac',props);let arvore=render();buscar(arvore,'input').props.onChange({target:{files:[{name:'primeiro.pdf',size:10},{name:'segundo.pdf',size:10}],value:''}});arvore=render();buscar(arvore,'TextField',p=>p.label==='Comentário: segundo.pdf').props.onChange({target:{value:'Evidência final'}});arvore=render();await buscar(arvore,'Button',p=>p.children==='Enviar anexos').props.onClick();arvore=render();assert.equal(elementos(arvore).filter(n=>n.type==='TextField').length,1);await buscar(arvore,'Button',p=>p.children==='Enviar anexos').props.onClick();assert.deepEqual(chamadas,[['primeiro.pdf',''],['segundo.pdf','Evidência final'],['segundo.pdf','Evidência final']]);
});

test('Atendimento fica imediatamente abaixo de Operação na sidebar', () => {
  const contexto = { exports: {}, require: () => new Proxy({}, { get: (_alvo, nome) => nome }) };
  vm.runInNewContext(compilar('../src/components/layout/sidebar-config.ts'), contexto);
  const ids = contexto.exports.sidebarSections.map(secao => secao.id);
  assert.equal(ids.indexOf('atendimento-sac'), ids.indexOf('operacao') + 1);
});
