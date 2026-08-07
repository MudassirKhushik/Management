"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
 
type Traveler = { id: string; price: number };
type Inquiry = { id: string };
type GenericBooking = { id: string };
 
export default function DashboardPage() {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [hotels, setHotels] = useState<GenericBooking[]>([]);
  const [transports, setTransports] = useState<GenericBooking[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    async function loadStats() {
      try {
        // Fetch all metrics using allSettled so one empty route won't crash the others
        const results = await Promise.allSettled([
          fetch("/api/travelers"),
          fetch("/api/inquiries"),
          fetch("/api/hotel-bookings"),
          fetch("/api/portal/transport-bookings"),
        ]);

        // Helper function to safely read responses as text before parsing
        const parseResult = async (result: PromiseSettledResult<Response>) => {
          if (result.status === "fulfilled" && result.value.ok) {
            try {
              const text = await result.value.text();
              return text.trim() ? JSON.parse(text) : [];
            } catch {
              return [];
            }
          }
          return [];
        };

        // Assign parsed results safely to individual states
        const [travelersData, inquiriesData, hotelsData, transportsData] = await Promise.all([
          parseResult(results[0]),
          parseResult(results[1]),
          parseResult(results[2]),
          parseResult(results[3]),
        ]);

        setTravelers(travelersData);
        setInquiries(inquiriesData);
        setHotels(hotelsData);
        setTransports(transportsData);
      } catch (error) {
        console.error("Dashboard critical unexpected error handled safely:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);
 
  const totalValue = travelers.reduce((sum, t) => sum + t.price, 0);
 
  if (loading) {
    return <div className="p-6 text-gray-500 font-medium">Loading workspace dashboard...</div>;
  }
 
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
 
      {/* 4-Card Multi-Tenant Metrics Row Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Active Travelers</p>
          <p className="text-2xl font-bold mt-1">{travelers.length}</p>
        </div>
        
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Booking Value</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{totalValue.toLocaleString()} PKR</p>
        </div>

        {/* Link Card: Hotel Bookings */}
        <Link 
          href="/portal/hotel-bookings/manage" 
          className="border rounded-lg p-4 bg-white shadow-sm block hover:border-amber-600 transition group"
        >
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 font-medium group-hover:text-amber-600 transition">Hotel Bookings</p>
            <span className="text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition">View All →</span>
          </div>
          <p className="text-2xl font-bold mt-1">{hotels.length}</p>
        </Link>

        {/* Link Card: Transport Bookings */}
        <Link 
          href="/portal/transport-bookings/manage" 
          className="border rounded-lg p-4 bg-white shadow-sm block hover:border-blue-600 transition group"
        >
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 font-medium group-hover:text-blue-600 transition">Transport Bookings</p>
            <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition">View All →</span>
          </div>
          <p className="text-2xl font-bold mt-1">{transports.length}</p>
        </Link>
      </div>

      {/* Action Shortcut Redirection Links */}
      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/portal/hotel-bookings/add" className="bg-amber-600 text-white px-4 py-2 rounded-md font-medium hover:bg-amber-700 transition">
          + Add Hotel Booking
        </Link>
        <Link href="/portal/transport-bookings/add" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition">
          + Add Transport Booking
        </Link>
      </div>
    </div>
  );
}
