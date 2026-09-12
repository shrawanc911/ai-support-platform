import type { TicketMessage } from "../types/message";

interface MessageBubbleProps {
  message: TicketMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.message_type === "CUSTOMER";

  const isAI = message.message_type === "AI";

  const isSystem = message.message_type === "SYSTEM";

  return (
    <div
      className={`message-row ${isCustomer ? "message-customer" : ""} ${
        isAI ? "message-ai" : ""
      } ${isSystem ? "message-system" : ""}`}
    >
      <div className="message-bubble">
        <div className="message-type">{message.message_type}</div>

        <div className="message-content">{message.content}</div>

        <div className="message-time">
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
