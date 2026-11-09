const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, bindings = {}) {
  const context = { exports: {}, Error, FormData, ...bindings, require(name) {
    if (name === '@/services/api') return { API_BASE_URL: '/api' };
    if (name === '@/lib/opportunity-documents') return load('src/lib/opportunity-documents.ts');
    return {};
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}
test('bloqueia arquivo acima de 20 MB antes da requisição e informa o nome e o limite', async () => {
  let requests = 0;
  const api = load('src/services/crm.service.ts', { fetch: async () => { requests++; } });
  await assert.rejects(api.enviarDocumentosPropostaOportunidade('c1', [
    { name: 'proposta.xlsm', size: 20 * 1024 * 1024 + 1 },
  ], 'token'), /proposta\.xlsm.*20 MB/);
  assert.equal(requests, 0);
});
test('aceita XLSM acima de 10 KB e exatamente 20 MB', async () => {
  const requests = [];
  const api = load('src/services/crm.service.ts', { fetch: async (url, options) => {
    requests.push(options.body);
    return { ok: true, json: async () => [] };
  } });
  for (const size of [11 * 1024, 10 * 1024 * 1024 + 1, 20 * 1024 * 1024]) {
    const file = new File([new Uint8Array(size)], 'proposta.xlsm', { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
    await api.enviarDocumentosPropostaOportunidade('c1', [file], 'token');
    assert.equal(requests.at(-1).get('file').name, file.name);
  }
  assert.equal(requests.length, 3);
});
test('arquivo inválido em lote bloqueia todo o envio e mantém o limite de 20 anexos', async () => {
  let requests = 0;
  const api = load('src/services/crm.service.ts', { fetch: async () => { requests++; } });
  await assert.rejects(api.enviarDocumentosPropostaOportunidade('c1', [
    { name: 'pequeno.xlsm', size: 1024 }, { name: 'grande.xlsm', size: 20 * 1024 * 1024 + 1 },
  ], 'token'), /grande\.xlsm.*20 MB/);
  await assert.rejects(api.enviarDocumentosPropostaOportunidade('c1',
    Array.from({ length: 21 }, () => ({ name: 'pequeno.xlsm', size: 1024 })), 'token'), /20 arquivos/);
  assert.equal(requests, 0);
});
test('resposta HTTP 413 sem JSON exibe orientação de 20 MB', async () => {
  const api = load('src/services/crm.service.ts', { fetch: async () => ({
    ok: false, status: 413, json: async () => { throw new Error('HTML'); },
  }) });
  await assert.rejects(api.enviarDocumentosPropostaOportunidade('c1', [], 'token'), /20 MB/);
});
