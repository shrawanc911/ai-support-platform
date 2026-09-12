import { type FormEvent, useState } from "react";

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageComposer({
  onSend,
  disabled = false,
}: MessageComposerProps) {
  const [content, setContent] = useState("");

  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || sending) {
      return;
    }

    try {
      setSending(true);

      await onSend(trimmed);

      setContent("");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a reply..."
        rows={4}
        disabled={disabled || sending}
      />

      <button type="submit" disabled={disabled || sending || !content.trim()}>
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
