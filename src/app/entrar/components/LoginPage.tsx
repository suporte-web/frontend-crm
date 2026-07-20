'use client';

import { FormEvent, useState } from 'react';
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
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

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

      router.push(
        loginData.user.mustChangePassword ? '/alterar-senha' : '/painel',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: '#fbf7ef',
        color: '#343434',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2.5, sm: 4 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 464,
          bgcolor: '#ffa987',
          border: '1px solid rgba(236,49,57,0.10)',
          borderRadius: 3,
          boxShadow: '0 28px 70px rgba(52,52,52,0.28)',
          p: { xs: 3, sm: 4.25 },
        }}
      >
        <Stack spacing={3.25}>
          <Box
            sx={{
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <Typography
              component="h1"
              sx={{
                color: '#343434',
                fontSize: { xs: 22, sm: 24 },
                lineHeight: 1.2,
                fontWeight: 900,
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              Portal CRM
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.15}>
              <TextField
                id="email"
                name="email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                slotProps={{
                  htmlInput: {
                    'aria-label': 'E-mail',
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={loginTextFieldSx}
              />

              <TextField
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                slotProps={{
                  htmlInput: {
                    'aria-label': 'Senha',
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockKeyhole size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          sx={{ color: 'rgba(52,52,52,0.68)' }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={loginTextFieldSx}
              />

              {error ? (
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{
                    bgcolor: '#ec3139',
                    color: '#fff',
                    borderRadius: 1.25,
                    fontWeight: 700,
                    '& .MuiAlert-icon': { color: '#fff' },
                  }}
                >
                  {error}
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                variant="contained"
                endIcon={
                  loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null
                }
                sx={{
                  mt: 1.75,
                  minHeight: 50,
                  borderRadius: 2,
                  bgcolor: '#ff4d00',
                  boxShadow: '0 10px 20px rgba(236,49,57,0.22)',
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#ec3139' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,77,0,0.62)',
                    color: 'rgba(255,255,255,0.78)',
                  },
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

const loginTextFieldSx = {
  '& .MuiInputBase-root': {
    minHeight: 56,
    borderRadius: 2,
    bgcolor: 'rgba(255,248,244,0.86)',
    color: '#343434',
  },
  '& .MuiInputAdornment-root': {
    color: 'rgba(52,52,52,0.54)',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(52,52,52,0.60)',
    fontWeight: 700,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#ec3139',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(52,52,52,0.18)',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(236,49,57,0.45)',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#ec3139',
    borderWidth: 1,
  },
  '& input': {
    fontSize: 14,
    fontWeight: 600,
  },
  '& input::placeholder': {
    color: 'rgba(52,52,52,0.42)',
    opacity: 1,
  },
};
