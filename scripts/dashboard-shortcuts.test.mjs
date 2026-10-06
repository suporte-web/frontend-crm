import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
let authUser;
function load(file) {
  const sourcePath = [file, file + '.ts', file + '.tsx'].find(path => existsSync(path));
  if (!sourcePath) throw new Error('File missing: ' + file);
  if (cache.has(sourcePath)) return cache.get(sourcePath);
  const context = { exports: {}, process: { env: {} }, require(name) {
    if (name === '@/context/auth-context') return { useAuth: () => ({ user: authUser }) };
    if (name === '@/components/layout/app-layout') return { AppLayout: ({ children }) => React.createElement('main', { 'data-existing-layout': true }, children) };
    if (name.startsWith('@/')) return load(resolve(root, 'src', name.slice(2)));
    if (name.startsWith('.')) return load(resolve(dirname(sourcePath), name));
    return require(name);
  } };
  cache.set(sourcePath, context.exports);
  const compiled = ts.transpileModule(readFileSync(sourcePath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const shortcutModule = load(resolve(root, 'src/app/painel/components/dashboard-shortcuts'));
const { appScreens } = load(resolve(root, 'src/config/screens'));
const { getDashboardShortcuts, dashboardShortcuts } = shortcutModule;

test('atalhos usam somente rotas existentes e os perfis do cadastro atual', () => {
  assert.equal(new Set(dashboardShortcuts.map(card => card.id)).size, dashboardShortcuts.length);
  for (const card of dashboardShortcuts) {
    const screen = appScreens.find(screen => screen.key === card.id);
    assert.ok(screen);
    assert.equal(card.href, screen.href);
    assert.equal(card.roles, screen.roles);
    assert.ok(existsSync(resolve(root, 'src/app', card.href.slice(1), 'page.tsx')), card.href);
  }
});

test('cada perfil visualiza apenas seus atalhos permitidos', () => {
  for (const role of ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE', 'OPERACAO']) {
    const expected = dashboardShortcuts.filter(card => card.roles.includes(role)).map(card => card.id);
    assert.equal(JSON.stringify(getDashboardShortcuts(role).map(card => card.id)), JSON.stringify(expected));
  }
  assert.equal(getDashboardShortcuts('ADMIN').length, dashboardShortcuts.length);
  assert.equal(getDashboardShortcuts().length, 0);
});

test('bloqueios configurados por perfil também escondem os atalhos do ADMIN', () => {
  const visible = getDashboardShortcuts('ADMIN', [{ screenKey: 'quotes', isEnabled: false }]);
  assert.ok(!visible.some(card => card.id === 'quotes'));
  assert.equal(visible.length, dashboardShortcuts.length - 1);
});

test('atalhos de subrotas respeitam a proteção atual da rota pai', () => {
  const visible = getDashboardShortcuts('ADMIN', [
    { screenKey: 'marketing', isEnabled: false },
    { screenKey: 'marketingIntegrations', isEnabled: true },
  ]);
  assert.ok(!visible.some(card => card.id === 'marketingIntegrations'));
  assert.ok(visible.some(card => card.id === 'marketingMetrics'));
});

test('cliente e marketing não recebem links de módulos fora de seus perfis', () => {
  const client = getDashboardShortcuts('CLIENTE').map(card => card.id);
  assert.ok(client.includes('quotes') && client.includes('trackings'));
  assert.ok(!client.includes('leads') && !client.includes('users') && !client.includes('marketingMetrics'));
  const marketing = getDashboardShortcuts('MARKETING').map(card => card.id);
  assert.ok(marketing.includes('marketingMetrics') && marketing.includes('siteInstitutional'));
  assert.ok(!marketing.includes('quotes') && !marketing.includes('bi') && !marketing.includes('users'));
});

test('dashboard renderiza o banner e os links compactos dentro do AppLayout existente', () => {
  authUser = { role: 'ADMIN', screenPermissions: [] };
  const DashboardPage = load(resolve(root, 'src/app/painel/components/DashboardPage')).default;
  const html = renderToStaticMarkup(React.createElement(DashboardPage));
  assert.ok(html.includes('data-existing-layout="true"'));
  assert.ok(html.includes('/images/dashboard/banner.png'));
  assert.ok(html.includes('Começar') && html.includes('Relatórios'));
  for (const card of dashboardShortcuts) assert.ok(html.includes(`href="${card.href}"`));
  assert.ok(html.includes('object-fit:cover') && html.includes('height:300px'));
  assert.ok(html.includes('border:1px solid #e5e7eb') && html.includes('min-height:112px'));
  assert.ok(html.includes('repeat(2, minmax(0, 1fr))') && html.includes('repeat(3, minmax(0, 1fr))'));
  assert.ok(html.includes('@media (min-width:1200px)') && html.includes('repeat(5, minmax(0, 1fr))'));
  assert.ok(html.includes('repeat(6, minmax(0, 1fr))'));
});

test('grupos vazios não aparecem para o cliente e o posicionamento do banner é configurável', () => {
  authUser = { role: 'CLIENTE', screenPermissions: [] };
  const DashboardPage = load(resolve(root, 'src/app/painel/components/DashboardPage')).default;
  const html = renderToStaticMarkup(React.createElement(DashboardPage));
  assert.ok(!html.includes('>Administração<') && !html.includes('>Marketing<'));
  assert.ok(!html.includes('href="/usuarios"'));
  const { DashboardBanner } = load(resolve(root, 'src/app/painel/components/DashboardBanner'));
  const banner = renderToStaticMarkup(React.createElement(DashboardBanner, { objectPosition: 'left center' }));
  assert.ok(banner.includes('object-position:left center'));
});
