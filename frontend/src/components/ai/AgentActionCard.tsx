import { useCallback, useState } from "react";
import type { AgentAction } from "../../types/agentAction";
import {
  approveAgentAction,
  rejectAgentAction,
} from "../../services/agentActionService";
import AgentActionTimeline from "./AgentActionTimeline";
import { useAgentActionEvents } from "../../hooks/useAgentActionEvents";

interface Props {
  action: AgentAction;
  onUpdated?: (action: AgentAction) => void;
}

export default function AgentActionCard({ action, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);

  const handleActionEvent = useCallback(
    (event: any) => {
      const status = event?.event;

      if (
        status === "APPROVED" ||
        status === "PROCESSING" ||
        status === "EXECUTED" ||
        status === "FAILED"
      ) {
        onUpdated?.({
          ...action,
          status,
          error_message: event?.data?.error ?? action.error_message,
        });
      }
    },
    [action, onUpdated],
  );

  useAgentActionEvents({
    actionId: action.id,
    onEvent: handleActionEvent,
  });

  async function handleApprove() {
    try {
      setLoading(true);

      const updated = await approveAgentAction(action.id);

      onUpdated?.(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    const reason = window.prompt("Why are you rejecting this action?");

    if (!reason) {
      return;
    }

    try {
      setLoading(true);

      const updated = await rejectAgentAction(action.id, reason);

      onUpdated?.(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <h3 className="font-semibold">AI Action Requires Approval</h3>

        <p className="text-sm text-gray-500">{action.action_type}</p>
      </div>

      <pre className="rounded bg-gray-100 p-3 text-sm overflow-auto">
        {JSON.stringify(action.payload, null, 2)}
      </pre>

      {action.status === "APPROVED" && (
        <p className="text-sm">Action approved. Waiting for worker...</p>
      )}

      {action.status === "PROCESSING" && (
        <p className="text-sm">Executing action...</p>
      )}

      {action.status === "PENDING" && (
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={handleApprove}
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Approve
          </button>

          <button
            disabled={loading}
            onClick={handleReject}
            className="rounded bg-red-600 px-4 py-2 text-white"
          >
            Reject
          </button>
        </div>
      )}

      {action.status === "EXECUTED" && (
        <p className="text-sm text-green-600">Action executed successfully.</p>
      )}

      {action.status === "REJECTED" && (
        <p className="text-sm text-red-600">Action rejected.</p>
      )}

      {action.status === "FAILED" && (
        <div className="text-sm text-red-600">
          <p>Action execution failed.</p>

          {action.error_message && <p>{action.error_message}</p>}
        </div>
      )}
      <AgentActionTimeline actionId={action.id} />
    </div>
  );
}
