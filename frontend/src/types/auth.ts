export type RegisterRole = "CUSTOMER" | "AGENT" | "MANAGER";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: RegisterRole;
  organization_id: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: RegisterRole;
  organization_id: string;
}
