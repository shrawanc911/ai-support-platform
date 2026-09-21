import { apiRequest } from "./api";
import type {
  TicketMessage,
  TicketMessageListResponse,
} from "../types/message";

interface CreateMessageInput {
  content: string;
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessageListResponse> {
  return apiRequest<TicketMessageListResponse>(
    `/tickets/${ticketId}/messages`,
  );
}

export async function createTicketMessage(
  ticketId: string,
  data: CreateMessageInput,
): Promise<TicketMessage> {
  return apiRequest<TicketMessage>(
    `/tickets/${ticketId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
