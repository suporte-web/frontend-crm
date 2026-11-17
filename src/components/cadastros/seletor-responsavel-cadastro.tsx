import { useEffect, useState } from 'react';
import { Alert, Box, Button, MenuItem, TextField } from '@mui/material';
import { useUser } from '@/UserContext';
import { hasAnyRole } from '@/lib/user-roles';
import { listarResponsaveisCadastro, type ResponsavelComercial } from '@/stores/cadastros/service';

export function SeletorResponsavelCadastro({ valor, nomeAtual, aoAlterar, desabilitado = false }: {
  valor: string | null; nomeAtual?: string | null; aoAlterar: (id: string | null) => void; desabilitado?: boolean;
}) {
  const { user } = useUser();
  const consultora = hasAnyRole(user, ['CONSULTORA']);
  const [opcoes, setOpcoes] = useState<ResponsavelComercial[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    setCarregando(true); setErro('');
    listarResponsaveisCadastro().then(dados => { if (ativo) setOpcoes(dados); })
      .catch(error => { if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível carregar os usuários.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);
  const ausente = valor && !opcoes.some(item => item.id === valor);
  return <Box sx={{ minWidth: 0 }}>
    <TextField select size="small" fullWidth label="Responsável comercial" value={valor || ''}
      onChange={evento => aoAlterar(evento.target.value || null)} disabled={desabilitado || carregando || Boolean(erro) || consultora}
      helperText={carregando ? 'Carregando usuários...' : consultora ? 'A alteração deste vínculo é feita pela gestão.' : !valor && nomeAtual ? `Responsável antigo: ${nomeAtual}. Selecione o usuário correspondente.` : 'Vinculado ao usuário do CRM.'}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
      <MenuItem value="">Sem responsável vinculado</MenuItem>
      {ausente && <MenuItem value={valor!} disabled>{nomeAtual || 'Usuário vinculado indisponível'} ({valor!.slice(0, 8)})</MenuItem>}
      {opcoes.map(item => <MenuItem key={item.id} value={item.id}>{item.name} ({item.id.slice(0, 8)})</MenuItem>)}
    </TextField>
    {erro && <Alert severity="warning" sx={{ mt: 1 }} action={<Button size="small" color="inherit" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</Button>}>{erro}</Alert>}
  </Box>;
}
