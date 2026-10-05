import { apiRequest, setAccessToken } from "./api";
import type { RegisterRequest, RegisterResponse } from "../types/auth";

interface LoginResponse {
  access_token: string;
  token_type: string;
}


export interface CurrentUser {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "AGENT" | "MANAGER" | "ADMIN";
}

export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(email: string, password: string) {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(response.access_token);

  return response;
}

export async function getCurrentUser() {
  return apiRequest<CurrentUser>("/auth/me");
}
