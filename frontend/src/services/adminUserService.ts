import { apiRequest } from "./api";
import type { User, UserRole } from "../types/user";

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function getUsers(organizationId: string): Promise<User[]> {
  return apiRequest(`/admin/organizations/${organizationId}/users`);
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  return apiRequest("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  organizationId: string,
  userId: string,
  data: {
    role?: UserRole;
    is_active?: boolean;
  },
): Promise<User> {
  return apiRequest(
    `/admin/organization/${organizationId}/user/${userId}/update_user`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}
