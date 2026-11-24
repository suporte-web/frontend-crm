import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Plugin } from 'vite';

export function createBuildVersion() {
  let commit: string | null = null;
  try { commit = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { /* Builds de arquivos exportados podem não possuir Git. */ }
  const buildDate = new Date().toISOString();
  return { version: `${buildDate.replace(/\D/g, '')}-${randomUUID()}`, buildDate, commit };
}

export function appVersionPlugin(): Plugin {
  let metadata: ReturnType<typeof createBuildVersion>;
  return {
    name: 'crm-app-version',
    apply: 'build',
    config() {
      metadata = createBuildVersion();
      return { define: { __APP_VERSION__: JSON.stringify(metadata) } };
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(metadata, null, 2) + '\n' });
    },
  };
}
