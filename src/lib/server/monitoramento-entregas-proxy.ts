/** Proxy exclusivo do monitoramento: conserva a autenticacao e a resposta do backend. */
export async function proxyMonitoramentoEntregas(request: Request): Promise<Response> {
  const timeout = AbortSignal.timeout(90_000);
  const signal = AbortSignal.any([request.signal, timeout]);
  try {
    const backend = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
    const url = new URL(`${backend}/api/entregas-por-placas/monitoramento`);
    url.search = new URL(request.url).search;
    const headers = new Headers({ Accept: 'application/json' });
    const authorization = request.headers.get('authorization');
    if (authorization) headers.set('authorization', authorization);
    const upstream = await fetch(url, { method: 'GET', headers, cache: 'no-store', signal });
    const body = await upstream.arrayBuffer();
    return new Response([204, 205, 304].includes(upstream.status) ? null : body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const timedOut = timeout.aborted || (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name));
    return Response.json({
      message: timedOut
        ? 'A consulta de entregas excedeu o tempo de espera. Tente novamente em instantes.'
        : 'O serviço de entregas está temporariamente indisponível. Tente novamente em instantes.',
    }, { status: timedOut ? 504 : 503, headers: { 'cache-control': 'no-store' } });
  }
}
