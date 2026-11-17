const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const ts = require('typescript');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

function harness({ status = 200, data = { ok: true }, base = '/api' } = {}) {
  const state = { status, data };
  const requests = [];
  const events = [];
  const storage = new Map([['crm_token', 'token-da-aba'], ['crm_user', '{}']]);
  const load = createSourceLoader({
    globals: {
      __env: { VITE_API_BACKEND: base },
      window: { dispatchEvent: event => events.push(event.type) },
      sessionStorage: { getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key) },
      localStorage: { getItem: () => 'token-antigo' },
    },
    mocks: { axios: {
      isCancel: axios.isCancel,
      create(config) {
        const api = axios.create(config);
        api.defaults.adapter = async config => {
          requests.push(config);
          const response = {
            config, status: state.status, statusText: 'Test', headers: { 'content-type': 'application/json' },
            data: config.responseType === 'arraybuffer' ? new TextEncoder().encode(JSON.stringify(state.data)).buffer :
              config.responseType === 'blob' ? new Blob([JSON.stringify(state.data)], { type: 'application/json' }) : state.data,
          };
          if (config.validateStatus && !config.validateStatus(state.status)) throw new axios.AxiosError('Falha de teste', undefined, config, undefined, response);
          return response;
        };
        return api;
      },
    } },
  });
  return { ...load('src/utils/Api.ts'), load, requests, events, storage, state };
}

test('cliente central usa o token da aba e respeita token explícito', async () => {
  const app = harness();
  await app.Api.get('/users');
  await app.Api.get('/users', { headers: { Authorization: 'Bearer token-explicito' } });
  app.storage.delete('crm_token');
  await app.Api.get('/users');
  assert.deepEqual(app.requests.map(request => request.headers.get('Authorization')), ['Bearer token-da-aba', 'Bearer token-explicito', undefined]);
});

test('login rejeitado não envia token anterior nem encerra sessão existente', async () => {
  const app = harness({ status: 401, data: { message: 'Credenciais inválidas' } });
  await assert.rejects(app.Api.post('/auth/login', { email: 'teste@example.test', password: 'senha-de-teste' }), error => error.status === 401 && error.message === 'Credenciais inválidas');
  assert.equal(app.requests[0].headers.get('Authorization'), undefined);
  assert.equal(app.storage.get('crm_token'), 'token-da-aba');
  assert.deepEqual(app.events, []);
});

for (const status of [403, 404, 500, 503]) {
  test(`erro ${status} mantém sessão e preserva status e mensagens de validação`, async () => {
    const app = harness({ status, data: { message: ['Primeiro erro', 'Segundo erro'] } });
    await assert.rejects(app.Api.get('/users'), error => error.status === status && error.message === 'Primeiro erro, Segundo erro');
    assert.equal(app.storage.get('crm_token'), 'token-da-aba');
    assert.deepEqual(app.events, []);
  });
}

test('401 autenticado limpa a sessão e notifica os providers, inclusive em respostas binárias', async () => {
  const app = harness({ status: 401 });
  await assert.rejects(app.Api.get('/users', { responseType: 'arraybuffer' }), error => error.status === 401);
  assert.equal(app.storage.size, 0);
  assert.deepEqual(app.events, ['crm:session-expired']);
});

test('uploads preservam FormData sem forçar JSON e downloads mantêm bytes', async () => {
  const app = harness({ data: { arquivo: 'teste' } });
  const form = new FormData();
  form.set('arquivo', new Blob(['%PDF-teste']), 'teste.pdf');
  await app.Api.post('/clients/cliente/documents', form);
  assert.equal(app.requests[0].data, form);
  assert.notEqual(app.requests[0].headers.get('Content-Type'), 'application/json');
  const response = await app.Api.get('/clients/cliente/documents/documento/download', { responseType: 'arraybuffer' });
  assert.equal(new TextDecoder().decode(response.data), '{"arquivo":"teste"}');
});

for (const base of ['/api', 'https://backend.example.test/crm']) {
  test(`stores respeitam base configurada (${base}) sem duplicar prefixo`, async () => {
    const app = harness({ base, data: [] });
    await app.Api.get('/users');
    assert.equal(axios.getUri(app.requests[0]), `${base}/users`);
    const store = app.load('src/stores/solicitacoes-site/service.ts');
    await store.listarSolicitacoesSite({});
    assert.match(axios.getUri(app.requests[1]), new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/integracoes/site/solicitacoes'));
  });
}

test('resposta sem conteúdo e cancelamento não quebram downloads nem invalidam sessão', async () => {
  const app = harness({ status: 204 });
  const response = await app.Api.get('/users');
  assert.equal(response.status, 204);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(app.Api.get('/users', { signal: controller.signal }), error => axios.isCancel(error));
  assert.equal(app.storage.get('crm_token'), 'token-da-aba');
});

test('stores de SAC e visitas escolhem endpoints e métodos sem a tela montar URLs', async () => {
  const app = harness();
  const sac = app.load('src/stores/atendimento-sac/service.ts');
  const visitas = app.load('src/stores/visitas/service.ts');
  await sac.listarSac('token', new URLSearchParams({ pagina: '2', status: 'NOVO' }));
  await sac.salvarPlanoAcaoSac('token', 'sac-1', { oQue: 'Ação' }, false, true);
  await sac.salvarPlanoAcaoSac('token', 'sac-1', { oQue: 'Ação' }, false, false);
  await sac.salvarPlanoAcaoSac('token', 'sac-1', { oQue: 'Ação' }, true, false);
  await visitas.criarVisita('token', { motivo: 'Contato comercial' });
  await visitas.atualizarVisita('token', 'visita-1', { motivo: 'Novo motivo' });
  assert.deepEqual(app.requests.map(request => [request.method, axios.getUri(request)]), [
    ['get', '/api/atendimento-sac?pagina=2&status=NOVO'],
    ['post', '/api/atendimento-sac/sac-1/acao/iniciar'],
    ['put', '/api/atendimento-sac/sac-1/acao'],
    ['post', '/api/atendimento-sac/sac-1/acao/concluir'],
    ['post', '/api/visitas'],
    ['put', '/api/visitas/visita-1'],
  ]);
});

test('erros JSON em downloads preservam mensagem, status e dados', async () => {
  const app = harness({ status: 403, data: { message: ['Sem acesso', 'Solicite permissão'], code: 'ACCESS_DENIED' } });
  const store = app.load('src/stores/crm/service.ts');
  await assert.rejects(store.solicitarDownloadDocumentoCliente('cliente', 'documento', 'token'), error =>
    error.status === 403 && error.message === 'Sem acesso, Solicite permissão' && error.response.data.code === 'ACCESS_DENIED');
  assert.equal(app.storage.get('crm_token'), 'token-da-aba');
});

test('arquivos retornados pelos stores são Blob e preservam os bytes', async () => {
  const app = harness({ data: 'arquivo-de-teste' });
  const store = app.load('src/stores/anexos/service.ts');
  const blob = await store.obterArquivoAnexo('token', '/visitas/1/anexos/2');
  assert.ok(blob instanceof Blob);
  assert.equal(await blob.text(), '"arquivo-de-teste"');
  assert.equal(axios.getUri(app.requests[0]), '/api/visitas/1/anexos/2');
});

test('página institucional inexistente retorna null; outros erros continuam rejeitados', async () => {
  const app = harness({ status: 404 });
  const store = app.load('src/stores/site-institucional/service.ts');
  assert.equal(await store.buscarPaginaSite('quem-somos', 'token'), null);
  app.state.status = 503;
  await assert.rejects(store.buscarPaginaSite('quem-somos', 'token'), error => error.status === 503);
});

test('anexos da oportunidade preservam categoria e mensagem para limite excedido', async () => {
  const app = harness({ status: 413 });
  const store = app.load('src/stores/crm/service.ts');
  const { OPPORTUNITY_DOCUMENT_LIMIT_MESSAGE } = app.load('src/lib/opportunity-documents.ts');
  const file = new File(['%PDF-teste'], 'teste.pdf', { type: 'application/pdf' });
  await assert.rejects(store.enviarDocumentosPropostaOportunidade('cliente', [file], 'token'), error => error.message === OPPORTUNITY_DOCUMENT_LIMIT_MESSAGE);
  assert.equal(app.requests[0].data.get('category'), 'OPORTUNIDADE_PROPOSTA');
  assert.equal(app.requests[0].data.get('file').name, 'teste.pdf');
});

test('consulta CNPJ preserva código e status do erro e valida resposta de sucesso', async () => {
  const app = harness({ status: 404, data: { message: 'Cadastro não encontrado', code: 'CNPJ_NOT_FOUND' } });
  const store = app.load('src/stores/cnpj/service.ts');
  await assert.rejects(store.consultarCnpj('12.345.678/0001-90', 'token'), error => error.status === 404 && error.code === 'CNPJ_NOT_FOUND');
  assert.equal(axios.getUri(app.requests[0]), '/api/cnpj/12345678000190');
  app.state.status = 200;
  app.state.data = { cnpj: '12345678000190', legalName: 'Empresa', address: {} };
  assert.equal((await store.consultarCnpj('12.345.678/0001-90', 'token')).legalName, 'Empresa');
  app.state.data = {};
  await assert.rejects(store.consultarCnpj('12.345.678/0001-90', 'token'), error => error.code === 'CNPJ_INVALID_RESPONSE');
});

test('operações DELETE mantêm justificativa no corpo JSON', async () => {
  const app = harness({ data: { message: 'Excluído' } });
  const store = app.load('src/stores/crm/service.ts');
  assert.equal((await store.solicitarExclusaoDocumentoCliente('cliente', 'documento', 'Duplicado', 'token')).message, 'Excluído');
  assert.equal(app.requests[0].method, 'delete');
  assert.deepEqual(JSON.parse(app.requests[0].data), { justification: 'Duplicado' });
});

test('manifestos e pagadores usam a base relativa sem duplicar /api', async () => {
  const app = harness({ data: [] });
  await app.load('src/stores/entregas-por-placas/service.ts').getManifestosSsw('token', '2026-11-17');
  await app.load('src/stores/deliveries/service.ts').getPayers({}, 'token');
  assert.deepEqual(app.requests.map(config => axios.getUri(config)), ['/api/teste-manifesto-ssw?data=2026-11-17', '/api/entregas/find-payers']);
});

test('BI usa endpoint próprio e transmite o filtro por ID ou ausência de vínculo', async () => {
  const app = harness({ data: { cadastros: [], oportunidades: [], responsaveis: [], avisos: [], responsavelFixo: false, responsavelId: null } });
  const store = app.load('src/stores/bi-comercial/service.ts');
  await store.carregarBiComercial('token', 'usuario-a');
  await store.carregarBiComercial('token', 'sem-responsavel');
  await store.carregarBiComercial('token');
  assert.deepEqual(app.requests.map(config => axios.getUri(config)), [
    '/api/bi-comercial?responsavelId=usuario-a', '/api/bi-comercial?semResponsavel=true', '/api/bi-comercial',
  ]);
});

test('camada visual não executa HTTP e serviços usam exclusivamente o cliente central', () => {
  function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
  assert.equal(fs.existsSync('src/services'), false);
  for (const filename of walk('src').filter(filename => /\.tsx?$/.test(filename))) {
    const text = fs.readFileSync(filename, 'utf8');
    const ast = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === 'axios') assert.equal(filename.replaceAll('\\', '/'), 'src/utils/Api.ts');
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        assert.notEqual(node.expression.text, 'fetch', filename);
        assert.ok(!['apiFetch', 'apiResponse'].includes(node.expression.text), filename);
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(ast) === 'Api') assert.ok(filename.includes('stores'), filename);
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});
