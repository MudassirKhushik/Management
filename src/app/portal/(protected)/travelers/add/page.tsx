// src/app/portal/(protected)/travelers/add/page.tsx
// No checkbox gate. All four service sections are always visible; each is
// independently addable/empty. "include" flags are derived server-side from
// whether a section actually has rows, not from a checkbox.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { HotelRow, ROOM_TYPES, MEAL_PLANS, emptyHotelRow } from "@/src/lib/hotelBookingTypes";
import { TransportRow, VEHICLE_TYPES, emptyTransportRow } from "@/src/lib/transportBookingTypes";
import { FlightSegment, TRAVEL_CLASSES, emptyFlightSegment } from "@/src/lib/flightBookingTypes";
import { VisaRow, PROCESSING_TYPES, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { sumLineItems, calculateHotelEntryTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function RowCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-[#121212]">{title}</span>
        <button
          type="button"
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
      style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
      onClick={onClick}
    >
      + {label}
    </button>
  );
}

export default function AddPackageBookingPage() {
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  // Every section starts EMPTY — no forced first row, no checkbox gate.
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [transports, setTransports] = useState<TransportRow[]>([]);
  const [flights, setFlights] = useState<FlightSegment[]>([]);
  const [visas, setVisas] = useState<VisaRow[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- Hotel row helpers ----
  function updateHotelRow(rowId: string, field: keyof HotelRow, value: string | number) {
    setHotels((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addHotelRow() {
    setHotels((rows) => [...rows, emptyHotelRow()]);
  }
  function removeHotelRow(rowId: string) {
    setHotels((rows) => rows.filter((row) => row.id !== rowId));
  }

  // ---- Transport row helpers ----
  function updateTransportRow(rowId: string, field: keyof TransportRow, value: string | number) {
    setTransports((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addTransportRow() {
    setTransports((rows) => [...rows, emptyTransportRow()]);
  }
  function removeTransportRow(rowId: string) {
    setTransports((rows) => rows.filter((row) => row.id !== rowId));
  }

  // ---- Flight segment helpers (id-keyed, matches the rebuilt standalone Flight form) ----
  function updateFlightSegment(rowId: string, field: keyof FlightSegment, value: string | number) {
    setFlights((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addFlightSegment() {
    setFlights((rows) => [...rows, emptyFlightSegment()]);
  }
  function removeFlightSegment(rowId: string) {
    setFlights((rows) => rows.filter((row) => row.id !== rowId));
  }

  // ---- Visa row helpers ----
  function updateVisaRow(rowId: string, field: keyof VisaRow, value: string | number) {
    setVisas((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addVisaRow() {
    setVisas((rows) => [...rows, emptyVisaRow()]);
  }
  function removeVisaRow(rowId: string) {
    setVisas((rows) => rows.filter((row) => row.id !== rowId));
  }

  // ---- Combined pricing across every section that currently has rows ----
  const hotelLineItems = hotels
    .filter((row) => row.checkIn && row.checkOut)
    .map((row) => calculateHotelEntryTotals(row))
    .map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }));

  const combinedLineItems = [
    ...hotelLineItems,
    ...transports.map((r) => ({ buyingCost: r.buyingCost, sellingPrice: r.sellingPrice })),
    ...flights.map((r) => ({ buyingCost: r.buyingCost, sellingPrice: r.sellingPrice })),
    ...visas.map((r) => ({ buyingCost: r.buyingCost, sellingPrice: r.sellingPrice })),
  ];

  const { grossBuying, grossSelling } = sumLineItems(combinedLineItems);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (hotels.length === 0 && transports.length === 0 && flights.length === 0 && visas.length === 0) {
      setError("Add at least one item (hotel, transport, flight, or visa) before saving.");
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
          paymentStatus,
          hotels,
          transports,
          flights,
          visas,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the booking");
      }

      router.push("/portal/travelers/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save this package booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Full Package Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <SectionCard title="Vendor">
          <div>
            <label className={labelClass}>Vendor Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Who you bought this package from (supplier, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </SectionCard>

        {/* ---- HOTELS — same fields as standalone Hotel Booking form ---- */}
        <SectionCard title="Hotels">
          {hotels.length === 0 && <p className="text-sm text-gray-400 mb-3">No hotels added yet.</p>}
          <div className="space-y-4">
            {hotels.map((row, index) => (
              <RowCard key={row.id} title={`Hotel ${index + 1}`} onRemove={() => removeHotelRow(row.id)}>
                <div>
                  <label className={labelClass}>Hotel Name</label>
                  <input type="text" className={inputClass} value={row.hotelName}
                    onChange={(e) => updateHotelRow(row.id, "hotelName", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" className={inputClass} value={row.city}
                    onChange={(e) => updateHotelRow(row.id, "city", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Room Type</label>
                  <select className={inputClass} value={row.roomType}
                    onChange={(e) => updateHotelRow(row.id, "roomType", e.target.value)}>
                    {ROOM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Meal Plan</label>
                  <select className={inputClass} value={row.mealPlan}
                    onChange={(e) => updateHotelRow(row.id, "mealPlan", e.target.value)}>
                    <option value="">Select meal plan</option>
                    {MEAL_PLANS.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Check-In Date</label>
                  <input type="date" className={inputClass} value={row.checkIn}
                    onChange={(e) => updateHotelRow(row.id, "checkIn", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Check-Out Date</label>
                  <input type="date" className={inputClass} value={row.checkOut}
                    onChange={(e) => updateHotelRow(row.id, "checkOut", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>No. of Rooms</label>
                  <input type="number" min={1} className={inputClass} value={row.rooms}
                    onChange={(e) => updateHotelRow(row.id, "rooms", parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className={labelClass}>Adults</label>
                  <input type="number" min={1} className={inputClass} value={row.adults}
                    onChange={(e) => updateHotelRow(row.id, "adults", parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className={labelClass}>Children</label>
                  <input type="number" min={0} className={inputClass} value={row.children}
                    onChange={(e) => updateHotelRow(row.id, "children", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelClass}>Infants</label>
                  <input type="number" min={0} className={inputClass} value={row.infants}
                    onChange={(e) => updateHotelRow(row.id, "infants", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelClass}>Confirmation / Voucher No</label>
                  <input type="text" className={inputClass} value={row.confirmationNo}
                    onChange={(e) => updateHotelRow(row.id, "confirmationNo", e.target.value)} />
                </div>
                <div />
                <div>
                  <label className={labelClass}>Buying Cost (Per Night)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.buyingCostPerNight}
                    onChange={(e) => updateHotelRow(row.id, "buyingCostPerNight", parseFloat(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className={labelClass}>Selling Price (Per Night)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.sellingPricePerNight}
                    onChange={(e) => updateHotelRow(row.id, "sellingPricePerNight", parseFloat(e.target.value) || 0)} required />
                </div>
              </RowCard>
            ))}
          </div>
          <AddRowButton label="Add Another Hotel" onClick={addHotelRow} />
        </SectionCard>

        {/* ---- TRANSPORTS — same fields as standalone Transport Booking form ---- */}
        <SectionCard title="Transports">
          {transports.length === 0 && <p className="text-sm text-gray-400 mb-3">No transports added yet.</p>}
          <div className="space-y-4">
            {transports.map((row, index) => (
              <RowCard key={row.id} title={`Transport ${index + 1}`} onRemove={() => removeTransportRow(row.id)}>
                <div>
                  <label className={labelClass}>Vehicle</label>
                  <select className={inputClass} value={row.vehicle}
                    onChange={(e) => updateTransportRow(row.id, "vehicle", e.target.value)}>
                    {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sector</label>
                  <input type="text" className={inputClass} placeholder="e.g. Jeddah to Makkah" value={row.sector}
                    onChange={(e) => updateTransportRow(row.id, "sector", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Pickup Date</label>
                  <input type="date" className={inputClass} value={row.pickupDate}
                    onChange={(e) => updateTransportRow(row.id, "pickupDate", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Pickup Time</label>
                  <input type="time" className={inputClass} value={row.pickupTime}
                    onChange={(e) => updateTransportRow(row.id, "pickupTime", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="number" min={1} className={inputClass} value={row.qty}
                    onChange={(e) => updateTransportRow(row.id, "qty", parseInt(e.target.value) || 1)} />
                </div>
                <div />
                <div>
                  <label className={labelClass}>Buying Cost (Total)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.buyingCost}
                    onChange={(e) => updateTransportRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className={labelClass}>Selling Price (Total)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.sellingPrice}
                    onChange={(e) => updateTransportRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)} required />
                </div>
              </RowCard>
            ))}
          </div>
          <AddRowButton label="Add Another Transport" onClick={addTransportRow} />
        </SectionCard>

        {/* ---- FLIGHTS — same fields as the rebuilt standalone Flight Booking form ---- */}
        <SectionCard title="Flights">
          {flights.length === 0 && <p className="text-sm text-gray-400 mb-3">No flights added yet.</p>}
          <div className="space-y-4">
            {flights.map((row, index) => (
              <RowCard key={row.id} title={`Segment ${index + 1}`} onRemove={() => removeFlightSegment(row.id)}>
                <div>
                  <label className={labelClass}>Airline</label>
                  <input type="text" className={inputClass} value={row.airline}
                    onChange={(e) => updateFlightSegment(row.id, "airline", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Flight No.</label>
                  <input type="text" className={inputClass} value={row.flightNo}
                    onChange={(e) => updateFlightSegment(row.id, "flightNo", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>PNR</label>
                  <input type="text" className={inputClass} value={row.pnr}
                    onChange={(e) => updateFlightSegment(row.id, "pnr", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Travel Class</label>
                  <select className={inputClass} value={row.travelClass}
                    onChange={(e) => updateFlightSegment(row.id, "travelClass", e.target.value)}>
                    {TRAVEL_CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Departure Airport</label>
                  <input type="text" className={inputClass} value={row.departureAirport}
                    onChange={(e) => updateFlightSegment(row.id, "departureAirport", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Arrival Airport</label>
                  <input type="text" className={inputClass} value={row.arrivalAirport}
                    onChange={(e) => updateFlightSegment(row.id, "arrivalAirport", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Departure Date</label>
                  <input type="date" className={inputClass} value={row.departureDate}
                    onChange={(e) => updateFlightSegment(row.id, "departureDate", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Departure Time</label>
                  <input type="time" className={inputClass} value={row.departureTime}
                    onChange={(e) => updateFlightSegment(row.id, "departureTime", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Arrival Date</label>
                  <input type="date" className={inputClass} value={row.arrivalDate}
                    onChange={(e) => updateFlightSegment(row.id, "arrivalDate", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Arrival Time</label>
                  <input type="time" className={inputClass} value={row.arrivalTime}
                    onChange={(e) => updateFlightSegment(row.id, "arrivalTime", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Adults</label>
                  <input type="number" min={1} className={inputClass} value={row.adults}
                    onChange={(e) => updateFlightSegment(row.id, "adults", parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className={labelClass}>Children</label>
                  <input type="number" min={0} className={inputClass} value={row.children}
                    onChange={(e) => updateFlightSegment(row.id, "children", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelClass}>Infants</label>
                  <input type="number" min={0} className={inputClass} value={row.infants}
                    onChange={(e) => updateFlightSegment(row.id, "infants", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelClass}>Baggage</label>
                  <input type="text" className={inputClass} placeholder="e.g. 30kg checked + 7kg cabin" value={row.baggage}
                    onChange={(e) => updateFlightSegment(row.id, "baggage", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Buying Cost (Total for this leg)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.buyingCost}
                    onChange={(e) => updateFlightSegment(row.id, "buyingCost", parseFloat(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className={labelClass}>Selling Price (Total for this leg)</label>
                  <input type="number" step="0.01" className={inputClass} value={row.sellingPrice}
                    onChange={(e) => updateFlightSegment(row.id, "sellingPrice", parseFloat(e.target.value) || 0)} required />
                </div>
              </RowCard>
            ))}
          </div>
          <AddRowButton label="Add Another Segment" onClick={addFlightSegment} />
        </SectionCard>

        {/* ---- VISAS — same fields as standalone Visa Booking form ---- */}
        <SectionCard title="Visas">
          {visas.length === 0 && <p className="text-sm text-gray-400 mb-3">No visa applicants added yet.</p>}
          <div className="space-y-4">
            {visas.map((row, index) => (
              <RowCard key={row.id} title={`Applicant ${index + 1}`} onRemove={() => removeVisaRow(row.id)}>
                <div>
                  <label className={labelClass}>Visa Category</label>
                  <input type="text" className={inputClass} placeholder="e.g. Saudi Umrah, UK Tourist, Schengen Business" value={row.visaCategory}
                    onChange={(e) => updateVisaRow(row.id, "visaCategory", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Applicant Name</label>
                  <input type="text" className={inputClass} value={row.applicantName}
                    onChange={(e) => updateVisaRow(row.id, "applicantName", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Passport Number</label>
                  <input type="text" className={inputClass} value={row.passportNumber}
                    onChange={(e) => updateVisaRow(row.id, "passportNumber", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Processing Type</label>
                  <select className={inputClass} value={row.processingType}
                    onChange={(e) => updateVisaRow(row.id, "processingType", e.target.value)}>
                    <option value="">Select processing type</option>
                    {PROCESSING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Submission Date</label>
                  <input type="date" className={inputClass} value={row.submissionDate}
                    onChange={(e) => updateVisaRow(row.id, "submissionDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input type="date" className={inputClass} value={row.expiryDate}
                    onChange={(e) => updateVisaRow(row.id, "expiryDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Buying Cost</label>
                  <input type="number" step="0.01" className={inputClass} value={row.buyingCost}
                    onChange={(e) => updateVisaRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className={labelClass}>Selling Price</label>
                  <input type="number" step="0.01" className={inputClass} value={row.sellingPrice}
                    onChange={(e) => updateVisaRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)} required />
                </div>
              </RowCard>
            ))}
          </div>
          <AddRowButton label="Add Another Applicant" onClick={addVisaRow} />
        </SectionCard>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
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