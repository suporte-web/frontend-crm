'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, CircularProgress } from '@mui/material';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/services/api';

export default function AbrirCadastroLead({ params }: { params: Promise<{ id: string }> }) {
  const { token } = useAuth();
  const router = useRouter();
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    params.then(({ id }) => apiFetch<{ id: string }>(`/cadastros/lead/${id}`, {}, token))
      .then(cadastro => { if (ativo) router.replace(`/cadastros/${cadastro.id}`); })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível abrir o cadastro.'); });
    return () => { ativo = false; };
  }, [params, token, router]);
  return <AppLayout>{erro ? <Alert severity="error">{erro}</Alert> : <CircularProgress aria-label="Abrindo cadastro" />}</AppLayout>;
}
