const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

async function tela({ etapa = 'entrada_leads', falhar = false } = {}) {
  const slots = [], efeitos = [], gravacoes = [];
  let cursor = 0, importadas = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v, n) => !Object.is(v, slots[i][n]))) { slots[i] = deps; efeitos.push(fn); } },
  };
  const components = new Proxy({}, { get: (_, name) => name });
  const job = { id: 'job', arquivo: 'teste.xlsx', aba: 'CLIENTES', status: 'PREVIA', responsavelId: 'u', empresaConsultoraId: null, expiresAt: new Date(Date.now() + 3600000).toISOString(), linhas: { prioridadesNaoAssociadas: [], linhas: [{ numero: 2, nome: 'Empresa', contato: '', emails: [], telefone: '', cnae: '', funilOriginal: 'LEAD', segmentoOriginal: 'Químico', segmentoId: 's', etapaSugerida: etapa, selecionavel: true, erros: [], avisos: [], duplicidades: [] }] } };
  const load = createSourceLoader({ globals: { Error, AbortController }, mocks: {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' },
    '@mui/material': components, 'react-router-dom': { Link: 'Link' },
    '@/context/auth-context': { useAuth: () => ({ user: { id: 'admin', role: 'ADMIN' } }) },
    '@/stores/segmentos/service': { listarSegmentos: async () => [{ id: 's', nome: 'Químico' }] },
    '@/stores/importacoes-cadastros/service': {
      listarOpcoesImportacao: async () => [{ id: 'u', name: 'Responsável', empresaConsultoraId: null, empresaConsultora: null }],
      listarImportacoesCadastros: async () => [], prepararImportacaoCadastro: async () => job,
      confirmarImportacaoCadastro: async (id, linhas) => {
        gravacoes.push({ id, linhas });
        if (falhar) throw new Error('A base mudou.');
        return { ...job, status: 'CONCLUIDA', resultado: { criados: [{ numero: 2, id: 'cadastro', nome: 'Empresa' }], ignorados: [] } };
      },
    },
  } });
  const Page = load('src/pages/cadastros/components/importar-cadastros-dialog.tsx').ImportarCadastrosDialog;
  let tree;
  function render() { cursor = 0; tree = Page({ aoFechar() {}, aoImportar: async () => { importadas++; } }); }
  async function settle() { for (let i = 0; i < 3; i++) { render(); while (efeitos.length) efeitos.shift()(); await new Promise(setImmediate); } render(); }
  function find(type, predicado) {
    const encontrados = [];
    function walk(node) { if (Array.isArray(node)) return node.forEach(walk); if (!node || typeof node !== 'object') return; if (node.type === type && predicado(node.props)) encontrados.push(node.props); walk(node.props?.children); }
    walk(tree); assert.equal(encontrados.length, 1, `Elemento único: ${type}`); return encontrados[0];
  }
  await settle();
  find('TextField', p => p.label === 'Responsável pelos novos cadastros').onChange({ target: { value: 'u' } });
  find('input', p => p.type === 'file').onChange({ target: { files: [{ name: 'teste.xlsx', size: 100 }] } });
  await settle();
  find('Button', p => p.children === 'Gerar prévia').onClick(); await settle();
  return { find, settle, gravacoes, importadas: () => importadas };
}

test('prévia não grava e confirmação transmite somente campos aceitos pelo backend', async () => {
  const app = await tela();
  assert.equal(app.gravacoes.length, 0);
  app.find('Button', p => p.children === 'Revisar e importar').onClick(); await app.settle();
  assert.equal(app.gravacoes.length, 0);
  app.find('Button', p => p.children === 'Confirmar importação').onClick(); await app.settle();
  assert.deepEqual(JSON.parse(JSON.stringify(app.gravacoes)), [{ id: 'job', linhas: [{ numero: 2, etapa: 'entrada_leads', segmentoId: 's', segmentoAutomatico: false }] }]);
  assert.equal(app.importadas(), 1);
});
test('etapa sem correspondência bloqueia a confirmação até revisão', async () => {
  const app = await tela({ etapa: null });
  assert.equal(app.find('Button', p => p.children === 'Revisar e importar').disabled, true);
  assert.equal(app.gravacoes.length, 0);
});
test('conflito mantém a prévia e a confirmação para revisão', async () => {
  const app = await tela({ falhar: true });
  app.find('Button', p => p.children === 'Revisar e importar').onClick(); await app.settle();
  app.find('Button', p => p.children === 'Confirmar importação').onClick(); await app.settle();
  app.find('Alert', p => p.children === 'A base mudou.');
  assert.equal(app.importadas(), 0);
  assert.equal(app.find('Button', p => p.children === 'Confirmar importação').disabled, false);
});
