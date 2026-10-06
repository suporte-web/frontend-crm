"use client";

import { useEffect, useMemo, useState } from "react";

import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import { getUserRoles, hasAnyRole } from "@/lib/user-roles";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
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
  Mail,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
  X,
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
  resetUserPassword,
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
  "LIDER_ATENDIMENTO",
  "ATENDIMENTO",
  "ADMIN",
  "GESTAO",
  "COMERCIAL",
  "OPERACAO",
  "MARKETING",
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type StatusFilter = "TODOS" | "ATIVO" | "INATIVO";

type FormState = {
  name: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
};

type ConfirmAction =
  | {
      type: "delete" | "reset-password";
      user: User;
    }
  | null;

const initialFormState: FormState = {
  name: "",
  email: "",
  roles: ["COMERCIAL"],
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
  LIDER_ATENDIMENTO: { label: 'Líder de Atendimento', accent: '#0369a1', softColor: '#e0f2fe', chipSx: { bgcolor: '#e0f2fe', color: '#0369a1' } },
  ATENDIMENTO: { label: 'Atendimento', accent: '#0f766e', softColor: '#f0fdfa', chipSx: { bgcolor: '#f0fdfa', color: '#0f766e' } },
  ADMIN: {
    label: "Admin",
    accent: "#7c3aed",
    softColor: "#f5f3ff",
    chipSx: {
      bgcolor: "#f5f3ff",
      color: "#6d28d9",
      borderColor: "#ddd6fe",
    },
  },
  GESTAO: {
    label: "Gestão",
    accent: crmPalette.blue,
    softColor: "#eff6ff",
    chipSx: {
      bgcolor: "#eff6ff",
      color: "#1d4ed8",
      borderColor: "#bfdbfe",
    },
  },
  COMERCIAL: {
    label: "Comercial",
    accent: crmPalette.orange,
    softColor: "#fff7ed",
    chipSx: {
      bgcolor: "#fff7ed",
      color: crmPalette.orangeDark,
      borderColor: "#fed7aa",
    },
  },
  OPERACAO: {
    label: "Operação",
    accent: "#0f766e",
    softColor: "#f0fdfa",
    chipSx: {
      bgcolor: "#f0fdfa",
      color: "#0f766e",
      borderColor: "#99f6e4",
    },
  },
  MARKETING: {
    label: "Marketing",
    accent: "#db2777",
    softColor: "#fdf2f8",
    chipSx: {
      bgcolor: "#fdf2f8",
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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    borderRadius: "12px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    fontSize: 14,
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontSize: 14,
    fontWeight: 700,
  },
};

const filterFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
    borderRadius: "12px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 700,
  },
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getRoleLabel(role: UserRole) {
  return roleMeta[role]?.label ?? String(role);
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
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"TODOS" | UserRole>("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPermissionRole, setSelectedPermissionRole] =
    useState<UserRole>("ADMIN");

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToastMessage, setErrorToastMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
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

    const timer = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorToastMessage) return;

    const timer = setTimeout(() => setErrorToastMessage(""), 6000);
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
    const normalizedSearch = search.trim().toLowerCase();

    return companyUsers.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesRole =
        roleFilter === "TODOS" ? true : hasAnyRole(user, [roleFilter]);

      const matchesStatus =
        statusFilter === "TODOS"
          ? true
          : statusFilter === "ATIVO"
            ? user.isActive
            : !user.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [companyUsers, roleFilter, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage),
  );

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const paginationStart =
    filteredUsers.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const paginationEnd = Math.min(page * rowsPerPage, filteredUsers.length);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const summary = useMemo(() => {
    const total = companyUsers.length;
    const active = companyUsers.filter((user) => user.isActive).length;
    const inactive = companyUsers.filter((user) => !user.isActive).length;
    const operations = companyUsers.filter(
      (user) => hasAnyRole(user, ["OPERACAO"]),
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

  function isPermissionItemChecked(
    permissionItem: (typeof profilePermissionItems)[number],
  ) {
    const permission = selectedRolePermissions.get(permissionItem.key);

    return permission
      ? permission.isEnabled
      : permissionItem.roles.includes(selectedPermissionRole);
  }

  const selectedEnabledCount = useMemo(
    () =>
      profilePermissionItems.filter((permissionItem) =>
        isPermissionItemChecked(permissionItem),
      ).length,
    [selectedRolePermissions, selectedPermissionRole],
  );

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

  function handleFieldChange<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      roles: getUserRoles(user),
      isActive: user.isActive,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingUser(null);
    setForm(initialFormState);
    setFormError("");
  }

  function validateForm() {
    if (!form.roles.length) return "Selecione pelo menos um perfil.";
    if (!form.name.trim()) return "Informe o nome do usuário.";
    if (!form.email.trim()) return "Informe o email do usuário.";
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
          roles: form.roles,
          isActive: form.isActive,
        };

        const updatedUser = await updateUser(editingUser.id, payload);

        setUsers((prev) =>
          prev.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          ),
        );

        if (updatedUser.id === currentUser?.id) await refreshUser();
        setSuccessMessage("Usuário atualizado com sucesso.");
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          roles: form.roles,
          isActive: form.isActive,
        };

        const createdUser = await createUser(payload);
        setUsers((prev) => [createdUser, ...prev]);
        setSuccessMessage("Usuário criado com sucesso.");
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setForm(initialFormState);
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

  async function handleToggleStatus(user: User) {
    try {
      const updatedUser = await updateUser(user.id, {
        isActive: !user.isActive,
      });

      setUsers((prev) =>
        prev.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
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

  function openDeleteDialog(user: User) {
    setConfirmAction({ type: "delete", user });
  }

  function openResetPasswordDialog(user: User) {
    if (!hasAnyRole(currentUser, ["ADMIN"])) {
      setErrorToastMessage("Somente administradores podem redefinir senhas.");
      return;
    }

    setConfirmAction({ type: "reset-password", user });
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;

    try {
      setConfirmLoading(true);

      if (confirmAction.type === "delete") {
        await deleteUser(confirmAction.user.id);
        setUsers((prev) =>
          prev.filter((item) => item.id !== confirmAction.user.id),
        );
        setSuccessMessage("Usuário excluído com sucesso.");
      } else {
        const updatedUser = await resetUserPassword(confirmAction.user.id);

        setUsers((prev) =>
          prev.map((item) =>
            item.id === updatedUser.id ? updatedUser : item,
          ),
        );

        setSuccessMessage(
          "Senha redefinida. O usuário deverá alterar a senha no próximo acesso.",
        );
      }

      setConfirmAction(null);
    } catch (error) {
      const fallback =
        confirmAction.type === "delete"
          ? "Erro ao excluir usuário"
          : "Erro ao redefinir senha";
      const message = error instanceof Error ? error.message : fallback;
      setErrorToastMessage(message);
    } finally {
      setConfirmLoading(false);
    }
  }

  function renderStatusChip(isActive: boolean) {
    return (
      <Chip
        icon={
          isActive ? <CheckCircle2 size={14} /> : <CircleOff size={14} />
        }
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
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    );
  }

  function renderRoleChip(role: UserRole) {
    const meta = roleMeta[role];

    return (
      <Chip
        label={meta?.label ?? String(role)}
        size="small"
        variant="outlined"
        sx={{
          height: 28,
          borderRadius: "8px",
          fontSize: 12,
          fontWeight: 900,
          ...(meta?.chipSx ?? {}),
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
              width: 38,
              height: 38,
              border: `1px solid ${crmPalette.border}`,
              borderRadius: "10px",
              color: crmPalette.text,
              bgcolor: "#ffffff",
              "&:hover": { bgcolor: "#f8fafc" },
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
              width: 38,
              height: 38,
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              color: crmPalette.blue,
              bgcolor: "#eff6ff",
              "&:hover": { bgcolor: "#dbeafe" },
            }}
          >
            {user.isActive ? <CircleOff size={16} /> : <BadgeCheck size={16} />}
          </IconButton>
        </Tooltip>

        {hasAnyRole(currentUser, ["ADMIN"]) ? (
          <Tooltip title="Redefinir senha">
            <IconButton
              type="button"
              aria-label={`Redefinir senha de ${user.name}`}
              onClick={() => openResetPasswordDialog(user)}
              sx={{
                width: 38,
                height: 38,
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                color: crmPalette.orangeDark,
                bgcolor: "#fff7ed",
                "&:hover": { bgcolor: "#ffedd5" },
              }}
            >
              <KeyRound size={16} />
            </IconButton>
          </Tooltip>
        ) : null}

        <Tooltip title="Excluir usuário">
          <IconButton
            type="button"
            aria-label={`Excluir ${user.name}`}
            onClick={() => openDeleteDialog(user)}
            sx={{
              width: 38,
              height: 38,
              border: "1px solid #fecaca",
              borderRadius: "10px",
              color: "#b91c1c",
              bgcolor: "#fef2f2",
              "&:hover": { bgcolor: "#fee2e2" },
            }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  function renderUserCard(user: User) {
    return (
      <Paper
        key={user.id}
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.25 },
          border: `1px solid ${crmPalette.border}`,
          borderRadius: "14px",
          bgcolor: "#ffffff",
          transition: "border-color 160ms ease, box-shadow 160ms ease",
          "&:hover": {
            borderColor: "#fed7c3",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1.75}
            sx={{ minWidth: 0, flex: 1, alignItems: "center" }}
          >
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: "#fff0e8",
                color: crmPalette.orangeDark,
                fontSize: 14,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {getInitials(user.name)}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography
                  component="h3"
                  sx={{
                    color: crmPalette.text,
                    fontSize: { xs: 15, md: 16 },
                    fontWeight: 900,
                    lineHeight: 1.25,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.name}
                </Typography>

                {getUserRoles(user).map((role) => <Box key={role}>{renderRoleChip(role)}</Box>)}
                {renderStatusChip(user.isActive)}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.6, sm: 2 }}
                sx={{ mt: 1, color: crmPalette.muted }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <Mail size={16} />
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 13,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {user.email}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <KeyRound size={16} />
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 13,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {user.email.split("@")[0]}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ flexShrink: 0 }}>{renderUserActions(user)}</Box>
        </Stack>
      </Paper>
    );
  }

  const confirmIsDelete = confirmAction?.type === "delete";

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Administração"
          title="Gestão de usuários"
          description="Controle usuários, perfis, status de acesso e permissões do portal."
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
                  px: 2,
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                Atualizar
              </Button>

              <Button
                variant="contained"
                startIcon={<Plus size={17} />}
                onClick={openCreateModal}
                sx={{
                  minHeight: 44,
                  borderRadius: "10px",
                  px: 2.25,
                  bgcolor: crmPalette.orange,
                  textTransform: "none",
                  fontWeight: 900,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "none",
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
          }}
        >
          <CrmKpiCard
            title="Total de usuários"
            value={summary.total}
            icon={<UsersRound size={22} />}
            accent={crmPalette.blue}
            softColor="#eff6ff"
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
                sx={{ color: crmPalette.text, fontSize: 16, fontWeight: 800 }}
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
                  {selectedEnabledCount}/{profilePermissionItems.length} telas habilitadas
                </Typography>
                {savingPermissions ? (
                  <Stack direction="row" spacing={0.5} role="status" sx={{ alignItems: "center" }}>
                    <CircularProgress size={12} />
                    <Typography sx={{ color: crmPalette.muted, fontSize: 11 }}>
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
              const isProtected = isProtectedAdminPermission(permissionItem.key);

              return (
                <Paper
                  key={permissionItem.key}
                  elevation={0}
                  component="label"
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    display: "flex",
                    gap: 0.75,
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 48,
                    border: `1px solid ${crmPalette.border}`,
                    borderRadius: "8px",
                    bgcolor: checked ? "#fffaf7" : "#ffffff",
                    cursor: isProtected || savingPermissions ? "not-allowed" : "pointer",
                    transition: "border-color 160ms ease, background-color 160ms ease",
                    "&:hover": {
                      borderColor: isProtected || savingPermissions ? crmPalette.border : "#cbd5e1",
                    },
                    "&:focus-within": {
                      outline: `2px solid ${crmPalette.orange}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ color: crmPalette.text, fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {permissionItem.label}
                    </Typography>
                    {isProtected ? (
                      <Typography sx={{ mt: 0.25, color: crmPalette.muted, fontSize: 10.5 }}>
                        Obrigatória para Admin
                      </Typography>
                    ) : null}
                  </Box>

                  <Switch
                    size="small"
                    checked={checked}
                    disabled={isProtected || savingPermissions}
                    onChange={() => handleTogglePermissionItem(permissionItem.key)}
                    slotProps={{
                      input: {
                        "aria-label": `${permissionItem.label} — perfil ${getRoleLabel(selectedPermissionRole)}`,
                      },
                    }}
                    sx={{
                      flexShrink: 0,
                      mr: -0.5,
                      "& .MuiSwitch-switchBase.Mui-checked": { color: crmPalette.orange },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: crmPalette.orange },
                    }}
                  />
                </Paper>
              );
            })}
          </Box>
        </CrmSection>

        <CrmSection sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography
                component="h2"
                sx={{ color: crmPalette.text, fontSize: 18, fontWeight: 900 }}
              >
                Filtros
              </Typography>
              <Typography sx={{ mt: 0.35, color: crmPalette.muted, fontSize: 13 }}>
                Encontre usuários por nome, e-mail, perfil ou status.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.4fr) minmax(180px, .75fr) minmax(180px, .75fr)",
                },
                gap: 1.5,
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
          </Stack>
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
                sx={{ color: crmPalette.text, fontSize: 18, fontWeight: 900 }}
              >
                Usuários cadastrados
              </Typography>
              <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 13 }}>
                Visualize e gerencie os acessos da equipe.
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
              <UsersRound size={30} />
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                Nenhum usuário encontrado com os filtros aplicados.
              </Typography>
            </Stack>
          ) : (
            <>
              <Stack spacing={1.25} sx={{ p: { xs: 2, md: 2.5 } }}>
                {paginatedUsers.map((user) => renderUserCard(user))}
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{
                  px: { xs: 2, md: 2.5 },
                  py: 1.5,
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  borderTop: `1px solid ${crmPalette.border}`,
                  bgcolor: "#ffffff",
                }}
              >
                <Typography
                  sx={{ color: crmPalette.muted, fontSize: 13, fontWeight: 700 }}
                >
                  Mostrando {paginationStart}-{paginationEnd} de {filteredUsers.length}
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  sx={{ alignItems: { xs: "stretch", sm: "center" } }}
                >
                  <TextField
                    select
                    size="small"
                    label="Por página"
                    value={rowsPerPage}
                    onChange={(event) =>
                      setRowsPerPage(Number(event.target.value))
                    }
                    sx={{
                      minWidth: 132,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        fontSize: 13,
                        fontWeight: 800,
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: 12,
                        fontWeight: 800,
                      },
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={(_, nextPage) => setPage(nextPage)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Stack>
              </Stack>
            </>
          )}
        </CrmSection>

        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          fullWidth
          maxWidth="md"
          slotProps={{
            paper: {
              sx: {
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.20)",
              },
            },
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle
              component="div"
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2.25,
                bgcolor: "#ffffff",
                borderBottom: `1px solid ${crmPalette.border}`,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: "#fff0e8",
                      color: crmPalette.orange,
                    }}
                  >
                    <UserRound size={22} />
                  </Avatar>

                  <Box>
                    <Typography
                      component="h2"
                      sx={{
                        color: crmPalette.text,
                        fontSize: { xs: 19, md: 21 },
                        fontWeight: 900,
                        lineHeight: 1.2,
                      }}
                    >
                      {editingUser ? "Editar usuário" : "Novo usuário"}
                    </Typography>

                    <Typography
                      sx={{ mt: 0.35, color: crmPalette.muted, fontSize: 13 }}
                    >
                      {editingUser
                        ? "Atualize os dados e as configurações deste acesso."
                        : "Preencha os dados para cadastrar um novo acesso."}
                    </Typography>
                  </Box>
                </Stack>

                <IconButton
                  type="button"
                  aria-label="Fechar formulário"
                  disabled={saving}
                  onClick={closeModal}
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: "#f8fafc",
                    color: crmPalette.muted,
                    "&:hover": { bgcolor: "#f1f5f9" },
                  }}
                >
                  <X size={19} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "#f8fafc" }}>
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    border: `1px solid ${crmPalette.border}`,
                    borderRadius: "14px",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        sx={{ color: crmPalette.text, fontSize: 15, fontWeight: 900 }}
                      >
                        Dados do usuário
                      </Typography>
                      <Typography
                        sx={{ mt: 0.35, color: crmPalette.muted, fontSize: 12.5 }}
                      >
                        Informe nome e e-mail corporativo.
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      required
                      label="Nome completo"
                      value={form.name}
                      onChange={(event) =>
                        handleFieldChange("name", event.target.value)
                      }
                      slotProps={{
                        select: {
                          multiple: true,
                          renderValue: (value) => (
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                              {(value as UserRole[]).map((role) => <Chip key={role} label={getRoleLabel(role)} size="small" />)}
                            </Stack>
                          ),
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <UserRound size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={fieldSx}
                    />

                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="E-mail"
                      value={form.email}
                      onChange={(event) =>
                        handleFieldChange("email", event.target.value)
                      }
                      slotProps={{
                        select: {
                          multiple: true,
                          renderValue: (value) => (
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                              {(value as UserRole[]).map((role) => <Chip key={role} label={getRoleLabel(role)} size="small" />)}
                            </Stack>
                          ),
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Mail size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={fieldSx}
                    />
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    border: `1px solid ${crmPalette.border}`,
                    borderRadius: "14px",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        sx={{ color: crmPalette.text, fontSize: 15, fontWeight: 900 }}
                      >
                        Acesso e perfis
                      </Typography>
                      <Typography
                        sx={{ mt: 0.35, color: crmPalette.muted, fontSize: 12.5 }}
                      >
                        Selecione um ou mais perfis. Os acessos dos perfis serão combinados.
                      </Typography>
                    </Box>

                    <TextField
                      select
                      fullWidth
                      required
                      label="Perfis"
                      value={form.roles}
                      onChange={(event) =>
                        handleFieldChange("roles", typeof event.target.value === "string" ? event.target.value.split(",") as UserRole[] : event.target.value as unknown as UserRole[])
                      }
                      slotProps={{
                        select: {
                          multiple: true,
                          renderValue: (value) => (
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                              {(value as UserRole[]).map((role) => <Chip key={role} label={getRoleLabel(role)} size="small" />)}
                            </Stack>
                          ),
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <ShieldCheck size={18} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={fieldSx}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          <Checkbox checked={form.roles.includes(role)} />
                          <ListItemText primary={getRoleLabel(role)} />
                        </MenuItem>
                      ))}
                    </TextField>

                    {editingUser ? (
                      <Paper
                        elevation={0}
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          border: `1px solid ${crmPalette.border}`,
                          borderRadius: "12px",
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.isActive}
                              onChange={(event) =>
                                handleFieldChange("isActive", event.target.checked)
                              }
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: crmPalette.green,
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  bgcolor: crmPalette.green,
                                },
                              }}
                            />
                          }
                          label={form.isActive ? "Usuário ativo" : "Usuário inativo"}
                          sx={{
                            m: 0,
                            color: crmPalette.text,
                            "& .MuiFormControlLabel-label": {
                              fontSize: 14,
                              fontWeight: 800,
                            },
                          }}
                        />
                      </Paper>
                    ) : null}

                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: "10px",
                        fontSize: 13,
                        alignItems: "center",
                      }}
                    >
                      {editingUser
                        ? "Para gerar uma nova senha padrão, use a ação Redefinir senha na lista de usuários."
                        : "O usuário será criado com a senha padrão definida pelo sistema."}
                    </Alert>
                  </Stack>
                </Paper>

                {formError ? (
                  <Alert severity="error" sx={{ borderRadius: "10px" }}>
                    {formError}
                  </Alert>
                ) : null}
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2,
                gap: 1,
                bgcolor: "#ffffff",
                borderTop: `1px solid ${crmPalette.border}`,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={saving}
                onClick={closeModal}
                sx={{
                  minWidth: 110,
                  minHeight: 44,
                  borderRadius: "10px",
                  textTransform: "none",
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
                    <CircularProgress size={17} color="inherit" />
                  ) : editingUser ? (
                    <Pencil size={16} />
                  ) : (
                    <Plus size={17} />
                  )
                }
                sx={{
                  minWidth: 155,
                  minHeight: 44,
                  borderRadius: "10px",
                  px: 2.5,
                  bgcolor: crmPalette.orange,
                  textTransform: "none",
                  fontWeight: 900,
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

        <Dialog
          open={Boolean(confirmAction)}
          onClose={() => {
            if (!confirmLoading) setConfirmAction(null);
          }}
          fullWidth
          maxWidth="xs"
          slotProps={{
            paper: {
              sx: {
                borderRadius: "16px",
                overflow: "hidden",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              px: 3,
              pt: 3,
              pb: 1,
              color: crmPalette.text,
              fontSize: 19,
              fontWeight: 900,
            }}
          >
            {confirmIsDelete ? "Excluir usuário?" : "Redefinir senha?"}
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: 1 }}>
            <Typography sx={{ color: crmPalette.muted, fontSize: 14, lineHeight: 1.6 }}>
              {confirmIsDelete ? (
                <>
                  Você está prestes a excluir <strong>{confirmAction?.user.name}</strong>.
                  Essa ação removerá o acesso deste usuário.
                </>
              ) : (
                <>
                  A senha de <strong>{confirmAction?.user.name}</strong> será redefinida
                  para a senha padrão do sistema.
                </>
              )}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
            <Button
              variant="outlined"
              disabled={confirmLoading}
              onClick={() => setConfirmAction(null)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              color={confirmIsDelete ? "error" : "primary"}
              disabled={confirmLoading}
              onClick={handleConfirmAction}
              startIcon={
                confirmLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : confirmIsDelete ? (
                  <Trash2 size={16} />
                ) : (
                  <KeyRound size={16} />
                )
              }
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                boxShadow: "none",
                ...(confirmIsDelete
                  ? {}
                  : {
                      bgcolor: crmPalette.orange,
                      "&:hover": { bgcolor: crmPalette.orangeDark },
                    }),
              }}
            >
              {confirmLoading
                ? "Processando..."
                : confirmIsDelete
                  ? "Excluir"
                  : "Redefinir senha"}
            </Button>
          </DialogActions>
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
