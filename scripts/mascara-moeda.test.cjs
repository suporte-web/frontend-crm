const fs=require('fs'),path=require('path'),{createRequire}=require('module');
const root=path.resolve(__dirname,'..'),req=createRequire(path.join(root,'package.json')),ts=req('typescript'),assert=require('node:assert/strict'),test=require('node:test');
const moduleValue={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(root,'src/lib/valor-oportunidade.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(moduleValue.exports);const v=moduleValue.exports;
test('digitação acrescenta centavos e separa milhares',()=>{for(const [input,expected] of [['1','0,01'],['12','0,12'],['123','1,23'],['1234','12,34'],['123456','1.234,56'],['0','0,00'],['',''],['R$ 1.234,56','1.234,56']])assert.equal(v.mascararValorMonetario(input),expected);});
test('acrescentar e apagar dígitos mantém duas casas',()=>{let value='';for(const digit of '123456')value=v.mascararValorMonetario(value+digit);assert.equal(value,'1.234,56');assert.equal(v.mascararValorMonetario(value.slice(0,-1)),'123,45');assert.equal(v.mascararValorMonetario(''),'');});
test('valores existentes são exibidos sem alterar a grandeza',()=>{for(const [input,expected] of [['1234.56','1.234,56'],['1234','1.234,00'],['1.234,56','1.234,56'],['0','0,00'],['','']])assert.equal(v.formatarValorMonetarioSalvo(input),expected);});
test('valor digitado é salvo no número correto',()=>{assert.equal(v.converterValorTotalOportunidade(v.mascararValorMonetario('123456')),1234.56);assert.equal(v.converterValorTotalOportunidade(v.mascararValorMonetario('0')),0);assert.equal(v.converterValorTotalOportunidade(v.mascararValorMonetario('')),null);});

test('formulário comercial aplica a máscara no campo e preserva os outros dados',()=>{
 const React=req('react');const mod={exports:{}};
 const source=fs.readFileSync(path.join(root,'src/components/cadastros/campos-complementares-cadastro.tsx'),'utf8');
 new Function('require','exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(name=>name==='react/jsx-runtime'?req(name):name==='@/lib/valor-oportunidade'?v:name==='@mui/material'?{Box:'Box',MenuItem:'MenuItem',Stack:'Stack',TextField:'TextField'}:name.includes('lead-funnel')?{LEAD_FUNNEL_STAGES:[]}:name.includes('foto-cadastro')?{FotoCadastro:'FotoCadastro'}:{campoCadastroSx:{}},mod.exports,mod);
 let state={responsavel:'Caroline',proximaAcao:'Ligar',volumeMensalEstimado:'1234.56'};
 const render=()=>mod.exports.CamposComplementaresCadastro({modalidade:'LEAD',etapa:'entrada_leads',comerciais:state,setComerciais:fn=>state=fn(state)});
 const find=node=>Array.isArray(node)?node.map(find).find(Boolean):React.isValidElement(node)?node.props.label==='Volume mensal estimado (R$)'?node:find(node.props.children):undefined;
 let field=find(render());assert.equal(field.props.value,'1.234,56');field.props.onChange({target:{value:'123456'}});assert.equal(state.volumeMensalEstimado,'1.234,56');assert.equal(state.responsavel,'Caroline');field=find(render());field.props.onChange({target:{value:''}});assert.equal(state.volumeMensalEstimado,'');
});
