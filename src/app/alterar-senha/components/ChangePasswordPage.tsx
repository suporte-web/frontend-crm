"use client";

import { FormEvent, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { useAuth } from "@/context/auth-context";

const passwordFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 10,
    borderRadius: "10px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 15,
  },
  "& .MuiInputLabel-root": {
    fontSize: 18,
    fontWeight: 800,
  },
  "& .MuiInputAdornment-root svg": {
    width: 14,
    height: 14,
  },
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da senha não confere.");
      return;
    }

    try {
      setSaving(true);
      await changePassword(currentPassword, newPassword);
      router.replace("/painel");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Erro ao alterar senha.",
      );
    } finally {
      setSaving(false);
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
    <AppLayout>
      <CrmPageShell sx={{ maxWidth: 860 }}>
        <CrmPageHeader
          eyebrow="Primeiro acesso"
          title="Alterar senha inicial"
          description="Defina uma senha própria para continuar usando o portal."
          icon={<KeyRound size={30} />}
        />

        <CrmSection sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.75}>
              <Box>
                <Typography
                  component="h2"
                  sx={{
                    color: crmPalette.text,
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  Nova senha
                </Typography>
                <Typography sx={{ mt: 0.5, color: crmPalette.muted, fontSize: 13 }}>
                  Use pelo menos 6 caracteres.
                </Typography>
              </Box>

              <TextField
                fullWidth
                required
                label="Senha atual"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                slotProps={{
                  input: passwordAdornment(
                    showCurrentPassword,
                    () => setShowCurrentPassword((current) => !current),
                    showCurrentPassword
                      ? "Ocultar senha atual"
                      : "Mostrar senha atual",
                  ),
                }}
                sx={passwordFieldSx}
              />

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
                    showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha",
                  ),
                }}
                sx={passwordFieldSx}
              />

              <TextField
                fullWidth
                required
                label="Confirmar nova senha"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                slotProps={{
                  input: passwordAdornment(
                    showConfirmPassword,
                    () => setShowConfirmPassword((current) => !current),
                    showConfirmPassword
                      ? "Ocultar confirmação de senha"
                      : "Mostrar confirmação de senha",
                  ),
                }}
                sx={passwordFieldSx}
              />

              {error ? (
                <Alert severity="error" sx={{ borderRadius: "10px" }}>
                  {error}
                </Alert>
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <KeyRound size={17} />
                    )
                  }
                  sx={{
                    minHeight: 40,
                    borderRadius: "10px",
                    px: 2.5,
                    bgcolor: crmPalette.orange,
                    fontWeight: 900,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                      boxShadow: "none",
                    },
                  }}
                >
                  {saving ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CrmSection>
      </CrmPageShell>
    </AppLayout>
  );
}
