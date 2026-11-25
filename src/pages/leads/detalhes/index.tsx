import { CadastrosService } from '@/stores/cadastros/service';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, CircularProgress } from '@mui/material';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';

export default function AbrirCadastroLead() {
  const { id = '' } = useParams<'id'>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    CadastrosService.buscarCadastroDoLead(id)
      .then(cadastro => { if (ativo) navigate(`/cadastros/${cadastro.id}`, { replace: true }); })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível abrir o cadastro.'); });
    return () => { ativo = false; };
  }, [id, token, navigate]);
  return <AppLayout>{erro ? <Alert severity="error">{erro}</Alert> : <CircularProgress aria-label="Abrindo cadastro" />}</AppLayout>;
}
