import { apiRequest } from "./api";

import type {
  CreateKnowledgeDocumentRequest,
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeSearchResult,
} from "../types/knowledge";

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  return apiRequest<KnowledgeDocument[]>("/knowledge/documents");
}

export async function getKnowledgeDocument(
  documentId: string,
): Promise<KnowledgeDocumentDetail> {
  return apiRequest<KnowledgeDocumentDetail>(
    `/knowledge/documents/${documentId}`,
  );
}

export async function createKnowledgeDocument(
  data: CreateKnowledgeDocumentRequest,
): Promise<KnowledgeDocument> {
  return apiRequest<KnowledgeDocument>("/knowledge/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteKnowledgeDocument(
  documentId: string,
): Promise<void> {
  await apiRequest(`/knowledge/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function reindexKnowledgeDocument(
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiRequest<KnowledgeDocument>(
    `/knowledge/documents/${documentId}/reindex`,
    {
      method: "POST",
    },
  );
}

export async function searchKnowledge(
  query: string,
): Promise<KnowledgeSearchResult[]> {
  return apiRequest<KnowledgeSearchResult[]>(
    `/knowledge/search?q=${encodeURIComponent(query)}`,
  );
}

export async function uploadKnowledgeDocument(
  title: string,
  file: File,
): Promise<KnowledgeDocument> {
  const formData = new FormData();

  formData.append("title", title);
  formData.append("file", file);

  return apiRequest<KnowledgeDocument>("/knowledge/documents/upload", {
    method: "POST",
    body: formData,
  });
}
