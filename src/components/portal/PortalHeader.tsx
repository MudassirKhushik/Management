// src/components/portal/PortalHeader.tsx
"use client";

import { usePathname } from "next/navigation";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

function formatSegment(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PortalHeader() {
  const pathname = usePathname() || "/portal";
  const { agencyName, primaryColor } = useAgencyTheme();

  const segments = pathname.split("/").filter(Boolean).slice(1); // drop leading "portal"
  const parts = ["Dashboard", ...segments.map(formatSegment)];

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-black/5">
      <nav className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">›</span>}
            <span className={i === parts.length - 1 ? "font-semibold text-[#121212]" : ""}>{p}</span>
          </span>
        ))}
      </nav>
      {agencyName && (
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
          {agencyName}
        </div>
      )}
    </header>
  );
}