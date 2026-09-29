export function streamAIJob(
  ticketId: string,
  jobId: string,
  onProgress: (data: any) => void,
  onCompleted: () => void,
  onFailed: (data: any) => void,
) {
  const url =
    `${import.meta.env.VITE_API_URL}` +
    `/tickets/${ticketId}/ai/jobs/${jobId}/stream`;

  const eventSource = new EventSource(url);

  eventSource.addEventListener("progress", (event) => {
    const data = JSON.parse(event.data);

    onProgress(data);
  });

  eventSource.addEventListener("completed", (event) => {
    const data = JSON.parse(event.data);

    onProgress(data);
    onCompleted();

    eventSource.close();
  });

  eventSource.addEventListener("failed", (event) => {
    const data = JSON.parse(event.data);

    onFailed(data);

    eventSource.close();
  });

  eventSource.onerror = () => {
    eventSource.close();

    onFailed({
      message: "Connection to AI worker was lost",
    });
  };

  return () => {
    eventSource.close();
  };
}

export function parseSSEEvent(rawEvent: string, onProgress: (data: any) => void) {
  const lines = rawEvent.split("\n");

  let eventType = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }

  if (!data) {
    return;
  }

  const parsed = JSON.parse(data);

  onProgress({
    type: eventType,
    ...parsed,
  });
}