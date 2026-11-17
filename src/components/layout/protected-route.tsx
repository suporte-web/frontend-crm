import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@/UserContext';
import { podeAcessarRota } from '@/config/screens';
import { getRotaInicial } from '@/lib/rota-inicial';

type Validation = { access: string; token: string; error?: string };

export function ProtectedRoute() {
  const { user, token, isLoading, refreshUser } = useUser();
  const location = useLocation();
  const access = JSON.stringify([location.key, location.pathname, location.search, location.hash]);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isLoading || !token) return;
    const activeToken = token;
    let active = true;

    async function validate() {
      try {
        const currentUser = await refreshUser();
        if (active) setValidation({ access, token: activeToken, error: currentUser?.id ? undefined : 'Não foi possível validar o usuário.' });
      } catch (error) {
        if (active) setValidation({ access, token: activeToken, error: error instanceof Error ? error.message : 'Não foi possível validar sua sessão.' });
      }
    }

    void validate();
    return () => { active = false; };
  }, [access, token, isLoading, refreshUser, attempt]);

  if (isLoading) return <p role="status" style={{ padding: 24 }}>Verificando sessão...</p>;
  if (!token) return <Navigate to="/" replace />;
  if (!validation || validation.access !== access || validation.token !== token) {
    return <p role="status" style={{ padding: 24 }}>Verificando sessão...</p>;
  }
  if (validation.error) {
    return <section role="alert" style={{ padding: 24 }}>
      <p>Não foi possível confirmar seu acesso: {validation.error}</p>
      <button type="button" onClick={() => { setValidation(null); setAttempt(value => value + 1); }}>Tentar novamente</button>
    </section>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (user.mustChangePassword && location.pathname !== '/alterar-senha') {
    return <Navigate to="/alterar-senha" replace />;
  }
  if (!podeAcessarRota(location.pathname, user.roles?.length ? user.roles : user.role, user.screenPermissions)) {
    return <Navigate to={getRotaInicial(user)} replace />;
  }
  return <Outlet />;
}
