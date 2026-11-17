import type { ProxyOptions } from 'vite';

/** Configuração exclusiva do servidor de desenvolvimento/preview; não vai para o navegador. */
export function createApiProxy({ target, prefix }: { target: string; prefix: string }): Record<string, ProxyOptions> {
  const apiPrefix = prefix ? `/${prefix.replace(/^\/+|\/+$/g, '')}` : '';
  return {
    '/api': {
      target,
      changeOrigin: true,
      // Mantém chamadas longas de monitoramento e transmite uploads sem buffer intermediário.
      timeout: 90_000,
      proxyTimeout: 90_000,
      rewrite: path => path.replace(/^\/api(?=\/|\?|$)/, apiPrefix),
      configure(proxy) {
        proxy.on('error', (error, _request, response) => {
          if (!('writeHead' in response) || response.headersSent || response.writableEnded) return;
          const timedOut = ['ETIMEDOUT', 'ECONNRESET'].includes((error as NodeJS.ErrnoException).code || '');
          response.writeHead(timedOut ? 504 : 502, { 'Content-Type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ message: timedOut
            ? 'A consulta excedeu o tempo de espera. Tente novamente.'
            : 'Não foi possível conectar ao backend. Verifique se a API está em execução.' }));
        });
      },
    },
    '/uploads': { target, changeOrigin: true },
  };
}
