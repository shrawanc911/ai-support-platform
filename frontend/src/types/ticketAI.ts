export interface TicketAIAnalysis {
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  suggested_response: string;
  confidence: number;
  evidence_summary: string;
}
