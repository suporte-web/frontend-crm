"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  BadgeCheck,
  CheckCircle2,
  CircleOff,
  KeyRound,
  Pencil,
  PlusCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  XCircle,
} from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmKpiCard,
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { profilePermissionItems } from "@/config/screens";
import { useAuth } from "@/context/auth-context";
import {
  createUser,
  deleteUser,
  getScreenPermissions,
  getUsers,
  updateRoleScreenPermissions,
  updateUser,
} from "@/services/users.service";
import type {
  CreateUserPayload,
  RoleScreenPermissionsGroup,
  UpdateUserPayload,
  User,
  UserRole,
} from "@/types/user";

const roles: UserRole[] = [
  "ADMIN",
  "GESTAO",
  "COMERCIAL",
  "OPERACAO",
  "MARKETING",
];

type StatusFilter = "TODOS" | "ATIVO" | "INATIVO";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  password: "",
  role: "COMERCIAL",
  isActive: true,
};

const roleMeta: Record<
  UserRole,
  {
    label: string;
    accent: string;
    softColor: string;
    chipSx: object;
  }
> = {
  ADMIN: {
    label: "Admin",
    accent: "#7c3aed",
    softColor: "#f3e8ff",
    chipSx: {
      bgcolor: "#f3e8ff",
      color: "#6d28d9",
      borderColor: "#ddd6fe",
    },
  },
  GESTAO: {
    label: "Gestão",
    accent: crmPalette.blue,
    softColor: "#eaf4ff",
    chipSx: {
      bgcolor: "#eaf4ff",
      color: "#1d5f99",
      borderColor: "#bfdbfe",
    },
  },
  COMERCIAL: {
    label: "Comercial",
    accent: crmPalette.orange,
    softColor: "#fff0e8",
    chipSx: {
      bgcolor: "#fff0e8",
      color: crmPalette.orangeDark,
      borderColor: "#fed7c3",
    },
  },
  OPERACAO: {
    label: "Operação",
    accent: "#0f766e",
    softColor: "#ccfbf1",
    chipSx: {
      bgcolor: "#ccfbf1",
      color: "#0f766e",
      borderColor: "#99f6e4",
    },
  },
  MARKETING: {
    label: "Marketing",
    accent: "#db2777",
    softColor: "#fce7f3",
    chipSx: {
      bgcolor: "#fce7f3",
      color: "#be185d",
      borderColor: "#fbcfe8",
    },
  },
  CLIENTE: {
    label: "Cliente",
    accent: crmPalette.green,
    softColor: "#ecfdf5",
    chipSx: {
      bgcolor: "#ecfdf5",
      color: "#047857",
      borderColor: "#bbf7d0",
    },
  },
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 42,
    borderRadius: "10px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    fontSize: 13,
  },
  "& .MuiInputLabel-root": {
    fontSize: 13,
    fontWeight: 800,
  },
};

const filterFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    minHeight: 52,
    borderRadius: "10px",
    bgcolor: "#ffffff",
    alignItems: "center",
  },
  "& .MuiInputBase-input": {
    height: "auto",
    paddingTop: 0,
    paddingBottom: 0,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    height: "100% !important",
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
  },
  "& .MuiInputAdornment-root": {
    height: 24,
    maxHeight: 24,
    alignItems: "center",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 800,
  },
};

const tableHeadCellSx = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  bgcolor: "#f8fafc",
  borderBottom: `1px solid ${crmPalette.border}`,
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "US";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getRoleLabel(role: UserRole) {
  return roleMeta[role].label;
}

export default function UsersPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [screenPermissions, setScreenPermissions] = useState<
    RoleScreenPermissionsGroup[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"TODOS" | UserRole>("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [selectedPermissionRole, setSelectedPermissionRole] =
    useState<UserRole>("ADMIN");

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToastMessage, setErrorToastMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState<FormState>(initialFormState);

  const companyUsers = useMemo(
    () => users.filter((user) => user.role !== "CLIENTE"),
    [users],
  );

  async function loadUsers() {
    try {
      setLoading(true);
      setPageError("");
      const [usersData, permissionsData] = await Promise.all([
        getUsers(),
        getScreenPermissions(),
      ]);
      setUsers(usersData);
      setScreenPermissions(permissionsData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar usuários";
      setPageError(message);
      setErrorToastMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorToastMessage) return;

    const timer = setTimeout(() => {
      setErrorToastMessage("");
    }, 6000);

    return () => clearTimeout(timer);
  }, [errorToastMessage]);

  function getFriendlyErrorMessage(message: string) {
    if (message.includes("email must be an email")) {
      return "Digite um email válido, por exemplo: nome@empresa.com";
    }

    if (message.includes("Email already in use")) {
      return "Este email já está sendo usado por outro usuário.";
    }

    if (message.includes("property isActive should not exist")) {
      return "O campo de status não foi aceito pela API. Verifique o backend.";
    }

    if (message.includes("A senha deve ter pelo menos")) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    return message;
  }

  const filteredUsers = useMemo(() => {
    return companyUsers.filter((user) => {
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        roleFilter === "TODOS" ? true : user.role === roleFilter;

      const matchesStatus =
        statusFilter === "TODOS"
          ? true
          : statusFilter === "ATIVO"
            ? user.isActive
            : !user.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [companyUsers, search, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = companyUsers.length;
    const active = companyUsers.filter((user) => user.isActive).length;
    const inactive = companyUsers.filter((user) => !user.isActive).length;
    const operations = companyUsers.filter(
      (user) => user.role === "OPERACAO",
    ).length;

    return { total, active, inactive, operations };
  }, [companyUsers]);

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

  const selectedEnabledCount = useMemo(() => {
    return profilePermissionItems.filter((permissionItem) =>
      isPermissionItemChecked(permissionItem),
    ).length;
  }, [selectedRolePermissions, selectedPermissionRole]);

  function isPermissionItemChecked(
    permissionItem: (typeof profilePermissionItems)[number],
  ) {
    const permission = selectedRolePermissions.get(permissionItem.key);

    return permission
      ? permission.isEnabled
      : permissionItem.roles.includes(selectedPermissionRole);
  }

  function isProtectedAdminPermission(screenKey: string) {
    return selectedPermissionRole === "ADMIN" && screenKey === "users";
  }

  async function handleTogglePermissionItem(screenKey: string) {
    const permissionItem = profilePermissionItems.find(
      (item) => item.key === screenKey,
    );

    if (!permissionItem) return;

    if (isProtectedAdminPermission(screenKey)) {
      setErrorToastMessage(
        "A tela Usuários é obrigatória para o perfil Admin e não pode ser desativada.",
      );
      return;
    }

    const nextPermissions = profilePermissionItems.map((item) => {
      const existingPermission = selectedRolePermissions.get(item.key);
      const currentValue = existingPermission
        ? existingPermission.isEnabled
        : item.roles.includes(selectedPermissionRole);

      return {
        screenKey: item.key,
        screenLabel: item.label,
        isEnabled: item.key === screenKey ? !currentValue : currentValue,
      };
    });

    try {
      setSavingPermissions(true);
      setErrorToastMessage("");

      const updated = await updateRoleScreenPermissions(
        selectedPermissionRole,
        {
          screens: nextPermissions,
        },
      );

      setScreenPermissions((prev) => {
        const withoutCurrentRole = prev.filter(
          (item) => item.role !== selectedPermissionRole,
        );

        return [...withoutCurrentRole, updated];
      });

      if (currentUser?.role === selectedPermissionRole) {
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

  function handleFieldChange<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingUser(null);
    setForm(initialFormState);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(initialFormState);
    setFormError("");
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Informe o nome do usuário.";
    }

    if (!form.email.trim()) {
      return "Informe o email do usuário.";
    }

    if (!editingUser && form.password.trim().length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      setErrorToastMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setErrorToastMessage("");

      if (editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
        };

        const updatedUser = await updateUser(editingUser.id, payload);

        setUsers((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
        );

        setSuccessMessage("Usuário atualizado com sucesso.");
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
          isActive: form.isActive,
        };

        const createdUser = await createUser(payload);

        setUsers((prev) => [createdUser, ...prev]);

        setSuccessMessage("Usuário criado com sucesso.");
      }

      closeModal();
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Erro ao salvar usuário";

      const friendlyMessage = getFriendlyErrorMessage(rawMessage);

      setFormError(friendlyMessage);
      setErrorToastMessage(friendlyMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário "${user.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSuccessMessage("Usuário excluído com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir usuário";

      setErrorToastMessage(message);
    }
  }

  async function handleToggleStatus(user: User) {
    try {
      const updatedUser = await updateUser(user.id, {
        isActive: !user.isActive,
      });

      setUsers((prev) =>
        prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
      );

      setSuccessMessage(
        updatedUser.isActive
          ? "Usuário ativado com sucesso."
          : "Usuário inativado com sucesso.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao alterar status";

      setErrorToastMessage(message);
    }
  }

  function renderStatusChip(isActive: boolean) {
    return (
      <Chip
        icon={isActive ? <CheckCircle2 size={14} /> : <CircleOff size={14} />}
        label={isActive ? "Ativo" : "Inativo"}
        size="small"
        variant="outlined"
        sx={{
          height: 28,
          borderRadius: "8px",
          bgcolor: isActive ? "#ecfdf5" : "#fef2f2",
          color: isActive ? "#047857" : "#b91c1c",
          borderColor: isActive ? "#bbf7d0" : "#fecaca",
          fontSize: 12,
          fontWeight: 900,
          "& .MuiChip-icon": {
            color: "inherit",
          },
        }}
      />
    );
  }

  function renderRoleChip(role: UserRole) {
    return (
      <Chip
        label={getRoleLabel(role)}
        size="small"
        variant="outlined"
        sx={{
          height: 28,
          borderRadius: "8px",
          fontSize: 12,
          fontWeight: 900,
          ...roleMeta[role].chipSx,
        }}
      />
    );
  }

  function renderUserActions(user: User) {
    return (
      <Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="Editar usuário">
          <IconButton
            type="button"
            aria-label={`Editar ${user.name}`}
            onClick={() => openEditModal(user)}
            sx={{
              width: 36,
              height: 36,
              border: `1px solid ${crmPalette.border}`,
              borderRadius: "10px",
              color: crmPalette.text,
              bgcolor: "#ffffff",
              "&:hover": {
                bgcolor: "#f8fafc",
              },
            }}
          >
            <Pencil size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title={user.isActive ? "Inativar usuário" : "Ativar usuário"}>
          <IconButton
            type="button"
            aria-label={user.isActive ? "Inativar usuário" : "Ativar usuário"}
            onClick={() => handleToggleStatus(user)}
            sx={{
              width: 36,
              height: 36,
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              color: crmPalette.blue,
              bgcolor: "#eff6ff",
              "&:hover": {
                bgcolor: "#dbeafe",
              },
            }}
          >
            {user.isActive ? <CircleOff size={16} /> : <BadgeCheck size={16} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Excluir usuário">
          <IconButton
            type="button"
            aria-label={`Excluir ${user.name}`}
            onClick={() => handleDelete(user)}
            sx={{
              width: 36,
              height: 36,
              border: "1px solid #fecaca",
              borderRadius: "10px",
              color: "#b91c1c",
              bgcolor: "#fef2f2",
              "&:hover": {
                bgcolor: "#fee2e2",
              },
            }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Administração"
          title="Gestão de usuários"
          description="Controle perfis, status de acesso e telas disponíveis para cada tipo de usuário."
          icon={<UserCog size={30} />}
          aside={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              sx={{ alignItems: "stretch" }}
            >
              <Button
                variant="outlined"
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshCcw size={17} />
                  )
                }
                onClick={() => loadUsers()}
                disabled={loading}
                sx={{
                  minHeight: 44,
                  borderRadius: "10px",
                  fontWeight: 800,
                }}
              >
                Atualizar
              </Button>

              <Button
                variant="contained"
                startIcon={<PlusCircle size={17} />}
                onClick={openCreateModal}
                sx={{
                  minHeight: 44,
                  borderRadius: "10px",
                  px: 2.25,
                  bgcolor: crmPalette.orange,
                  fontWeight: 800,
                  boxShadow: "0 12px 24px rgba(255,77,0,0.20)",
                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                  },
                }}
              >
                Novo usuário
              </Button>
            </Stack>
          }
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <CrmKpiCard
            title="Total de usuários"
            value={summary.total}
            icon={<UsersRound size={22} />}
            accent={crmPalette.blue}
            softColor="#eaf4ff"
          />

          <CrmKpiCard
            title="Usuários ativos"
            value={summary.active}
            icon={<BadgeCheck size={22} />}
            accent={crmPalette.green}
            softColor="#ecfdf5"
          />

          <CrmKpiCard
            title="Usuários inativos"
            value={summary.inactive}
            icon={<CircleOff size={22} />}
            accent={crmPalette.red}
            softColor="#fef2f2"
          />

          <CrmKpiCard
            title="Perfil operação"
            value={summary.operations}
            icon={<ShieldCheck size={22} />}
            accent={roleMeta.OPERACAO.accent}
            softColor={roleMeta.OPERACAO.softColor}
          />
        </Box>

        <CrmSection>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              alignItems: { xs: "stretch", lg: "center" },
              justifyContent: "space-between",
              borderBottom: `1px solid ${crmPalette.border}`,
            }}
          >
            <Box>
              <Typography
                component="h2"
                sx={{
                  color: crmPalette.text,
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                Telas por perfil
              </Typography>

              <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 13 }}>
                Configure quais áreas do portal ficam disponíveis para cada
                perfil de acesso.
              </Typography>
            </Box>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={selectedPermissionRole}
              onChange={(_, value: UserRole | null) => {
                if (value) {
                  setSelectedPermissionRole(value);
                }
              }}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                "& .MuiToggleButtonGroup-grouped": {
                  border: `1px solid ${crmPalette.border} !important`,
                  borderRadius: "10px !important",
                  px: 1.5,
                  py: 0.9,
                  color: crmPalette.text,
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "#fff0e8",
                    color: crmPalette.orangeDark,
                    borderColor: "#fed7c3 !important",
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
              gridTemplateColumns: { xs: "1fr", xl: "280px 1fr" },
              gap: 2,
              p: { xs: 2, md: 2.5 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${crmPalette.border}`,
                borderRadius: "12px",
                bgcolor: roleMeta[selectedPermissionRole].softColor,
              }}
            >
              <Stack spacing={1.5}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "12px",
                    bgcolor: "#ffffff",
                    color: roleMeta[selectedPermissionRole].accent,
                    border: `1px solid ${roleMeta[selectedPermissionRole].accent}30`,
                  }}
                >
                  <ShieldCheck size={22} />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      color: crmPalette.text,
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    Perfil {getRoleLabel(selectedPermissionRole)}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: crmPalette.muted,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedEnabledCount} de {profilePermissionItems.length}{" "}
                    telas habilitadas.
                  </Typography>
                </Box>

                {savingPermissions ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ color: crmPalette.muted, fontSize: 12 }}>
                      Salvando permissões...
                    </Typography>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.25,
              }}
            >
              {profilePermissionItems.map((permissionItem) => {
                const checked = isPermissionItemChecked(permissionItem);
                const isProtected = isProtectedAdminPermission(
                  permissionItem.key,
                );

                return (
                  <Paper
                    key={permissionItem.key}
                    elevation={0}
                    component="label"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      gap: 1.25,
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 76,
                      border: `1px solid ${
                        checked ? "#fed7c3" : crmPalette.border
                      }`,
                      borderRadius: "12px",
                      bgcolor: checked ? "#fffaf7" : "#ffffff",
                      cursor:
                        isProtected || savingPermissions ? "not-allowed" : "pointer",
                      transition:
                        "border-color 160ms ease, background-color 160ms ease",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 13,
                          fontWeight: 900,
                          lineHeight: 1.25,
                        }}
                      >
                        {permissionItem.label}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          color: checked ? crmPalette.orangeDark : crmPalette.muted,
                          fontSize: 12,
                        }}
                      >
                        {isProtected
                          ? "Obrigatória para Admin"
                          : checked
                            ? "Disponível no perfil"
                            : "Oculta no perfil"}
                      </Typography>
                    </Box>

                    <Checkbox
                      checked={checked}
                      disabled={isProtected || savingPermissions}
                      onChange={() =>
                        handleTogglePermissionItem(permissionItem.key)
                      }
                      sx={{
                        color: crmPalette.border,
                        "&.Mui-checked": {
                          color: crmPalette.orange,
                        },
                      }}
                    />
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </CrmSection>

        <CrmSection sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1.4fr) minmax(180px, .75fr) minmax(180px, .75fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Buscar usuário"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome ou email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={filterFieldSx}
            />

            <TextField
              select
              fullWidth
              label="Perfil"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as "TODOS" | UserRole)
              }
              sx={filterFieldSx}
            >
              <MenuItem value="TODOS">Todos os perfis</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {getRoleLabel(role)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              sx={filterFieldSx}
            >
              <MenuItem value="TODOS">Todos os status</MenuItem>
              <MenuItem value="ATIVO">Ativos</MenuItem>
              <MenuItem value="INATIVO">Inativos</MenuItem>
            </TextField>
          </Box>
        </CrmSection>

        <CrmSection>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              borderBottom: `1px solid ${crmPalette.border}`,
            }}
          >
            <Box>
              <Typography
                component="h2"
                sx={{
                  color: crmPalette.text,
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                Usuários cadastrados
              </Typography>

              <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 13 }}>
                Lista filtrável com dados de acesso, perfil e status.
              </Typography>
            </Box>

            <Chip
              label={`${filteredUsers.length} resultado(s)`}
              size="small"
              sx={{
                height: 30,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: crmPalette.text,
                fontSize: 12,
                fontWeight: 900,
              }}
            />
          </Stack>

          {loading ? (
            <Stack
              spacing={1.5}
              sx={{
                minHeight: 220,
                alignItems: "center",
                justifyContent: "center",
                color: crmPalette.muted,
              }}
            >
              <CircularProgress size={28} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                Carregando usuários...
              </Typography>
            </Stack>
          ) : pageError ? (
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Alert severity="error" sx={{ borderRadius: "10px" }}>
                {pageError}
              </Alert>
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Stack
              spacing={1}
              sx={{
                minHeight: 220,
                alignItems: "center",
                justifyContent: "center",
                color: crmPalette.muted,
                textAlign: "center",
                px: 2,
              }}
            >
              <UsersRound size={28} />
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                Nenhum usuário encontrado com os filtros aplicados.
              </Typography>
            </Stack>
          ) : (
            <>
              <TableContainer sx={{ display: { xs: "none", lg: "block" } }}>
                <Table sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadCellSx}>Usuário</TableCell>
                      <TableCell sx={tableHeadCellSx}>Perfil</TableCell>
                      <TableCell sx={tableHeadCellSx}>Status</TableCell>
                      <TableCell sx={tableHeadCellSx}>Criado em</TableCell>
                      <TableCell align="right" sx={tableHeadCellSx}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{
                          "& td": {
                            borderBottom: `1px solid ${crmPalette.border}`,
                          },
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center", minWidth: 0 }}
                          >
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: "12px",
                                bgcolor: roleMeta[user.role].softColor,
                                color: roleMeta[user.role].accent,
                                fontSize: 13,
                                fontWeight: 900,
                              }}
                            >
                              {getInitials(user.name)}
                            </Avatar>

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  color: crmPalette.text,
                                  fontSize: 14,
                                  fontWeight: 900,
                                }}
                              >
                                {user.name}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.25,
                                  color: crmPalette.muted,
                                  fontSize: 12,
                                }}
                              >
                                {user.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>{renderRoleChip(user.role)}</TableCell>

                        <TableCell>{renderStatusChip(user.isActive)}</TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: crmPalette.muted,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {formatDate(user.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          {renderUserActions(user)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                spacing={1.25}
                sx={{ display: { xs: "flex", lg: "none" }, p: 2 }}
              >
                {filteredUsers.map((user) => (
                  <Paper
                    key={user.id}
                    elevation={0}
                    sx={{
                      p: 1.75,
                      border: `1px solid ${crmPalette.border}`,
                      borderRadius: "12px",
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: "flex-start", minWidth: 0 }}
                      >
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "12px",
                            bgcolor: roleMeta[user.role].softColor,
                            color: roleMeta[user.role].accent,
                            fontSize: 13,
                            fontWeight: 900,
                          }}
                        >
                          {getInitials(user.name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 15,
                              fontWeight: 900,
                              lineHeight: 1.3,
                            }}
                          >
                            {user.name}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,
                              color: crmPalette.muted,
                              fontSize: 12,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap", rowGap: 1 }}
                      >
                        {renderRoleChip(user.role)}
                        {renderStatusChip(user.isActive)}
                      </Stack>

                      <Box>
                        <Typography
                          sx={{
                            color: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                          }}
                        >
                          Criado em
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            color: crmPalette.text,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Box>

                      <Divider />
                      {renderUserActions(user)}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </CrmSection>

        <Dialog
          open={isModalOpen}
          onClose={() => {
            if (!saving) {
              closeModal();
            }
          }}
          fullWidth
          maxWidth="md"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.20)",
            },
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle
              component="div"
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2.5,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: crmPalette.orangeDark,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {editingUser ? "Edição de acesso" : "Novo acesso"}
                  </Typography>

                  <Typography
                    component="h2"
                    sx={{
                      mt: 0.5,
                      color: crmPalette.text,
                      fontSize: { xs: 21, md: 24 },
                      fontWeight: 900,
                      lineHeight: 1.2,
                    }}
                  >
                    {editingUser ? "Editar usuário" : "Cadastrar usuário"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.75,
                      color: crmPalette.muted,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {editingUser
                      ? "Atualize dados, perfil e status do usuário selecionado."
                      : "Crie o acesso e defina o perfil inicial no portal."}
                  </Typography>
                </Box>

                <IconButton
                  type="button"
                  aria-label="Fechar formulário"
                  disabled={saving}
                  onClick={closeModal}
                  sx={{
                    flexShrink: 0,
                    color: crmPalette.muted,
                    "&:hover": {
                      bgcolor: "#f1f5f9",
                      color: crmPalette.text,
                    },
                  }}
                >
                  <XCircle size={21} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <Divider />

            <DialogContent
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 3,
                bgcolor: "#f8fafc",
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: editingUser
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Nome"
                    value={form.name}
                    onChange={(event) =>
                      handleFieldChange("name", event.target.value)
                    }
                    placeholder="Digite o nome completo"
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    type="email"
                    label="Email"
                    value={form.email}
                    onChange={(event) =>
                      handleFieldChange("email", event.target.value)
                    }
                    placeholder="nome@empresa.com"
                    sx={textFieldSx}
                  />

                  {!editingUser ? (
                    <TextField
                      fullWidth
                      type="password"
                      label="Senha"
                      value={form.password}
                      onChange={(event) =>
                        handleFieldChange("password", event.target.value)
                      }
                      placeholder="Mínimo 6 caracteres"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <KeyRound size={16} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={textFieldSx}
                    />
                  ) : null}

                  <TextField
                    select
                    fullWidth
                    label="Perfil"
                    value={form.role}
                    onChange={(event) =>
                      handleFieldChange("role", event.target.value as UserRole)
                    }
                    sx={textFieldSx}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Paper
                    elevation={0}
                    sx={{
                      px: 1.5,
                      minHeight: 54,
                      display: "flex",
                      alignItems: "center",
                      border: `1px solid ${crmPalette.border}`,
                      borderRadius: "10px",
                      bgcolor: "#ffffff",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isActive}
                          onChange={(event) =>
                            handleFieldChange("isActive", event.target.checked)
                          }
                          sx={{
                            color: crmPalette.border,
                            "&.Mui-checked": {
                              color: crmPalette.green,
                            },
                          }}
                        />
                      }
                      label={form.isActive ? "Usuário ativo" : "Usuário inativo"}
                      sx={{
                        m: 0,
                        color: crmPalette.text,
                        "& .MuiFormControlLabel-label": {
                          fontSize: 13,
                          fontWeight: 800,
                        },
                      }}
                    />
                  </Paper>
                </Box>

                {formError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>
                    {formError}
                  </Alert>
                ) : null}
              </Stack>
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2,
                gap: 1,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={saving}
                onClick={closeModal}
                sx={{
                  minHeight: 42,
                  borderRadius: "10px",
                  borderColor: crmPalette.border,
                  color: crmPalette.text,
                  fontWeight: 800,
                }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PlusCircle size={16} />
                  )
                }
                sx={{
                  minHeight: 42,
                  borderRadius: "10px",
                  px: 2.5,
                  bgcolor: crmPalette.orange,
                  fontWeight: 800,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "none",
                  },
                }}
              >
                {saving
                  ? "Salvando..."
                  : editingUser
                    ? "Salvar alterações"
                    : "Criar usuário"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      </CrmPageShell>

      <FeedbackToast
        open={!!successMessage}
        title="Sucesso"
        message={successMessage}
        variant="success"
        onClose={() => setSuccessMessage("")}
      />

      <FeedbackToast
        open={!!errorToastMessage}
        title="Atenção"
        message={errorToastMessage}
        variant="warning"
        bottomClassName="bottom-24"
        onClose={() => setErrorToastMessage("")}
      />
    </AppLayout>
  );
}
