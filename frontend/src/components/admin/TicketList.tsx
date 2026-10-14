import { useMemo, useState } from "react";
import type { Ticket } from "../../types/ticket";

type TicketStatus =
  | "OPEN"
  | "AI_ANALYZING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Props {
  tickets: Ticket[];
  onSelect?: (ticket: Ticket) => void;
}

const PAGE_SIZE = 8;

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
  MEDIUM: "bg-blue-50 text-blue-700 ring-blue-200",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-200",
  URGENT: "bg-red-50 text-red-700 ring-red-200",
};

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700 ring-amber-200",
  AI_ANALYZING: "bg-violet-50 text-violet-700 ring-violet-200",
  ASSIGNED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  WAITING_FOR_CUSTOMER: "bg-orange-50 text-orange-700 ring-orange-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityDot: Record<TicketPriority, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function timeAgo(value: string) {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) return "Unknown date";

  const diff = Date.now() - timestamp;

  if (diff < 0) return formatDate(value);

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

function Badge({
  children,
  className,
  dot = false,
}: {
  children: string;
  className: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap
        rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide
        ring-1 ring-inset sm:text-[11px] ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            priorityDot[children as TicketPriority] ?? "bg-current"
          }`}
        />
      )}
      {formatLabel(children)}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  description,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-IN")}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${color}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({
  searching,
  onClear,
}: {
  searching: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        {searching ? "⌕" : "▤"}
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-900">
        {searching ? "No matching tickets" : "No tickets yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {searching
          ? "Try another search term or change your filters to find tickets."
          : "When customers submit support requests, their tickets will appear here."}
      </p>

      {searching && (
        <button
          onClick={onClear}
          className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function TicketList({ tickets, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) =>
        ["OPEN", "AI_ANALYZING", "ASSIGNED"].includes(t.status)
      ).length,
      inProgress: tickets.filter((t) =>
        ["IN_PROGRESS", "WAITING_FOR_CUSTOMER"].includes(t.status)
      ).length,
      urgent: tickets.filter((t) => t.priority === "URGENT").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.customer_id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleTickets = filteredTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function changePriority(value: string) {
    setPriorityFilter(value);
    setPage(1);
  }

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL";

  return (
    <section className="min-h-screen bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Support center
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tickets
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage customer requests, priorities and resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-600">
              Ticket overview
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total tickets"
            value={stats.total}
            icon="▤"
            color="bg-blue-50 text-blue-600"
            description="Tickets in the loaded dataset"
          />

          <StatCard
            label="Open queue"
            value={stats.open}
            icon="◷"
            color="bg-amber-50 text-amber-600"
            description="Open, assigned or being analyzed"
          />

          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon="↗"
            color="bg-violet-50 text-violet-600"
            description="Active work and customer follow-ups"
          />

          <StatCard
            label="Urgent priority"
            value={stats.urgent}
            icon="!"
            color="bg-red-50 text-red-600"
            description="Tickets requiring urgent attention"
          />
        </div>

        {/* Ticket table container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All tickets
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search and filter incoming support requests.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Search */}
                <div className="relative min-w-0 sm:min-w-[260px]">
                  <svg
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4" />
                  </svg>

                  <input
                    type="search"
                    value={search}
                    onChange={(e) => changeSearch(e.target.value)}
                    placeholder="Search tickets..."
                    aria-label="Search tickets"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => changeStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="ALL">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="AI_ANALYZING">AI analyzing</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="WAITING_FOR_CUSTOMER">
                    Waiting for customer
                  </option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                {/* Priority filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => changePriority(e.target.value)}
                  aria-label="Filter by priority"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="ALL">All priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Filters applied · {filteredTickets.length} result(s)
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredTickets.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(currentPage * PAGE_SIZE, filteredTickets.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredTickets.length}
              </span>{" "}
              tickets
            </p>

            <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:inline-flex">
              Latest first
            </span>
          </div>

          {/* Responsive table */}
          {visibleTickets.length === 0 ? (
            <EmptyState
              searching={hasFilters}
              onClear={clearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Ticket details
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Customer
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Priority
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Created
                    </th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelect?.(ticket)}
                      className={`group transition-colors hover:bg-blue-50/40 ${
                        onSelect ? "cursor-pointer" : ""
                      }`}
                    >
                      {/* Ticket */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 shadow-sm transition group-hover:border-blue-200 group-hover:text-blue-600">
                            {ticket.subject?.trim().charAt(0).toUpperCase() || "T"}
                          </div>

                          <div className="min-w-0 max-w-[300px]">
                            <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-700">
                              {ticket.subject}
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {ticket.description}
                            </p>

                            <p className="mt-1.5 font-mono text-[10px] text-slate-400">
                              #{ticket.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                            {ticket.customer_id.slice(0, 1).toUpperCase()}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              Customer
                            </p>
                            <p
                              title={ticket.customer_id}
                              className="mt-1 font-mono text-[10px] text-slate-400"
                            >
                              {ticket.customer_id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <Badge
                          className={priorityStyles[ticket.priority]}
                          dot
                        >
                          {ticket.priority}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <Badge className={statusStyles[ticket.status]}>
                          {ticket.status}
                        </Badge>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-xs font-medium text-slate-700">
                          {timeAgo(ticket.created_at)}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                          {formatDate(ticket.created_at)}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(ticket);
                          }}
                          disabled={!onSelect}
                          aria-label={`View ticket ${ticket.subject}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-default disabled:opacity-40"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-500">
                Page{" "}
                <span className="font-semibold text-slate-800">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                )
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "...")[]>((items, p, index, arr) => {
                    if (index > 0 && p - arr[index - 1] > 1) {
                      items.push("...");
                    }
                    items.push(p);
                    return items;
                  }, [])
                  .map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        aria-current={
                          currentPage === item ? "page" : undefined
                        }
                        className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                          currentPage === item
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="pb-2 text-center text-xs text-slate-400">
          Support workspace · Ticket data is based on your loaded records
        </p>
      </div>
    </section>
  );
}