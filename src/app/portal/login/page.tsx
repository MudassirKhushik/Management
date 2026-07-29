"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const agencySlug = agencyName.trim().toLowerCase();

    if (agencySlug) {
      const checkRes = await fetch("/api/portal/check-agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencySlug }),
      });
      const checkData = await checkRes.json();

      if (!checkData.valid) {
        setError("No such agency exists.");
        setLoading(false);
        return;
      }
    }

    const res = await signIn("credentials", { agencySlug, email, password, redirect: false });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    setLoading(false);

    if (session?.user?.isSuperAdmin) {
      router.push("/admin");
    } else {
      router.push("/portal");
    }
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto p-6 mt-20">
      <h1 className="text-xl font-semibold mb-1">Agency Login</h1>
      <p className="text-xs text-gray-500 mb-4">Super admin? Leave agency name blank.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Agency Name</label>
          <input className="w-full border rounded px-3 py-2" placeholder="e.g. travelcraft" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-gray-500 whitespace-nowrap px-2"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded w-full">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}