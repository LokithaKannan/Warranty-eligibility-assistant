import apiClient from './client';
import { AuditLog, User, PaginatedResponse, DashboardStats } from '../types';

export async function getDashboardStats() {
  const res = await apiClient.get<{ success: boolean; data: DashboardStats }>(
    '/dashboard/stats'
  );
  return res.data.data;
}

export async function getAuditLogs(params?: { page?: number; pageSize?: number; userId?: string }) {
  const res = await apiClient.get<{ success: boolean; data: PaginatedResponse<AuditLog> }>(
    '/admin/audit-logs',
    { params }
  );
  return res.data.data;
}

export async function getUsers(params?: { page?: number; pageSize?: number }) {
  const res = await apiClient.get<{ success: boolean; data: PaginatedResponse<User> }>(
    '/admin/users',
    { params }
  );
  return res.data.data;
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: string;
}) {
  const res = await apiClient.post<{ success: boolean; data: User }>('/admin/users', data);
  return res.data.data;
}

export async function updateUser(
  id: string,
  data: { isActive?: boolean; role?: string }
) {
  const res = await apiClient.patch<{ success: boolean; data: User }>(
    `/admin/users/${id}`,
    data
  );
  return res.data.data;
}
