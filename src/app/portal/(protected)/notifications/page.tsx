"use client";
 
import { useEffect, useState } from "react";
 
type Inquiry = {
  id: string;
  phone: string;
  peopleCount: number;
  createdAt: string;
  package: { title: string };
};
 
export default function NotificationsPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
 
  async function loadInquiries() {
    const res = await fetch("/api/inquiries");
    const data = await res.json();
    setInquiries(data);
    setLoading(false);
  }
 
  useEffect(() => {
    loadInquiries();
    // For now, we re-check every 10 seconds so new inquiries show up
    // without a manual refresh. This is a simple stand-in for true
    // real-time updates - we'll upgrade this to Supabase Realtime
    // (instant push, no polling) once this basic version is confirmed working.
    const interval = setInterval(loadInquiries, 10000);
    return () => clearInterval(interval);
  }, []);
 
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>
 
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : inquiries.length === 0 ? (
        <p className="text-gray-500">No inquiries yet.</p>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inq) => (
            <li key={inq.id} className="border rounded p-4">
              <p className="font-medium">{inq.package.title}</p>
              <p className="text-sm text-gray-600">
                {inq.peopleCount} people · {inq.phone}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(inq.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 