import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from './constants';

export const API_BASE_URL = (import.meta.env.VITE_API_BACKEND || import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function messageFrom(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const { message, error } = data as { message?: unknown; error?: unknown };
  if (Array.isArray(message)) return message.filter(item => typeof item === 'string').join(', ') || fallback;
  return typeof message === 'string' ? message : typeof error === 'string' ? error : fallback;
}

// Downloads também podem retornar um erro JSON em vez do arquivo esperado.
async function readErrorData(data: unknown): Promise<unknown> {
  try {
    if (data instanceof Blob) return JSON.parse(await data.text());
    if (data instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(data));
  } catch {
    // Respostas sem JSON usam a mensagem padrão.
  }
  return data;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly response?: { status: number; data: unknown }) {
    super(message);
    this.name = 'ApiError';
  }
}

function isPublicAuthRequest(config?: InternalAxiosRequestConfig) {
  return /\/auth\/(login|forgot-password|reset-password)(?:\?|$)/.test(config?.url || '');
}

function expireSession(status: number, config?: InternalAxiosRequestConfig) {
  if (status !== 401 || isPublicAuthRequest(config) || typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

/** Único cliente HTTP da aplicação. Serviços de domínio ficam em stores/<dominio>/service.ts. */
export function createApi(baseURL = API_BASE_URL) {
  const api = axios.create({ baseURL });
  api.interceptors.request.use(config => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
    if (token && !isPublicAuthRequest(config) && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });
  api.interceptors.response.use(
    response => {
      expireSession(response.status, response.config);
      return response;
    },
    async (error: AxiosError) => {
      if (axios.isCancel(error)) throw error;
      if (error.response) expireSession(error.response.status, error.config);
      const data = await readErrorData(error.response?.data);
      throw new ApiError(
        messageFrom(data, 'Erro ao comunicar com a API.'),
        error.response?.status,
        error.response && { status: error.response.status, data },
      );
    },
  );
  return api;
}

export const Api = createApi();
