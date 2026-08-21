// src/lib/formatting.ts

/**
 * Splits any agency name into "everything but the last word" + "last word"
 * for the two-tone brand-style heading treatment
 */
export function splitName(name: string): { lead: string; last: string } {
  const words = name.trim().split(/\s+/);
  const last = words.pop() || name;
  return { lead: words.join(" "), last };
}

/**
 * Capitalizes first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}