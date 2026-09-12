import { useEffect, useState } from "react";

import { getTickets } from "../services/ticketService";
import type { Ticket } from "../types/ticket";

const ORGANIZATION_ID = "e05996ae-4c33-4f4e-8d1b-e25972d3ac6f";

export default function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  console.log("Hello");
  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        const response = await getTickets({
          organizationId: ORGANIZATION_ID,
          page: 1,
          limit: 20,
        });
        console.log("Response:", response);
        setTickets(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  if (loading) {
    return <p>Loading tickets...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Manages customer support requests.</p>
        </div>
      </header>

      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="ticket-card">
            <div>
              <h3>{ticket.subject}</h3>
              <p>{ticket.description}</p>
            </div>
            <div className="ticket-meta">
              <span>{ticket.status}</span>
              <span>{ticket.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
