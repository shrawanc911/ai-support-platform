import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getUsers, updateUser } from "../../services/adminUserService";
import { getOrganizationsList } from "../../services/organizationService";

import type { User, UserRole } from "../../types/user";
import type { Organization } from "../../types/organization";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "AGENT", label: "Agent" },
  { value: "MANAGER", label: "Manager" },
];

export default function UsersPage() {
  const { organizationId } = useParams<{ organizationId: string }>();

  const [users, setUsers] = useState<User[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const loadUsers = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [userData, organizationData] = await Promise.all([
        getUsers(organizationId),
        getOrganizationsList(),
      ]);

      setUsers(userData);
      setOrganization(
        organizationData.find((item: any) => item.id === organizationId) ??
          null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function changeRole(user: User, role: UserRole) {
    if (user.role === role || saving) return;
    if (!organizationId) return;
    try {
      setSaving(user.id);
      setError("");

      const updated = await updateUser(organizationId, user.id, { role });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(user: User) {
    if (saving) return;
    if (!organizationId) return;

    try {
      setSaving(user.id);
      setError("");

      const updated = await updateUser(organizationId, user.id, {
        is_active: !user.is_active,
      });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update account status.",
      );
    } finally {
      setSaving(null);
    }
  }

  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.length - activeUsers;

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query);

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center gap-3 text-sm text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        Loading organization users...
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6 bg-gray-50/60 p-4 sm:p-6">
      <Link
        to="/organizations"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <span aria-hidden="true">←</span>
        All organizations
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Organization management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {organization?.name ?? "Organization users"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage member roles and account access for this organization.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-500">Organization members</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total users</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeUsers}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-gray-500">
            {inactiveUsers}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900">Organization users</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search members and change their roles or account status.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              aria-label="Filter by role"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="AGENT">Agents</option>
              <option value="MANAGER">Managers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Account status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Access
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-gray-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      aria-label={`Role for ${user.name}`}
                      value={user.role}
                      disabled={saving !== null || user.role === "ADMIN"}
                      onChange={(event) =>
                        void changeRole(user, event.target.value as UserRole)
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    >
                      {user.role === "ADMIN" && (
                        <option value="ADMIN">Admin</option>
                      )}
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {saving === user.id && (
                      <p className="mt-1 text-xs text-indigo-600">Saving...</p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.is_active ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={saving !== null || user.role === "ADMIN"}
                      onClick={() => void toggleActive(user)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.is_active
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                      👥
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                      {users.length === 0
                        ? "No users in this organization"
                        : "No matching users"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {users.length === 0
                        ? "Users belonging to this organization will appear here."
                        : "Try a different search term or role filter."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 sm:px-6">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
