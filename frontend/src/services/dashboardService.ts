import { apiRequest } from "./api";

export interface DashboardStats {
  open: number;
  in_progress: number;
  waiting_for_customer: number;
  resolved: number;
  closed: number;
}

export interface DashboardTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_tickets: DashboardTicket[];
}

export async function getDashboardData(): Promise<DashboardData> {
  return apiRequest<DashboardData>("/dashboard");
}
