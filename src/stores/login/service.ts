import { UsersService } from '@/stores/users/service';
import { Api } from '@/utils/Api';
import type { AuthUser, LoginResponse } from '@/types/auth';

export const LoginService = {
  getUsers: UsersService.getUsers,

  createUser: UsersService.createUser,

  updateUser: UsersService.updateUser,

  deleteUser: UsersService.deleteUser,

  requestCurrentUser: async (): Promise<AuthUser> => {
    const { data } = await Api.get<AuthUser>('/auth/me');
    return data;
  },

  requestLogin: async (email: string, password: string): Promise<LoginResponse> => {
    return LoginService.login(email, password);
  },

  requestChangePassword: async (currentPassword: string, newPassword: string): Promise<{
    user: AuthUser;
    message?: string;
  }> => {
    const { data } = await Api.post<{
      user: AuthUser;
      message?: string;
    }>('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  auth: async (): Promise<AuthUser> => {
    return (await Api.get<AuthUser>('/auth/me')).data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    return (await Api.post<LoginResponse>('/auth/login', { email, password })).data;
  },

  forgotPassword: async (email: string): Promise<{
    message: string;
  }> => {
    const { data } = await Api.post<{
      message: string;
    }>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (payload: {
    token: string;
    newPassword: string;
  }): Promise<{
    message: string;
  }> => {
    const { data } = await Api.post<{
      message: string;
    }>('/auth/reset-password', payload);
    return data;
  },
};
