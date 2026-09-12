export type MessageType = "CUSTOMER" | "AGENT" | "SYSTEM" | "AI";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  message_type: MessageType;
  content: string;
  created_at: string;
}

export interface TicketMessageListResponse {
  items: TicketMessage[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
