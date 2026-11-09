const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{createRequire}=require('module');
const root=path.resolve(__dirname,'..'),external=createRequire(path.join(root,'package.json'));
const file=path.join(root,'src/lib/relatorio-funil-excel.ts');
test('Excel contém todos os cadastros, valores numéricos e textos sem executar fórmulas',async()=>{
assert.ok(fs.existsSync(file),'Exportação Excel ainda não implementada');
const ts=external('typescript'),mod={exports:{}};new Function('require','exports','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(external,mod.exports,mod);
const rows=Array.from({length:12},(_,i)=>({empresa:i===0?'=HYPERLINK("https://exemplo.com")':'Empresa & Filhos '+i,segmento:'Indústria',transporte:'Rodoviário',armazenagem:'Sim',etapa:'Cotação',entrada:'06/11/2026',ultimaInteracao:'06/11/2026',volumeMensal:i===0?0:1234.56,responsavel:'Maria',situacao:'Em negociação',proximaAcao:'Contatar',observacoes:'Ação <urgente>\nObservações'}));
const bytes=await mod.exports.gerarRelatorioFunilExcel(rows);const Excel=external('exceljs'),wb=new Excel.Workbook();await wb.xlsx.load(bytes);const sheet=wb.getWorksheet('Leads e clientes');assert.equal(sheet.rowCount,13);assert.equal(sheet.getCell('A2').value,rows[0].empresa);assert.equal(sheet.getCell('H2').value,0);assert.equal(sheet.getCell('H3').value,1234.56);assert.equal(sheet.getCell('L2').value,rows[0].observacoes);assert.equal(sheet.getCell('A13').value,rows[11].empresa);assert.ok(sheet.autoFilter);assert.equal(sheet.views[0].state,'frozen');
const empty=new Excel.Workbook();await empty.xlsx.load(await mod.exports.gerarRelatorioFunilExcel([]));assert.equal(empty.worksheets[0].rowCount,1);
console.log('Arquivo Excel validado por leitura independente.');
});

