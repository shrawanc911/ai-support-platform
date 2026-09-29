export interface TicketAIAnalysis {
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  sources: AISource[];
  suggested_response: string;
  confidence: number;
  evidence_summary: string;
}

export interface AISource {
  id: string;
  document_id: string;
  chunk_id: string;
  document_title: string;
  content: string;
  similarity: number;
}
