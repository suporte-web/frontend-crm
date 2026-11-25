import { Api } from '@/utils/Api';
import type { CreateUserPayload, RoleScreenPermissionsGroup, UpdateUserPayload, UpdateRoleScreenPermissionsPayload, User, UserRole, } from './types';

export const UsersService = {
  getUsers: async (): Promise<User[]> => {
    return (await Api.get<User[]>('/users', { headers: { 'Cache-Control': 'no-cache' } })).data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    return (await Api.post<User>('/users', payload)).data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    return (await Api.patch<User>(`/users/${id}`, payload)).data;
  },

  resetUserPassword: async (id: string): Promise<User> => {
    return (await Api.patch<User>(`/users/${id}/reset-password`)).data;
  },

  deleteUser: async (id: string): Promise<{
    message: string;
  }> => {
    return (await Api.delete<{
      message: string;
    }>(`/users/${id}`)).data;
  },

  getScreenPermissions: async (): Promise<RoleScreenPermissionsGroup[]> => {
    return (await Api.get<RoleScreenPermissionsGroup[]>('/screen-permissions', { headers: { 'Cache-Control': 'no-cache' } })).data;
  },

  updateRoleScreenPermissions: async (role: UserRole, payload: UpdateRoleScreenPermissionsPayload): Promise<RoleScreenPermissionsGroup> => {
    return (await Api.put<RoleScreenPermissionsGroup>(`/screen-permissions/${role}`, payload)).data;
  },
};
