// src/components/portal/NavLink.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

export function NavLink({
  href,
  children,
  indent = false,
}: {
  href: string;
  children: React.ReactNode;
  indent?: boolean;
}) {
  const pathname = usePathname();
  const { primaryColor, textColor } = useAgencyTheme();
  const isActive = pathname === href || (href !== "/portal" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`block rounded-lg transition-colors duration-150 ${
        indent ? "pl-8 pr-4 py-2 text-xs" : "px-4 py-2.5 text-sm font-semibold"
      }`}
      style={{
        backgroundColor: isActive ? primaryColor : "transparent",
        color: isActive ? textColor : "#B0B0B0",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </Link>
  );
}