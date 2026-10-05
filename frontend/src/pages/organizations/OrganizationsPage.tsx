import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getOrganizationsList } from "../../services/organizationService";
import type { Organization } from "../../types/organization";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrganizations() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrganizationsList();
      setOrganizations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load organizations",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Organizations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage organizations using the support platform.
          </p>
        </div>

        <Link
          to="/organizations/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create Organization
        </Link>
      </div>

      {loading && (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
          Loading organizations...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Slug
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {organizations.map((organization) => (
                <tr key={organization.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {organization.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {organization.slug}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {organizations.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
