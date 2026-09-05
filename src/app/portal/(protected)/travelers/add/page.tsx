// src/app/portal/(protected)/travelers/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import FlightSegmentFields from "@/src/components/booking/FlightSegmentFields";
import {
  HotelRowFields,
  TransportRowFields,
  VisaRowFields,
  SectionCard,
} from "@/src/components/booking/PackageSections";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { HotelRow, emptyHotelRow } from "@/src/lib/hotelBookingTypes";
import { TransportRow, emptyTransportRow } from "@/src/lib/transportBookingTypes";
import { FlightRow, emptyFlightRow } from "@/src/lib/flightBookingTypes";
import { VisaRow, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { calculatePackageLineItems, sumLineItems } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddPackageBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>({ ...emptyGlobalHeader, currency: "PKR" });
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");

  const [includeHotels, setIncludeHotels] = useState(false);
  const [includeTransports, setIncludeTransports] = useState(false);
  const [includeFlights, setIncludeFlights] = useState(false);
  const [includeVisas, setIncludeVisas] = useState(false);

  const [hotels, setHotels] = useState<HotelRow[]>([emptyHotelRow()]);
  const [transportSegments, setTransportSegments] = useState<TransportRow[]>([emptyTransportRow()]);
  const [flightSegments, setFlightSegments] = useState<FlightRow[]>([emptyFlightRow()]);
  const [visaEntries, setVisaEntries] = useState<VisaRow[]>([emptyVisaRow()]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialPaidAmount, setInitialPaidAmount] = useState("");
  const [initialBankAccountId, setInitialBankAccountId] = useState("");

  const rate = parseFloat(exchangeRate) || 1;

  // Only sections that are switched on contribute. Hotel lines are in SAR
  // and get converted by the rate inside this helper; the rest are PKR.
  const lines = calculatePackageLineItems(
    {
      hotels: includeHotels ? hotels : [],
      transportSegments: includeTransports ? transportSegments : [],
      flightSegments: includeFlights ? flightSegments : [],
      visaEntries: includeVisas ? visaEntries : [],
    },
    rate
  );
  const { grossBuying, grossSelling } = sumLineItems(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!includeHotels && !includeTransports && !includeFlights && !includeVisas) {
      setError("Select at least one section to include in this package.");
      return;
    }
    if (includeHotels && rate <= 1 && !exchangeRate) {
      setError("Enter an exchange rate — hotel prices are in SAR and need converting to PKR.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/travelers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...header,
          ...footer,
          vendorName,
          exchangeRate: rate,
          includeHotels,
          includeTransports,
          includeFlights,
          includeVisas,
          hotels,
          transportSegments,
          flightSegments,
          visaEntries,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the booking");
      }
      const created = await res.json();

      const paid = parseFloat(initialPaidAmount);
      if (paid > 0) {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingType: "package",
            bookingId: created.id,
            amount: paid,
            paidOn: new Date().toISOString().slice(0, 10),
            bankAccountId: initialBankAccountId || null,
          }),
        });
        if (!payRes.ok) {
          alert("Booking saved, but the initial payment could not be recorded. Please add it from the Edit page.");
        }
      }

      router.push("/portal/travelers/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save the booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Full Package Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Vendor &amp; Exchange Rate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Vendor Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Main supplier for this package"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Exchange Rate (1 SAR = ? PKR)</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 75"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                required={includeHotels}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Converts hotel prices (entered in SAR) into the package's PKR total.
              </p>
            </div>
          </div>
        </section>

        <SectionCard
          title="Hotels"
          enabled={includeHotels}
          onToggle={setIncludeHotels}
          onAdd={() => setHotels((r) => [...r, emptyHotelRow()])}
          addLabel="+ Add Another Hotel"
        >
          {hotels.map((row, i) => (
            <HotelRowFields
              key={row.id}
              row={row}
              index={i}
              exchangeRate={rate}
              onChange={(field, value) =>
                setHotels((rows) => rows.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))
              }
              onRemove={() => setHotels((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== row.id) : rows))}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Transport"
          enabled={includeTransports}
          onToggle={setIncludeTransports}
          onAdd={() => setTransportSegments((r) => [...r, emptyTransportRow()])}
          addLabel="+ Add Another Transfer"
        >
          {transportSegments.map((row, i) => (
            <TransportRowFields
              key={row.id}
              row={row}
              index={i}
              currency={header.currency}
              onChange={(field, value) =>
                setTransportSegments((rows) => rows.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))
              }
              onRemove={() =>
                setTransportSegments((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== row.id) : rows))
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Flights"
          enabled={includeFlights}
          onToggle={setIncludeFlights}
          onAdd={() => setFlightSegments((r) => [...r, emptyFlightRow()])}
          addLabel="+ Add Another Flight"
        >
          {flightSegments.map((row, i) => (
            <FlightSegmentFields
              key={row.id}
              row={row}
              index={i}
              currency={header.currency}
              onChange={(field, value) =>
                setFlightSegments((rows) => rows.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))
              }
              onRemove={() =>
                setFlightSegments((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== row.id) : rows))
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Visas"
          enabled={includeVisas}
          onToggle={setIncludeVisas}
          onAdd={() => setVisaEntries((r) => [...r, emptyVisaRow()])}
          addLabel="+ Add Another Applicant"
        >
          {visaEntries.map((row, i) => (
            <VisaRowFields
              key={row.id}
              row={row}
              index={i}
              currency={header.currency}
              onChange={(field, value) =>
                setVisaEntries((rows) => rows.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)))
              }
              onRemove={() => setVisaEntries((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== row.id) : rows))}
            />
          ))}
        </SectionCard>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          bookingType="package"
          initialPaidAmount={initialPaidAmount}
          onInitialPaidAmountChange={setInitialPaidAmount}
          initialBankAccountId={initialBankAccountId}
          onInitialBankAccountIdChange={setInitialBankAccountId}
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Package Booking"}
        </button>
      </form>
    </div>
  );
}