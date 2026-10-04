import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeDocuments,
  searchKnowledge,
} from "../../services/knowledgeService";
import type {
  KnowledgeDocument,
  KnowledgeSearchResult,
} from "../../types/knowledge";
import { uploadKnowledgeDocument } from "../../services/knowledgeService";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getKnowledgeDocuments();

      setDocuments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load knowledge base",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setError("");

      const results = await searchKnowledge(searchQuery);

      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await createKnowledgeDocument({
        title,
        content,
        source: source || undefined,
      });

      setTitle("");
      setSource("");
      setContent("");
      setShowCreate(false);

      await loadDocuments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this knowledge document?");

    if (!confirmed) return;

    try {
      await deleteKnowledgeDocument(id);

      setDocuments((current) =>
        current.filter((document) => document.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document",
      );
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!uploadTitle.trim()) {
      setError("Document title is required");
      return;
    }

    if (!uploadFile) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadKnowledgeDocument(uploadTitle, uploadFile);

      setUploadTitle("");
      setUploadFile(null);

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading knowledge base...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage documents used by the AI for RAG.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Add Document
        </button>
      </div>

      <form
        onSubmit={handleUpload}
        className="space-y-4 rounded-xl border bg-white p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Upload Document</h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload a document to add it to the AI knowledge base.
          </p>
        </div>

        <input
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          placeholder="Document title"
          className="w-full rounded-lg border p-3"
        />

        <input
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx"
          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border p-3"
        />

        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge..."
          className="flex-1 rounded-lg border p-3"
        />

        <button
          type="submit"
          disabled={searching}
          className="rounded-lg border px-5"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Search Results</h2>

          {searchResults.map((result) => (
            <div
              key={result.chunk_id}
              className="rounded-xl border bg-white p-5"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{result.document_title}</h3>

                <span className="text-sm text-gray-500">
                  {(result.similarity * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Chunk #{result.chunk_index + 1}
              </p>

              <p className="mt-3 text-sm text-gray-600">{result.content}</p>
            </div>
          ))}
        </section>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="font-semibold">No knowledge documents</h2>

          <p className="mt-2 text-sm text-gray-500">
            Add your first document to give the AI company-specific knowledge.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <div key={document.id} className="rounded-xl border bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/knowledge/${document.id}`}
                    className="font-semibold hover:underline"
                  >
                    {document.title}
                  </Link>

                  {document.source && (
                    <p className="mt-1 text-xs text-gray-500">
                      {document.source}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(document.id)}
                  className="text-sm text-red-600"
                >
                  Delete
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Updated {new Date(document.updated_at).toLocaleString()}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  document.status === "READY"
                    ? "bg-green-100 text-green-700"
                    : document.status === "FAILED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {document.status}
              </span>

              {document.status === "FAILED" && (
                <p className="mt-2 text-sm text-red-600">
                  Processing failed. Open the document to inspect the error.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Knowledge Document</h2>

              <button type="button" onClick={() => setShowCreate(false)}>
                ✕
              </button>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full rounded-lg border p-3"
              required
            />

            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (optional)"
              className="w-full rounded-lg border p-3"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Document content..."
              rows={12}
              className="w-full rounded-lg border p-3"
              required
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-white"
              >
                Create Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
