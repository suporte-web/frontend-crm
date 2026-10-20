const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');

function montar(recolhida = true) {
  let estado = null;
  const alternar = [];
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync('src/components/layout/sidebar-navigation.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const carregar = nome => {
    if (nome === 'react/jsx-runtime') return jsx;
    if (nome === 'react') return { useState: () => [estado, valor => { estado = typeof valor === 'function' ? valor(estado) : valor; }], useEffect: () => {} };
    if (nome === './sidebar-utils') return { getScreenLabel: item => item.label, isScreenActive: (caminho, destino) => caminho === destino || caminho.startsWith(destino + '/') };
    if (nome === './sidebar-config') return { screenIcons: { dashboard: 'icone-inicio', cadastros: 'icone-cadastro', opportunities: 'icone-oportunidade' } };
    if (nome === 'lucide-react') return { UserSearch: 'icone-prospeccao' };
    return { __esModule: true, default: nome.split('/').pop() };
  };
  vm.runInNewContext(codigo, { module: modulo, exports: modulo.exports, require: carregar });
  const props = {
    sections: [
      { id: 'inicio', items: [{ key: 'dashboard', href: '/painel', label: 'Início' }] },
      { id: 'comercial', title: 'Comercial', items: [{ key: 'cadastros', href: '/cadastros', label: 'Cadastros' }, { key: 'opportunities', href: '/oportunidades', label: 'Oportunidades' }] },
    ],
    pathname: '/cadastros/registro', openSections: {}, collapsed: recolhida, unreadChatCount: 0,
    onToggleSection: (...valores) => alternar.push(valores),
  };
  const renderizar = () => modulo.exports.SidebarNavigation(props);
  return { renderizar, alternar };
}
function elementos(arvore) {
  if (Array.isArray(arvore)) return arvore.flatMap(elementos);
  if (!arvore || typeof arvore !== 'object' || !arvore.props) return [];
  return [arvore, ...elementos(arvore.props.children)];
}

test('ícone recolhido abre opções clicáveis com a rota correta e fecha ao selecionar', () => {
  const tela = montar();
  const botao = elementos(tela.renderizar()).find(item => item.type === 'ListItemButton' && !item.props.href);
  assert.ok(botao, 'O ícone do grupo deve ter identificação acessível.');
  const ancora = {};
  botao.props.onClick({ currentTarget: ancora });
  const menu = elementos(tela.renderizar()).find(item => item.type === 'Menu' && item.props.open);
  assert.ok(menu, 'Clicar no ícone recolhido deve abrir o menu.');
  assert.equal(menu.props.anchorEl, ancora);
  const opcoes = elementos(menu).filter(item => item.type === 'MenuItem');
  assert.deepEqual(opcoes.map(item => item.props.href), ['/cadastros', '/oportunidades']);
  assert.equal(opcoes[0].props.selected, true);
  opcoes[1].props.onClick();
  assert.equal(elementos(tela.renderizar()).some(item => item.type === 'Menu' && item.props.open), false);
  assert.equal(tela.alternar.length, 0);
});

test('menu expandido continua abrindo e fechando suas seções', () => {
  const tela = montar(false);
  const botao = elementos(tela.renderizar()).find(item => item.type === 'ListItemButton' && !item.props.href);
  assert.ok(botao);
  botao.props.onClick({ currentTarget: {} });
  assert.deepEqual(tela.alternar, [['comercial', true]]);
});

test('ícone de página sem grupo continua sendo link direto', () => {
  const tela = montar();
  assert.ok(elementos(tela.renderizar()).find(item => item.type === 'ListItemButton' && item.props.href === '/painel'));
});
