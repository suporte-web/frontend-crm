const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const arquivo=path.resolve(__dirname,'../src/app/clientes/[id]/propostas/[propostaId]/components/PaginaDetalhePropostaCliente.tsx');
const fonte=fs.readFileSync(arquivo,'utf8'),ast=ts.createSourceFile('pagina.tsx',fonte,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler;
function visitar(no){if(ts.isFunctionDeclaration(no)&&no.name?.text==='handleChangeOpportunityStatus')handler=no.getText(ast);ts.forEachChild(no,visitar);}visitar(ast);assert.ok(handler);
function preparar({salvando=false,falha=false,token='token-teste'}={}){
 const chamadas=[],estado={aberto:true,codigo:'PRECO',observacoes:'Condição anterior',erro:'',toasts:[],recarregou:false};
 const ambiente={exports:{},Error,token,clientId:'c-1',proposalId:'o-1',savingStatus:salvando,lossCode:'PRECO',lossNotes:'Condição anterior',opportunity:{motivoPerda:'CONCORRENCIA',observacaoPerda:'Escolheu outro fornecedor'},
 setLossCode:valor=>estado.codigo=valor,setLossNotes:valor=>estado.observacoes=valor,setErroPerda:valor=>estado.erro=valor,setLossOpen:valor=>estado.aberto=valor,setSavingStatus:valor=>estado.salvando=valor,setToast:valor=>estado.toasts.push(valor),formatOpportunityStatus:status=>status,
 updateOpportunityStatus:async(...args)=>{chamadas.push(args);if(falha)throw Error('Selecione um motivo da perda válido.');},reloadClient:async()=>{estado.recarregou=true;}};
 vm.runInNewContext(ts.transpileModule('exports.executar = '+handler,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ambiente);
 return{...ambiente.exports,chamadas,estado};
}
test('selecionar Perdida abre os motivos sem salvar prematuramente',async()=>{
 const fluxo=preparar();await fluxo.executar('LOST');
 assert.equal(fluxo.estado.aberto,true);assert.equal(fluxo.estado.codigo,'CONCORRENCIA');assert.equal(fluxo.estado.observacoes,'Escolheu outro fornecedor');assert.equal(fluxo.estado.erro,'');assert.equal(fluxo.chamadas.length,0);
});
test('confirmar perda envia motivo e observações e atualiza os dados',async()=>{
 const fluxo=preparar();await fluxo.executar('LOST',true);
 assert.equal(fluxo.chamadas.length,1);const args=fluxo.chamadas[0];assert.equal(args[2],'LOST');assert.equal(args[4].motivoPerda,'PRECO');assert.equal(args[4].observacaoPerda,'Condição anterior');assert.equal(fluxo.estado.aberto,false);assert.equal(fluxo.estado.recarregou,true);assert.equal(fluxo.estado.salvando,false);
});
test('erro de validação mantém o formulário aberto e apresenta a mensagem',async()=>{
 const fluxo=preparar({falha:true});await fluxo.executar('LOST',true);
 assert.equal(fluxo.estado.aberto,true);assert.match(fluxo.estado.erro,/motivo/);assert.equal(fluxo.estado.recarregou,false);assert.equal(fluxo.estado.toasts[0].variant,'error');assert.equal(fluxo.estado.salvando,false);
});
test('salvamento em andamento impede uma nova atualização',async()=>{const fluxo=preparar({salvando:true});await fluxo.executar('LOST',true);assert.equal(fluxo.chamadas.length,0);});
test('outras situações preservam o fluxo de atualização existente',async()=>{const fluxo=preparar();await fluxo.executar('OPEN');assert.equal(fluxo.chamadas[0][2],'OPEN');assert.equal(fluxo.estado.recarregou,true);});
test('ausência de autenticação não envia atualização',async()=>{const fluxo=preparar({token:null});await fluxo.executar('LOST',true);assert.equal(fluxo.chamadas.length,0);});
