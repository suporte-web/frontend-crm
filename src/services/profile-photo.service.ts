import { API_BASE_URL } from './api';

async function photoRequest(token: string, options: RequestInit) {
  const response = await fetch(`${API_BASE_URL}/auth/profile-photo`, {
    ...options, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!response.ok && !(options.method === 'GET' && response.status === 404)) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Não foi possível atualizar sua foto. Tente novamente.');
  }
  return response;
}
export async function getProfilePhoto(token: string, signal?: AbortSignal) {
  const response = await photoRequest(token, { method: 'GET', signal });
  if (response.status === 404) return null;
  if (!response.headers.get('Content-Type')?.startsWith('image/jpeg')) throw new Error('Não foi possível carregar sua foto de perfil.');
  return response.blob();
}
export async function saveProfilePhoto(token: string, photo: Blob) {
  const form = new FormData(); form.append('photo', photo, 'profile.jpg');
  await photoRequest(token, { method: 'POST', body: form });
}
export async function removeProfilePhoto(token: string) { await photoRequest(token, { method: 'DELETE' }); }
