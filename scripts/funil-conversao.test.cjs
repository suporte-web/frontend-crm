const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{createRequire}=require('module');
const root=path.resolve(__dirname,'..'),ext=createRequire(path.join(root,'package.json')),React=ext('react'),ts=ext('typescript'),{renderToStaticMarkup}=ext('react-dom/server');
function render(leads){let index=0;const mock={...React,useState(initial){const n=index++;return React.useState(n===1?leads:n===2?false:initial);}};const cache=new Map();function load(name,base=root){
if(name==='react')return mock;
if(name==='@/context/auth-context')return{useAuth:()=>({token:'teste',user:{role:'ADMIN'},loading:false})};
if(name==='@/components/layout/app-layout')return{AppLayout:({children})=>React.createElement('main',null,children)};
if(name==='@/services/crm.service'||name==='@/services/leads.service')return{};
if(!name.startsWith('@/')&&!name.startsWith('.'))return ext(name);
const p=name.startsWith('@/')?path.join(root,'src',name.slice(2)):path.resolve(base,name);const file=[p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!file)throw Error(name);if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','exports','module',js)(n=>load(n,path.dirname(file)),mod.exports,mod);return mod.exports;}
return renderToStaticMarkup(React.createElement(load('@/app/bi/components/BusinessIntelligencePage').default)).replace(/<style[^>]*>[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,'');}
test('Conversão conta a etapa conversao e o status legado contacted; percentual usa todo o funil',()=>{const leads=['conversao','contacted','cotacao','perdido'].map((status,i)=>({id:String(i),company:'Empresa '+i,status,createdAt:'2026-11-01',metadata:{}}));const text=render(leads);assert.match(text,/Conversão2[\s\S]*?50,0% do funil/);assert.ok(!text.includes('Em contato'));});
test('Conversão exibe zero e percentual zero quando o funil está vazio',()=>assert.match(render([]),/Conversão0[\s\S]*?0,0% do funil/));
