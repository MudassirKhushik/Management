// src/app/portal/(protected)/travelers/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import PaymentHistorySection from "@/src/components/booking/PaymentHistorySection";
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
import { FlightRow, emptyFlightRow, TRAVEL_CLASSES } from "@/src/lib/flightBookingTypes";
import { VisaRow, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { calculatePackageLineItems, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" — an ISO string
// from the API has seconds and a timezone the input silently rejects.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditPackageBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/travelers/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setHeader({
          agentName: data.agentName,
          guestName: data.guestName,
          nationality: data.nationality,
          mobileNo: data.mobileNo || "",
          referenceNo: data.referenceNo || "",
          currency: data.currency,
        });
        setFooter({
          discount: data.discount,
          vatPercent: data.vatPercent,
          paymentType: data.paymentType || "",
          note: data.note || "",
        });
        setVendorName(data.vendorName || "");
        setExchangeRate(String(data.exchangeRate || ""));
        setIncludeHotels(data.includeHotels);
        setIncludeTransports(data.includeTransports);
        setIncludeFlights(data.includeFlights);
        setIncludeVisas(data.includeVisas);

        // A toggled-off section has no saved rows — seed it with one blank
        // row so switching it on later doesn't show an empty section.
        if (data.hotels?.length) {
          setHotels(
            data.hotels.map((h: any) => ({
              id: h.id,
              hotelName: h.hotelName,
              city: h.city,
              roomType: h.roomType,
              checkIn: h.checkIn ? h.checkIn.slice(0, 10) : "",
              checkOut: h.checkOut ? h.checkOut.slice(0, 10) : "",
              rooms: h.rooms,
              adults: h.adults,
              children: h.children,
              infants: h.infants,
              mealPlan: h.mealPlan || "",
              confirmationNo: h.confirmationNo || "",
              adultBuyingPricePerNight: h.adultBuyingPricePerNight,
              adultSellingPricePerNight: h.adultSellingPricePerNight,
              childBuyingPricePerNight: h.childBuyingPricePerNight,
              childSellingPricePerNight: h.childSellingPricePerNight,
            }))
          );
        }
        if (data.transportSegments?.length) {
          setTransportSegments(
            data.transportSegments.map((s: any) => ({
              id: s.id,
              vehicle: s.vehicle,
              sector: s.sector,
              pickupDate: s.pickupDate ? s.pickupDate.slice(0, 10) : "",
              pickupTime: s.pickupTime || "",
              qty: s.qty,
              driverContact: s.driverContact || "",
              buyingCost: s.buyingCost,
              sellingPrice: s.sellingPrice,
            }))
          );
        }
        if (data.flightSegments?.length) {
          setFlightSegments(
            data.flightSegments.map((s: any) => ({
              id: s.id,
              airline: s.airline,
              flightNo: s.flightNo,
              pnr: s.pnr || "",
              departureAirport: s.departureAirport,
              arrivalAirport: s.arrivalAirport,
              departureDateTime: toLocalInput(s.departureDateTime),
              arrivalDateTime: toLocalInput(s.arrivalDateTime),
              travelClass: s.travelClass || TRAVEL_CLASSES[0],
              adults: s.adults,
              children: s.children,
              infants: s.infants,
              baggage: s.baggage || "",
              passengerNames: s.passengerNames ? s.passengerNames.split("\n").filter(Boolean) : [""],
              adultBuyingPricePerLeg: s.adultBuyingPricePerLeg,
              adultSellingPricePerLeg: s.adultSellingPricePerLeg,
              childBuyingPricePerLeg: s.childBuyingPricePerLeg,
              childSellingPricePerLeg: s.childSellingPricePerLeg,
              infantBuyingPricePerLeg: s.infantBuyingPricePerLeg,
              infantSellingPricePerLeg: s.infantSellingPricePerLeg,
            }))
          );
        }
        if (data.visaEntries?.length) {
          setVisaEntries(
            data.visaEntries.map((e: any) => ({
              id: e.id,
              visaCategory: e.visaCategory,
              applicantName: e.applicantName,
              passportNumber: e.passportNumber,
              companyName: e.companyName || "",
              processingType: e.processingType || "",
              submissionDate: e.submissionDate ? e.submissionDate.slice(0, 10) : "",
              expiryDate: e.expiryDate ? e.expiryDate.slice(0, 10) : "",
              buyingCost: e.buyingCost,
              sellingPrice: e.sellingPrice,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [id]);

  const rate = parseFloat(exchangeRate) || 1;

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
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: footer.discount,
    vatPercent: footer.vatPercent,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!includeHotels && !includeTransports && !includeFlights && !includeVisas) {
      setError("Select at least one section to include in this package.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/travelers/${id}`, {
        method: "PUT",
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
        throw new Error(errorData.error || "Server rejected the update");
      }
      router.push("/portal/travelers/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Package Booking</h1>

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
          bookingId={id}
          bookingType="package"
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Outside the <form> — PaymentHistorySection has its own form inside
          it, and nested forms are invalid HTML. */}
      <div className="mt-5">
        <PaymentHistorySection
          bookingType="package"
          bookingId={id}
          netTotal={totals.netTotal}
          currency={header.currency}
        />
      </div>
    </div>
  );
}