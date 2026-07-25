"use client";
 
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
 
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
 
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false, // we handle the redirect ourselves, so we can show errors nicely
    });
 
    setLoading(false);
 
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/portal");
      router.refresh();
    }
  }
 
  return (
    <div className="max-w-sm mx-auto p-6 mt-20">
      <h1 className="text-xl font-semibold mb-4">Agency Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
 