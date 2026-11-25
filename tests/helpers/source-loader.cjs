const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

/** Executa o código real dos stores com adaptadores HTTP controlados, sem acessar a API. */
function createSourceLoader({ globals = {}, mocks = {} } = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (!fs.existsSync(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx';
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env', '__env');
    const code = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, {
      module, exports: module.exports,
      console, process, FormData, Blob, Headers, Response, Request, URL, URLSearchParams, TextEncoder, TextDecoder, ArrayBuffer, AbortSignal, Event,
      setTimeout, clearTimeout,
      __env: { VITE_API_BACKEND: '/api' },
      ...globals,
      require(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2)));
        if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name));
        return require(name);
      },
    }, { filename });
    return module.exports;
  }
  return load;
}

module.exports = { createSourceLoader };
