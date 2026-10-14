import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getOrganizationsList } from "../../services/organizationService";
import type { Organization } from "../../types/organization";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrganizations() {
      try {
        setLoading(true);
        setError("");
        setOrganizations(await getOrganizationsList());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load organizations",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOrganizations();
  }, []);

  return (
    <div className="min-h-full space-y-6 bg-gray-50/60 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Organizations
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Select an organization to manage its users and access.
          </p>
        </div>

        <Link
          to="/organizations/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
        >
          <span className="text-lg leading-none">+</span>
          Create organization
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total organizations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {organizations.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
          <p className="text-sm font-medium text-gray-900">
            Organization management
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Open an organization to view its members, update their roles, and
            manage account access.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border bg-white p-12 text-sm text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Loading organizations...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">All organizations</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select a row to manage its users.
            </p>
          </div>

          {organizations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                🏢
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                No organizations yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create an organization to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {organizations.map((organization) => (
                <Link
                  key={organization.id}
                  to={`/organizations/${organization.id}/users`}
                  className="group flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-indigo-50/40 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                      {organization.name?.charAt(0).toUpperCase() || "O"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 group-hover:text-indigo-700">
                        {organization.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {organization.slug}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Created{" "}
                        {new Date(organization.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition group-hover:border-indigo-200 group-hover:bg-white group-hover:text-indigo-700">
                    <span className="hidden sm:inline">Manage users</span>
                    <span className="sm:hidden">Users</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
