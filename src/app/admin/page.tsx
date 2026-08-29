"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BRAND = "#D2232A";

type Agency = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  publicSiteEnabled: boolean;
  users: { email: string }[];
};

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
// Power icon — toggles whether the agency's portal account is Active/Inactive
function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="2" x2="12" y2="12" strokeLinecap="round" />
    </svg>
  );
}
// Globe icon — toggles whether the agency's public website is On/Off
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconButton({
  href,
  onClick,
  children,
  title,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  title: string;
}) {
  const cls = "w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white";
  const inner = (
    <span
      className={cls}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      title={title}
    >
      {children}
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : <button type="button" onClick={onClick}>{inner}</button>;
}

// Colored by current state (green = on, gray = off) rather than swapping
// icons — the icon identifies WHICH toggle this is, the color shows its state.
function IconToggle({
  on,
  onClick,
  icon,
  title,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
        on ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
    >
      {icon}
    </button>
  );
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadAgencies() {
    const res = await fetch("/api/admin/agencies");
    const data = await res.json();
    setAgencies(data);
    setLoading(false);
  }

  useEffect(() => {
    loadAgencies();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/agencies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    loadAgencies();
  }

  async function togglePublicSite(id: string, current: boolean) {
    await fetch(`/api/admin/agencies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicSiteEnabled: !current }),
    });
    loadAgencies();
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = confirm(
      `Delete "${name}"? Agencies with existing bookings or inquiries will be deactivated instead of permanently deleted.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/agencies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();

      if (data.mode === "deactivated") {
        alert(`"${name}" has existing data, so it was deactivated instead of deleted.`);
      }

      loadAgencies();
    } catch (err) {
      console.error(err);
      alert("Could not delete this agency.");
    }
  }

  const filtered = agencies.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#121212]">Agencies</h1>
        <Link
          href="/admin/add"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          + Add Agency
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Slug</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Login Email</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Account</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Public Site</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#121212]">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600">/{a.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{a.users[0]?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${
                        a.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${
                        a.publicSiteEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {a.publicSiteEnabled ? "On" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <IconButton href={`/admin/${a.id}/edit`} title="Edit">
                        <EditIcon />
                      </IconButton>
                      <IconToggle
                        on={a.isActive}
                        onClick={() => toggleActive(a.id, a.isActive)}
                        icon={<PowerIcon />}
                        title={a.isActive ? "Deactivate Portal" : "Activate Portal"}
                      />
                      <IconToggle
                        on={a.publicSiteEnabled}
                        onClick={() => togglePublicSite(a.id, a.publicSiteEnabled)}
                        icon={<GlobeIcon />}
                        title={a.publicSiteEnabled ? "Disable Site" : "Enable Site"}
                      />
                      <IconButton onClick={() => handleDelete(a.id, a.name)} title="Delete">
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    {search ? "No matches." : "No agencies yet."}
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