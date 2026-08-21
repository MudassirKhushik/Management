// src/hooks/useAgencyTheme.tsx

"use client";

import { createContext, useContext, ReactNode } from "react";
import { getContrastColor } from "@/src/lib/contrastColor";

interface AgencyThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  textColor: "#121212" | "#FFFFFF";
  agencyName: string;
  agencySlug: string;
  city: string | null;
  logoUrl: string | null;
}

const AgencyThemeContext = createContext<AgencyThemeContextType>({
  primaryColor: "#d2232a",
  secondaryColor: "#0A0A0A",
  textColor: "#FFFFFF",
  agencyName: "",
  agencySlug: "",
  city: null,
  logoUrl: null,
});

interface AgencyThemeProviderProps {
  children: ReactNode;
  agency: {
    name: string;
    slug: string;
    city: string | null;
    primaryColor: string | null;
    logoUrl: string | null;
  } | null;
}

export function AgencyThemeProvider({ children, agency }: AgencyThemeProviderProps) {
  const primaryColor = agency?.primaryColor || "#d2232a";

  const value: AgencyThemeContextType = {
    primaryColor,
    secondaryColor: "#0A0A0A",
    textColor: getContrastColor(primaryColor),
    agencyName: agency?.name || "",
    agencySlug: agency?.slug || "",
    city: agency?.city || null,
    logoUrl: agency?.logoUrl || null,
  };

  return <AgencyThemeContext.Provider value={value}>{children}</AgencyThemeContext.Provider>;
}

export function useAgencyTheme() {
  return useContext(AgencyThemeContext);
}