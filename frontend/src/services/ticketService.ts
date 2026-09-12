import { apiRequest } from "./api";
import type {
  Ticket,
  TicketListResponse,
  TicketPriority,
  TicketStatus,
} from "../types/ticket";

interface GetTicketsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
}

export async function getTickets(
  params: GetTicketsParams,
): Promise<TicketListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("organization_id", params.organizationId);

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

  return apiRequest<TicketListResponse>(`/tickets?${searchParams.toString()}`);
}

export async function getTicket(
  ticketId: string,
  organizationId: string,
): Promise<Ticket> {
  return apiRequest<Ticket>(
    `/tickets/${ticketId}?organization_id=${organizationId}`,
  );
}