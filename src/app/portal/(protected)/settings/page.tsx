// src/app/portal/(protected)/settings/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImageUploadGrid from "@/src/components/settings/ImageUploadGrid";
import SingleImageUploader from "@/src/components/settings/SingleImageUploader";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

type MediaItem = { id: string; url: string };

type Settings = {
  name: string;
  logoUrl: string | null;
  aboutImageUrl: string | null;
  primaryColor: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIban: string | null;
  bankAddress: string | null;
  cancellationPolicy: string | null;
  noShowPolicy: string | null;
  importantContact: string | null;
  carousel: MediaItem[];
  gallery: MediaItem[];
  packageCount: number;
  packageLimit: number;
};

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

export default function AgencySettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agency-settings");
        if (!res.ok) throw new Error("Failed to load settings");
        setSettings(await res.json());
      } catch (err) {
        console.error(err);
        setLoadError("Could not load settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateField<K extends keyof Settings>(field: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [field]: value } : s));
    setSaved(false);
  }

  async function handleSaveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountName: settings.bankAccountName,
          bankName: settings.bankName,
          bankAccountNo: settings.bankAccountNo,
          bankIban: settings.bankIban,
          bankAddress: settings.bankAddress,
          cancellationPolicy: settings.cancellationPolicy,
          noShowPolicy: settings.noShowPolicy,
          importantContact: settings.importantContact,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch (err) {
      console.error(err);
      setSaveError("Could not save bank details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>;
  if (!settings) return null;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Agency Settings</h1>

      <div className="space-y-5">
        <SectionCard title="Logo">
          <SingleImageUploader
            section="logo"
            currentUrl={settings.logoUrl}
            label="Logo"
            onChange={(url) => updateField("logoUrl", url)}
          />
        </SectionCard>

        <SectionCard title="About Image">
          <SingleImageUploader
            section="about"
            currentUrl={settings.aboutImageUrl}
            label="About"
            onChange={(url) => updateField("aboutImageUrl", url)}
          />
        </SectionCard>

        <SectionCard title="Hero Carousel">
          <ImageUploadGrid
            section="carousel"
            items={settings.carousel}
            maxCount={6}
            onChange={(items) => updateField("carousel", items)}
          />
        </SectionCard>

        <SectionCard title="Memories / Gallery">
          <ImageUploadGrid
            section="gallery"
            items={settings.gallery}
            maxCount={12}
            onChange={(items) => updateField("gallery", items)}
          />
        </SectionCard>

        <SectionCard title="Website Packages">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-[#121212]">
                {settings.packageCount} / {settings.packageLimit}
              </span>{" "}
              packages used. Each package has its own title, description, and image — manage them from
              the Packages page.
            </p>
            <Link
              href="/portal/packages/manage"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "var(--agency-color)" }}
            >
              Manage Packages
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Bank & Policy Details">
          <form onSubmit={handleSaveBankDetails} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bank Account Name</label>
                <input
                  className={inputClass}
                  value={settings.bankAccountName || ""}
                  onChange={(e) => updateField("bankAccountName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input
                  className={inputClass}
                  value={settings.bankName || ""}
                  onChange={(e) => updateField("bankName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  className={inputClass}
                  value={settings.bankAccountNo || ""}
                  onChange={(e) => updateField("bankAccountNo", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>IBAN</label>
                <input
                  className={inputClass}
                  value={settings.bankIban || ""}
                  onChange={(e) => updateField("bankIban", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Bank Address</label>
                <input
                  className={inputClass}
                  value={settings.bankAddress || ""}
                  onChange={(e) => updateField("bankAddress", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Important Contact</label>
                <input
                  className={inputClass}
                  placeholder="Shown on invoices and vouchers"
                  value={settings.importantContact || ""}
                  onChange={(e) => updateField("importantContact", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Cancellation Policy</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={settings.cancellationPolicy || ""}
                  onChange={(e) => updateField("cancellationPolicy", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>No-Show Policy</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={settings.noShowPolicy || ""}
                  onChange={(e) => updateField("noShowPolicy", e.target.value)}
                />
              </div>
            </div>

            {saveError && <p className="text-red-600 text-sm font-medium">{saveError}</p>}
            {saved && <p className="text-emerald-600 text-sm font-medium">Saved.</p>}

            <button
              type="submit"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--agency-color)" }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Bank & Policy Details"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}