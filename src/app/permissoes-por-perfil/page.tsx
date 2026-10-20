"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageShell,
  CrmPageHeader,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { cartaoCrmSx } from "@/components/mui/estilos-cartoes-crm";
import { useAuth } from "@/context/auth-context";
import { hasAnyRole } from "@/lib/user-roles";
import { roles, roleMeta } from "@/lib/user-role-presentation";
import { profilePermissionItems, cadastroModalidadePermissionItems, isPermissionEnabledForRole, montarPermissoesPerfil } from "@/config/screens";
import {
  getScreenPermissions,
  updateRoleScreenPermissions,
} from "@/services/users.service";
import type { RoleScreenPermissionsGroup, UserRole } from "@/types/user";
const getRoleLabel = (role: UserRole) => roleMeta[role].label;
export default function PermissionsPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [screenPermissions, setScreenPermissions] = useState<
    RoleScreenPermissionsGroup[]
  >([]);
  const [selectedPermissionRole, setSelectedPermissionRole] =
    useState<UserRole>("ADMIN");
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorToastMessage, setErrorToastMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  useEffect(() => {
    getScreenPermissions()
      .then(setScreenPermissions)
      .catch((e) => setErrorToastMessage(e.message))
      .finally(() => setLoading(false));
  }, []);
  const selectedRolePermissions = useMemo(() => {
    const group = screenPermissions.find(
      (item) => item.role === selectedPermissionRole,
    );

    return new Map(
      (group?.screens ?? []).map((permission) => [
        permission.screenKey,
        permission,
      ]),
    );
  }, [screenPermissions, selectedPermissionRole]);

  function isPermissionItemChecked(
    permissionItem: (typeof profilePermissionItems)[number],
  ) {
    return isPermissionEnabledForRole(permissionItem, selectedPermissionRole, Array.from(selectedRolePermissions.values()));
  }

  const selectedEnabledCount = useMemo(
    () =>
      profilePermissionItems.filter((permissionItem) =>
        isPermissionItemChecked(permissionItem),
      ).length,
    [selectedRolePermissions, selectedPermissionRole],
  );

  function isProtectedAdminPermission(screenKey: string) {
    return (
      (selectedPermissionRole === "ADMIN" &&
        ["users", "profilePermissions"].includes(screenKey))
    );
  }

  async function handleTogglePermissionItem(screenKey: string) {
    const permissionItem = [...profilePermissionItems, ...cadastroModalidadePermissionItems].find(
      (item) => item.key === screenKey,
    );

    if (!permissionItem) return;

    if (isProtectedAdminPermission(screenKey)) {
      setErrorToastMessage(
        "A tela Usuários é obrigatória para o perfil Admin e não pode ser desativada.",
      );
      return;
    }

    const nextPermissions = montarPermissoesPerfil(
      selectedPermissionRole,
      Array.from(selectedRolePermissions.values()),
      screenKey,
    );

    try {
      setSavingPermissions(true);
      setErrorToastMessage("");

      const updated = await updateRoleScreenPermissions(
        selectedPermissionRole,
        { screens: nextPermissions },
      );

      setScreenPermissions((prev) => {
        const withoutCurrentRole = prev.filter(
          (item) => item.role !== selectedPermissionRole,
        );

        return [...withoutCurrentRole, updated];
      });

      if (hasAnyRole(currentUser, [selectedPermissionRole])) {
        await refreshUser();
      }

      setSuccessMessage("Permissões de telas atualizadas com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar permissões de telas";

      setErrorToastMessage(message);
    } finally {
      setSavingPermissions(false);
    }
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          title="Permissões por perfil"
          description="Configure o acesso às telas de cada perfil."
          icon={<ShieldCheck size={28} />}
        />
        {errorToastMessage && (
          <Alert severity="error">{errorToastMessage}</Alert>
        )}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {" "}
            <CrmSection>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                sx={{
                  px: { xs: 1.75, md: 2 },
                  py: 1.5,
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${crmPalette.border}`,
                }}
              >
                <Stack spacing={0.75}>
                  <Typography
                    component="h2"
                    sx={{
                      color: crmPalette.text,
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    Permissões por perfil
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    sx={{ alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Chip
                      icon={<ShieldCheck size={13} />}
                      label={getRoleLabel(selectedPermissionRole)}
                      size="small"
                      sx={{
                        height: 23,
                        borderRadius: "6px",
                        bgcolor: roleMeta[selectedPermissionRole].softColor,
                        color: roleMeta[selectedPermissionRole].accent,
                        fontSize: 11,
                        fontWeight: 700,
                        "& .MuiChip-icon": { color: "inherit", ml: 0.75 },
                      }}
                    />
                    <Typography sx={{ color: crmPalette.muted, fontSize: 12 }}>
                      {selectedEnabledCount}/{profilePermissionItems.length}{" "}
                      telas habilitadas
                    </Typography>
                    {savingPermissions ? (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        role="status"
                        sx={{ alignItems: "center" }}
                      >
                        <CircularProgress size={12} />
                        <Typography
                          sx={{ color: crmPalette.muted, fontSize: 11 }}
                        >
                          Salvando...
                        </Typography>
                      </Stack>
                    ) : null}
                  </Stack>
                </Stack>

                <ToggleButtonGroup
                  exclusive
                  size="small"
                  aria-label="Selecionar perfil para configurar permissões"
                  value={selectedPermissionRole}
                  onChange={(_, value: UserRole | null) => {
                    if (value) setSelectedPermissionRole(value);
                  }}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    "& .MuiToggleButtonGroup-grouped": {
                      border: "1px solid transparent !important",
                      borderRadius: "7px !important",
                      minHeight: 32,
                      px: 1.25,
                      py: 0.5,
                      color: crmPalette.muted,
                      bgcolor: "#f8fafc",
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": { bgcolor: "#f1f5f9", color: crmPalette.text },
                      "&.Mui-selected": {
                        bgcolor: "#fff0e8",
                        color: crmPalette.orangeDark,
                        borderColor: "#fed7c3 !important",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#ffe6d9" },
                      },
                    },
                  }}
                >
                  {roles.map((role) => (
                    <ToggleButton key={role} value={role}>
                      {getRoleLabel(role)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 0.75,
                  p: { xs: 1.75, md: 2 },
                }}
              >
                {profilePermissionItems.map((permissionItem) => {
                  const checked = isPermissionItemChecked(permissionItem);
                  const isProtected = isProtectedAdminPermission(
                    permissionItem.key,
                  );

                  if (permissionItem.key === 'cadastros') {
                    return (
                      <Paper key={permissionItem.key} variant="outlined" sx={{ ...cartaoCrmSx, p: 1.5, borderRadius: '8px', gridColumn: { sm: 'span 2' } }}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Cadastros</Typography>
                            <Switch checked={checked} disabled={savingPermissions} onChange={() => handleTogglePermissionItem('cadastros')} slotProps={{ input: { 'aria-label': 'Permitir acesso a Cadastros' } }} />
                          </Stack>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Defina quais modalidades este perfil pode acessar na base unificada.</Typography>
                          {cadastroModalidadePermissionItems.map(modalidade => (
                            <Stack key={modalidade.key} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                              <Typography sx={{ fontSize: 12.5 }}>{modalidade.label}</Typography>
                              <Switch size="small" checked={isPermissionItemChecked(modalidade)} disabled={savingPermissions || !checked} onChange={() => handleTogglePermissionItem(modalidade.key)} slotProps={{ input: { 'aria-label': `Permitir ${modalidade.label} em Cadastros` } }} />
                            </Stack>
                          ))}
                        </Stack>
                      </Paper>
                    );
                  }

                  return (
                    <Paper
                      key={permissionItem.key}
                      elevation={0}
                      component="label"
                      sx={{
                        ...cartaoCrmSx,
                        px: 1.25,
                        py: 0.75,
                        display: "flex",
                        gap: 0.75,
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 48,
                        border: `1px solid ${crmPalette.border}`,
                        borderRadius: "8px",
                        bgcolor: "background.paper",
                        cursor:
                          isProtected || savingPermissions
                            ? "not-allowed"
                            : "pointer",
                        transition:
                          "border-color 160ms ease, background-color 160ms ease",
                        "&:hover": {
                          borderColor:
                            isProtected || savingPermissions
                              ? crmPalette.border
                              : "#cbd5e1",
                        },
                        "&:focus-within": {
                          outline: `2px solid ${crmPalette.orange}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: crmPalette.text,
                            fontSize: 12.5,
                            fontWeight: 600,
                            lineHeight: 1.3,
                          }}
                        >
                          {permissionItem.label}
                        </Typography>
                        {isProtected ? (
                          <Typography
                            sx={{
                              mt: 0.25,
                              color: crmPalette.muted,
                              fontSize: 10.5,
                            }}
                          >
                            {selectedPermissionRole === "CONSULTORA"
                              ? "Acesso restrito aos próprios cadastros"
                              : "Obrigatória para Admin"}
                          </Typography>
                        ) : null}
                      </Box>

                      <Switch
                        size="small"
                        checked={checked}
                        disabled={isProtected || savingPermissions}
                        onChange={() =>
                          handleTogglePermissionItem(permissionItem.key)
                        }
                        slotProps={{
                          input: {
                            "aria-label": `${permissionItem.label} — perfil ${getRoleLabel(selectedPermissionRole)}`,
                          },
                        }}
                        sx={{
                          flexShrink: 0,
                          mr: -0.5,
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: crmPalette.orange,
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            { bgcolor: crmPalette.orange },
                        }}
                      />
                    </Paper>
                  );
                })}
              </Box>
            </CrmSection>
          </>
        )}
      </CrmPageShell>
    </AppLayout>
  );
}
