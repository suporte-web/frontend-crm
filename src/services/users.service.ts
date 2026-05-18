import type {
  CreateUserPayload,
  RoleScreenPermissionsGroup,
  UpdateUserPayload,
  UpdateRoleScreenPermissionsPayload,
  User,
  UserRole,
} from '../types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'crm_token';

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Erro ao processar a requisição';

    try {
      const errorData = await response.json();

      if (Array.isArray(errorData.message)) {
        message = errorData.message.join(', ');
      } else {
        message = errorData.message || message;
      }
    } catch {
      //
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  return handleResponse<User[]>(response);
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<User>(response);
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<User>(response);
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

export async function getScreenPermissions(): Promise<
  RoleScreenPermissionsGroup[]
> {
  const response = await fetch(`${API_URL}/screen-permissions`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  return handleResponse<RoleScreenPermissionsGroup[]>(response);
}

export async function updateRoleScreenPermissions(
  role: UserRole,
  payload: UpdateRoleScreenPermissionsPayload,
): Promise<RoleScreenPermissionsGroup> {
  const response = await fetch(`${API_URL}/screen-permissions/${role}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<RoleScreenPermissionsGroup>(response);
}
