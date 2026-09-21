import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getTickets } from "../services/ticketService";
import type { Ticket, TicketStatus, TicketPriority } from "../types/ticket";

const STATUSES: TicketStatus[] = [
  "OPEN",
  "AI_ANALYZING",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const LIMIT = 10;

export default function TicketPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;

  const page = Number(searchParams.get("page") ?? "1");

  const [searchInput, setSearchInput] = useState(urlSearch);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep input synchronized with URL
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);

      if (searchInput.trim()) {
        next.set("search", searchInput.trim());
      } else {
        next.delete("search");
      }

      next.set("page", "1");

      setSearchParams(next);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load tickets
  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const response = await getTickets({
          page,
          limit: LIMIT,
          search: urlSearch || undefined,
          status: status || undefined,
          priority: priority || undefined,
        });

        setTickets(response.items);
        setTotal(response.total);
        setPages(response.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [urlSearch, status, priority, page]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    next.set("page", "1");

    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);

    next.set("page", String(nextPage));

    setSearchParams(next);
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Manage customer support requests.</p>
        </div>

        <button className="primary-button">+ New Ticket</button>
      </header>

      <div className="ticket-filters">
        <input
          type="search"
          placeholder="Search tickets..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
        />

        <select
          value={status ?? ""}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>

          {STATUSES.map((ticketStatus) => (
            <option key={ticketStatus} value={ticketStatus}>
              {ticketStatus}
            </option>
          ))}
        </select>

        <select
          value={priority ?? ""}
          onChange={(event) => updateFilter("priority", event.target.value)}
        >
          <option value="">All priorities</option>

          {PRIORITIES.map((ticketPriority) => (
            <option key={ticketPriority} value={ticketPriority}>
              {ticketPriority}
            </option>
          ))}
        </select>
      </div>

      <div className="ticket-summary">{total} tickets</div>

      {loading && <TicketListSkeleton />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && tickets.length === 0 && <EmptyState />}

      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <Link
                to={`/tickets/${ticket.id}`}
                key={ticket.id}
                className="ticket-card"
              >
                <div>
                  <h3>{ticket.subject}</h3>
                  <p>{ticket.description}</p>
                </div>

                <div className="ticket-meta">
                  <span>{ticket.status}</span>
                  <span>{ticket.priority}</span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={pages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>No tickets found</h3>
      <p>Try changing your search or filters.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state">
      <h3>Unable to load tickets</h3>
      <p>{message}</p>
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="ticket-list">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="ticket-skeleton" key={index}>
          <div className="skeleton-line large" />
          <div className="skeleton-line" />
          <div className="skeleton-badge" />
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        ←
      </button>

      {Array.from({ length: pages }, (_, index) => index + 1).map(
        (pageNumber) => (
          <button
            key={pageNumber}
            className={pageNumber === page ? "active" : ""}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ),
      )}

      <button disabled={page === pages} onClick={() => onPageChange(page + 1)}>
        →
      </button>
    </div>
  );
}
