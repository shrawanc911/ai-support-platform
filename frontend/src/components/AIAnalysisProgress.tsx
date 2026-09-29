interface Props {
  status: "idle" | "queued" | "processing" | "completed" | "failed";

  message: string;
}

export default function AIAnalysisProgress({ status, message }: Props) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {status === "processing" && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        )}

        {status === "queued" && (
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
        )}

        {status === "completed" && <div className="text-green-600">✓</div>}

        {status === "failed" && <div className="text-red-600">✕</div>}

        <div>
          <p className="font-medium">
            {status === "queued" && "AI analysis queued"}

            {status === "processing" && "AI analysis in progress"}

            {status === "completed" && "AI analysis completed"}

            {status === "failed" && "AI analysis failed"}
          </p>

          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
