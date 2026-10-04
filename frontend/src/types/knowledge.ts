export interface KnowledgeDocument {
  id: string;
  organization_id: string;
  title: string;
  source: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  created_at: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocument {
  content: string;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

export interface CreateKnowledgeDocumentRequest {
  title: string;
  content: string;
  source?: string;
}
