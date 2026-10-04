import { useEffect, useState } from "react";

import type { AuditLog } from "../../types/agentAction";
import { getAgentActionAudit } from "../../services/agentActionService";

interface Props {
  actionId: string;
}

export default function AgentActionTimeline({ actionId }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        const data = await getAgentActionAudit(actionId);

        setLogs(data);
      } finally {
        setLoading(false);
      }
    }

    loadAudit();
  }, [actionId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading audit history...</p>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="border-l-2 pl-4">
          <p className="font-medium">{formatEvent(log.event_type)}</p>

          {log.message && (
            <p className="text-sm text-gray-500">{log.message}</p>
          )}

          <p className="text-xs text-gray-400">
            {new Date(log.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatEvent(event: string) {
  return event
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
