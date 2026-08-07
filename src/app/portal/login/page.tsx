"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// Brand hex (hardcoded here — will move to CSS variables once globals.css is set up):
// black #121212, red #D2232A, gray #6B6B6B, cream #FAF7F2

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      <div className="w-full max-w-sm bg-white border-2 border-[#121212]">
        <div className="h-2 bg-[#D2232A]" />

        <div className="p-8">
          <h1 className="font-black uppercase text-2xl tracking-tight text-[#121212] mb-1">
            Travel<span className="text-[#D2232A]">Craft</span>
          </h1>

          <div className="flex items-center gap-2 my-3" aria-hidden="true">
            <span className="h-px w-8 border-t-2 border-dotted border-[#D2232A]" />
            <span className="text-xs text-[#D2232A]">✕</span>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] font-semibold">
              Agency Login
            </p>
          </div>

          <p className="text-xs text-[#6B6B6B] mb-6">Super admin? Leave agency name blank.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#121212] mb-1">
                Agency Name
              </label>
              <input
                className="w-full border-2 border-[#121212] px-3 py-2 text-sm focus:outline-none focus:border-[#D2232A]"
                placeholder="e.g. travelcraft"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#121212] mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border-2 border-[#121212] px-3 py-2 text-sm focus:outline-none focus:border-[#D2232A]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#121212] mb-1">
                Password
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border-2 border-[#121212] px-3 py-2 text-sm focus:outline-none focus:border-[#D2232A]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-semibold text-[#6B6B6B] hover:text-[#D2232A] whitespace-nowrap px-2"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="text-[#D2232A] text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#121212] hover:bg-[#D2232A] transition text-white font-semibold uppercase tracking-wide text-sm px-4 py-3"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}