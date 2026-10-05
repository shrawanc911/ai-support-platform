import { useEffect, useState } from "react";

import { getUsers, updateUser } from "../../services/adminUserService";

import type { User, UserRole } from "../../types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId: string, role: UserRole) {
    const updated = await updateUser(userId, { role });

    setUsers((current) =>
      current.map((user) =>
        user.id === updated.id ? updated : user,
      ),
    );
  }

  async function toggleActive(user: User) {
    const updated = await updateUser(user.id, {
      is_active: !user.is_active,
    });

    setUsers((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Loading users...
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage users, roles, and account access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-white px-4 py-2">
            <p className="text-xs text-gray-500">Total users</p>
            <p className="text-lg font-semibold text-gray-900">
              {users.length}
            </p>
          </div>

          <div className="rounded-lg border bg-white px-4 py-2">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-lg font-semibold text-gray-900">
              {activeUsers}
            </p>
          </div>

          <div className="hidden rounded-lg border bg-white px-4 py-2 sm:block">
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-lg font-semibold text-gray-900">
              {inactiveUsers}
            </p>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            All users
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Update roles or manage account access.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                        {user.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {user.name}
                        </p>

                        <p className="truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        changeRole(
                          user.id,
                          event.target.value as UserRole,
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    >
                      <option value="CUSTOMER">
                        Customer
                      </option>

                      <option value="AGENT">
                        Agent
                      </option>

                      <option value="MANAGER">
                        Manager
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      className={
                        user.is_active
                          ? "rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          : "rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      }
                    >
                      {user.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                          />
                        </svg>
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-gray-900">
                        No users found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        There are currently no users in
                        this organization.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}