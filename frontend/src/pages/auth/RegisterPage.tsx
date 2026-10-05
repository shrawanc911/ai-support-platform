import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Mail, Lock, Building2, UserRound, Loader2 } from "lucide-react";

import { register } from "../../services/authService";
import { getOrganizationsList } from "../../services/organizationService";

import type { Organization } from "../../types/organization";
import type { RegisterRole } from "../../types/auth";

const roles: {
  value: RegisterRole;
  label: string;
  description: string;
}[] = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Create and manage your support tickets",
  },
  {
    value: "AGENT",
    label: "Agent",
    description: "Handle customer support tickets",
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "Manage support operations and team",
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("CUSTOMER");
  const [organizationId, setOrganizationId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const data = await getOrganizationsList();
        setOrganizations(data);
      } catch {
        setError("Unable to load organizations.");
      } finally {
        setLoadingOrganizations(false);
      }
    }

    loadOrganizations();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!organizationId) {
      setError("Please select an organization.");
      return;
    }

    try {
      setLoading(true);

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        organization_id: organizationId,
      });

      navigate("/login");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            AI
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Join your organization and get started with AI Support.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Password must contain at least 8 characters.
              </p>
            </div>

            {/* Organization */}
            <div>
              <label
                htmlFor="organization"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Organization
              </label>

              <div className="relative">
                <Building2
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="organization"
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                  required
                  disabled={loadingOrganizations}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingOrganizations
                      ? "Loading organizations..."
                      : "Select your organization"}
                  </option>

                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account type
              </label>

              <div className="space-y-2">
                {roles.map((item) => (
                  <label
                    key={item.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      role === item.value
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={item.value}
                      checked={role === item.value}
                      onChange={() => setRole(item.value)}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <UserRound size={16} className="text-slate-500" />

                        <p className="text-sm font-medium text-slate-900">
                          {item.label}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || loadingOrganizations}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}

              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Login */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-slate-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
