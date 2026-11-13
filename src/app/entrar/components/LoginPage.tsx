'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/auth-context';
import { getRotaInicial } from '@/lib/rota-inicial';
import { campoOportunidadeSx, acaoPrincipalOportunidadeSx } from '@/components/crm/estilos-oportunidades';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, token, loading: carregandoSessao } = useAuth();

  useEffect(() => {
    if (!carregandoSessao && token && user) router.replace(getRotaInicial(user));
  }, [carregandoSessao, token, user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginData = await signIn(email, password);

      router.replace(getRotaInicial(loginData.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="main" sx={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#2f2f2f', color: '#343434', px: { xs: 2, sm: 4 }, py: { xs: 3, md: 5 },
      backgroundImage: "linear-gradient(rgba(47,47,47,.72), rgba(47,47,47,.86)), url('/login/login-fundo.png')",
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, minWidth: 0, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none', p: { xs: 2.5, sm: 3.5 } }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: .5 }}>
            <Box component="img" src="/imagem/logopizzatto.png" alt="Pizzattolog" sx={{ display: 'block', width: 180, maxWidth: '100%', height: 'auto', objectFit: 'contain' }}/>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography component="h1" sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.25, color: '#343434' }}>Entrar no CRM</Typography>
            <Typography sx={{ mt: .75, fontSize: 13, color: '#64748b' }}>Acesse sua conta com e-mail e senha.</Typography>
          </Box>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField id="email" name="email" type="email" label="E-mail" required fullWidth size="small" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{ htmlInput: { 'aria-label': 'E-mail' }, input: { startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18 }}/></InputAdornment> } }} sx={loginTextFieldSx}/>
              <TextField id="password" name="password" type={showPassword ? 'text' : 'password'} label="Senha" required fullWidth size="small" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{ htmlInput: { 'aria-label': 'Senha' }, input: {
                  startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18 }}/></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton type="button" edge="end" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} sx={{ width: 30, height: 30, color: '#64748b' }}>
                    {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }}/> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }}/>}
                  </IconButton></InputAdornment>,
                } }} sx={loginTextFieldSx}/>
              {error ? <Alert severity="error" sx={{ border: '1px solid #fecaca', borderRadius: '8px', fontSize: 13 }}>{error}</Alert> : null}
              <Button type="submit" disabled={loading} fullWidth variant="contained" sx={{ ...acaoPrincipalOportunidadeSx, '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' } }}>
                {loading ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={16} color="inherit"/><span>Entrando...</span></Stack> : 'Entrar'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

const loginTextFieldSx = {
  ...campoOportunidadeSx,
  '& .MuiInputAdornment-root': { color: '#64748b' },
};
