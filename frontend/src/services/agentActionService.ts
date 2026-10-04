import { apiRequest } from "./api";
import type { AgentAction } from "../types/agentAction";

export async function getAgentActions(): Promise<AgentAction[]> {
  return apiRequest<AgentAction[]>("/ai/agent/actions", {
    method: "GET",
  });
}

export async function getAgentAction(actionId: string): Promise<AgentAction> {
  return apiRequest<AgentAction>(`/ai/agent/actions/${actionId}`, {
    method: "GET",
  });
}

export async function approveAgentAction(
  actionId: string,
): Promise<AgentAction> {
  return apiRequest<AgentAction>(`/ai/agent/actions/${actionId}/approve`, {
    method: "POST",
  });
}

export async function rejectAgentAction(
  actionId: string,
  reason: string,
): Promise<AgentAction> {
  return apiRequest<AgentAction>(`/ai/agent/actions/${actionId}/reject`, {
    method: "POST",
    body: JSON.stringify({
      reason,
    }),
  });
}
