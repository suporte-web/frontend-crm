
"use client";

import { campoOportunidadeSx, acaoPrincipalOportunidadeSx } from '@/components/crm/estilos-oportunidades';

import { notificarCrm } from '@/lib/feedback-crm';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

import { PageTopContent } from '@/components/layout/page-top';
import { AppLayout } from "@/components/layout/app-layout";
import { CrmPageShell, CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { useAuth } from "@/context/auth-context";

// PADRÃO VISUAL DOS CAMPOS
const passwordFieldSx = {
  ...campoOportunidadeSx, width: '100%',
  '& .MuiInputAdornment-root': { color: '#64748b' },
  '& .MuiInputAdornment-root svg': { width: 16, height: 16 },
  '& .MuiIconButton-root': { width: 30, height: 30 },
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword } = useAuth();

  // ESTADOS DOS CAMPOS
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // VISIBILIDADE DAS SENHAS
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // CONTROLE DO FORMULÁRIO
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // SALVAR NOVA SENHA
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

      notificarCrm('Senha alterada com sucesso.');
      router.replace("/painel");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Erro ao alterar senha."
      );
    } finally {
      setSaving(false);
    }
  }

  // ÍCONES DOS CAMPOS DE SENHA
  function passwordAdornment(
    visible: boolean,
    onToggle: () => void,
    label: string
  ) {
    return {
      startAdornment: (
        <InputAdornment position="start">
          <LockKeyhole size={16} />
        </InputAdornment>
      ),

      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            type="button"
            aria-label={label}
            onClick={onToggle}
            edge="end"
            size="small"
            disabled={saving}
            sx={{
              color: "#64748b",
              "&:hover": {
                color: "#ff5805",
                bgcolor: "#fff7ed",
              },
            }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        </InputAdornment>
      ),
    };
  }

  return (
    <AppLayout>
      <CrmPageShell sx={{ maxWidth: 560, gap: 2.2, minWidth: 0 }}>
        {/* CABEÇALHO DA PÁGINA */}
        <PageTopContent title="Alterar senha" />

        {/* CARD PRINCIPAL */}
        <CrmSection
          sx={{
            p: { xs: 2, md: 2.5 },
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "none",
          }}
        >
          {/* FORMULÁRIO CENTRALIZADO */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              minWidth: 0,
              mx: "auto",
            }}
          >
            <Stack spacing={2}>
              {/* TÍTULO */}
              <Box>
                <Typography
                  component="h2"
                  sx={{
                    color: crmPalette.text,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Nova senha
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: crmPalette.muted,
                    fontSize: 13,
                  }}
                >
                  Use pelo menos 6 caracteres para definir sua senha.
                </Typography>
              </Box>

              {/* SENHA ATUAL */}
              <TextField
                fullWidth
                required
                size="small"
                label="Senha atual"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                disabled={saving}
                slotProps={{
                  input: passwordAdornment(
                    showCurrentPassword,
                    () =>
                      setShowCurrentPassword((current) => !current),
                    showCurrentPassword
                      ? "Ocultar senha atual"
                      : "Mostrar senha atual"
                  ),
                }}
                sx={passwordFieldSx}
              />

              {/* NOVA SENHA */}
              <TextField
                fullWidth
                required
                size="small"
                label="Nova senha"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                disabled={saving}
                slotProps={{
                  input: passwordAdornment(
                    showNewPassword,
                    () =>
                      setShowNewPassword((current) => !current),
                    showNewPassword
                      ? "Ocultar nova senha"
                      : "Mostrar nova senha"
                  ),
                }}
                sx={passwordFieldSx}
              />

              {/* CONFIRMAR NOVA SENHA */}
              <TextField
                fullWidth
                required
                size="small"
                label="Confirmar nova senha"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                disabled={saving}
                slotProps={{
                  input: passwordAdornment(
                    showConfirmPassword,
                    () =>
                      setShowConfirmPassword((current) => !current),
                    showConfirmPassword
                      ? "Ocultar confirmação de senha"
                      : "Mostrar confirmação de senha"
                  ),
                }}
                sx={passwordFieldSx}
              />

              {/* MENSAGEM DE ERRO */}
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "8px",
                    fontSize: 13,
                    alignItems: "center",
                    border: "1px solid #fecaca",
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* BOTÃO SALVAR */}
              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  justifyContent: "flex-end",
                  width: "100%",
                  alignItems: "center",
                  pt: 1.5,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={15}
                        color="inherit"
                      />
                    ) : (
                      <KeyRound size={15} />
                    )
                  }
                  sx={{ ...acaoPrincipalOportunidadeSx, width: { xs: '100%', sm: 'auto' }, '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' } }}
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
