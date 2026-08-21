"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateHotelEntryTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";
import { useAgencyTheme, AgencyThemeProvider } from "@/src/hooks/useAgencyTheme";
import { getContrastColor } from "@/src/lib/contrastColor";

type Inquiry = { id: string };
type ArrivalEvent = {
  id: string;
  type: "hotel" | "transport" | "flight";
  guestName: string;
  date: string;
  detail: string;
  href: string;
};

function hotelBookingRevenue(b: any) {
  const rowTotals = (b.hotels || []).map((h: any) => calculateHotelEntryTotals(h));
  const { grossBuying, grossSelling } = sumLineItems(
    rowTotals.map((t: any) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
  );
  return calculateFooterTotals({ grossBuying, grossSelling, discount: b.discount, vatPercent: b.vatPercent });
}
function flatBookingRevenue(b: any, entries: any[]) {
  const { grossBuying, grossSelling } = sumLineItems(
    entries.map((e) => ({ buyingCost: e.buyingCost || 0, sellingPrice: e.sellingPrice || 0 }))
  );
  return calculateFooterTotals({ grossBuying, grossSelling, discount: b.discount, vatPercent: b.vatPercent });
}
function packageBookingRevenue(b: any) {
  const entries = [
    ...(b.hotels || []).map((h: any) => ({ buyingCost: h.buyingCostPerNight, sellingPrice: h.sellingPricePerNight })),
    ...(b.transportSegments || []).map((t: any) => ({ buyingCost: t.buyingCost, sellingPrice: t.sellingPrice })),
    ...(b.flightSegments || []).map((f: any) => ({ buyingCost: f.buyingCost, sellingPrice: f.sellingPrice })),
    ...(b.visaEntries || []).map((v: any) => ({ buyingCost: v.buyingCost, sellingPrice: v.sellingPrice })),
  ];
  const { grossBuying, grossSelling } = sumLineItems(entries);
  return calculateFooterTotals({ grossBuying, grossSelling, discount: b.discount, vatPercent: b.vatPercent });
}

function fmtDateDay(d: string | Date) {
  const date = new Date(d);
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  return `${datePart} (${weekday})`;
}

const TYPE_ICON: Record<string, string> = { hotel: "🏨", transport: "🚖", flight: "✈️" };
const TYPE_COLOR: Record<string, string> = {
  hotel: "bg-amber-100 text-amber-700",
  transport: "bg-blue-100 text-blue-700",
  flight: "bg-sky-100 text-sky-700",
};

// Transport events store their route in a free-text "sector" field like
// "Jeddah to Makkah" — parse it into From/To for a clearer arrivals display.
function parseSector(detail: string) {
  const match = detail.match(/^(.+?)\s+to\s+(.+?)(\s*·.*)?$/i);
  if (match) {
    return { from: match[1].trim(), to: match[2].trim(), rest: match[3]?.trim() || "" };
  }
  return null;
}

function ArrivalsWidget() {
  const [tab, setTab] = useState<"today" | "tomorrow" | "upcoming">("today");
  const [cache, setCache] = useState<Record<string, ArrivalEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (cache[tab]) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/dashboard/arrivals?range=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        setCache((c) => ({ ...c, [tab]: data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  const events = (cache[tab] || []).filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return ev.guestName.toLowerCase().includes(q) || ev.detail.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="flex items-center border-b border-black/5">
      <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs px-2.5 py-1.5 w-32 md:w-44 mx-2 my-1.5"
        />
        <div className="flex flex-1">
          {(["today", "tomorrow", "upcoming"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t ? "text-[#D2232A] border-b-2 border-[#D2232A]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "today" ? "Today" : t === "tomorrow" ? "Tomorrow" : "Upcoming"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-400 py-6 text-center">Loading arrivals...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            {search ? "No matches." : `No ${tab === "today" ? "arrivals today" : tab === "tomorrow" ? "arrivals tomorrow" : "upcoming arrivals in the next 30 days"}.`}
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => {
              const route = ev.type === "transport" ? parseSector(ev.detail) : null;
              return (
                <Link
                  key={ev.id}
                  href={ev.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-black/[0.02] transition"
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0 ${TYPE_COLOR[ev.type]}`}>
                    {TYPE_ICON[ev.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{ev.guestName}</p>
                    {route ? (
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <span className="font-medium text-gray-700">{route.from}</span>
                        <span>→</span>
                        <span className="font-medium text-gray-700">{route.to}</span>
                        {route.rest && <span className="text-gray-400">· {route.rest}</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 truncate">{ev.detail}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-400 shrink-0">{fmtDateDay(ev.date)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueBar({ totalRevenue, totalProfit }: { totalRevenue: number; totalProfit: number }) {
  const { primaryColor, textColor } = useAgencyTheme();
  const [showProfit, setShowProfit] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const dayStr = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dimText = textColor === "#FFFFFF" ? "rgba(255,255,255,0.7)" : "rgba(18,18,18,0.7)";

  return (
    <div className="rounded-2xl p-6 md:p-8 mb-6 shadow-lg" style={{ backgroundColor: primaryColor, color: textColor }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: dimText }}>
            Total Revenue (Net) · {dayStr}, {dateStr}
          </div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-baseline gap-2">
            {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-base font-medium" style={{ color: dimText }}>PKR</span>
          </div>
        </div>

        {/* Profit sits directly under the button, opposite the revenue number —
            not a separate full-width section. */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => setShowProfit((v) => !v)}
            className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full transition"
            style={{ backgroundColor: textColor === "#FFFFFF" ? "rgba(255,255,255,0.15)" : "rgba(18,18,18,0.1)", color: textColor }}
          >
            {showProfit ? "Hide Profit" : "Show Profit"}
          </button>
          {showProfit && (
            <div className="text-right">
              <div className="text-[10px] font-medium tracking-wider uppercase" style={{ color: dimText }}>
                Net Profit
              </div>
              <div className="text-xl font-bold">
                {totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-xs font-medium ml-1" style={{ color: dimText }}>PKR</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardInner() {
  const [packages, setPackages] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [visas, setVisas] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const results = await Promise.allSettled([
          fetch("/api/travelers"),
          fetch("/api/hotel-bookings"),
          fetch("/api/transport-bookings"),
          fetch("/api/flight-bookings"),
          fetch("/api/visa-bookings"),
          fetch("/api/inquiries"),
        ]);
        const parseResult = async (result: PromiseSettledResult<Response>) => {
          if (result.status === "fulfilled" && result.value.ok) {
            try {
              const text = await result.value.text();
              return text.trim() ? JSON.parse(text) : [];
            } catch {
              return [];
            }
          }
          return [];
        };
        const [packagesData, hotelsData, transportsData, flightsData, visasData, inquiriesData] = await Promise.all([
          parseResult(results[0]),
          parseResult(results[1]),
          parseResult(results[2]),
          parseResult(results[3]),
          parseResult(results[4]),
          parseResult(results[5]),
        ]);
        setPackages(packagesData);
        setHotels(hotelsData);
        setTransports(transportsData);
        setFlights(flightsData);
        setVisas(visasData);
        setInquiries(inquiriesData);
      } catch (error) {
        console.error("Dashboard error handled safely:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  let totalRevenue = 0;
  let totalProfit = 0;
  try {
    const all = [
      ...hotels.map((b) => hotelBookingRevenue(b)),
      ...transports.map((b) => flatBookingRevenue(b, b.segments || [])),
      ...flights.map((b) => flatBookingRevenue(b, b.segments || [])),
      ...visas.map((b) => flatBookingRevenue(b, b.entries || [])),
      ...packages.map((b) => packageBookingRevenue(b)),
    ];
    totalRevenue = all.reduce((sum, t) => sum + t.netTotal, 0);
    totalProfit = all.reduce((sum, t) => sum + t.profit, 0);
  } catch (err) {
    console.error("Revenue calculation error:", err);
  }

  const cards = [
    { label: "Package Bookings", value: packages.length, href: "/portal/travelers/manage", icon: "🧳", iconBg: "bg-red-500", barColor: "bg-red-500" },
    { label: "Hotel Bookings", value: hotels.length, href: "/portal/hotel-bookings/manage", icon: "🏨", iconBg: "bg-amber-500", barColor: "bg-amber-500" },
    { label: "Transport Bookings", value: transports.length, href: "/portal/transport-bookings/manage", icon: "🚖", iconBg: "bg-blue-500", barColor: "bg-blue-500" },
    { label: "Flight Bookings", value: flights.length, href: "/portal/flight-bookings/manage", icon: "✈️", iconBg: "bg-sky-500", barColor: "bg-sky-500" },
    { label: "Visa Bookings", value: visas.length, href: "/portal/visa-bookings/manage", icon: "🪪", iconBg: "bg-emerald-500", barColor: "bg-emerald-500" },
    { label: "New Inquiries", value: inquiries.length, href: "/portal/notifications", icon: "🔔", iconBg: "bg-purple-500", barColor: "bg-purple-500" },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 w-40 bg-gray-200 rounded-full"></div>
          <div className="h-28 w-full bg-gray-100 rounded-2xl"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#121212]">Dashboard</h1>
      </div>

      <RevenueBar totalRevenue={totalRevenue} totalProfit={totalProfit} />

      {/* Cards — icon + number share the top row (matches reference), label
          and a colored underline bar sit below. White card bg, dark bold
          numbers for maximum readability. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-xl p-4 border border-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-24"
          >
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-white text-base shrink-0 ${card.iconBg}`}>
                {card.icon}
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-[#121212] leading-none">{card.value}</span>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 truncate">{card.label}</div>
              <div className={`h-1 rounded-full mt-1.5 ${card.barColor}`} />
            </div>
          </Link>
        ))}
      </div>

      <ArrivalsWidget />
    </div>
  );
}

// Wraps in the same AgencyThemeProvider the sidebar uses, so the revenue bar
// picks up the agency's color automatically. Dashboard doesn't have direct
// session access as a client component, so it fetches agency info the same
// way the public site does.
export default function DashboardPage() {
  const [agency, setAgency] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        setAgency({
          name: session?.user?.agencyName || "",
          slug: session?.user?.agencySlug || "",
          city: null,
          primaryColor: session?.user?.agencyColor || null,
          logoUrl: session?.user?.agencyLogoUrl || null,
        });
      })
      .catch(() => setAgency(null));
  }, []);

  return (
    <AgencyThemeProvider agency={agency}>
      <DashboardInner />
    </AgencyThemeProvider>
  );
}