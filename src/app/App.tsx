import { Component, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Erro ao abrir página do CRM', error, info); }
  render() {
    if (this.state.failed) return (
      <main role="alert" style={{ padding: 32 }}>
        <h1>Não foi possível abrir esta página</h1>
        <p>Atualize a página para tentar novamente.</p>
        <button onClick={() => window.location.reload()}>Atualizar página</button>
      </main>
    );
    return this.props.children;
  }
}

/** Composição compartilhada: as rotas são declaradas exclusivamente em Rotas.tsx. */
export function App({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={<p role="status" style={{ padding: 24 }}>Carregando página...</p>}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}
