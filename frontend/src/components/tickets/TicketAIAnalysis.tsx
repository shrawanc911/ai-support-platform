import type { TicketAIAnalysis } from "../../types/ticketAI";

interface Props {
  analysis: TicketAIAnalysis
}

export default function TicketAIAnalysis({ analysis }: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">AI Analysis</h2>

        <p className="text-sm text-gray-500">
          AI-generated suggestions for agent review
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Category</p>

          <p className="font-medium">{analysis.category}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Priority</p>

          <p className="font-medium">{analysis.priority}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Sentiment</p>

          <p className="font-medium">{analysis.sentiment}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-500">Summary</p>

        <p className="mt-1">{analysis.summary}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-500">Suggested Response</p>

        <div className="mt-1 rounded-lg bg-gray-50 p-3">
          {analysis.suggested_response}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-500">Evidence</p>

        <p className="mt-1">{analysis.evidence_summary}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-500">Confidence</p>

        <p className="font-medium">{(analysis.confidence * 100).toFixed(0)}%</p>
      </div>
    </div>
  );
}
