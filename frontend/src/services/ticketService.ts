import { apiRequest } from "./api";
import type {
  Ticket,
  TicketListResponse,
  TicketPriority,
  TicketStatus,
} from "../types/ticket";

interface GetTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}

export async function getTickets(
  params: GetTicketsParams,
): Promise<TicketListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.priority) {
    searchParams.set("priority", params.priority);
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  return apiRequest<TicketListResponse>(`/tickets?${searchParams.toString()}`);
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  return apiRequest<Ticket>(`/tickets/${ticketId}`);
}

export async function analyzeTicket(ticketId: string) {
  return apiRequest(`/tickets/${ticketId}/ai/analyze`, {
    method: "POST",
  });
}