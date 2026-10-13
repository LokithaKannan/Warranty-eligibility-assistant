import apiClient from './client';
import { User } from '../types';

export async function login(username: string, password: string) {
  const res = await apiClient.post<{
    success: boolean;
    data: { token: string; user: User };
  }>('/auth/login', { username, password });
  return res.data.data;
}

export async function register(username: string, email: string, password: string) {
  const res = await apiClient.post<{
    success: boolean;
    data: { token: string; user: User };
  }>('/auth/register', { username, email, password });
  return res.data.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function getMe() {
  const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
  return res.data.data;
}
