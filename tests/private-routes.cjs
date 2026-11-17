const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const { createSourceLoader } = require('./helpers/source-loader.cjs');

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

function harness() {
  const states = [], dependencies = [], cleanups = [], effects = [];
  let cursor = 0;
  const session = { user: { id: '1', name: 'Teste', role: 'ADMIN' }, token: 'token', isLoading: false };
  let location = { key: 'a', pathname: '/painel', search: '', hash: '' };
  const requests = [];
  session.refreshUser = () => {
    const request = deferred();
    requests.push(request);
    return request.promise.then(user => { session.user = user; return user; });
  };
  const Outlet = () => null, Navigate = () => null;
  const load = createSourceLoader({
    globals: { Error },
    mocks: {
      react: {
        useState(initial) {
          const index = cursor++;
          if (!(index in states)) states[index] = initial;
          return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
        },
        useEffect(effect, deps) {
          const index = cursor++;
          if (!dependencies[index] || deps.some((value, i) => !Object.is(value, dependencies[index][i]))) {
            dependencies[index] = deps;
            effects.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
          }
        },
      },
      'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
      'react-router-dom': { Outlet, Navigate, useLocation: () => location },
      '@/UserContext': { useUser: () => session },
    },
  });
  const { ProtectedRoute } = load('src/components/layout/protected-route.tsx');
  return {
    session, requests, Outlet, Navigate,
    render() { cursor = 0; return ProtectedRoute(); },
    flush() { while (effects.length) effects.shift()(); },
    navigate(next) { location = { ...location, ...next }; },
  };
}

test('sem token, uma URL privada redireciona ao login sem montar a tela', () => {
  const app = harness();
  app.session.token = null;
  const output = app.render(); app.flush();
  assert.equal(output.type, app.Navigate);
  assert.equal(output.props.to, '/');
  assert.equal(app.requests.length, 0);
});

test('usuário em cache não libera a tela antes da resposta do backend', async () => {
  const app = harness();
  assert.equal(app.render().props.role, 'status'); app.flush();
  assert.equal(app.render().props.role, 'status');
  app.requests[0].resolve(app.session.user); await new Promise(setImmediate);
  assert.equal(app.render().type, app.Outlet);
});

test('cada navegação, inclusive parâmetro, query e voltar à mesma URL, exige nova validação', async () => {
  const app = harness();
  for (const [index, route] of [
    { pathname: '/clientes/1' }, { pathname: '/clientes/2' },
    { search: '?aba=contatos' }, { search: '?aba=contatos' },
    { pathname: '/entregas/tv', search: '' },
  ].entries()) {
    app.navigate({ ...route, key: String(index) });
    assert.equal(app.render().props.role, 'status'); app.flush();
    assert.equal(app.requests.length, index + 1);
    app.requests[index].resolve(app.session.user); await new Promise(setImmediate);
    assert.equal(app.render().type, app.Outlet);
  }
});

test('falha temporária bloqueia a tela, preserva sessão e permite tentar novamente', async () => {
  const app = harness();
  app.render(); app.flush();
  app.requests[0].reject(new Error('API indisponível')); await new Promise(setImmediate);
  const error = app.render();
  assert.equal(error.props.role, 'alert');
  assert.equal(app.session.token, 'token');
  error.props.children[1].props.onClick();
  assert.equal(app.render().props.role, 'status'); app.flush();
  app.requests[1].resolve(app.session.user); await new Promise(setImmediate);
  assert.equal(app.render().type, app.Outlet);
});

test('resposta de uma navegação anterior não libera a rota atual', async () => {
  const app = harness();
  app.render(); app.flush();
  app.navigate({ key: 'b', pathname: '/entregas' });
  app.render(); app.flush();
  app.requests[0].resolve(app.session.user); await new Promise(setImmediate);
  assert.equal(app.render().props.role, 'status');
  app.requests[1].resolve(app.session.user); await new Promise(setImmediate);
  assert.equal(app.render().type, app.Outlet);
});

test('logout durante a validação mantém a rota fechada', async () => {
  const app = harness();
  app.render(); app.flush();
  app.session.token = null;
  app.render(); app.flush();
  app.requests[0].resolve(app.session.user); await new Promise(setImmediate);
  assert.equal(app.render().type, app.Navigate);
});

test('troca obrigatória de senha e permissões continuam sendo respeitadas', async () => {
  const app = harness();
  app.render(); app.flush();
  app.requests[0].resolve({ ...app.session.user, mustChangePassword: true }); await new Promise(setImmediate);
  assert.equal(app.render().props.to, '/alterar-senha');
  app.session.user = { ...app.session.user, mustChangePassword: false, screenPermissions: [{ role: 'ADMIN', screenKey: 'dashboard', isEnabled: false }] };
  assert.equal(app.render().type, app.Navigate);
  assert.notEqual(app.render().props.to, '/painel');
});

test('Rotas declara todas as telas de negócio sob a proteção, incluindo TV', () => {
  const source = fs.readFileSync('src/Rotas.tsx', 'utf8');
  const ast = ts.createSourceFile('Rotas.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const publicPaths = new Set(['/', '/entrar', '/recuperar-senha', '/redefinir-senha', '*']);
  let privateCount = 0;
  function visit(node, protectedParent = false) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(ast) === 'Route') {
        const path = opening.attributes.properties.find(p => p.name?.getText(ast) === 'path')?.initializer?.text;
        const isGuard = opening.attributes.getText(ast).includes('<ProtectedRoute');
        if (path) {
          assert.equal(protectedParent, !publicPaths.has(path), path);
          if (protectedParent) privateCount++;
        }
        if (ts.isJsxElement(node)) for (const child of node.children) visit(child, protectedParent || isGuard);
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, protectedParent));
  }
  visit(ast);
  assert.ok(privateCount >= 48);
});
