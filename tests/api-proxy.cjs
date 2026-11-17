const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('config/api-proxy.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { createApiProxy } = exportsObject;

async function listen(server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

for (const prefix of ['', '/api']) {
  test(`proxy preserva autenticação, query, uploads e status com prefixo ${prefix || '(vazio)'}`, async () => {
    const upstream = http.createServer(async (request, response) => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      response.writeHead(request.url.includes('falha') ? 503 : 200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ url: request.url, authorization: request.headers.authorization, type: request.headers['content-type'], body: Buffer.concat(chunks).toString('utf8') }));
    });
    const target = await listen(upstream);
    const { createServer } = await import('vite');
    const vite = await createServer({
      configFile: false,
      logLevel: 'silent',
      appType: 'custom',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, proxy: createApiProxy({ target, prefix }) },
    });
    const server = http.createServer(vite.middlewares);
    const base = await listen(server);
    try {
      const result = await fetch(`${base}/api/entregas-por-placas/monitoramento?placa=ABC1D23`, { headers: { Authorization: 'Bearer token-de-teste' } });
      const data = await result.json();
      assert.equal(data.url, `${prefix}/entregas-por-placas/monitoramento?placa=ABC1D23`);
      assert.equal(data.authorization, 'Bearer token-de-teste');
      const form = new FormData();
      form.set('arquivo', new Blob(['%PDF-teste']), 'teste.pdf');
      form.set('etapa', 'ANEXOS');
      const upload = await fetch(`${base}/api/atendimento-sac/registro/anexos`, { method: 'POST', body: form });
      const saved = await upload.json();
      assert.match(saved.type, /^multipart\/form-data; boundary=/);
      assert.match(saved.body, /%PDF-teste/);
      assert.match(saved.body, /ANEXOS/);
      const failed = await fetch(`${base}/api/falha`);
      assert.equal(failed.status, 503);
    } finally {
      await vite.close();
      server.closeAllConnections();
      upstream.closeAllConnections();
      await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => upstream.close(resolve))]);
    }
  });
}
