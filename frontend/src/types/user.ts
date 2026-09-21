export type UserRole = "CUSTOMER" | "AGENT" | "MANAGER" | "ADMIN";

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}
