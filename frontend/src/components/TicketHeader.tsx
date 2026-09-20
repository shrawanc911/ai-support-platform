import type { Ticket } from "../types/ticket";

interface TicketHeaderProps {
  ticket: Ticket;
}

export default function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <div className="ticket-header">
      <div>
        <div className="ticket-id">Ticket #{ticket.id.slice(0, 8)}</div>

        <h1>{ticket.subject}</h1>

        <p>{ticket.description}</p>
      </div>

      <div className="ticket-header-meta">
        <span className="status-badge">{ticket.status}</span>

        <span className="priority-badge">{ticket.priority}</span>
      </div>
    </div>
  );
}

