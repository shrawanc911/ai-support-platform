export type AgentActionType =
  | "CHANGE_TICKET_STATUS"
  | "ASSIGN_TICKET"
  | "ADD_INTERNAL_NOTE";

export type AgentActionStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED";

export interface AgentAction {
  id: string;
  organization_id: string;
  ticket_id: string;
  requested_by_id: string;
  approved_by_id: string | null;

  action_type: AgentActionType;
  status: AgentActionStatus;

  payload: Record<string, unknown>;

  error_message: string | null;

  created_at: string;
  approved_at: string | null;
  executed_at: string | null;
}
