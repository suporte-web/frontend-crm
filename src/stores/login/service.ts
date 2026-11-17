import { Api } from '@/utils/Api';
// Compatibilidade dos imports antigos; operações de usuários pertencem ao store users.
export { getUsers, createUser, updateUser, deleteUser } from '@/stores/users/service';
import type { AuthUser, LoginResponse } from '@/types/auth';
export async function requestCurrentUser(token: string): Promise<AuthUser> {
  const { data } = await Api.get<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function requestLogin(email: string, password: string): Promise<LoginResponse> {
  return login(email, password);
}
export async function requestChangePassword(currentPassword: string, newPassword: string, token: string): Promise<{
  user: AuthUser;
  message?: string;
}> {
  const { data } = await Api.post<{
    user: AuthUser;
    message?: string;
  }>('/auth/change-password', { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function auth(): Promise<AuthUser> {
  return (await Api.get<AuthUser>('/auth/me')).data;
}
export async function login(email: string, password: string): Promise<LoginResponse> {
  return (await Api.post<LoginResponse>('/auth/login', { email, password })).data;
}
export async function forgotPassword(email: string): Promise<{
  message: string;
}> {
  const { data } = await Api.post<{
    message: string;
  }>('/auth/forgot-password', { email });
  return data;
}
export async function resetPassword(payload: {
  token: string;
  newPassword: string;
}): Promise<{
  message: string;
}> {
  const { data } = await Api.post<{
    message: string;
  }>('/auth/reset-password', payload);
  return data;
}
