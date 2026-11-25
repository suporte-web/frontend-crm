const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

async function editor({ failSave = false } = {}) {
  const slots = [], effects = [], writes = [], notices = [];
  let cursor = 0;
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) slots[index] = { value: factory(), deps };
    return slots[index].value;
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index][i]))) { slots[index] = deps; effects.push(callback); }
    },
  };
  const components = new Proxy({}, { get: (_, name) => name });
  const load = createSourceLoader({ globals: { window: { addEventListener() {}, removeEventListener() {} }, Error }, mocks: {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' },
    '@mui/material': components,
    'lucide-react': components,
    '@/components/layout/app-layout': { AppLayout: 'AppLayout' },
    '@/components/mui/crm-primitives': { CrmPageShell: 'CrmPageShell', CrmSection: 'CrmSection' },
    '@/components/ui/sidebar': { useSidebar: () => ({ isMobile: false, state: 'expanded' }) },
    '@/components/crm/estilos-oportunidades': {},
    '@/UserContext': { useUser: () => ({ user: null, refreshUser: async () => null }) },
    '@/lib/user-role-presentation': { roleMeta: { ADMIN: { label: 'Admin' }, GESTAO: { label: 'Gestão' } } },
    '@/lib/feedback-crm': { notificarCrm: (...args) => notices.push(args) },
    '@/stores/users/service': { UsersService: {
      getScreenPermissions: async () => [
        { role: 'ADMIN', screens: [{ screenKey: 'chat', isEnabled: false }] },
        { role: 'GESTAO', screens: [{ screenKey: 'chat', isEnabled: true }] },
      ],
      updateRoleScreenPermissions: async (role, payload) => {
        writes.push({ role, payload });
        if (failSave) throw new Error('Falha simulada');
        return { role, screens: payload.screens };
      },
    } },
  } });
  const Page = load('src/pages/permissoes-por-perfil/index.tsx').default;
  let tree;
  function render() { cursor = 0; tree = Page(); return tree; }
  function find(type, predicate = () => true) {
    const matches = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (node.type === type && predicate(node.props)) matches.push(node);
      walk(node.props?.children);
    }
    walk(tree);
    assert.equal(matches.length, 1, `Elemento único: ${type}`);
    return matches[0].props;
  }
  render(); while (effects.length) effects.shift()();
  await new Promise(setImmediate); render();
  return { render, find, writes, notices };
}

test('alterações só são gravadas após revisar e confirmar', async () => {
  const app = await editor();
  app.find('Switch', p => p.slotProps.input['aria-label'].startsWith('Chat —')).onChange(); app.render();
  assert.equal(app.writes.length, 0);
  app.find('Button', p => p.children === 'Revisar e salvar').onClick(); app.render();
  assert.equal(app.find('Dialog', p => p['aria-labelledby'] === 'revisao-permissoes-titulo').open, true);
  assert.equal(app.writes.length, 0);
  app.find('Button', p => p.children === 'Confirmar e salvar').onClick();
  await new Promise(setImmediate); app.render();
  assert.equal(app.writes.length, 1);
  assert.equal(app.writes[0].role, 'ADMIN');
  assert.deepEqual(JSON.parse(JSON.stringify(app.writes[0].payload.screens.map(item => [item.screenKey, item.isEnabled]))), [['chat', true]]);
});

test('rascunhos são preservados ao alternar perfis e descarte afeta apenas o selecionado', async () => {
  const app = await editor();
  const chat = () => app.find('Switch', p => p.slotProps.input['aria-label'].startsWith('Chat —'));
  const select = label => { app.find('ListItemButton', p => p.children.props.children[0].props.children === label).onClick(); app.render(); };
  chat().onChange(); app.render();
  select('Gestão'); chat().onChange(); app.render();
  select('Admin'); assert.equal(chat().checked, true);
  app.find('Button', p => p.children === 'Descartar').onClick(); app.render();
  app.find('Button', p => p.children === 'Descartar alterações').onClick(); app.render();
  assert.equal(chat().checked, false);
  select('Gestão'); assert.equal(chat().checked, false);
  assert.equal(app.writes.length, 0);
});

test('falha na gravação mantém rascunho e revisão abertos para nova tentativa', async () => {
  const app = await editor({ failSave: true });
  app.find('Switch', p => p.slotProps.input['aria-label'].startsWith('Chat —')).onChange(); app.render();
  app.find('Button', p => p.children === 'Revisar e salvar').onClick(); app.render();
  app.find('Button', p => p.children === 'Confirmar e salvar').onClick();
  await new Promise(setImmediate); app.render();
  assert.equal(app.find('Dialog', p => p['aria-labelledby'] === 'revisao-permissoes-titulo').open, true);
  assert.equal(app.find('Button', p => p.children === 'Revisar e salvar').disabled, false);
  assert.equal(app.notices.at(-1)[1], 'error');
});

test('cópia prepara rascunho sem gravar automaticamente', async () => {
  const app = await editor();
  app.find('Button', p => p.children === 'Copiar de outro perfil').onClick(); app.render();
  app.find('TextField', p => p.label === 'Perfil de origem').onChange({ target: { value: 'GESTAO' } }); app.render();
  app.find('Button', p => p.children === 'Preparar cópia').onClick(); app.render();
  assert.equal(app.find('Switch', p => p.slotProps.input['aria-label'].startsWith('Chat —')).checked, true);
  assert.equal(app.writes.length, 0);
  assert.equal(app.find('Dialog', p => p['aria-labelledby'] === 'copiar-permissoes-titulo').open, false);
});
