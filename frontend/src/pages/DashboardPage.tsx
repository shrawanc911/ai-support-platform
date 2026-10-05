import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  CircleCheck,
  CircleDot,
  Loader2,
  Plus,
  Ticket,
} from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "../context/AuthContext";
import {
  getDashboardData,
  type DashboardData,
} from "../services/dashboardService";

export default function DashboardPage() {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const result = await getDashboardData();

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Welcome back
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Hello, {firstName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here's an overview of your support requests.
            </p>
          </div>

          <Link
            to="/tickets/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            New Ticket
          </Link>
        </header>

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open"
            value={data.stats.open}
            icon={<CircleDot size={19} />}
            description="Tickets awaiting action"
          />

          <StatCard
            label="In Progress"
            value={data.stats.in_progress}
            icon={<Clock3 size={19} />}
            description="Currently being handled"
          />

          <StatCard
            label="Waiting for You"
            value={data.stats.waiting_for_customer}
            icon={<Ticket size={19} />}
            description="Need your response"
          />

          <StatCard
            label="Resolved"
            value={data.stats.resolved}
            icon={<CircleCheck size={19} />}
            description="Successfully resolved"
          />
        </section>

        {/* Recent tickets */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Your Recent Tickets
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Your latest support requests
              </p>
            </div>

            <Link
              to="/tickets"
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          {data.recent_tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <Ticket size={20} className="text-slate-500" />
              </div>

              <h3 className="text-sm font-medium text-slate-900">
                No tickets yet
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                You haven't created any support requests yet.
              </p>

              <Link
                to="/tickets/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                Create your first ticket
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {ticket.subject}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Updated {formatDate(ticket.updated_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={ticket.status} />

                    <span
                      className={`text-xs font-medium ${getPriorityColor(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority}
                    </span>

                    <ArrowRight size={16} className="text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    AI_ANALYZING: "bg-purple-50 text-purple-700",
    ASSIGNED: "bg-indigo-50 text-indigo-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    WAITING_FOR_CUSTOMER: "bg-orange-50 text-orange-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-600",
  };

  const labels: Record<string, string> = {
    OPEN: "Open",
    AI_ANALYZING: "AI Analyzing",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    WAITING_FOR_CUSTOMER: "Waiting",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "URGENT":
      return "text-red-600";

    case "HIGH":
      return "text-orange-600";

    case "MEDIUM":
      return "text-amber-600";

    case "LOW":
      return "text-slate-500";

    default:
      return "text-slate-500";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
