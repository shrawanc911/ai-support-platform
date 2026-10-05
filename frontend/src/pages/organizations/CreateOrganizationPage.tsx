import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";

import { createOrganization } from "../../services/organizationService";

export default function CreateOrganizationPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }

    if (!slug.trim()) {
      setError("Organization slug is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createOrganization({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      });

      navigate("/organizations");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/organizations"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to organizations
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Create Organization
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a new organization for the support platform.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Organization Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Acme Corporation"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Slug
          </label>

          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(event) =>
              setSlug(
                event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              )
            }
            placeholder="acme-corporation"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
          />

          <p className="mt-1 text-xs text-gray-500">
            The slug uniquely identifies the organization.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/organizations"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </form>
    </div>
  );
}
