import { apiRequest } from "./api";
import type {
  TicketMessage,
  TicketMessageListResponse,
} from "../types/message";

interface CreateMessageInput {
  sender_id: string | null;
  message_type: "CUSTOMER" | "AGENT" | "SYSTEM" | "AI";
  content: string;
}

export async function getTicketMessages(
  ticketId: string,
  organizationId: string,
): Promise<TicketMessageListResponse> {
  return apiRequest<TicketMessageListResponse>(
    `/tickets/${ticketId}/messages?organization_id=${organizationId}`,
  );
}

export async function createTicketMessage(
  ticketId: string,
  organizationId: string,
  data: CreateMessageInput,
): Promise<TicketMessage> {
  return apiRequest<TicketMessage>(
    `/tickets/${ticketId}/messages?organization_id=${organizationId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
