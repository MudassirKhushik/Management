"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Agency = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  users: { email: string }[];
};

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Agencies</h1>
        <Link href="/admin/add" className="bg-black text-white px-4 py-2 rounded text-sm">
          + Add Agency
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : agencies.length === 0 ? (
        <p className="text-gray-500">No agencies yet.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Slug</th>
              <th className="py-2">Login Email</th>
              <th className="py-2">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2">{a.name}</td>
                <td className="py-2">/{a.slug}</td>
                <td className="py-2">{a.users[0]?.email || "—"}</td>
                <td className="py-2">
                  <span className={a.isActive ? "text-green-600" : "text-red-600"}>
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => toggleActive(a.id, a.isActive)}
                    className="text-blue-600 hover:underline"
                  >
                    {a.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}