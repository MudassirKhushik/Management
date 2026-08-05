"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { VisaEntry, emptyVisaEntry } from "@/src/lib/visaBookingTypes";

export default function EditVisaBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    agentName: "",
    agentNo: "",
    nationality: "",
    guestName: "",
    contactName: "",
    mobileNo: "",
    clientRefNo: "",
    groupNo: "",
    localRefNo: "",
    reservationNo: "",
    totalAmount: 0,
    subAmount: 0,
  });

  const [entries, setEntries] = useState<VisaEntry[]>([{ ...emptyVisaEntry }]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/visa-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();

        setForm({
          agentName: data.agentName || "",
          agentNo: data.agentNo || "",
          nationality: data.nationality || "",
          guestName: data.guestName || "",
          contactName: data.contactName || "",
          mobileNo: data.mobileNo || "",
          clientRefNo: data.clientRefNo || "",
          groupNo: data.groupNo || "",
          localRefNo: data.localRefNo || "",
          reservationNo: data.reservationNo || "",
          totalAmount: data.totalAmount,
          subAmount: data.subAmount,
        });

        setEntries(
          data.entries.map((e: any) => ({
            applicantName: e.applicantName,
            visaType: e.visaType,
            processingType: e.processingType || "",
            issueDate: e.issueDate ? e.issueDate.slice(0, 10) : "",
            expiryDate: e.expiryDate ? e.expiryDate.slice(0, 10) : "",
            visaFee: e.visaFee,
            serviceCharge: e.serviceCharge,
            confirmationNo: e.confirmationNo || "",
          }))
        );
      } catch (err) {
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEntry(index: number, field: keyof VisaEntry, value: string | number) {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addEntry() {
    setEntries((prev) => [...prev, { ...emptyVisaEntry }]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/visa-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, entries }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not save changes");
        return;
      }

      router.push("/portal/visa-bookings/manage");
    } catch (err) {
      setError("Could not save changes. Please try again.");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Visa Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border p-4 space-y-2">
          <h2 className="font-semibold">Booking Details</h2>

          <input className="border p-2 w-full" placeholder="Agent Name"
            value={form.agentName} onChange={(e) => updateForm("agentName", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Agent No"
            value={form.agentNo} onChange={(e) => updateForm("agentNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Nationality"
            value={form.nationality} onChange={(e) => updateForm("nationality", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Guest Name"
            value={form.guestName} onChange={(e) => updateForm("guestName", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Contact Name"
            value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Mobile No"
            value={form.mobileNo} onChange={(e) => updateForm("mobileNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Client Ref No"
            value={form.clientRefNo} onChange={(e) => updateForm("clientRefNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Group No"
            value={form.groupNo} onChange={(e) => updateForm("groupNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Local Ref No"
            value={form.localRefNo} onChange={(e) => updateForm("localRefNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Reservation No"
            value={form.reservationNo} onChange={(e) => updateForm("reservationNo", e.target.value)} />

          <label className="block text-sm">Total Amount</label>
          <input type="number" className="border p-2 w-full"
            value={form.totalAmount} onChange={(e) => updateForm("totalAmount", Number(e.target.value))} />

          <label className="block text-sm">Sub Amount</label>
          <input type="number" className="border p-2 w-full"
            value={form.subAmount} onChange={(e) => updateForm("subAmount", Number(e.target.value))} />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Visa Applicants</h2>

          {entries.map((entry, index) => (
            <div key={index} className="border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Applicant {index + 1}</span>
                {entries.length > 1 && (
                  <button type="button" onClick={() => removeEntry(index)}>
                    Remove
                  </button>
                )}
              </div>

              <input className="border p-2 w-full" placeholder="Applicant Name"
                value={entry.applicantName} onChange={(e) => updateEntry(index, "applicantName", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="Visa Type (e.g. Umrah Visa)"
                value={entry.visaType} onChange={(e) => updateEntry(index, "visaType", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="Processing Type (Normal/Urgent)"
                value={entry.processingType} onChange={(e) => updateEntry(index, "processingType", e.target.value)} />

              <label className="block text-sm">Issue Date</label>
              <input type="date" className="border p-2 w-full"
                value={entry.issueDate} onChange={(e) => updateEntry(index, "issueDate", e.target.value)} />

              <label className="block text-sm">Expiry Date</label>
              <input type="date" className="border p-2 w-full"
                value={entry.expiryDate} onChange={(e) => updateEntry(index, "expiryDate", e.target.value)} />

              <label className="block text-sm">Visa Fee</label>
              <input type="number" className="border p-2 w-full"
                value={entry.visaFee} onChange={(e) => updateEntry(index, "visaFee", Number(e.target.value))} required />

              <label className="block text-sm">Service Charge</label>
              <input type="number" className="border p-2 w-full"
                value={entry.serviceCharge} onChange={(e) => updateEntry(index, "serviceCharge", Number(e.target.value))} />

              <input className="border p-2 w-full" placeholder="Confirmation No"
                value={entry.confirmationNo} onChange={(e) => updateEntry(index, "confirmationNo", e.target.value)} />
            </div>
          ))}

          <button type="button" onClick={addEntry} className="border p-2">
            + Add Another Applicant
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button type="submit" className="border p-2 bg-gray-200">
          Save Changes
        </button>
      </form>
    </div>
  );
}