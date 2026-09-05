"use client";

import { useCallback, useEffect, useState } from "react";
import { SidebarContext } from "./SidebarContext";

export default function SidebarShell({
  defaultCollapsed,
  primaryColor,
  sidebar,
  children,
}: {
  defaultCollapsed: boolean;
  primaryColor: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      // A cookie, not localStorage — the server layout reads it and renders
      // the correct width on first paint, so there's no expand-then-snap
      // flash on every navigation.
      document.cookie = `sidebar-collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="flex min-h-screen" style={{ ["--agency-color" as string]: primaryColor }}>
        <aside
          className={`shrink-0 bg-[#0E0E0E] text-white sticky top-0 h-screen flex flex-col transition-[width] duration-200 ease-out ${
            collapsed ? "w-16" : "w-64"
          }`}
        >
          {sidebar}
        </aside>

        {/* Edge handle — straddles the sidebar border and slides with it. */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
          className="fixed top-24 z-50 flex h-9 w-6 items-center justify-center rounded-r-lg border border-l-0 border-black/10 bg-white text-gray-500 shadow-sm transition-[left] duration-200 ease-out hover:text-[#121212] hover:shadow-md"
          style={{ left: collapsed ? "4rem" : "16rem" }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* min-w-0 is load-bearing: without it a wide manage table forces the
            flex item past the viewport and squeezes the sidebar instead of
            scrolling itself. */}
        <main className="flex-1 min-w-0 bg-[#FAF9F6] flex flex-col min-h-screen">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}