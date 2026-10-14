export interface TicketAIAnalysis {
  id: string;
  ticket_id: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  sentiment: string;
  summary: string;
  confidence: number;
  suggested_response: string;
  prompt_version: string;
  job_id: string;
  model: string;
  created_at: string;
}
