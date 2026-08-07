// src/lib/countryList.ts
//
// Used by the Nationality dropdown in the Global Header on every form.
// This is a starter list of commonly-used countries for a Hajj/Umrah +
// general tours agency — add more any time, it's just a plain array.
// (A "searchable dropdown" just means a normal <select>, or later an
// autocomplete component, fed by this same array — no extra library
// needed yet.)

export const COUNTRIES: string[] = [
  "Pakistan",
  "Saudi Arabia",
  "United Arab Emirates",
  "India",
  "Bangladesh",
  "United Kingdom",
  "United States",
  "Canada",
  "Afghanistan",
  "Turkey",
  "Egypt",
  "Malaysia",
  "Indonesia",
  "China",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Iraq",
  "Iran",
  "Nigeria",
  "South Africa",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sri Lanka",
  "Nepal",
  "Philippines",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Yemen",
  "Sudan",
  "Somalia",
  "Kenya",
  "Singapore",
  "Japan",
  "South Korea",
  "Thailand",
  "Russia",
  "Other",
].sort((a, b) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));