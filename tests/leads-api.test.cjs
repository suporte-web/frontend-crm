const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function service() {
  const calls = [];
  const context = {
    exports: {}, URLSearchParams,
    require(name) {
      assert.equal(name, '@/services/api');
      return { API_BASE_URL: '/api', apiFetch: async (...args) => { calls.push(args); return []; } };
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/leads.service.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return { api: context.exports, calls };
}

test('listagem e solicitações usam endpoints próprios sem consultar detalhes por engano', async () => {
  const { api, calls } = service();
  await api.getLeads('sessao', { convertidoParaCliente: false });
  await api.getSolicitacoesExclusaoLeads('sessao');
  assert.equal(calls[0][0], '/leads?convertidoParaCliente=false');
  assert.equal(calls[1][0], '/leads/deletion-requests');
  assert.equal(calls[1][1].cache, 'no-store');
  assert.ok(calls.every((call) => call[2] === 'sessao'));
});

test('solicitação e decisão enviam IDs e corpos previstos pelo contrato NestJS', async () => {
  const { api, calls } = service();
  await api.solicitarExclusaoLead('lead-1', 'Cadastro duplicado', 'sessao');
  await api.decidirExclusaoLead('pedido-1', { action: 'REJECT', message: 'Manter' }, 'sessao');
  assert.equal(calls[0][0], '/leads/lead-1/deletion-request');
  assert.equal(calls[0][1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body), { reason: 'Cadastro duplicado' });
  assert.equal(calls[1][0], '/leads/deletion-requests/pedido-1/decision');
  assert.deepEqual(JSON.parse(calls[1][1].body), { action: 'REJECT', message: 'Manter' });
  assert.ok(calls.every((call) => !call[0].startsWith('/clients')));
});

test('detalhes só são requisitados explicitamente com o ID informado', async () => {
  const { api, calls } = service();
  await api.getLeadById('lead-real', 'sessao');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/leads/lead-real');
});
