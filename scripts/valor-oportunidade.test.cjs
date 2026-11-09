const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function nomesCadastro(){const c={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/lib/nome-cadastro.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,c);return c.exports;}
const contexto={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/lib/valor-oportunidade.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,contexto);
const {formatarValorOportunidade,origemValorOportunidade}=contexto.exports;
test('prioriza o valor preenchido diretamente na oportunidade',()=>{
  assert.match(formatarValorOportunidade({value:900,valorPropostaComercial:'12345.67'}),/900,00/);
  assert.equal(origemValorOportunidade({value:900,valorPropostaComercial:'12345.67'}),'Valor da oportunidade');
});
test('preserva o valor de oportunidades anteriores quando não há preço de proposta',()=>assert.match(formatarValorOportunidade({value:'1250',valorPropostaComercial:null}),/1\.250,00/));
test('ausência de preço não é convertida em zero',()=>{
  for(const valor of [null,undefined,'',' ','inválido'])assert.equal(formatarValorOportunidade({value:valor}),'Não informado');
});
test('zero explícito na oportunidade prevalece sobre o preço da proposta antiga',()=>assert.match(formatarValorOportunidade({value:0,valorPropostaComercial:'900'}),/0,00/));
test('preserva o preço vinculado quando o valor da oportunidade está vazio',()=>assert.match(formatarValorOportunidade({value:null,valorPropostaComercial:'1250'}),/1\.250,00/));

test('detalhe preserva o preço recebido do backend e o valor original',async()=>{
  const ambiente={exports:{},require:nome=>nome==='@/lib/nome-cadastro'?nomesCadastro():nome==='@/services/api'?{apiFetch:async()=>({
    client:{id:'c-1',createdAt:'2026-11-05',contacts:[]},
    opportunities:[{id:'o-1',clientId:'c-1',title:'Operação',value:'900',valorPropostaComercial:'12345.67',stage:'PROPOSTA',status:'OPEN'}],
  })}:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../src/services/crm.service.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ambiente);
  const detalhe=await ambiente.exports.getCrmLeadById('c-1','token-teste',true);
  assert.equal(detalhe.opportunities[0].valorPropostaComercial,12345.67);
  assert.equal(detalhe.opportunities[0].value,900);
  assert.match(formatarValorOportunidade(detalhe.opportunities[0]),/900,00/);
});
