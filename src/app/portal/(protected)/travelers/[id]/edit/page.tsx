// src/app/portal/(protected)/travelers/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { FlightSegment, emptyFlightSegment } from "@/src/lib/flightBookingTypes";
import { VisaRow, PROCESSING_TYPES, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

export default function EditPackageBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);

  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [transports, setTransports] = useState<TransportRow[]>([]);
  const [flights, setFlights] = useState<FlightSegment[]>([]);
  const [visas, setVisas] = useState<VisaRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/travelers/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();

        setHeader({
          agentName: data.agentName || "",
          guestName: data.guestName || "",
          nationality: data.nationality || "",
          mobileNo: data.mobileNo || "",
          referenceNo: data.referenceNo || "",
          currency: data.currency || "USD",
        });

        setFooter({
          discount: data.discount || 0,
          vatPercent: data.vatPercent || 0,
          paymentType: data.paymentType || "",
          note: data.note || "",
        });

        setHotels(
          (data.hotels || []).map((h: any) => ({
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
            buyingCostPerNight: h.buyingCostPerNight,
            sellingPricePerNight: h.sellingPricePerNight,
          }))
        );

        setTransports(
          (data.transportSegments || []).map((t: any) => ({
            id: t.id,
            vehicle: t.vehicle,
            sector: t.sector,
            pickupDate: t.pickupDate ? t.pickupDate.slice(0, 10) : "",
            pickupTime: t.pickupTime || "",
            qty: t.qty,
            buyingCost: t.buyingCost,
            sellingPrice: t.sellingPrice,
          }))
        );

        setFlights(
          (data.flightSegments || []).map((s: any) => {
            let datePart = "";
            let departureTimePart = "";
            let arrivalTimePart = "";

            if (s.departureDateTime) {
              const depObj = new Date(s.departureDateTime);
              if (!isNaN(depObj.getTime())) {
                const parts = depObj.toISOString().split("T");
                datePart = parts[0];
                if (parts[1]) departureTimePart = parts[1].slice(0, 5);
              }
            }

            if (s.arrivalDateTime) {
              const arrObj = new Date(s.arrivalDateTime);
              if (!isNaN(arrObj.getTime())) {
                const parts = arrObj.toISOString().split("T");
                if (parts[1]) arrivalTimePart = parts[1].slice(0, 5);
              }
            }

            return {
              date: datePart,
              airline: s.airline || "",
              flightNo: s.flightNo || "",
              pnr: s.pnr || "",
              fromAirport: s.departureAirport || "",
              toAirport: s.arrivalAirport || "",
              departureTime: departureTimePart,
              arrivalTime: arrivalTimePart,
              travelClass: s.travelClass || "",
              adults: s.adults ?? 1,
              children: s.children ?? 0,
              infants: s.infants ?? 0,
              baggage: s.baggage || "",
              buyingCost: s.buyingCost ?? 0,
              sellingPrice: s.sellingPrice ?? 0,
            };
          })
        );

        setVisas(
          (data.visaEntries || []).map((v: any) => ({
            id: v.id,
            visaCategory: v.visaCategory,
            applicantName: v.applicantName,
            passportNumber: v.passportNumber,
            processingType: v.processingType || "",
            submissionDate: v.submissionDate ? v.submissionDate.slice(0, 10) : "",
            expiryDate: v.expiryDate ? v.expiryDate.slice(0, 10) : "",
            buyingCost: v.buyingCost,
            sellingPrice: v.sellingPrice,
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Could not load this package booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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

  // ---- Flight segment helpers (index-keyed) ----
  function updateFlightSegment(index: number, field: keyof FlightSegment, value: string | number) {
    setFlights((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }
  function addFlightSegment() {
    setFlights((prev) => [...prev, { ...emptyFlightSegment }]);
  }
  function removeFlightSegment(index: number) {
    setFlights((prev) => prev.filter((_, i) => i !== index));
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

  const combinedLineItems = [
    ...hotels.map((r) => ({ buyingCost: r.buyingCostPerNight, sellingPrice: r.sellingPricePerNight })),
    ...transports.map((r) => ({ buyingCost: r.buyingCost, sellingPrice: r.sellingPrice })),
    ...flights.map((r: any) => ({
      buyingCost: parseFloat(r.buyingCost) || 0,
      sellingPrice: parseFloat(r.sellingPrice) || 0,
    })),
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
      const res = await fetch(`/api/travelers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...header,
          ...footer,
          hotels,
          transports,
          flights,
          visas,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      router.push("/portal/travelers/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Edit Package Booking</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-4 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        {/* ---- HOTELS ---- */}
        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Hotels</legend>

          {hotels.length === 0 && <p className="text-sm text-gray-500 mb-2">No hotels added.</p>}

          {hotels.map((row, index) => (
            <div key={row.id} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Hotel {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeHotelRow(row.id)}>
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="block">Hotel Name</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.hotelName}
                  onChange={(e) => updateHotelRow(row.id, "hotelName", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">City</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.city}
                  onChange={(e) => updateHotelRow(row.id, "city", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Room Type</label>
                <select
                  className="border p-2 w-full"
                  value={row.roomType}
                  onChange={(e) => updateHotelRow(row.id, "roomType", e.target.value)}
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Check-in</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={row.checkIn}
                    onChange={(e) => updateHotelRow(row.id, "checkIn", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Check-out</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={row.checkOut}
                    onChange={(e) => updateHotelRow(row.id, "checkOut", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="block">Rooms</label>
                  <input
                    type="number"
                    min={1}
                    className="border p-2 w-full"
                    value={row.rooms}
                    onChange={(e) => updateHotelRow(row.id, "rooms", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block">Adults</label>
                  <input
                    type="number"
                    min={1}
                    className="border p-2 w-full"
                    value={row.adults}
                    onChange={(e) => updateHotelRow(row.id, "adults", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block">Children</label>
                  <input
                    type="number"
                    min={0}
                    className="border p-2 w-full"
                    value={row.children}
                    onChange={(e) => updateHotelRow(row.id, "children", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block">Infants</label>
                  <input
                    type="number"
                    min={0}
                    className="border p-2 w-full"
                    value={row.infants}
                    onChange={(e) => updateHotelRow(row.id, "infants", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block">Meal Plan</label>
                <select
                  className="border p-2 w-full"
                  value={row.mealPlan}
                  onChange={(e) => updateHotelRow(row.id, "mealPlan", e.target.value)}
                >
                  <option value="">Select meal plan</option>
                  {MEAL_PLANS.map((mp) => (
                    <option key={mp.value} value={mp.value}>
                      {mp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Confirmation No.</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.confirmationNo}
                  onChange={(e) => updateHotelRow(row.id, "confirmationNo", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Buying Cost / Night</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.buyingCostPerNight}
                    onChange={(e) =>
                      updateHotelRow(row.id, "buyingCostPerNight", parseFloat(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block">Selling Price / Night</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.sellingPricePerNight}
                    onChange={(e) =>
                      updateHotelRow(row.id, "sellingPricePerNight", parseFloat(e.target.value) || 0)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addHotelRow}>
            + Add Hotel
          </button>
        </fieldset>

        {/* ---- TRANSPORTS ---- */}
        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Transports</legend>

          {transports.length === 0 && <p className="text-sm text-gray-500 mb-2">No transports added.</p>}

          {transports.map((row, index) => (
            <div key={row.id} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Transport {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeTransportRow(row.id)}>
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="block">Vehicle</label>
                <select
                  className="border p-2 w-full"
                  value={row.vehicle}
                  onChange={(e) => updateTransportRow(row.id, "vehicle", e.target.value)}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Sector</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  placeholder="e.g. Jeddah to Makkah"
                  value={row.sector}
                  onChange={(e) => updateTransportRow(row.id, "sector", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Pickup Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={row.pickupDate}
                    onChange={(e) => updateTransportRow(row.id, "pickupDate", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Pickup Time</label>
                  <input
                    type="time"
                    className="border p-2 w-full"
                    value={row.pickupTime}
                    onChange={(e) => updateTransportRow(row.id, "pickupTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="border p-2 w-full"
                  value={row.qty}
                  onChange={(e) => updateTransportRow(row.id, "qty", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Buying Cost (Total)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.buyingCost}
                    onChange={(e) => updateTransportRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Selling Price (Total)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.sellingPrice}
                    onChange={(e) => updateTransportRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addTransportRow}>
            + Add Transport
          </button>
        </fieldset>

        {/* ---- FLIGHTS ---- */}
        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Flights</legend>

          {flights.length === 0 && <p className="text-sm text-gray-500 mb-2">No flights added.</p>}

          {flights.map((seg, index) => (
            <div key={index} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Flight Segment {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeFlightSegment(index)}>
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={seg.date}
                    onChange={(e) => updateFlightSegment(index, "date", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Airline</label>
                  <input
                    type="text"
                    className="border p-2 w-full"
                    value={seg.airline}
                    onChange={(e) => updateFlightSegment(index, "airline", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Flight No.</label>
                  <input
                    type="text"
                    className="border p-2 w-full"
                    value={seg.flightNo}
                    onChange={(e) => updateFlightSegment(index, "flightNo", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block">PNR</label>
                  <input
                    type="text"
                    className="border p-2 w-full"
                    value={seg.pnr}
                    onChange={(e) => updateFlightSegment(index, "pnr", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">From Airport</label>
                  <input
                    type="text"
                    className="border p-2 w-full"
                    value={seg.fromAirport}
                    onChange={(e) => updateFlightSegment(index, "fromAirport", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block">To Airport</label>
                  <input
                    type="text"
                    className="border p-2 w-full"
                    value={seg.toAirport}
                    onChange={(e) => updateFlightSegment(index, "toAirport", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Departure Time</label>
                  <input
                    type="time"
                    className="border p-2 w-full"
                    value={seg.departureTime}
                    onChange={(e) => updateFlightSegment(index, "departureTime", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block">Arrival Time</label>
                  <input
                    type="time"
                    className="border p-2 w-full"
                    value={seg.arrivalTime}
                    onChange={(e) => updateFlightSegment(index, "arrivalTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block">Class (Economy/Business)</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={seg.travelClass}
                  onChange={(e) => updateFlightSegment(index, "travelClass", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="block">Adults</label>
                  <input
                    type="number"
                    className="border p-2 w-full"
                    value={seg.adults}
                    onChange={(e) => updateFlightSegment(index, "adults", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block">Children</label>
                  <input
                    type="number"
                    className="border p-2 w-full"
                    value={seg.children}
                    onChange={(e) => updateFlightSegment(index, "children", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block">Infants</label>
                  <input
                    type="number"
                    className="border p-2 w-full"
                    value={seg.infants}
                    onChange={(e) => updateFlightSegment(index, "infants", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block">Baggage</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={seg.baggage}
                  onChange={(e) => updateFlightSegment(index, "baggage", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Buying Cost (Total)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={seg.buyingCost}
                    onChange={(e) => updateFlightSegment(index, "buyingCost", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Selling Price (Total)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={seg.sellingPrice}
                    onChange={(e) => updateFlightSegment(index, "sellingPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addFlightSegment}>
            + Add Flight Segment
          </button>
        </fieldset>

        {/* ---- VISAS ---- */}
        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Visas</legend>

          {visas.length === 0 && <p className="text-sm text-gray-500 mb-2">No visas added.</p>}

          {visas.map((row, index) => (
            <div key={row.id} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Applicant {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeVisaRow(row.id)}>
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="block">Visa Category</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  placeholder="e.g. Saudi Umrah, UK Tourist, Schengen Business"
                  value={row.visaCategory}
                  onChange={(e) => updateVisaRow(row.id, "visaCategory", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Applicant Name</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.applicantName}
                  onChange={(e) => updateVisaRow(row.id, "applicantName", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Passport Number</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.passportNumber}
                  onChange={(e) => updateVisaRow(row.id, "passportNumber", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Processing Type</label>
                <select
                  className="border p-2 w-full"
                  value={row.processingType}
                  onChange={(e) => updateVisaRow(row.id, "processingType", e.target.value)}
                >
                  <option value="">Select processing type</option>
                  {PROCESSING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Submission Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={row.submissionDate}
                    onChange={(e) => updateVisaRow(row.id, "submissionDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block">Expiry Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full"
                    value={row.expiryDate}
                    onChange={(e) => updateVisaRow(row.id, "expiryDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block">Buying Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.buyingCost}
                    onChange={(e) => updateVisaRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full"
                    value={row.sellingPrice}
                    onChange={(e) => updateVisaRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addVisaRow}>
            + Add Visa Applicant
          </button>
        </fieldset>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
        />

        <button type="submit" className="border px-4 py-2 font-bold" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}