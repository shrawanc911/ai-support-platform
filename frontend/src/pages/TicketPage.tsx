import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Ticket as TicketIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { createTicket, getTickets } from "../services/ticketService";
import type { Ticket, TicketStatus, TicketPriority } from "../types/ticket";
import CreateTicketModal from "../components/popups/CreateTicketModal";
import { useAuth } from "../context/AuthContext";

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
  const { user } = useAuth();

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
  const [ticketPopup, setTicketPopup] = useState(false);

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

  useEffect(() => {
    loadTickets();
  }, [urlSearch, status, priority, page]);

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

  function clearFilters() {
    const next = new URLSearchParams();

    setSearchParams(next);
    setSearchInput("");
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);

    next.set("page", String(nextPage));

    setSearchParams(next);
  }

  const handleCreateTicket = async (data: {
    subject: string;
    description: string;
  }) => {
    await createTicket(data);
    setTicketPopup(false);
    await loadTickets();
  };

  const hasFilters = Boolean(urlSearch) || Boolean(status) || Boolean(priority);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <TicketIcon size={16} />
              <span>Support</span>
              <span>/</span>
              <span className="text-slate-700">Tickets</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Tickets
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your support requests.
            </p>
          </div>

          {user?.role === "CUSTOMER" && (
            <button
              type="button"
              onClick={() => setTicketPopup(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={17} />
              New Ticket
            </button>
          )}

          {ticketPopup && (
            <CreateTicketModal
              isOpen={ticketPopup}
              onClose={() => setTicketPopup(false)}
              onSubmit={handleCreateTicket}
            />
          )}
        </header>

        {/* Filters */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                placeholder="Search tickets by subject or description..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status */}
            <select
              value={status ?? ""}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 lg:w-44"
            >
              <option value="">All statuses</option>

              {STATUSES.map((ticketStatus) => (
                <option key={ticketStatus} value={ticketStatus}>
                  {formatStatus(ticketStatus)}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priority ?? ""}
              onChange={(event) => updateFilter("priority", event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 lg:w-40"
            >
              <option value="">All priorities</option>

              {PRIORITIES.map((ticketPriority) => (
                <option key={ticketPriority} value={ticketPriority}>
                  {formatPriority(ticketPriority)}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <SlidersHorizontal size={14} />
                Filters applied
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Results header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {loading
                ? "Loading tickets..."
                : `${total} ${total === 1 ? "ticket" : "tickets"}`}
            </p>

            {!loading && total > 0 && (
              <p className="mt-0.5 text-xs text-slate-500">
                Showing page {page} of {pages}
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && <TicketListSkeleton />}

        {/* Error */}
        {!loading && error && (
          <ErrorState message={error} onRetry={loadTickets} />
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreate={
              user?.role === "CUSTOMER" ? () => setTicketPopup(true) : undefined
            }
          />
        )}

        {/* Tickets */}
        {!loading && !error && tickets.length > 0 && (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {tickets.map((ticket, index) => (
                <Link
                  to={`/tickets/${ticket.id}`}
                  key={ticket.id}
                  className={`group block px-5 py-4 transition hover:bg-slate-50 ${
                    index !== tickets.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Ticket information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <TicketIcon size={17} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                            {ticket.subject}
                          </h3>

                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                            {ticket.description}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Ticket #{ticket.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status / Priority */}
                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      <StatusBadge status={ticket.status} />

                      <PriorityBadge priority={ticket.priority} />

                      <ChevronRight
                        size={17}
                        className="ml-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination page={page} pages={pages} onPageChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-100",
    AI_ANALYZING: "bg-purple-50 text-purple-700 border-purple-100",
    ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-100",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-100",
    WAITING_FOR_CUSTOMER: "bg-orange-50 text-orange-700 border-orange-100",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const styles: Record<TicketPriority, string> = {
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
    MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-100",
    HIGH: "bg-orange-50 text-orange-700 border-orange-100",
    URGENT: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[priority]}`}
    >
      {formatPriority(priority)}
    </span>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onCreate,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <TicketIcon size={21} className="text-slate-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {hasFilters ? "No matching tickets" : "No tickets yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "You don't have any support tickets yet."}
      </p>

      <div className="mt-5 flex justify-center gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}

        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Create ticket
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-red-800">
        Unable to load tickets
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-red-600">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-inset ring-red-200 transition hover:bg-red-50"
      >
        Try again
      </button>
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />

          <div className="flex-1">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="hidden h-6 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />

          <div className="hidden h-6 w-16 animate-pulse rounded-full bg-slate-100 sm:block" />
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
    <div className="mt-5 flex items-center justify-between">
      <p className="text-xs text-slate-500">
        Page {page} of {pages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </button>

        {Array.from({ length: pages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`hidden h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition sm:flex ${
                pageNumber === page
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {pageNumber}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPriority(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}
