import { useEffect } from "react";

import { API_URL } from "../services/api";

interface Props {
  actionId: string;
  onEvent: (event: unknown) => void;
}

export function useAgentActionEvents({ actionId, onEvent }: Props) {
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const url =
      `${API_URL}/ai/agent/actions/` +
      `${actionId}/events` +
      `?token=${encodeURIComponent(token ?? "")}`;

    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        onEvent(data);
      } catch {
        // Ignore malformed events.
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [actionId, onEvent]);
}
