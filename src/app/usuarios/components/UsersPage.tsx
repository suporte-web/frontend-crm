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
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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
  PlusCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
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
  role: UserRole;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  email: "",
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
  "GESTAO": {
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
    minHeight: 50,
    borderRadius: "14px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    fontSize: 16,
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontSize: 14,
    fontWeight: 800,
  },
};

const modalSectionTitleSx = {
  color: crmPalette.text,
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.2,
};

const modalSectionTextSx = {
  mt: 0.75,
  color: crmPalette.muted,
  fontSize: 15,
  lineHeight: 1.5,
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
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  async function handleResetPassword(user: User) {
    if (currentUser?.role !== "ADMIN") {
      setErrorToastMessage("Somente administradores podem redefinir senhas.");
      return;
    }

    const confirmed = window.confirm(
      `Redefinir a senha de "${user.name}" para a senha padrão do sistema?`,
    );

    if (!confirmed) return;

    try {
      const updatedUser = await resetUserPassword(user.id);

      setUsers((prev) =>
        prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
      );

      setSuccessMessage(
        "Senha redefinida. O usuário deverá alterar a senha no próximo acesso.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao redefinir senha.";

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

        {currentUser?.role === "ADMIN" ? (
          <Tooltip title="Redefinir senha">
            <IconButton
              type="button"
              aria-label={`Redefinir senha de ${user.name}`}
              onClick={() => handleResetPassword(user)}
              sx={{
                width: 36,
                height: 36,
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                color: crmPalette.orangeDark,
                bgcolor: "#fff7ed",
                "&:hover": {
                  bgcolor: "#ffedd5",
                },
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

  function renderUserCard(user: User) {
    return (
      <Paper
        key={user.id}
        elevation={0}
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          border: `1px solid ${crmPalette.border}`,
          borderRadius: "12px",
          bgcolor: "#ffffff",
          transition: "border-color 160ms ease, box-shadow 160ms ease",
          "&:hover": {
            borderColor: "#fed7c3",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
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
          <Stack direction="row" spacing={1.75} sx={{ minWidth: 0, flex: 1 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                borderRadius: "999px",
                bgcolor: "#fff0e8",
                color: crmPalette.orange,
                fontSize: 15,
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
                sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}
              >
                <Typography
                  component="h3"
                  sx={{
                    color: "#020617",
                    fontSize: { xs: 16, md: 18 },
                    fontWeight: 900,
                    lineHeight: 1.25,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.name}
                </Typography>

                {renderRoleChip(user.role)}
                {renderStatusChip(user.isActive)}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.75, sm: 2 }}
                sx={{ mt: 1, color: crmPalette.muted }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Mail size={17} />
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 14,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {user.email}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                  <KeyRound size={17} />
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 14,
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
                      border: `1px solid ${checked ? "#fed7c3" : crmPalette.border
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
                Lista de usuários
              </Typography>

              <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 13 }}>
                Visualize e gerencie os usuários cadastrados.
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
              <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.5 } }}>
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
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Mostrando {paginationStart}-{paginationEnd} de{" "}
                  {filteredUsers.length}
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
          onClose={() => {
            if (!saving) {
              closeModal();
            }
          }}
          fullWidth
          maxWidth="md"
          sx={{
            "& .MuiDialog-paper": {
              width: "100%",
              maxWidth: 750,
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.24)",
            },
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle
              component="div"
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2.5,
                bgcolor: "#fff7f2",
                borderBottom: `1px solid ${crmPalette.border}`,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: "#ffe4d6",
                      color: crmPalette.orange,
                    }}
                  >
                    <UserRound size={25} />
                  </Avatar>

                  <Box>
                    <Typography
                      component="h2"
                      sx={{
                        color: crmPalette.text,
                        fontSize: { xs: 22, md: 25 },
                        fontWeight: 900,
                        lineHeight: 1.15,
                      }}
                    >
                      {editingUser ? "Editar usuário" : "Criar novo usuário"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.75,
                        color: "#666666",
                        fontSize: { xs: 14, md: 18 },
                        lineHeight: 1.25,
                      }}
                    >
                      {editingUser
                        ? "Atualize os dados e permissões deste acesso."
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
                    flexShrink: 0,
                    color: "#737373",
                    "&:hover": {
                      bgcolor: "#fff0e8",
                      color: crmPalette.text,
                    },
                  }}
                >
                  <XCircle size={27} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 0,
                bgcolor: "#ffffff",
              }}
            >
              <Stack spacing={0}>
                <Box sx={{ py: 2.5 }}>
                  <Typography sx={modalSectionTitleSx}>
                    Dados pessoais
                  </Typography>

                  <Typography sx={modalSectionTextSx}>
                    Informe o nome e o e-mail do usuário.
                  </Typography>

                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      required
                      label="Nome completo"
                      value={form.name}
                      onChange={(event) =>
                        handleFieldChange("name", event.target.value)
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <UserRound size={19} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={textFieldSx}
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
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Mail size={20} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={textFieldSx}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box sx={{ py: 3 }}>
                  <Typography sx={modalSectionTitleSx}>
                    Permissões de acesso
                  </Typography>

                  <Typography sx={modalSectionTextSx}>
                    Selecione o perfil que será atribuído ao usuário.
                  </Typography>

                  <Stack spacing={2.5} sx={{ mt: 3 }}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Perfil"
                      value={form.role}
                      onChange={(event) =>
                        handleFieldChange("role", event.target.value as UserRole)
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <ShieldCheck size={20} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        ...textFieldSx,
                        "& .MuiOutlinedInput-root": {
                          ...textFieldSx["& .MuiOutlinedInput-root"],
                          "&.Mui-focused fieldset": {
                            borderColor: crmPalette.orange,
                            borderWidth: 2,
                          },
                        },
                      }}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </TextField>

                    {editingUser ? (
                      <Paper
                        elevation={0}
                        sx={{
                          px: 1.5,
                          minHeight: 52,
                          display: "flex",
                          alignItems: "center",
                          border: `1px solid ${crmPalette.border}`,
                          borderRadius: "12px",
                          bgcolor: "#ffffff",
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={form.isActive}
                              onChange={(event) =>
                                handleFieldChange(
                                  "isActive",
                                  event.target.checked,
                                )
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
                              fontSize: 14,
                              fontWeight: 800,
                            },
                          }}
                        />
                      </Paper>
                    ) : null}

                    <Alert
                      severity="info"
                      icon={false}
                      sx={{
                        border: "1px solid #bae6fd",
                        borderRadius: "10px",
                        bgcolor: "#eef8ff",
                        color: "#666666",
                        fontSize: 18,
                        lineHeight: 1.35,
                        "& .MuiAlert-message": {
                          py: 0.25,
                        },
                      }}
                    >
                      {editingUser
                        ? "Use a opção de redefinição de senha na lista de usuários quando precisar gerar uma nova senha padrão."
                        : "O usuário será criado com a senha padrão definida pelo sistema. Ela poderá ser alterada posteriormente pela opção de redefinição de senha."}
                    </Alert>
                  </Stack>

                  {formError ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>
                      {formError}
                    </Alert>
                  ) : null}
                </Box>
              </Stack>
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2,
                gap: 1.5,
                bgcolor: "#fafafa",
              }}
            >
              <Button
                type="button"
                variant="text"
                disabled={saving}
                onClick={closeModal}
                sx={{
                  minWidth: 138,
                  minHeight: 50,
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  color: crmPalette.text,
                  fontSize: 16,
                  fontWeight: 900,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
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
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PlusCircle size={19} />
                  )
                }
                sx={{
                  minWidth: 188,
                  minHeight: 50,
                  borderRadius: "12px",
                  px: 2.5,
                  bgcolor: crmPalette.orange,
                  fontSize: 16,
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: "0 8px 18px rgba(255, 77, 0, 0.26)",
                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "0 10px 22px rgba(255, 77, 0, 0.28)",
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
