import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const icons = new Proxy({ __esModule: true }, { get: (_, key) => key === '__esModule' ? true : String(key) });
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;

function plain(file) {
  const context = { exports: {}, process: { env: {} }, require: name => plain(resolve(root, 'src', name.slice(2) + '.ts')) };
  vm.runInNewContext(compile(readFileSync(file, 'utf8')), context);
  return context.exports;
}
const config = plain(resolve(root, 'src/config/site-institucional/site-page-config.ts'));
const defaults = plain(resolve(root, 'src/config/site-institucional/site-default-content.ts'));
const guide = plain(resolve(root, 'src/config/site-institucional/site-media-guide.ts'));

function component(file, mocks = {}) {
  const state = [];
  let cursor = 0;
  const effects = [];
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
    useCallback: value => value,
    useEffect(effect, deps) {
      const i = cursor++;
      if (!state[i] || deps.some((dep, index) => dep !== state[i][index])) { state[i] = deps; effects.push(effect); }
    },
  };
  const context = { exports: {}, URL, structuredClone, process: { env: {} },
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name === '@mui/material/styles') return { alpha: value => value };
      if (name.startsWith('@mui/')) return { __esModule: true, default: name.split('/').at(-1) };
      if (name === 'lucide-react') return icons;
      if (name === 'next/link') return { __esModule: true, default: 'Link' };
      if (name === '@/components/mui/crm-primitives') return { CrmSection: 'CrmSection', CrmPageShell: 'CrmPageShell', CrmPageHeader: 'CrmPageHeader', crmPalette: {} };
      if (name === '@/config/site-institucional/site-media-guide') return guide;
      throw new Error('Unexpected import: ' + name);
    },
  };
  vm.runInNewContext(compile(readFileSync(resolve(root, file), 'utf8')), context);
  const fn = Object.values(context.exports)[0];
  return { render(props) { cursor = 0; return fn(props); }, async flush() { effects.splice(0).forEach(f => f()); await new Promise(setImmediate); } };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  if (typeof tree !== 'object') return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  return text(tree.props?.children);
}
function button(tree, label) {
  const result = nodes(tree).find(n => n.type === 'Button' && text(n) === label);
  assert.ok(result, 'Button missing: ' + label);
  return result;
}
function image(initial, options = {}) {
  const instance = component('src/components/site-institucional/SiteImageUpload.tsx', {
    '@/services/api': { API_BASE_URL: 'http://localhost:3001/api' },
    '@/services/site-institucional.service': { uploadImagemSite: options.upload ?? (async () => ({ path: '/api/public/site/assets/solucoes/new.png' })) },
  });
  const props = { slug: 'solucoes', label: 'Banner', value: initial, token: 'test-token', onChange: value => { props.value = value; }, ...options.props };
  return { props, render: () => instance.render(props) };
}

test('excluir limpa somente a imagem selecionada e desfazer recupera a seleção', () => {
  const field = image('/api/public/site/assets/solucoes/old.png');
  const remove = button(field.render(), 'Excluir imagem');
  assert.equal(remove.props.disabled, false);
  remove.props.onClick();
  assert.equal(field.props.value, '');
  const tree = field.render();
  assert.ok(!nodes(tree).some(n => n.props?.component === 'img'));
  const alert = nodes(tree).find(n => n.type === 'Alert');
  button(alert.props.action, 'Desfazer').props.onClick();
  assert.equal(field.props.value, '/api/public/site/assets/solucoes/old.png');
});

test('excluir não aparece sem imagem e não altera campo desabilitado', () => {
  const empty = image('');
  assert.ok(!nodes(empty.render()).some(n => text(n) === 'Excluir imagem'));
  const locked = image('old.png', { props: { disabled: true } });
  const remove = button(locked.render(), 'Excluir imagem');
  assert.equal(remove.props.disabled, true);
  remove.props.onClick();
  assert.equal(locked.props.value, 'old.png');
});

test('envio bloqueia a exclusão e comunica início e fim ao editor', async () => {
  let finish;
  const states = [];
  const field = image('old.png', { upload: () => new Promise(resolve => { finish = resolve; }), props: { onUploadingChange: value => states.push(value) } });
  const input = nodes(field.render()).find(n => n.type === 'input');
  const pending = input.props.onChange({ target: { files: [{ type: 'image/png', size: 100 }] } });
  const remove = button(field.render(), 'Excluir imagem');
  assert.equal(remove.props.disabled, true);
  remove.props.onClick();
  assert.equal(field.props.value, 'old.png');
  finish({ path: '/api/public/site/assets/solucoes/new.png' });
  await pending;
  assert.equal(field.props.value, '/api/public/site/assets/solucoes/new.png');
  assert.deepEqual(states, [true, false]);
});

test('falha no envio preserva a foto anterior e libera os controles', async () => {
  const states = [];
  const field = image('old.png', { upload: async () => { throw new Error('falha'); }, props: { onUploadingChange: value => states.push(value) } });
  await nodes(field.render()).find(n => n.type === 'input').props.onChange({ target: { files: [{ type: 'image/jpeg', size: 100 }] } });
  assert.equal(field.props.value, 'old.png');
  assert.equal(button(field.render(), 'Excluir imagem').props.disabled, false);
  assert.deepEqual(states, [true, false]);
});

test('todas as 25 fotos têm orientação de onde aparecem no site', () => {
  let count = 0;
  for (const [slug, page] of Object.entries(config.sitePageConfigs)) {
    const images = page.sections.flatMap(s => s.fields).filter(f => f.type === 'image');
    assert.equal(guide.getSitePhotoCount(page), images.length);
    for (const field of images) {
      assert.notEqual(guide.getImagePlacement(slug, field.path), 'Imagem exibida nesta seção do site.');
      count++;
    }
  }
  assert.equal(count, 25);
});

async function editor(slug = 'solucoes') {
  const calls = [];
  const page = { publicado: true, temAlteracoesNaoPublicadas: false, conteudoRascunho: structuredClone(defaults.siteDefaultContent[slug]) };
  const instance = component('src/components/site-institucional/SitePageEditor.tsx', {
    '@/components/layout/app-layout': { AppLayout: 'AppLayout' },
    '@/components/site-institucional/SiteSectionEditor': { SiteSectionEditor: 'SiteSectionEditor' },
    '@/components/site-institucional/SiteBlogPostsEditor': { SiteBlogPostsEditor: 'SiteBlogPostsEditor' },
    '@/config/site-institucional/site-page-config': config,
    '@/config/site-institucional/site-default-content': defaults,
    '@/context/auth-context': { useAuth: () => ({ user: { role: 'MARKETING' }, token: 'test-token' }) },
    '@/services/site-institucional.service': {
      buscarPaginaSite: async () => page,
      salvarRascunhoPaginaSite: async (_, __, value) => { calls.push(structuredClone(value)); return { ...page, temAlteracoesNaoPublicadas: true }; },
      publicarPaginaSite: async () => page,
    },
  });
  const render = () => instance.render({ slug });
  render(); await instance.flush();
  return { render, calls };
}

test('editor abre em fotos e mantém os textos na aba separada', async () => {
  const page = await editor();
  let tree = page.render();
  const sections = nodes(tree).filter(n => n.type === 'SiteSectionEditor');
  assert.equal(sections.reduce((n, section) => n + section.props.section.fields.length, 0), 4);
  assert.ok(sections.every(section => section.props.section.fields.every(f => f.type === 'image')));
  nodes(tree).find(n => n.type === 'Tabs').props.onChange(null, 'content');
  tree = page.render();
  assert.ok(nodes(tree).filter(n => n.type === 'SiteSectionEditor').every(n => n.props.section.fields.every(f => f.type !== 'image')));
});

test('remoção é salva como campo vazio sem apagar os outros conteúdos', async () => {
  const page = await editor();
  const section = nodes(page.render()).find(n => n.type === 'SiteSectionEditor');
  section.props.onChange('cabecalho.imagemUrl', '');
  const tree = page.render();
  assert.ok(text(tree).includes('Alterações por salvar'));
  await button(tree, 'Salvar rascunho').props.onClick();
  assert.equal(page.calls[0].cabecalho.imagemUrl, '');
  assert.equal(page.calls[0].cabecalho.titulo, defaults.siteDefaultContent.solucoes.cabecalho.titulo);
  assert.equal(JSON.stringify(page.calls[0].itens), JSON.stringify(defaults.siteDefaultContent.solucoes.itens));
});

test('publicação espera todos os envios e protege handlers já capturados', async () => {
  const page = await editor();
  const initial = page.render();
  const staleSave = button(initial, 'Salvar rascunho').props.onClick;
  const callback = nodes(initial).find(n => n.type === 'SiteSectionEditor').props.onUploadStateChange;
  callback('first', true); callback('second', true);
  await staleSave();
  assert.equal(page.calls.length, 0);
  assert.equal(button(page.render(), 'Publicar').props.disabled, true);
  callback('first', false);
  assert.equal(button(page.render(), 'Publicar').props.disabled, true);
  callback('second', false);
  assert.equal(button(page.render(), 'Publicar').props.disabled, false);
});

test('páginas sem fotos continuam abrindo diretamente nos conteúdos', async () => {
  const page = await editor('termos-de-uso');
  const tree = page.render();
  assert.ok(!nodes(tree).some(n => n.type === 'Tabs'));
  assert.ok(nodes(tree).filter(n => n.type === 'SiteSectionEditor').every(n => n.props.section.fields.every(f => f.type !== 'image')));
});

test('lista de páginas permite busca sem acentos e informa a quantidade de fotos', () => {
  const instance = component('src/app/site-institucional/page.tsx', {
    '@/components/layout/app-layout': { AppLayout: 'AppLayout' },
    '@/config/site-institucional/site-page-config': config,
    '@/context/auth-context': { useAuth: () => ({ user: { role: 'MARKETING' } }) },
  });
  const tree = instance.render({});
  nodes(tree).find(n => n.type === 'TextField').props.onChange({ target: { value: 'solucoes' } });
  const filtered = instance.render({});
  // Home também descreve suas soluções; a busca inclui a descrição da página.
  assert.equal(nodes(filtered).filter(n => n.type === 'Button' && text(n) === 'Editar página').length, 2);
  assert.ok(nodes(filtered).some(n => n.type === 'Chip' && n.props.label === '4 fotos editáveis'));
  assert.ok(!nodes(filtered).some(n => n.type === 'Chip' && n.props.label === 'Publicado'));
  assert.ok(nodes(filtered).some(n => n.type === 'Button' && text(n) === 'Ver no site' && n.props.href === 'http://localhost:3002/solucoes'));
});
