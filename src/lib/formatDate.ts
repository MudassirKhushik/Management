// src/lib/formatDate.ts
// Central place for turning a stored date into the DD/MM/YYYY format we show everywhere.
// Use this any time a date is displayed on a Manage page, Edit page, or PDF —
// never format dates ad-hoc in individual components.

export function formatDateDDMMYYYY(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
}