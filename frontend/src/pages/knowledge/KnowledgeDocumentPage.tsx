import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  getKnowledgeDocument,
  reindexKnowledgeDocument,
} from "../../services/knowledgeService";
import type { KnowledgeDocumentDetail } from "../../types/knowledge";

export default function KnowledgeDocumentPage() {
  const { documentId } = useParams<{
    documentId: string;
  }>();

  const [document, setDocument] = useState<KnowledgeDocumentDetail | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!documentId) return;

    const load = async () => {
      try {
        setLoading(true);

        const data = await getKnowledgeDocument(documentId);

        setDocument(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [documentId]);

  const handleReindex = async () => {
    if (!documentId) return;

    try {
      setReindexing(true);
      setError("");

      await reindexKnowledgeDocument(documentId);

      const updated = await getKnowledgeDocument(documentId);

      setDocument(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to re-index document",
      );
    } finally {
      setReindexing(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading document...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!document) {
    return <div className="p-6">Document not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Link to="/knowledge" className="text-sm text-gray-500">
        ← Back to Knowledge Base
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{document.title}</h1>

          {document.source && (
            <p className="mt-1 text-sm text-gray-500">{document.source}</p>
          )}
        </div>

        <div className="mt-2">
          <span className="rounded-full border px-3 py-1 text-xs">
            {document.status}
          </span>
        </div>

        {document.status === "FAILED" && document.error_message && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {document.error_message}
          </div>
        )}

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="rounded-lg border px-4 py-2"
        >
          {reindexing ? "Re-indexing..." : "Re-index"}
        </button>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Document Content</h2>

        <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">
          {document.content}
        </pre>
      </section>
      {document.status === "READY" && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chunks</h2>

            <span className="text-sm text-gray-500">
              {document.chunks.length} chunks
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {document.chunks.map((chunk) => (
              <div key={chunk.id} className="rounded-xl border bg-white p-5">
                <div className="text-xs font-medium text-gray-500">
                  Chunk #{chunk.chunk_index + 1}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
