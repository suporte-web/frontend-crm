const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const raiz=path.resolve(__dirname,'..');
function carregar(arquivo,imports={}){
 const ambiente={exports:{},Map,Set,Date,Error,Promise,require:nome=>{
  if(nome in imports)return imports[nome];
  if(nome.startsWith('@/'))return carregar('src/'+nome.slice(2)+'.ts',imports);
  return{};
 }};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(raiz,arquivo),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ambiente);
 return ambiente.exports;
}
const lib=()=>carregar('src/lib/bi-comercial.ts');
const criado='2026-11-05T12:00:00Z';
const cadastro=(id,etapa='entrada_leads',extras={})=>({id,companyName:'Empresa '+id,modalidadeCadastro:'LEAD',status:'ATIVO',createdAt:criado,updatedAt:criado,leadCadastro:{id:'lead-'+id,source:'manual',status:etapa,metadata:{}},...extras});
const oportunidade=(id,status='OPEN',extras={})=>({id,status,stage:'PROPOSTA',createdAt:criado,...extras});
const usuario={id:'u1',name:'Comercial',email:'teste@exemplo.com',role:'COMERCIAL'};
test('funil usa as sete etapas reais e não duplica cadastros',()=>{
 const etapas=['entrada_leads','conversao','homologacao','cotacao','venda_efetivada','pos_venda','perdido'];
 const dados=etapas.map((etapa,i)=>cadastro('c'+i,etapa));
 const bi=lib().montarBiCadastros([...dados,dados[0]]);
 assert.equal(bi.total,7);for(const etapa of etapas)assert.equal(bi.etapas.find(item=>item.value===etapa).quantidade,1);
});
test('status de oportunidade não vira etapa do funil nem preenche etapa ausente',()=>{
 const bi=lib().montarBiCadastros([cadastro('a','WON'),cadastro('b',''),cadastro('c','GANHO')]);
 assert.equal(bi.etapas.find(item=>item.value==='entrada_leads').quantidade,0);
 assert.equal(bi.etapas.find(item=>item.value==='venda_efetivada').quantidade,0);
 assert.equal(bi.etapas.find(item=>item.value==='sem_etapa').quantidade,3);
});
test('segmentos contam empresas por ID, preservam nomes e identificam ausência',()=>{
 const a=cadastro('a','cotacao',{segment:' Indústria '}),b=cadastro('b','cotacao',{segment:'Indústria'}),c=cadastro('c','cotacao',{segment:'Comércio'}),d=cadastro('d','cotacao',{segment:null});
 const bi=lib().montarBiCadastros([a,a,b,c,d]);
 assert.equal(bi.segmentos.find(item=>item.segmento==='Indústria').quantidade,2);
 assert.equal(bi.segmentos.find(item=>item.segmento==='Comércio').quantidade,1);
 assert.equal(bi.segmentos.find(item=>item.segmento===null).quantidade,1);
 assert.equal(bi.segmentos.reduce((s,item)=>s+item.quantidade,0),4);
});
test('oportunidades contam status real e propostas pela marcação cadastrada',()=>{
 const {normalizarOportunidadesBi,montarBiOportunidades}=lib();
 const a=oportunidade('a','OPEN',{stage:'GANHO'}),b=oportunidade('b','WON',{stage:'NOVO',preContractNotes:'Tipo de proposta: Armazenagem\nOpções: Posição mensal'}),c=oportunidade('c','LOST',{preContractNotes:'Tipo de proposta: Transporte rodoviário\nOrigem: Curitiba'}),d=oportunidade('d','OPEN',{preContract:true});
 const bi=montarBiOportunidades(normalizarOportunidadesBi([a,b,c,d,c]));
 assert.equal(bi.total,4);assert.equal(bi.abertas,2);assert.equal(bi.ganhas,1);assert.equal(bi.perdidas,1);assert.equal(bi.propostas,2);
});
test('normalização do BI descarta observações livres e não expõe os textos de perda',()=>{
 const normalizadas=lib().normalizarOportunidadesBi([oportunidade('a','LOST',{motivoPerda:'OUTRO',observacaoPerda:'Texto privado do usuário',lostReason:'Texto legado livre',preContractNotes:'Tipo de proposta: Armazenagem\nOutra informação: confidencial'})]);
 const json=JSON.stringify(normalizadas);for(const texto of ['Texto privado','Texto legado','confidencial','observacaoPerda','preContractNotes'])assert.ok(!json.includes(texto));
 const perdas=carregar('src/lib/perda-oportunidade.ts').analisarPerdas(normalizadas,[{codigo:'OUTRO',rotulo:'Outro motivo',exigeObservacao:true}]);
 assert.equal(perdas.motivos[0].rotulo,'Outro motivo');assert.equal(perdas.motivos[0].quantidade,1);
});
test('período é aplicado sem confundir data do cadastro com status ou data de contato',()=>{
 const {montarBiCadastros,normalizarOportunidadesBi,montarBiOportunidades}=lib();
 const filtro={de:'2026-11-05',ate:'2026-11-05'};
 const bi=montarBiCadastros([cadastro('a'),cadastro('b','cotacao',{createdAt:'2026-11-04T12:00:00Z'})],filtro);assert.equal(bi.total,1);
 const op=montarBiOportunidades(normalizarOportunidadesBi([oportunidade('a'),oportunidade('b','WON',{createdAt:'2026-11-06T03:00:00Z'})]),filtro);assert.equal(op.abertas,1);assert.equal(op.ganhas,0);
 assert.throws(()=>montarBiCadastros([],{de:'2026-02-30'}),/inválido/i);assert.throws(()=>montarBiOportunidades([],{de:'2026-11-06',ate:'2026-11-05'}),/inválido/i);
});
test('acompanhamento conserva responsável, próxima ação, situação e contato real',()=>{
 const registro=cadastro('a','cotacao');registro.leadCadastro.metadata={responsible:'Maria',nextAction:'Retornar ao contato',currentStatus:'Aguardando retorno',monthlyEstimatedValue:'1.250,00',lastInteractionDate:'2026-10-20'};
 const bi=lib().montarBiCadastros([registro],{agora:new Date(criado)});
 assert.equal(bi.prioridades[0].responsavel,'Maria');assert.equal(bi.prioridades[0].proximaAcao,'Retornar ao contato');assert.equal(bi.prioridades[0].situacaoContato,'Aguardando retorno');assert.equal(bi.valorMensal,1250);assert.ok(bi.prioridades[0].diasSemContato>=15);
});
test('alteração cadastral não conta como interação e dados ausentes não viram valor preenchido',()=>{
 const bi=lib().montarBiCadastros([cadastro('a')],{agora:new Date(criado)});
 assert.equal(bi.semInteracao,1);assert.equal(bi.tempoMedioSemContato,null);assert.equal(bi.cadastrosComValorMensal,0);assert.equal(bi.etapas[0].valoresInformados,0);
 const zero=cadastro('z');zero.leadCadastro.metadata={monthlyEstimatedValue:'0,00'};assert.equal(lib().montarBiCadastros([zero]).cadastrosComValorMensal,1);
});
test('falha ao obter acompanhamento não é apresentada como ausência confirmada de contato',()=>{
 const bi=lib().montarBiCadastros([cadastro('a','cotacao',{dadosAcompanhamentoDisponiveis:false})]);
 assert.equal(bi.semInteracao,0);assert.equal(bi.semProximaAcao,0);assert.equal(bi.prioridades.length,0);assert.equal(bi.acompanhamentosIndisponiveis,1);assert.equal(bi.acompanhamentosDisponiveis,0);
});
test('participação de clientes permanece baseada na modalidade registrada',()=>{
 const bi=lib().montarBiCadastros([cadastro('a','venda_efetivada'),cadastro('b','entrada_leads',{modalidadeCadastro:'CLIENTE'})]);assert.equal(bi.percentualClientes,50);assert.equal(bi.clientes,1);assert.equal(bi.leads,1);
});
function servico({cadastros=[cadastro('a')],leads=[],fallback=async()=>null,bulkFalha=false,api=async()=>[]}={}){
 const chamadas=[];
 const modulo=carregar('src/services/bi-comercial.service.ts',{
  '@/services/cadastros.service':{listarCadastros:async token=>{chamadas.push({tipo:'cadastros',token});return cadastros;},obterDadosLead:async(id,token)=>{chamadas.push({tipo:'detalhe',id,token});return fallback(id);}},
  '@/services/leads.service':{getLeads:async(token,filtro)=>{chamadas.push({tipo:'leads',token,filtro});if(bulkFalha)throw Error('Indisponível');return leads.filter(lead=>Boolean(lead.convertidoParaCliente)===filtro.convertidoParaCliente);}},
  '@/services/api':{apiFetch:async(...args)=>{chamadas.push({tipo:'api',args});return api(...args);}},
 });return{...modulo,chamadas};
}
test('carregamento une dados pelo ID real do Lead e inclui convertidos sem duplicação',async()=>{
 const a=cadastro('a'),b=cadastro('b','pos_venda',{modalidadeCadastro:'CLIENTE'});
 const s=servico({cadastros:[a,a,b],leads:[{id:'lead-a',status:'cotacao',source:'manual',metadata:{nextAction:'Contato A'}},{id:'lead-b',status:'pos_venda',source:'manual',convertidoParaCliente:true,metadata:{monthlyEstimatedValue:'900'}}]});
 const resultado=await s.carregarCadastrosBi('token',usuario);assert.equal(resultado.cadastros.length,2);assert.equal(s.chamadas.filter(c=>c.tipo==='leads').length,2);assert.equal(s.chamadas.filter(c=>c.tipo==='detalhe').length,0);assert.equal(resultado.cadastros[0].leadCadastro.metadata.nextAction,'Contato A');assert.equal(lib().montarBiCadastros(resultado.cadastros).valorMensal,900);
});
test('consulta alternativa usa o cadastro autorizado e respeita limite de concorrência',async()=>{
 let ativas=0,maximo=0;const registros=Array.from({length:9},(_,i)=>cadastro(String(i)));
 const s=servico({cadastros:registros,bulkFalha:true,fallback:async id=>{ativas++;maximo=Math.max(maximo,ativas);await new Promise(resolve=>setImmediate(resolve));ativas--;return{id:'lead-'+id,status:'cotacao',source:'manual',metadata:{responsible:'Maria'}};}});
 const resultado=await s.carregarCadastrosBi('token',usuario);assert.equal(resultado.cadastros.length,9);assert.ok(maximo<=4);assert.equal(s.chamadas.filter(c=>c.tipo==='detalhe').length,9);assert.equal(resultado.avisos.length,0);
});
test('falha ou vínculo divergente não mistura cadastros e informa dados indisponíveis',async()=>{
 const s=servico({fallback:async()=>({id:'lead-de-outra-empresa',metadata:{responsible:'Não usar'}})});
 const resultado=await s.carregarCadastrosBi('token',usuario);assert.equal(resultado.cadastros[0].dadosAcompanhamentoDisponiveis,false);assert.ok(resultado.avisos.length);assert.ok(!JSON.stringify(resultado.cadastros[0]).includes('Não usar'));
});
test('sem permissão de Leads não consulta a listagem de Leads',async()=>{
 const s=servico({fallback:async()=>({id:'lead-a',status:'cotacao',source:'manual',metadata:{}})});
 await s.carregarCadastrosBi('token',{...usuario,screenPermissions:[{role:'COMERCIAL',screenKey:'leads',isEnabled:false}]});assert.equal(s.chamadas.filter(c=>c.tipo==='leads').length,0);assert.equal(s.chamadas.filter(c=>c.tipo==='detalhe').length,1);
});
test('oportunidades usam uma leitura autenticada e não consultam tela bloqueada',async()=>{
 const s=servico({api:async()=>[oportunidade('a')]});const rows=await s.carregarOportunidadesBi('token',usuario);assert.equal(rows.length,1);assert.equal(s.chamadas[0].args[0],'/opportunities');assert.equal(s.chamadas[0].args[2],'token');
 const bloqueado=servico();await assert.rejects(()=>bloqueado.carregarOportunidadesBi('token',{...usuario,screenPermissions:[{role:'COMERCIAL',screenKey:'opportunities',isEnabled:false}]}),/permissão/i);assert.equal(bloqueado.chamadas.length,0);
});
