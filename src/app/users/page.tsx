'use client';
import { AppLayout } from '@/components/layout/app-layout';
import { useEffect, useMemo, useState } from 'react';
import {
  createUser,
  deleteUser,
  getScreenPermissions,
  getUsers,
  updateRoleScreenPermissions,
  updateUser,
} from '../../services/users.service';
import type {
  CreateUserPayload,
  RoleScreenPermissionsGroup,
  UpdateUserPayload,
  User,
  UserRole,
} from '../../types/user';
import { appScreens } from '@/config/screens';
import { useAuth } from '@/context/auth-context';

const roles: UserRole[] = [
  'ADMIN',
  'GESTAO',
  'COMERCIAL',
  'MARKETING',
  'CLIENTE',
];

type StatusFilter = 'TODOS' | 'ATIVO' | 'INATIVO';

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  document: string;
  phone: string;
  companyName: string;
};

const initialFormState: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'CLIENTE',
  isActive: true,
  document: '',
  phone: '',
  companyName: '',
};

export default function UsersPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [screenPermissions, setScreenPermissions] = useState<
    RoleScreenPermissionsGroup[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'TODOS' | UserRole>('TODOS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [selectedPermissionRole, setSelectedPermissionRole] =
    useState<UserRole>('ADMIN');

  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorToastMessage, setErrorToastMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState<FormState>(initialFormState);

  async function loadUsers() {
    try {
      setLoading(true);
      setPageError('');
      const [usersData, permissionsData] = await Promise.all([
        getUsers(),
        getScreenPermissions(),
      ]);
      setUsers(usersData);
      setScreenPermissions(permissionsData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar usuários';
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
      setSuccessMessage('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorToastMessage) return;

    const timer = setTimeout(() => {
      setErrorToastMessage('');
    }, 6000);

    return () => clearTimeout(timer);
  }, [errorToastMessage]);

  function getFriendlyErrorMessage(message: string) {
    if (message.includes('email must be an email')) {
      return 'Digite um email válido, por exemplo: nome@empresa.com';
    }

    if (message.includes('Email already in use')) {
      return 'Este email já está sendo usado por outro usuário.';
    }

    if (message.includes('property isActive should not exist')) {
      return 'O campo de status não foi aceito pela API. Verifique o backend.';
    }

    if (message.includes('A senha deve ter pelo menos')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    return message;
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.clientProfile?.companyName || '')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesRole =
        roleFilter === 'TODOS' ? true : user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'TODOS'
          ? true
          : statusFilter === 'ATIVO'
            ? user.isActive
            : !user.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const inactive = users.filter((user) => !user.isActive).length;
    const clients = users.filter((user) => user.role === 'CLIENTE').length;

    return { total, active, inactive, clients };
  }, [users]);

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

  function isScreenChecked(screen: (typeof appScreens)[number]) {
    const permission = selectedRolePermissions.get(screen.key);

    return permission
      ? permission.isEnabled
      : screen.roles.includes(selectedPermissionRole);
  }

  async function handleToggleScreenPermission(screenKey: string) {
    const screen = appScreens.find((item) => item.key === screenKey);

    if (!screen) return;

    const nextPermissions = appScreens.map((item) => {
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
      setErrorToastMessage('');

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

      setSuccessMessage('Permissões de telas atualizadas com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar permissões de telas';

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
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
      document: user.clientProfile?.document ?? '',
      phone: user.clientProfile?.phone ?? '',
      companyName: user.clientProfile?.companyName ?? '',
    });
    setFormError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(initialFormState);
    setFormError('');
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Informe o nome do usuário.';
    }

    if (!form.email.trim()) {
      return 'Informe o email do usuário.';
    }

    if (!editingUser && form.password.trim().length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    return '';
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
      setFormError('');
      setErrorToastMessage('');

      if (editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
          document:
            form.role === 'CLIENTE'
              ? form.document.trim() || undefined
              : undefined,
          phone:
            form.role === 'CLIENTE'
              ? form.phone.trim() || undefined
              : undefined,
          companyName:
            form.role === 'CLIENTE'
              ? form.companyName.trim() || undefined
              : undefined,
        };

        const updatedUser = await updateUser(editingUser.id, payload);

        setUsers((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
        );

        setSuccessMessage('Usuário atualizado com sucesso.');
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
          isActive: form.isActive,
          document:
            form.role === 'CLIENTE'
              ? form.document.trim() || undefined
              : undefined,
          phone:
            form.role === 'CLIENTE'
              ? form.phone.trim() || undefined
              : undefined,
          companyName:
            form.role === 'CLIENTE'
              ? form.companyName.trim() || undefined
              : undefined,
        };

        const createdUser = await createUser(payload);

        setUsers((prev) => [createdUser, ...prev]);

        setSuccessMessage('Usuário criado com sucesso.');
      }

      closeModal();
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Erro ao salvar usuário';

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
      setSuccessMessage('Usuário excluído com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao excluir usuário';

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
          ? 'Usuário ativado com sucesso.'
          : 'Usuário inativado com sucesso.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao alterar status';

      setErrorToastMessage(message);
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  function getRoleLabel(role: UserRole) {
    const labels: Record<UserRole, string> = {
      ADMIN: 'Admin',
      GESTAO: 'Gestão',
      COMERCIAL: 'Comercial',
      MARKETING: 'Marketing',
      CLIENTE: 'Cliente',
    };

    return labels[role];
  }

  function getRoleBadgeClass(role: UserRole) {
    const classes: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100 text-violet-700',
      GESTAO: 'bg-sky-100 text-sky-700',
      COMERCIAL: 'bg-amber-100 text-amber-700',
      MARKETING: 'bg-pink-100 text-pink-700',
      CLIENTE: 'bg-emerald-100 text-emerald-700',
    };

    return classes[role];
  }

  function getInitials(name: string) {
    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_.7fr] lg:p-8">
              <div>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Admin
                </span>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Gestão de usuários
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Gerencie acessos, permissões e status dos usuários em uma tela
                  mais organizada, moderna e fácil de operar.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Novo usuário
                  </button>

                  <button
                    onClick={loadUsers}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Atualizar lista
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Visão rápida
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Usuários ativos
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                      {summary.active}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Usuários inativos
                    </p>
                    <p className="mt-2 text-2xl font-bold text-rose-600">
                      {summary.inactive}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total de usuários</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {summary.total}
                  </h2>
                </div>
                <div className="rounded-2xl bg-blue-50 px-3 py-2 text-blue-600">
                  👥
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Ativos</p>
                  <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                    {summary.active}
                  </h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-600">
                  ✔
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Inativos</p>
                  <h2 className="mt-2 text-3xl font-bold text-rose-600">
                    {summary.inactive}
                  </h2>
                </div>
                <div className="rounded-2xl bg-rose-50 px-3 py-2 text-rose-600">
                  !
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Clientes</p>
                  <h2 className="mt-2 text-3xl font-bold text-sky-600">
                    {summary.clients}
                  </h2>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2 text-sky-600">
                  🏢
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Telas por perfil
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Marque as telas liberadas para cada perfil do portal.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedPermissionRole(role)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                      selectedPermissionRole === role
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {getRoleLabel(role)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {appScreens.map((screen) => {
                const checked = isScreenChecked(screen);
                const allowedByBaseRole = screen.roles.includes(
                  selectedPermissionRole,
                );

                return (
                  <label
                    key={screen.key}
                    className={`flex min-h-[72px] cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    } ${savingPermissions ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {screen.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {allowedByBaseRole
                          ? 'Disponivel para o perfil'
                          : 'Fora do perfil padrao'}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleScreenPermission(screen.key)}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_.8fr_.8fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Buscar usuário
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nome, email ou empresa"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Perfil
                </label>
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as 'TODOS' | UserRole)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  <option value="TODOS">Todos os perfis</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                >
                  <option value="TODOS">Todos os status</option>
                  <option value="ATIVO">Ativos</option>
                  <option value="INATIVO">Inativos</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Usuários cadastrados
                  </h2>
                  <p className="text-sm text-slate-500">
                    Visualize, edite e acompanhe o status dos usuários do
                    sistema.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {filteredUsers.length} resultado(s)
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Carregando usuários...
              </div>
            ) : pageError ? (
              <div className="p-10 text-center text-sm text-red-600">
                {pageError}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Nenhum usuário encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-5 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[1.6fr_.8fr_.9fr_.8fr_.9fr_1fr] md:px-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                        {getInitials(user.name)}
                      </div>

                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center md:items-start">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                          user.role,
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-700 md:hidden">
                        Empresa
                      </p>
                      <p>{user.clientProfile?.companyName || '-'}</p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700 md:hidden">
                        Status
                      </p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-700 md:hidden">
                        Criado em
                      </p>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        {user.isActive ? 'Inativar' : 'Ativar'}
                      </button>

                      <button
                        onClick={() => handleDelete(user)}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingUser ? 'Editar usuário' : 'Cadastrar novo usuário'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingUser
                    ? 'Atualize os dados e permissões do usuário selecionado.'
                    : 'Preencha os dados abaixo para cadastrar um novo usuário no sistema.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-7">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        handleFieldChange('name', event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleFieldChange('email', event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                      placeholder="Digite o email"
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Senha
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          handleFieldChange('password', event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Perfil
                    </label>
                    <select
                      value={form.role}
                      onChange={(event) =>
                        handleFieldChange(
                          'role',
                          event.target.value as UserRole,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>
                    <select
                      value={form.isActive ? 'true' : 'false'}
                      onChange={(event) =>
                        handleFieldChange(
                          'isActive',
                          event.target.value === 'true',
                        )
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                </div>

                {form.role === 'CLIENTE' && (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Dados do cliente
                      </h3>
                      <p className="text-sm text-slate-500">
                        Esses campos são exibidos quando o perfil é do tipo
                        cliente.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Documento
                        </label>
                        <input
                          type="text"
                          value={form.document}
                          onChange={(event) =>
                            handleFieldChange('document', event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                          placeholder="CPF ou CNPJ"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(event) =>
                            handleFieldChange('phone', event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                          placeholder="Telefone"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(event) =>
                            handleFieldChange('companyName', event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? 'Salvando...'
                      : editingUser
                        ? 'Salvar alterações'
                        : 'Criar usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 animate-[fadeInUp_.25s_ease-out]">
            <div className="flex min-w-[340px] max-w-[92vw] items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-600 px-5 py-4 text-white shadow-2xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                ✓
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">Sucesso</p>
                <p className="text-sm text-white/90">{successMessage}</p>
              </div>

              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {errorToastMessage && (
          <div className="fixed bottom-24 left-1/2 z-[9999] -translate-x-1/2 animate-[fadeInUp_.25s_ease-out]">
            <div className="flex min-w-[340px] max-w-[92vw] items-center gap-3 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-4 text-white shadow-2xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                !
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">Atenção</p>
                <p className="text-sm text-white/90">{errorToastMessage}</p>
              </div>

              <button
                type="button"
                onClick={() => setErrorToastMessage('')}
                className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
