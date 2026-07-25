"use client";
 
import { useEffect, useState } from "react";
 
type Traveler = { id: string; price: number };
type Inquiry = { id: string };
 
export default function DashboardPage() {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    async function loadStats() {
      const [travelersRes, inquiriesRes] = await Promise.all([
        fetch("/api/travelers"),
        fetch("/api/inquiries"),
      ]);
      setTravelers(await travelersRes.json());
      setInquiries(await inquiriesRes.json());
      setLoading(false);
    }
    loadStats();
  }, []);
 
  const totalValue = travelers.reduce((sum, t) => sum + t.price, 0);
 
  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }
 
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
 
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">Active Travelers</p>
          <p className="text-2xl font-bold">{travelers.length}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">Total Booking Value</p>
          <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-500">New Inquiries</p>
          <p className="text-2xl font-bold">{inquiries.length}</p>
        </div>
      </div>
 
      {/* Note: "profit" tracking isn't in the data model yet.
          When ready, we add a `profit` field to Traveler and a
          fourth card here summing it — small, isolated change. */}
    </div>
  );
}