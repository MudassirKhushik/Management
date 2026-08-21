// src/lib/contrastColor.ts
//
// Given any background hex color, returns readable black or white text.
// Needed because agency.primaryColor can be ANY color a future agency picks —
// white text on a light yellow, for example, would be unreadable without this.

export function getContrastColor(hex: string | null | undefined, fallback = "#D2232A"): "#121212" | "#FFFFFF" {
  const color = (hex || fallback).replace("#", "");
  if (color.length !== 6) return "#FFFFFF";

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Standard relative-luminance weighting for perceived brightness
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#121212" : "#FFFFFF";
}