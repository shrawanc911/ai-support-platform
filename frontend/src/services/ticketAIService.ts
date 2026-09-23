import { apiRequest } from "./api";

export interface TicketAIAnalysis {
  id: string;
  ticket_id: string;
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  suggested_response: string;
  confidence: number;
  evidence_summary: string;
  model: string;
  prompt_version: string;
  created_at: string;
}

export async function analyzeTicket(
  ticketId: string,
): Promise<TicketAIAnalysis> {
  return apiRequest(`/tickets/${ticketId}/ai/analyze`, {
    method: "POST",
  });
}
