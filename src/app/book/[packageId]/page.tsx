"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BookPackagePage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;

  const [phone, setPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, phone, peopleCount }),
    });

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Thank you!</h1>
        <p className="text-gray-600 mb-4">
          Your interest has been sent. Our team will contact you shortly.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          Back to homepage
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Book This Package</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Phone Number</label>
          <input
            type="tel"
            className="w-full border rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">No. of People</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded px-3 py-2"
            value={peopleCount}
            onChange={(e) => setPeopleCount(Number(e.target.value))}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Sending..." : "Submit"}
        </button>
      </form>
    </main>
  );
}
