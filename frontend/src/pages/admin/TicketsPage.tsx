import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import TicketList from "../../components/admin/TicketList";
import { getTickets } from "../../services/ticketService";
import type { TicketListResponse } from "../../types/ticket";

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketListResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTickets() {
      try {
        const response = await getTickets({});

        if (!controller.signal.aborted) {
          setTickets(response);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTickets();

    return () => controller.abort();
  }, []);

  if (loading) return <p>Loading tickets...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Support Tickets</h1>
      <TicketList
        tickets={tickets?.items ?? []}
        onSelect={(ticket) => navigate(`/admin/tickets/${ticket.id}`)}
      />
    </main>
  );
}
