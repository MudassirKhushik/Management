"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.7 18.7 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.7 18.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.07C24 5.68 18.63.4 12 .4S0 5.68 0 12.07c0 5.77 4.39 10.56 10.13 11.43v-8.09H7.08v-3.34h3.05V9.41c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.94h-1.51c-1.49 0-1.95.92-1.95 1.87v2.24h3.32l-.53 3.34h-2.79v8.09C19.61 22.63 24 17.84 24 12.07z" />
    </svg>
  );
}

const ACCENT = "#D2232A";

function ComingSoonButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      type="button"
      aria-disabled="true"
      onClick={(e) => e.preventDefault()}
      whileHover={{ scale: 1.02, borderColor: "#D2232A" }}
      whileTap={{ scale: 0.98 }}
      className="w-full border-2 border-[#E5E1D8] flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#8a8a8a] cursor-not-allowed relative transition-colors duration-200"
    >
      {icon}
      {label}
      <span className="absolute right-3 text-[9px] uppercase tracking-wide bg-[#EDEAE3] text-[#6B6B6B] px-2 py-0.5 rounded-full">
        Soon
      </span>
    </motion.button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT — brand panel with animated gradient border */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="md:w-1/2 relative overflow-hidden flex items-center justify-center px-10 py-16 md:py-0 text-white"
        style={{ backgroundColor: ACCENT }}
      >
        {/* Animated border on left side */}
        <motion.div
          className="absolute right-0 top-0 w-1 h-full"
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{ background: "linear-gradient(to bottom, #ffffff, #D2232A, #ffffff)" }}
        />

        {/* faint watermark dots */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 1.5px)",
            backgroundSize: "34px 34px",
          }}
        />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-sm text-center md:text-left"
        >
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-black uppercase text-4xl md:text-5xl tracking-tight leading-[0.95] mb-4"
          >
            MY Digital
            <br />
            Solutions
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center md:justify-start gap-2 mb-5"
            aria-hidden="true"
          >
            <span className="h-px w-10 border-t-2 border-dotted border-white/50" />
            <span className="text-sm text-white/80">✕</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg font-semibold mb-2"
          >
            Premium Travel Management System
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-sm text-white/80 leading-relaxed"
          >
            One platform to run bookings, invoicing, and your public storefront —
            built for travel agencies that want to look as good as they perform.
          </motion.p>
        </motion.div>
      </motion.div>

      {/* RIGHT — login form with enhanced border */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="md:w-1/2 flex items-center justify-center bg-white px-6 py-14 relative"
      >
        {/* Decorative border frame */}
        <div className="absolute inset-4 border-2 border-[#E5E1D8] pointer-events-none" />
        <div className="absolute inset-8 border border-[#E5E1D8] pointer-events-none" />
        
        {/* Animated corner accents */}
        <motion.div
          className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#D2232A]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
        <motion.div
          className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[#D2232A]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[#D2232A]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        />
        <motion.div
          className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#D2232A]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm relative z-10"
        >
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-black uppercase text-xl tracking-tight text-[#121212] mb-1"
          >
            Portal Login
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xs text-[#6B6B6B] mb-8"
          >
            Sign in with your registered email and password.
          </motion.p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#121212] mb-1">
                Email
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#D2232A" }}
                type="email"
                className="w-full border-2 border-[#121212] px-3 py-2 text-sm focus:outline-none transition-all duration-300"
                style={{ transition: "border-color 0.3s, box-shadow 0.3s" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#121212] mb-1">
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#D2232A" }}
                  type={showPassword ? "text" : "password"}
                  className="w-full border-2 border-[#121212] px-3 py-2 pr-10 text-sm focus:outline-none transition-all duration-300"
                  style={{ transition: "border-color 0.3s, box-shadow 0.3s" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#121212] transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </motion.button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#121212] text-white font-semibold uppercase tracking-wide text-sm px-4 py-3 relative overflow-hidden group"
            >
              <motion.span
                className="absolute inset-0 bg-[#D2232A]"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⟳
                  </motion.span>
                ) : (
                  "Login"
                )}
              </span>
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="flex items-center gap-3 my-5"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-[#E5E1D8]" />
            <span className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">or</span>
            <span className="h-px flex-1 bg-[#E5E1D8]" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="space-y-2"
          >
            <ComingSoonButton icon={<GoogleIcon />} label="Continue with Google" />
            <ComingSoonButton icon={<FacebookIcon />} label="Continue with Facebook" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}