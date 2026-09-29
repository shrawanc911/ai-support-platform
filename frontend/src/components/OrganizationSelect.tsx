import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, Building2 } from "lucide-react";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface OrganizationSelectProps {
  organizations: Organization[];
  value: string;
  onChange: (organizationId: string) => void;
  placeholder?: string;
}

export default function OrganizationSelect({
  organizations,
  value,
  onChange,
  placeholder = "Select organization",
}: OrganizationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOrganization = organizations.find(
    (organization) => organization.id === value
  );

  const filteredOrganizations = organizations.filter((organization) => {
    const searchValue = search.toLowerCase();

    return (
      organization.name.toLowerCase().includes(searchValue) ||
      organization.slug.toLowerCase().includes(searchValue)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleSelect = (organization: Organization) => {
    onChange(organization.id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      {/* Label */}
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Organization
      </label>

      {/* Select button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex w-full items-center justify-between
          rounded-xl border bg-white px-4 py-3
          text-left shadow-sm
          transition-all duration-200
          ${
            open
              ? "border-blue-500 ring-4 ring-blue-500/10"
              : "border-slate-200 hover:border-slate-300"
          }
        `}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 size={18} />
          </div>

          {selectedOrganization ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {selectedOrganization.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {selectedOrganization.slug}
              </p>
            </div>
          ) : (
            <span className="text-sm text-slate-400">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`
            shrink-0 text-slate-400 transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          {/* Search */}
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organization..."
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Organizations */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOrganizations.length > 0 ? (
              filteredOrganizations.map((organization) => {
                const isSelected =
                  organization.id === value;

                return (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() =>
                      handleSelect(organization)
                    }
                    className={`
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-3
                      text-left transition
                      ${
                        isSelected
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`
                        flex h-10 w-10 shrink-0 items-center
                        justify-center rounded-lg
                        ${
                          isSelected
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-500"
                        }
                      `}
                    >
                      <Building2 size={18} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`
                          truncate text-sm font-medium
                          ${
                            isSelected
                              ? "text-blue-700"
                              : "text-slate-900"
                          }
                        `}
                      >
                        {organization.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {organization.slug}
                      </p>
                    </div>

                    {/* Selected */}
                    {isSelected && (
                      <Check
                        size={18}
                        className="shrink-0 text-blue-600"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Search
                    size={18}
                    className="text-slate-400"
                  />
                </div>

                <p className="text-sm font-medium text-slate-700">
                  No organizations found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try a different search term
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-xs text-slate-400">
              {filteredOrganizations.length}{" "}
              {filteredOrganizations.length === 1
                ? "organization"
                : "organizations"}{" "}
              available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}