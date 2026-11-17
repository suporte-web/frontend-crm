import { Api } from '@/utils/Api';
import type { CreateUserPayload, RoleScreenPermissionsGroup, UpdateUserPayload, UpdateRoleScreenPermissionsPayload, User, UserRole, } from './types';
export async function getUsers(): Promise<User[]> {
  return (await Api.get<User[]>('/users', { headers: { 'Cache-Control': 'no-cache' } })).data;
}
export async function createUser(payload: CreateUserPayload): Promise<User> {
  return (await Api.post<User>('/users', payload)).data;
}
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return (await Api.patch<User>(`/users/${id}`, payload)).data;
}
export async function resetUserPassword(id: string): Promise<User> {
  return (await Api.patch<User>(`/users/${id}/reset-password`)).data;
}
export async function deleteUser(id: string): Promise<{
  message: string;
}> {
  return (await Api.delete<{
    message: string;
  }>(`/users/${id}`)).data;
}
export async function getScreenPermissions(): Promise<RoleScreenPermissionsGroup[]> {
  return (await Api.get<RoleScreenPermissionsGroup[]>('/screen-permissions', { headers: { 'Cache-Control': 'no-cache' } })).data;
}
export async function updateRoleScreenPermissions(role: UserRole, payload: UpdateRoleScreenPermissionsPayload): Promise<RoleScreenPermissionsGroup> {
  return (await Api.put<RoleScreenPermissionsGroup>(`/screen-permissions/${role}`, payload)).data;
}
