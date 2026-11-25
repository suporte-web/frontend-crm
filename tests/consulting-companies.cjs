const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

async function abrir({ role = 'ADMIN', falhar = false } = {}) {
  const slots = [], efeitos = [], gravacoes = [], simulacoes = [];
  let cursor = 0, consultas = 0;
  const memo = (fn, deps) => {
    const i = cursor++;
    if (!slots[i] || deps.some((valor, indice) => !Object.is(valor, slots[i].deps[indice]))) slots[i] = { valor: fn(), deps };
    return slots[i].valor;
  };
  const react = {
    useState(valor) { const i = cursor++; if (!(i in slots)) slots[i] = valor; return [slots[i], proximo => { slots[i] = typeof proximo === 'function' ? proximo(slots[i]) : proximo; }]; },
    useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((valor, indice) => !Object.is(valor, slots[i][indice]))) { slots[i] = deps; efeitos.push(fn); } },
  };
  const componentes = new Proxy({}, { get: (_, nome) => nome });
  const load = createSourceLoader({ globals: { Error }, mocks: {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' },
    '@mui/material': componentes, 'lucide-react': componentes,
    '@/components/layout/app-layout': { AppLayout: 'AppLayout' },
    '@/components/mui/crm-primitives': componentes,
    '@/UserContext': { useUser: () => ({ user: { id: 'gestor', role }, token: 'token-teste' }) },
    '@/stores/cadastros/service': { CadastrosService: { listarCadastros: async () => [] } },
    '@/stores/empresas-consultoras/service': { EmpresasConsultorasService: {
      listarEmpresasConsultoras: async () => { consultas++; return [{ id: 'empresa', nome: 'Empresa A', ativa: true, usuarios: [], _count: { cadastros: 0 } }]; },
      listarConsultoresEmpresas: async () => [],
      listarCarteiraEmpresa: async () => [{ id: 'cadastro', companyName: 'Cadastro A', empresaConsultoraId: null, responsavel: { id: 'colega', name: 'Colega' } }],
      vincularCarteiraEmpresa: async (id, cadastroIds, aplicar = false) => {
        if (aplicar) { gravacoes.push({ id, cadastroIds }); if (falhar) throw new Error('A carteira mudou.'); }
        else simulacoes.push({ id, cadastroIds });
        return { aplicado: aplicar, quantidade: cadastroIds.length, cadastroIds };
      },
    } },
  } });
  const Page = load('src/pages/empresas-consultoras/index.tsx').default;
  let arvore;
  function render() { cursor = 0; arvore = Page(); }
  async function estabilizar() {
    for (let i = 0; i < 5; i++) { render(); while (efeitos.length) efeitos.shift()(); await new Promise(setImmediate); }
    render();
  }
  function encontrar(tipo, predicado) {
    const encontrados = [];
    function visitar(no) {
      if (Array.isArray(no)) return no.forEach(visitar);
      if (!no || typeof no !== 'object') return;
      if (no.type === tipo && predicado(no.props)) encontrados.push(no.props);
      visitar(no.props?.children);
    }
    visitar(arvore);
    assert.equal(encontrados.length, 1, `Elemento único: ${tipo}`);
    return encontrados[0];
  }
  await estabilizar();
  return { estabilizar, encontrar, gravacoes, simulacoes, consultas: () => consultas };
}

test('carteira exige simulação e confirmação antes de gravar os vínculos', async () => {
  const app = await abrir();
  app.encontrar('Button', p => p.children === 'Conferir vínculos pendentes').onClick();
  await app.estabilizar();
  assert.equal(app.simulacoes.length, 1);
  assert.equal(app.gravacoes.length, 0);
  app.encontrar('Alert', p => p.severity === 'info').action.props.onClick();
  await app.estabilizar();
  assert.equal(app.gravacoes.length, 0);
  app.encontrar('Button', p => p.children === 'Confirmar').onClick();
  await app.estabilizar();
  assert.deepEqual(JSON.parse(JSON.stringify(app.gravacoes)), [{ id: 'empresa', cadastroIds: ['cadastro'] }]);
});

test('falha ao aplicar mantém a confirmação aberta e apresenta o erro', async () => {
  const app = await abrir({ falhar: true });
  app.encontrar('Button', p => p.children === 'Conferir vínculos pendentes').onClick();
  await app.estabilizar();
  app.encontrar('Alert', p => p.severity === 'info').action.props.onClick();
  await app.estabilizar();
  app.encontrar('Button', p => p.children === 'Confirmar').onClick();
  await app.estabilizar();
  app.encontrar('Dialog', p => p.open && p.children[0].props.children === 'Aplicar vínculos da carteira');
  assert.equal(app.gravacoes.length, 1);
});

test('CONSULTORA não consulta a tela administrativa de empresas', async () => {
  const app = await abrir({ role: 'CONSULTORA' });
  assert.equal(app.consultas(), 0);
  app.encontrar('Alert', p => p.severity === 'error');
});
