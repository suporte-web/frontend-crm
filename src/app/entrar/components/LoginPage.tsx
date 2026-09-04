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

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

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

        backgroundImage: `
    linear-gradient(
      rgba(22, 18, 16, 0.58),
      rgba(22, 18, 16, 0.70)
    ),
    url('/login/login-fundo.png')
  `,

        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        px: {
          xs: 2,
          sm: 4,
        },

        py: {
          xs: 4,
          md: 6,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,

          width: '100%',
          maxWidth: 460,

          bgcolor: 'rgba(255,255,255,0.94)',

          border: '1px solid rgba(255,255,255,0.35)',

          borderRadius: {
            xs: 3,
            sm: 4,
          },

          backdropFilter: 'blur(14px)',

          boxShadow: `
      0 32px 80px rgba(0,0,0,0.32),
      0 8px 24px rgba(0,0,0,0.12)
    `,

          p: {
            xs: 3,
            sm: 4.5,
          },
        }}
      >
        <Stack spacing={3.25}>
          {/* LOGO */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box
              component="img"
              src="/imagem/logopizzatto.png"
              alt="Pizzattolog"
              sx={{
                display: 'block',
                width: {
                  xs: 180,
                  sm: 210,
                },
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain',
                mx: 'auto',
              }}
            />
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
                        <EmailOutlinedIcon />
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
                        <LockOutlinedIcon />
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
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
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
                sx={{
                  mt: 1,

                  minHeight: 54,

                  borderRadius: 2.5,

                  bgcolor: '#ff5805',

                  color: '#fff',

                  fontSize: 15,
                  fontWeight: 800,

                  textTransform: 'none',

                  boxShadow: '0 12px 26px rgba(255,88,5,0.30)',

                  transition: 'all 0.2s ease',

                  '&:hover': {
                    bgcolor: '#e94f00',

                    transform: 'translateY(-1px)',

                    boxShadow: '0 15px 30px rgba(255,88,5,0.38)',
                  },

                  '&:active': {
                    transform: 'translateY(0)',
                  },

                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,88,5,0.55)',
                    color: 'rgba(255,255,255,0.75)',
                  },
                }}
              >
                {loading ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                    }}
                  >
                    <CircularProgress
                      size={17}
                      sx={{ color: '#fff' }}
                    />

                    <span>Entrando...</span>
                  </Stack>
                ) : (
                  'Entrar'
                )}
              </Button>

              <Stack
                spacing={0.8}
                sx={{
                  alignItems: 'center',
                  textAlign: 'center',
                  mt: 0.8,
                }}
              >
                <Typography
                  component="h1"
                  sx={{
                    color: '#343434',
                    fontSize: {
                      xs: 17,
                      sm: 18,
                    },
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    textAlign: 'center',
                  }}
                >
                  Portal CRM
                </Typography>

                <Box
                  sx={{
                    width: 42,
                    height: 3,
                    borderRadius: 999,
                    bgcolor: '#ff5805',
                  }}
                />
              </Stack>

            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}


const loginTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 58,

    borderRadius: 2.5,

    bgcolor: 'rgba(248,248,248,0.95)',

    color: '#343434',

    transition: 'all 0.2s ease',

    '& fieldset': {
      borderColor: 'rgba(52,52,52,0.16)',
    },

    '&:hover fieldset': {
      borderColor: 'rgba(255,88,5,0.50)',
    },

    '&.Mui-focused': {
      bgcolor: '#fff',

      boxShadow: '0 0 0 4px rgba(255,88,5,0.08)',
    },

    '&.Mui-focused fieldset': {
      borderColor: '#ff5805',
      borderWidth: '1.5px',
    },
  },

  '& .MuiInputAdornment-root': {
    color: '#858585',
  },

  '& input': {
    fontSize: 14,
    fontWeight: 600,
    color: '#343434',
  },

  '& input::placeholder': {
    color: '#8c8c8c',
    opacity: 1,
    fontWeight: 500,
  },
};
