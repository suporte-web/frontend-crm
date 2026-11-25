const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { test } = require('node:test');
const axios = require('axios');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

const root = resolve(process.argv[2] || '.');
const cases = [
  ['login', 'getUsers', []],
  ['users', 'getUsers', []],
  ['users', 'getScreenPermissions', []],
  ['help-center', 'getHelpArticles', []],
  ['portal-content', 'getPortalContents', []],
  ['portal-content', 'getPublishedPortalContents', []],
  ['portal-content', 'uploadPortalContentMedia', [new Blob(['image'])]],
  ['login', 'requestCurrentUser', []],
  ['login', 'requestChangePassword', ['atual', 'nova']],
  ['anexos', 'obterArquivoAnexo', ['/visitas/1/anexos/2']],
  ['anexos', 'enviarAnexo', ['/visitas/1/anexos', new File(['arquivo'], 'teste.pdf'), 'REALIZACAO', 'comentario']],
  ['atendimento-sac', 'getAtendimentoSac', ['sac-1']],
  ['audit-logs', 'getAuditLogs', [{}]],
  ['bi-comercial', 'carregarBiComercial', ['usuario-a'], { cadastros: [], oportunidades: [], responsaveis: [], avisos: [], responsavelFixo: false, responsavelId: null }],
  ['cadastros', 'listarCadastros', []],
  ['chat', 'getChats', []],
  ['cnpj', 'consultarCnpj', ['12345678000190'], { cnpj: '12345678000190', legalName: 'Empresa', address: {} }],
  ['crm', 'solicitarDownloadDocumentoCliente', ['cliente', 'documento']],
  ['deliveries', 'getDeliveries', [{}]],
  ['entradas', 'getEntradas', [{}]],
  ['entregas-por-placas', 'getManifestosSsw', ['2026-11-25']],
  ['gestao-prospeccoes', 'getOpcoesProspeccoes', []],
  ['informativo', 'listarAssinantesInformativo', [{}]],
  ['lead-anexos', 'listarAnexosLead', ['lead-1']],
  ['leads', 'getLeads', [{}]],
  ['marketing-integrations', 'listarIntegracoesMarketing', []],
  ['marketing-manual-reports', 'listManualReports', []],
  ['marketing-metrics', 'carregarMetricasMarketing', [{ periodo: '7d' }]],
  ['motivos-perda', 'consultarMotivosPerda', []],
  ['notifications', 'getNotifications', []],
  ['oportunidades', 'listarOportunidades', []],
  ['quotes', 'getMyQuotes', []],
  ['site-institucional', 'buscarPaginaSite', ['home']],
  ['suppliers', 'getSupplierInvites', []],
  ['tickets', 'getAllTickets', [{}]],
  ['visitas', 'getVisita', ['visita-1']],
];

for (const [service, method, args, data = []] of cases) {
  test(`${service}.${method}: uses tab credentials and never falls back to old credentials`, async () => {
    let token = 'current-tab-token';
    const requests = [];
    const load = createSourceLoader({
      globals: {
        window: {},
        sessionStorage: { getItem: () => token },
        localStorage: { getItem: () => 'obsolete-persistent-token' },
      },
      mocks: { axios: {
        isCancel: axios.isCancel,
        create(config) {
          const api = axios.create(config);
          api.defaults.adapter = async config => {
            requests.push(config.headers.get('Authorization'));
            return { config, status: 200, statusText: 'OK', headers: {}, data: config.responseType === 'arraybuffer' ? new TextEncoder().encode('[]').buffer : data };
          };
          return api;
        },
      } },
    });
    const serviceName = service.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('') + 'Service';
    const exports = load(resolve(root, `src/stores/${service}/service.ts`))[serviceName];
    for (const current of ['current-tab-token', 'renewed-tab-token', null]) {
      token = current;
      const start = requests.length;
      await exports[method](...args);
      const headers = requests.slice(start);
      assert.ok(headers.length > 0);
      assert.ok(headers.every(header => header === (current ? `Bearer ${current}` : undefined)));
    }
  });
}
