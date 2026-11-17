const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

test('Axios real transmite JSON, multipart, token e arquivo binário sem acessar o backend', async () => {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({ url: request.url, token: request.headers.authorization, contentType: request.headers['content-type'], body: Buffer.concat(chunks).toString() });
    if (request.url.includes('download')) {
      response.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=teste.pdf' });
      response.end(Buffer.from('%PDF-arquivo-de-teste'));
    } else {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ recebido: true }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/crm`;
  const load = createSourceLoader({ globals: {
    __env: { VITE_API_BACKEND: base },
    window: { dispatchEvent() {} },
    sessionStorage: { getItem: () => 'token-de-teste' },
  } });
  const { Api } = load('src/utils/Api.ts');
  try {
    assert.equal((await Api.post('/registro', { nome: 'Teste' })).data.recebido, true);
    const form = new FormData();
    form.set('arquivo', new Blob(['%PDF-teste']), 'teste.pdf');
    form.set('etapa', 'ANEXOS');
    await Api.post('/upload?cliente=123', form);
    const download = await Api.get('/download', { responseType: 'arraybuffer' });
    assert.equal(Buffer.from(download.data).toString(), '%PDF-arquivo-de-teste');
    assert.equal(download.headers['content-disposition'], 'attachment; filename=teste.pdf');
    assert.equal(requests[0].url, '/crm/registro');
    assert.deepEqual(JSON.parse(requests[0].body), { nome: 'Teste' });
    assert.equal(requests[1].url, '/crm/upload?cliente=123');
    assert.match(requests[1].contentType, /^multipart\/form-data; boundary=/);
    assert.match(requests[1].body, /%PDF-teste/);
    assert.match(requests[1].body, /ANEXOS/);
    assert.ok(requests.every(request => request.token === 'Bearer token-de-teste'));
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
