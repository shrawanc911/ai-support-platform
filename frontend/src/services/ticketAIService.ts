import { apiRequest } from "./api";

export interface TicketAIAnalysis {
  id: string;
  ticket_id: string;
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  suggested_response: string;
  confidence: number;
  evidence_summary: string;
  model: string;
  prompt_version: string;
  created_at: string;
}

export async function analyzeTicket(
  ticketId: string,
): Promise<TicketAIAnalysis> {
  return apiRequest(`/tickets/${ticketId}/ai/analyze`, {
    method: "POST",
  });
}

export async function streamAIJob(
  ticketId: string,
  jobId: string,
  onEvent: (event: { type: string; status?: string; message?: string }) => void,
  signal?: AbortSignal,
) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/tickets/${ticketId}/ai/jobs/${jobId}/stream`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`AI stream failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("AI stream response body is unavailable");
  }

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");

    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      parseSSEEvent(rawEvent, onEvent);
    }
  }
}

function parseSSEEvent(
  rawEvent: string,
  onEvent: (event: { type: string; status?: string; message?: string }) => void,
) {
  const lines = rawEvent.split("\n");

  let type = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      type = line.slice("event:".length).trim();
    }

    if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }

  if (!data) {
    return;
  }

  const parsed = JSON.parse(data);

  onEvent({
    type,
    ...parsed,
  });
}
