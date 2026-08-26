// src/app/portal/(protected)/packages/manage/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PACKAGE_LIMIT = 20;

type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
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
  const cls = "w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white";
  const inner = (
    <span
      className={cls}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--agency-color)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      title={title}
    >
      {children}
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : <button type="button" onClick={onClick}>{inner}</button>;
}

export default function ManagePackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPackages() {
    setLoading(true);
    setError("");
    try {
      // PROTECTED portal-side listing, reads the agency from your login
      // session — different from the public /api/packages?agencySlug=...
      // route visitors use.
      const res = await fetch("/api/packages/mine");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      console.error(err);
      setError("Could not load packages. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  const filtered = packages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  const atLimit = packages.length >= PACKAGE_LIMIT;

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPackages((rows) => rows.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete this package.");
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-[#121212]">Manage Packages</h1>
        {atLimit ? (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
            {packages.length} / {PACKAGE_LIMIT} — limit reached
          </span>
        ) : (
          <button
            onClick={() => router.push("/portal/packages/add")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--agency-color)" }}
          >
            + Add Package
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">{packages.length} / {PACKAGE_LIMIT} packages used</p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Title</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Description</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#121212]">{p.title}</td>
                <td className="px-4 py-3 text-gray-600 max-w-sm truncate">{p.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <IconButton href={`/portal/packages/${p.id}/edit`} title="Edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(p.id)} title="Delete">
                      <TrashIcon />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                  {search ? "No matches." : "No packages yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}