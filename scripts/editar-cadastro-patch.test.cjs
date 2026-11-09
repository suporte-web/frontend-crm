const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{createRequire}=require('module');
const root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../backend-crm'),ext=createRequire(path.join(root,'package.json')),back=createRequire(path.join(backend,'package.json')),ts=ext('typescript'),React=ext('react');back('reflect-metadata');
function transpile(file,requireFn){const mod={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,experimentalDecorators:true,emitDecoratorMetadata:true}}).outputText)(requireFn,mod.exports,mod);return mod.exports;}
function dto(file){return transpile(path.join(backend,'src/modules/clientes/dto',file),n=>n.startsWith('.')?dto(n.replace('./','')+'.ts'):back(n));}
const {UpdateClientDto}=dto('update-client.dto.ts'),{plainToInstance}=back('class-transformer'),{validate}=back('class-validator');
const form={companyName:'Empresa Teste',tradeName:'',legalName:'',document:'12345678000100',phone:'',cnae:'',stateRegistration:'',businessActivity:'',taxRegime:'',address:'',city:'',bankDetails:'',modality:'',registrationDate:'',segment:'',status:'ATIVO',notes:''};
async function save(contacts,etapa='cotacao'){
const calls=[],errors=[];let index=0;const ClientForm=()=>null;
const apiFetch=async(url,opts)=>{const payload=JSON.parse(opts.body);calls.push({tipo:'PATCH',payload});const errors=await validate(plainToInstance(UpdateClientDto,payload),{whitelist:true,forbidNonWhitelisted:true});if(errors.length)throw Error(JSON.stringify(errors.map(e=>({property:e.property,children:e.children}))));return{};};
const service=transpile(path.join(root,'src/services/crm.service.ts'),n=>n==='@/services/api'?{apiFetch}:n==='@/lib/nome-cadastro'?transpile(path.join(root,'src/lib/nome-cadastro.ts'),()=>({})):{});
const react={...React,useEffect:()=>{},useState(initial){const n=index++;let value=typeof initial==='function'?initial():initial;if(n===4)value=etapa;if(n===8)value=false;return[value,v=>{if(n===10&&typeof v==='string')errors.push(v);}];}};
const module=transpile(path.join(root,'src/components/cadastros/editar-cadastro-dialog.tsx'),n=>{
if(n==='@/components/ui/feedback-toast')return{FeedbackToast:()=>null};if(n==='react')return react;if(n==='react/jsx-runtime')return ext(n);if(n==='@mui/material')return Object.fromEntries(['Alert','CircularProgress','Dialog','DialogContent','DialogTitle','Divider','IconButton','Stack','Typography'].map(k=>[k,k]));if(n==='lucide-react')return{X:'X'};
if(n==='@/components/clientes/client-form')return{ClientForm,emptyClientContact:()=>({name:'',role:'',email:'',phone:'',notes:''})};if(n==='./campos-complementares-cadastro')return{CamposComplementaresCadastro:()=>null};
if(n==='@/services/crm.service')return{...service,uploadClientDocuments:async()=>{}};
if(n==='@/services/cadastros.service')return{atualizarEtapaCadastro:async(id,etapa)=>{calls.push({tipo:'etapa',etapa});},alterarModalidade:async()=>{}};
if(n==='@/hooks/use-cnpj-lookup')return{useCnpjLookup:()=>({searchingCnpj:false})};
if(n==='@/constants/lead-funnel')return{normalizeLeadFunnelStage:v=>v};
if(n.includes('detalhes-cliente-compartilhado'))return{clienteParaFormularioCliente:()=>form,montarEnderecoCliente:()=>''};throw Error(n);
});
const tree=module.EditarCadastroDialog({cadastro:{id:'empresa',contacts,documents:[],modalidadeCadastro:'CLIENTE'},token:'token-ficticio',aoSalvar:async()=>calls.push({tipo:'recarregar'}),aoFechar:()=>calls.push({tipo:'fechar'})});
function find(el){if(!el)return;if(Array.isArray(el))return el.map(find).find(Boolean);if(el.type===ClientForm)return el;return find(el.props?.children);}const component=find(tree);assert.ok(component,'Formulário de edição não encontrado');await component.props.onSubmit({preventDefault(){}});return{calls,errors};
}
for(const email of [undefined,'','   '])test('salva edição com contato sem email: '+JSON.stringify(email),async()=>{const {calls,errors}=await save([{name:'Maria',email,phone:'41999990000'}]);assert.ok(!errors.some(Boolean),'PATCH rejeitado: '+errors.join(' '));assert.deepEqual(calls.map(c=>c.tipo),['PATCH','etapa','recarregar','fechar']);assert.ok(!('email' in calls[0].payload.contacts[0]));assert.equal(calls[0].payload.contacts[0].isPrimary,true);});
test('salva etapa com contatos mistos e email preenchido preservado',async()=>{const {calls,errors}=await save([{name:'Maria',email:'maria@example.test'},{name:'João',email:''}],'homologacao');assert.ok(!errors.some(Boolean),'PATCH rejeitado: '+errors.join(' '));assert.equal(calls[0].payload.contacts[0].email,'maria@example.test');assert.equal(calls[1].etapa,'homologacao');});
test('email inválido continua bloqueado e não avança para etapa',async()=>{const {calls,errors}=await save([{name:'Maria',email:'invalido'}]);assert.ok(errors.some(Boolean));assert.deepEqual(calls.map(c=>c.tipo),['PATCH']);});

test('remove espaços do email preenchido antes de enviar',async()=>{const {calls,errors}=await save([{name:'Maria',email:'  maria@example.test  '}]);assert.ok(!errors.some(Boolean));assert.equal(calls[0].payload.contacts[0].email,'maria@example.test');});
test('salva cadastro sem contatos sem criar contato vazio',async()=>{const {calls,errors}=await save([]);assert.ok(!errors.some(Boolean));assert.deepEqual(calls[0].payload.contacts,[]);assert.deepEqual(calls.map(c=>c.tipo),['PATCH','etapa','recarregar','fechar']);});
