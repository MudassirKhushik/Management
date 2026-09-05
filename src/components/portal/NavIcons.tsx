const p = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconDashboard = () => (
  <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
);
export const IconPackage = () => (
  <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M2 13h20" /></svg>
);
export const IconHotel = () => (
  <svg {...p}><path d="M3 20V9l9-5 9 5v11" /><path d="M3 20h18" /><path d="M9 20v-5h6v5" /></svg>
);
export const IconTransport = () => (
  <svg {...p}><path d="M5 17h14" /><path d="M4 17v-4.5L6 8h12l2 4.5V17" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>
);
export const IconFlight = () => (
  <svg {...p}><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7L9 11l-2 3H4l1.5 3L9 18.5V16l3-2 3.1 5.1a1 1 0 0 0 1.7-.9z" /></svg>
);
export const IconVisa = () => (
  <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><circle cx="8.5" cy="10.5" r="2" /><path d="M5 16c.6-1.6 2-2.4 3.5-2.4S11.4 14.4 12 16" /><path d="M15 10h4M15 14h4" /></svg>
);
export const IconMarketing = () => (
  <svg {...p}><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6.5a8 8 0 0 1 0 11" /></svg>
);
export const IconSettings = () => (
  <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 7 2.6h.1A2 2 0 1 1 11 2.6V3a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const IconBell = () => (
  <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const IconLogout = () => (
  <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);