"use client";

import { FormEvent, Suspense, useState } from "react";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { crmPalette, crmPaperSx } from "@/components/mui/crm-primitives";
import { resetPassword } from "@/services/auth.service";

const passwordFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 36,
    borderRadius: "8px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 12,
  },
  "& .MuiInputLabel-root": {
    fontSize: 11,
    fontWeight: 800,
  },
  "& .MuiInputAdornment-root svg": {
    width: 14,
    height: 14,
  },
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccessMessage("");
    setError("");

    if (!token) {
      setError("Link de recuperação inválido ou ausente.");
      setLoading(false);
      return;
    }

    if (newPassword.trim().length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword({
        token,
        newPassword: newPassword.trim(),
      });

      setSuccessMessage(response.message);

      setTimeout(() => {
        router.push("/entrar");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  function passwordAdornment(
    visible: boolean,
    onToggle: () => void,
    label: string,
  ) {
    return {
      startAdornment: (
        <InputAdornment position="start">
          <LockKeyhole size={17} />
        </InputAdornment>
      ),
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            type="button"
            aria-label={label}
            onClick={onToggle}
            edge="end"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </IconButton>
        </InputAdornment>
      ),
    };
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 5,
        bgcolor: crmPalette.page,
      }}
    >
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          ...crmPaperSx,
          width: "100%",
          maxWidth: 250,
          p: { xs: 2, sm: 2.5 },
          bgcolor: "#ffffff",
        }}
      >
        <Stack spacing={1.75}>
          <Box
            component="img"
            src="/imagem/logopizzatto.png"
            alt="Pizzattolog"
            sx={{
              width: 176,
              maxWidth: "70%",
              height: "auto",
              objectFit: "contain",
            }}
          />

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                bgcolor: "#fff0e8",
                color: crmPalette.orange,
                border: "1px solid #fed7c3",
              }}
            >
                <ShieldCheck size={26} />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: crmPalette.orangeDark,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                }}
              >
                Nova senha
              </Typography>

              <Typography
                component="h1"
                sx={{
                  mt: 0.5,
                  color: crmPalette.text,
                  fontSize: { xs: 26, sm: 32 },
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                Redefinir senha
              </Typography>
            </Box>
          </Stack>

          <Typography sx={{ color: crmPalette.muted, fontSize: 14 }}>
            Crie uma nova senha para acessar sua conta no CRM.
          </Typography>

          <TextField
            fullWidth
            required
            label="Nova senha"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            slotProps={{
              input: passwordAdornment(
                showNewPassword,
                () => setShowNewPassword((current) => !current),
                showNewPassword ? "Ocultar senha" : "Mostrar senha",
              ),
            }}
            sx={passwordFieldSx}
          />

          <TextField
            fullWidth
            required
            label="Confirmar senha"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            slotProps={{
              input: passwordAdornment(
                showConfirmPassword,
                () => setShowConfirmPassword((current) => !current),
                showConfirmPassword ? "Ocultar senha" : "Mostrar senha",
              ),
            }}
            sx={passwordFieldSx}
          />

          {successMessage ? (
            <Alert severity="success" sx={{ borderRadius: "10px" }}>
              {successMessage} Redirecionando para o login...
            </Alert>
          ) : null}

          {error ? (
            <Alert severity="error" sx={{ borderRadius: "10px" }}>
              {error}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ShieldCheck size={17} />
              )
            }
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              bgcolor: crmPalette.orange,
              fontWeight: 900,
              boxShadow: "none",
              "&:hover": {
                bgcolor: crmPalette.orangeDark,
                boxShadow: "none",
              },
            }}
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>

          <Link
            component={NextLink}
            href="/entrar"
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: crmPalette.muted,
              fontSize: 13,
              fontWeight: 800,
              "&:hover": {
                color: crmPalette.text,
              },
            }}
          >
            <ArrowLeft size={16} />
            Voltar para o login
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          component="main"
          sx={{
            minHeight: "100svh",
            display: "grid",
            placeItems: "center",
            bgcolor: crmPalette.page,
          }}
        >
          <CircularProgress size={26} />
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
