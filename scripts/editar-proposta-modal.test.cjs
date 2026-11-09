const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const raiz=path.resolve(__dirname,'..');
function formulario(titulo='Nova operação') { return { title:titulo,valorTotal:'1.234,56',proposalType:'TRANSPORTE_RODOVIARIO',transportOptions:['Distribuição Urbana'],storageOptions:[],customOption:'',origin:'Curitiba',destination:'Sergipe',vehicleType:'Toco',cargoType:'Fracionada',averageWeight:'1200',aggregateValue:'5000',cubage:'',monthlyShipments:'20',dangerousGoods:'NAO',dangerousGoodsInfo:'',transportValues:{'Frete Peso':'500,00'},motivoPerda:'',observacaoPerda:'' }; }
function montar({edicao=true,salvando=false,nova=false,permitido=true}={}){
 const chamadas=[],estados=[],formCriacao=formulario(),formEdicao=formulario('Operação existente');let indice=0;
 const hooks={useEffect:()=>{},useRef:()=>({current:null}),useState:inicial=>{const n=indice++;return[n===1?nova:inicial,valor=>estados.push({n,valor})];}};
 const shared={STORAGE_PROPOSAL_OPTIONS:['Armazenagem'],TRANSPORT_PROPOSAL_OPTIONS:['Distribuição Urbana'],TRANSPORT_PRICE_ITEMS:['Frete Peso'],VEHICLE_TYPE_OPTIONS:['Toco'],formatarData:()=> '05/11/2026',TituloSecaoFormulario:'TituloSecaoFormulario',CabecalhoSecao:'CabecalhoSecao'};
 const valor={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(raiz,'src/lib/valor-oportunidade.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,valor);
 const estilos={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(raiz,'src/components/crm/estilos-oportunidades.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,estilos);
 const ambiente={exports:{},require:nome=>{
  if(nome==='@/components/crm/estilos-oportunidades')return estilos.exports;
  if(nome==='react')return hooks;
  if(nome==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'};
  if(nome==='next/navigation')return{useSearchParams:()=>({get:()=>null})};
  if(nome==='next/link')return{__esModule:true,default:'Link'};
  if(nome.startsWith('@mui/material/'))return{__esModule:true,default:nome.split('/').pop()};
  if(nome==='lucide-react')return new Proxy({},{get:(_,nome)=>nome});
  if(nome==='@/components/mui/crm-primitives')return{CrmSection:'CrmSection'};
  if(nome==='@/lib/valor-oportunidade')return valor.exports;
  if(nome==='@/services/crm.service')return{formatarEtapaOportunidade:()=> 'Proposta'};
  if(nome.endsWith('detalhes-cliente-compartilhado'))return shared;
  if(nome.endsWith('estilos-abas-cliente'))return{paletaAbasCliente:{}};
  return{};
 }};
 const fonte=fs.readFileSync(path.join(raiz,'src/app/clientes/[id]/components/detalhes-cliente/AbaOportunidadePropostaCliente.tsx'),'utf8');
 vm.runInNewContext(ts.transpileModule(fonte,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,ambiente);
 const props={currentLead:{id:'c1',opportunities:[{id:'o1',title:'Operação existente',stage:'PROPOSTA',status:'OPEN'}]},canEditCommercialData:permitido,proposalFiles:{},setProposalFiles:()=>{},opportunityProposalDocuments:[],opportunityProposalForm:formCriacao,editingOpportunityForm:formEdicao,editingOpportunityId:edicao?'o1':null,savingEditingOpportunityId:salvando?'o1':null,savingOpportunityProposal:!edicao&&salvando,opportunityProposalError:'',
 setFormularioPropostaOportunidade:atualizar=>chamadas.push({tipo:'formCriacao',valor:atualizar(formCriacao)}),setEditingOpportunityForm:atualizar=>chamadas.push({tipo:'formEdicao',valor:atualizar(formEdicao)}),
 setEditingOpportunityId:valor=>chamadas.push({tipo:'idEdicao',valor}),handleUpdateOpportunity:(id,event)=>chamadas.push({tipo:'editar',id,event}),handleCreateOpportunityProposal:event=>chamadas.push({tipo:'criar',event}),toggleProposalOption:()=>chamadas.push({tipo:'opcaoCriacao'}),addCustomProposalOption:()=>{},startEditingOpportunity:()=>{},};
 const arvore=ambiente.exports.AbaOportunidadePropostaCliente(props);
 function buscar(no,predicado,achados=[]){if(!no||typeof no!=='object')return achados;if(Array.isArray(no)){no.forEach(n=>buscar(n,predicado,achados));return achados;}if(predicado(no))achados.push(no);buscar(no.props?.children,predicado,achados);buscar(no.props?.control,predicado,achados);return achados;}
 const dialogo=buscar(arvore,no=>no.type==='Dialog')[0];
 return{arvore,dialogo,chamadas,estados,buscar};
}
test('editar abre a mesma janela da nova proposta com o título e os dados preenchidos',()=>{
 const tela=montar();assert.equal(tela.dialogo.props.open,true);
 const campos=tela.buscar(tela.dialogo,no=>no.type==='TextField');
 assert.ok(campos.some(no=>no.props.value==='Operação existente'));assert.ok(campos.some(no=>no.props.value==='Curitiba'));assert.ok(campos.some(no=>no.props.value==='1.234,56'));assert.ok(campos.some(no=>no.props.value==='500,00'));
});
test('enviar em edição atualiza a oportunidade existente e não cria outra',()=>{
 const tela=montar();const form=tela.buscar(tela.dialogo,no=>no.props?.component==='form')[0];form.props.onSubmit({preventDefault:()=>{}});
 assert.equal(tela.chamadas.filter(c=>c.tipo==='editar').length,1);assert.equal(tela.chamadas.find(c=>c.tipo==='editar').id,'o1');assert.equal(tela.chamadas.filter(c=>c.tipo==='criar').length,0);
});
test('alterar o valor na edição não altera o formulário de criação',()=>{
 const tela=montar();const campo=tela.buscar(tela.dialogo,no=>no.type==='TextField'&&no.props.label==='Valor total (R$)')[0];campo.props.onChange({target:{value:'3.500,00'}});
 assert.equal(tela.chamadas[0].tipo,'formEdicao');assert.equal(tela.chamadas[0].valor.valorTotal,'3.500,00');
});
test('cancelar edição fecha a janela e preserva a lista',()=>{
 const tela=montar();tela.dialogo.props.onClose();assert.ok(tela.chamadas.some(c=>c.tipo==='idEdicao'&&c.valor===null));
});
test('salvamento em andamento bloqueia o fechamento e os botões de ação',()=>{
 const tela=montar({salvando:true});tela.dialogo.props.onClose();assert.equal(tela.chamadas.length,0);assert.equal(tela.estados.length,0);
 const botoes=tela.buscar(tela.dialogo,no=>no.type==='Button');assert.ok(botoes.filter(no=>no.props.type==='submit').every(no=>no.props.disabled));
});
test('nova proposta continua usando o formulário e a criação originais',()=>{
 const tela=montar({edicao:false,nova:true});assert.equal(tela.dialogo.props.open,true);const form=tela.buscar(tela.dialogo,no=>no.props?.component==='form')[0];form.props.onSubmit({preventDefault:()=>{}});
 assert.equal(tela.chamadas.filter(c=>c.tipo==='criar').length,1);assert.equal(tela.chamadas.filter(c=>c.tipo==='editar').length,0);
});
test('perfil sem edição comercial não recebe a janela de edição',()=>assert.equal(montar({permitido:false}).dialogo,undefined));

test('edição e criação exibem os mesmos campos e identificam corretamente a ação',()=>{
 const editar=montar(),criar=montar({edicao:false,nova:true});
 const campos=tela=>tela.buscar(tela.dialogo,no=>no.type==='TextField').map(no=>no.props.label||no.props.id||'campo');
 assert.deepEqual(campos(editar),campos(criar));
 assert.ok(editar.buscar(editar.dialogo,no=>no.type==='Typography'&&no.props.children==='Editar proposta').length);
 assert.ok(editar.buscar(editar.dialogo,no=>no.type==='Button'&&no.props.children==='Salvar alterações').length);
});
test('serviços alterados na edição não modificam a criação',()=>{
 const tela=montar(),opcao=tela.buscar(tela.dialogo,no=>no.type==='Checkbox'&&no.props.checked===true)[0];
 assert.ok(opcao);opcao.props.onChange();
 assert.equal(tela.chamadas[0].tipo,'formEdicao');assert.deepEqual([...tela.chamadas[0].valor.transportOptions],[]);
});
