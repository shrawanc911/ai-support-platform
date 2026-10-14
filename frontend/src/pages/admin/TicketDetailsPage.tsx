import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getTicketAIAnalysis } from "../../services/ticketService";
import type { TicketAIAnalysis } from "../../types/ticketAIAnalysis";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AnalysisCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function TicketDetailsPage() {
  const { ticketId, organizationId } = useParams();

  const [analysis, setAnalysis] = useState<TicketAIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) {
      setError("Ticket ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchAnalysis() {
      setLoading(true);
      setError("");
      if (!ticketId) {
        return;
      }
      try {
        const result = await getTicketAIAnalysis(ticketId);

        if (active) setAnalysis(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load AI analysis.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAnalysis();

    return () => {
      active = false;
    };
  }, [ticketId]);

  if (loading) {
    return (
      <main className="p-6 text-slate-500">Loading ticket analysis...</main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4 p-6">
        <Link
          to={`/organizations/${organizationId}/tickets`}
          className="text-sm font-medium text-blue-600"
        >
          ← Back to tickets
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="space-y-4 p-6">
        <Link to={`/organizations/${organizationId}/tickets`}>
          ← Back to tickets
        </Link>
        <p>No AI analysis found for this ticket.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Link
        to={`/organizations/${organizationId}/tickets`}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        ← Back to tickets
      </Link>

      <header>
        <p className="text-sm font-medium text-blue-600">
          SUPPORT CENTER / TICKET DETAILS
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          AI Ticket Analysis
        </h1>

        <p className="mt-2 break-all font-mono text-sm text-slate-500">
          Ticket ID: {analysis.ticket_id}
        </p>
      </header>

      {/* Main analysis metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalysisCard label="Category" value={analysis.category} />

        <AnalysisCard label="Priority" value={analysis.priority} />

        <AnalysisCard label="Customer sentiment" value={analysis.sentiment} />

        <AnalysisCard
          label="AI confidence"
          value={`${(analysis.confidence * 100).toFixed(0)}%`}
        />
      </section>

      {/* AI-generated summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">AI Summary</h2>

        <p className="mt-3 leading-7 text-slate-600">{analysis.summary}</p>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-600">Confidence score</span>
            <span className="font-semibold text-slate-900">
              {(analysis.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, analysis.confidence * 100),
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Suggested response */}
      <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Suggested Response
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              AI-generated draft for the support agent to review.
            </p>
          </div>

          <button
            onClick={() =>
              void navigator.clipboard.writeText(analysis.suggested_response)
            }
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Copy response
          </button>
        </div>

        <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {analysis.suggested_response}
        </div>
      </section>

      {/* AI processing metadata */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Analysis metadata</h2>

        <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">AI model</dt>
            <dd className="mt-1 break-all text-sm font-medium text-slate-800">
              {analysis.model}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Prompt version</dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {analysis.prompt_version}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Analysis ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">
              {analysis.id}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">AI job ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">
              {analysis.job_id}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Created at</dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(analysis.created_at)}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
