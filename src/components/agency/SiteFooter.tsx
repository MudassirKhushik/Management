// src/components/agency/SiteFooter.tsx
type AgencyLite = { slug: string; name: string };

const SERVICES = [
  "Umrah Packages",
  "Flight Bookings",
  "Hotel Reservations",
  "Visa Consultation",
  "Honeymoon Packages",
  "Group Tours",
  "Pilgrimage",
];

export default function SiteFooter({ agency }: { agency: AgencyLite }) {
  return (
    <footer
      className="border-t-4 py-12 px-6"
      style={{ borderColor: "var(--tct-red)", backgroundColor: "var(--tct-black)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <h3 className="font-display text-2xl font-black uppercase text-white mb-2">
            {agency.name}
          </h3>
          <p className="text-sm" style={{ color: "#999999" }}>Crafting Your Dream Trip</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm" style={{ color: "#cccccc" }}>
          {SERVICES.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
      <p className="max-w-6xl mx-auto mt-8 pt-6 border-t text-xs" style={{ borderColor: "#333333", color: "#777777" }}>
        © {new Date().getFullYear()} {agency.name}. All rights reserved.
      </p>
    </footer>
  );
}