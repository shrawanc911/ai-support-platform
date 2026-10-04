import { apiRequest } from "./api";

export interface AgentRunRequest {
  ticket_id: string;
  message: string;
}

export interface AgentRunResponse {
  answer: string;
  confidence: number;
  tools_used: string[];
}

export async function runAIAgent(
  request: AgentRunRequest,
): Promise<AgentRunResponse> {
  return apiRequest<AgentRunResponse>("/ai/agent/run", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
