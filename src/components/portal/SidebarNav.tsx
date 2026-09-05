"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { IconLogout } from "./NavIcons";

export function RailNavLink({
  href,
  icon,
  children,
  indent = false,
  hideInRail = false,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  indent?: boolean;
  // Add pages are hidden from the collapsed rail — every Manage page has a
  // "+ Add" button, so nothing becomes unreachable, and eight distinct
  // icons read far better at 64px than sixteen near-identical ones.
  hideInRail?: boolean;
}) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  // "/portal" must be exact, or it would light up on every single page.
  const active = href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  if (collapsed && hideInRail) return null;

  return (
    <Link
      href={href}
      title={collapsed ? String(children) : undefined}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center rounded-lg text-sm transition-colors ${
        collapsed ? "justify-center h-11 w-11 mx-auto" : `gap-3 px-4 py-2.5 ${indent ? "pl-6" : ""}`
      } ${active ? "bg-white/10 text-white font-semibold" : "text-[#c9c9c9] hover:bg-white/5 hover:text-white"}`}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r"
          style={{ backgroundColor: "var(--agency-color)" }}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

export function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  // Collapsed: the heading becomes a hairline divider so the icon groups
  // still read as groups.
  if (collapsed) return <div className="mx-auto my-2 h-px w-6 bg-white/10" />;
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
      {children}
    </p>
  );
}

export function SidebarBrand({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex items-center border-b border-white/10 shrink-0 ${
        collapsed ? "justify-center px-2 py-5" : "gap-3 px-6 pt-7 pb-5"
      }`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className={collapsed ? "h-7 w-7 object-contain" : "h-9 w-auto"} />
      ) : collapsed ? (
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg font-black text-sm text-white"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          {(name || "P").charAt(0).toUpperCase()}
        </span>
      ) : (
        <h2 className="font-black uppercase text-lg tracking-tight leading-none">{name || "Portal"}</h2>
      )}
    </div>
  );
}

export function SidebarLogoutButton() {
  const { collapsed } = useSidebar();
  return (
    <button
      title={collapsed ? "Log out" : undefined}
      className={`text-sm font-semibold text-[#D2232A] hover:text-white transition ${
        collapsed ? "flex h-10 w-10 items-center justify-center rounded-lg mx-auto hover:bg-white/5" : "w-full text-left"
      }`}
    >
      {collapsed ? <IconLogout /> : "Log out"}
    </button>
  );
}