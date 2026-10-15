
"use client";

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

import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { useAuth } from "@/context/auth-context";

// PADRÃO VISUAL DOS CAMPOS
const passwordFieldSx = {
  width: "100%",
  minWidth: 0,

  "& .MuiOutlinedInput-root": {
    height: 42,
    borderRadius: "10px",
    bgcolor: "#ffffff",

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#dce3eb",
    },

    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#94a3b8",
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ff5805",
    },
  },

  "& .MuiInputBase-input": {
    py: "10px",
    fontSize: 13,
    fontWeight: 500,
  },

  "& .MuiInputLabel-root": {
    fontSize: 13,
    fontWeight: 500,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff5805",
  },

  "& .MuiInputAdornment-root": {
    color: "#64748b",
  },

  "& .MuiInputAdornment-root svg": {
    width: 16,
    height: 16,
  },

  "& .MuiIconButton-root": {
    width: 30,
    height: 30,
  },
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
      <CrmPageShell sx={{ maxWidth: 860 }}>
        {/* CABEÇALHO DA PÁGINA */}
        <CrmPageHeader
          eyebrow="Primeiro acesso"
          title="Alterar senha inicial"
          description="Defina uma senha própria para continuar usando o portal."
          icon={<KeyRound size={30} />}
        />

        {/* CARD PRINCIPAL */}
        <CrmSection
          sx={{
            p: { xs: 2, md: 3 },
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "none",
          }}
        >
          {/* FORMULÁRIO CENTRALIZADO */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: 520,
              mx: "auto",
            }}
          >
            <Stack spacing={2.5}>
              {/* TÍTULO */}
              <Box>
                <Typography
                  component="h2"
                  sx={{
                    color: crmPalette.text,
                    fontSize: 18,
                    fontWeight: 800,
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
                    borderRadius: "10px",
                    fontSize: 13,
                    alignItems: "center",
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
                  sx={{
                    height: 38,
                    minHeight: 38,
                    px: 2.5,
                    borderRadius: "10px",
                    bgcolor: "#ff5805",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    whiteSpace: "nowrap",

                    "&:hover": {
                      bgcolor: "#e94f00",
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
