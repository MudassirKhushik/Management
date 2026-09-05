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

type BankAccount = {
  id: string;
  accountName: string | null;
  bankName: string | null;
  accountNo: string | null;
  iban: string | null;
  address: string | null;
};

type Settings = {
  name: string;
  logoUrl: string | null;
  aboutImageUrl: string | null;
  primaryColor: string | null;
  cancellationPolicy: string | null;
  noShowPolicy: string | null;
  importantContact: string | null;
  // Round 4 — Agency Info section
  address: string | null;
  branches: string | null;
  licenseNo: string | null;
  // Phase 1b — voucher-only contact split
  makkahContact: string | null;
  madinahContact: string | null;
  hotlineContact: string | null;
  bankAccounts: BankAccount[];
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

function BankAccountCard({
  account,
  index,
  onSaved,
  onDeleted,
}: {
  account: BankAccount;
  index: number;
  onSaved: (updated: BankAccount) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState(account);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: keyof BankAccount, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: form.accountName,
          bankName: form.bankName,
          accountNo: form.accountNo,
          iban: form.iban,
          address: form.address,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Could not save this bank account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this bank account?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bank-accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      onDeleted(account.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not remove this bank account.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-[#121212]">Account {index + 1}</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? "Removing..." : "Remove"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Account Name</label>
          <input className={inputClass} value={form.accountName || ""} onChange={(e) => update("accountName", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Bank Name</label>
          <input className={inputClass} value={form.bankName || ""} onChange={(e) => update("bankName", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Account Number</label>
          <input className={inputClass} value={form.accountNo || ""} onChange={(e) => update("accountNo", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>IBAN</label>
          <input className={inputClass} value={form.iban || ""} onChange={(e) => update("iban", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Bank Address</label>
          <input className={inputClass} value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          {saving ? "Saving..." : "Save Account"}
        </button>
        {saved && <span className="text-xs font-medium text-emerald-600">Saved.</span>}
      </div>
    </div>
  );
}

export default function AgencySettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);

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

  async function handleAddAccount() {
    setAddingAccount(true);
    try {
      const res = await fetch("/api/bank-accounts", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create");
      const account = await res.json();
      setSettings((s) => (s ? { ...s, bankAccounts: [...s.bankAccounts, account] } : s));
    } catch (err) {
      console.error(err);
      alert("Could not add a new bank account.");
    } finally {
      setAddingAccount(false);
    }
  }

  function handleAccountSaved(updated: BankAccount) {
    setSettings((s) =>
      s ? { ...s, bankAccounts: s.bankAccounts.map((a) => (a.id === updated.id ? updated : a)) } : s
    );
  }

  function handleAccountDeleted(id: string) {
    setSettings((s) => (s ? { ...s, bankAccounts: s.bankAccounts.filter((a) => a.id !== id) } : s));
  }

  async function handleSavePolicies(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationPolicy: settings.cancellationPolicy,
          noShowPolicy: settings.noShowPolicy,
          importantContact: settings.importantContact,
          // Round 4 — Agency Info section
          address: settings.address,
          branches: settings.branches,
          licenseNo: settings.licenseNo,
          // Phase 1b — voucher-only contact split
          makkahContact: settings.makkahContact,
          madinahContact: settings.madinahContact,
          hotlineContact: settings.hotlineContact,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch (err) {
      console.error(err);
      setSaveError("Could not save policy details. Please try again.");
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

        <SectionCard title="Bank Accounts">
          {settings.bankAccounts.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">No bank accounts added yet.</p>
          )}
          <div className="space-y-4">
            {settings.bankAccounts.map((account, index) => (
              <BankAccountCard
                key={account.id}
                account={account}
                index={index}
                onSaved={handleAccountSaved}
                onDeleted={handleAccountDeleted}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddAccount}
            disabled={addingAccount}
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02] disabled:opacity-50"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
          >
            {addingAccount ? "Adding..." : "+ Add Bank Account"}
          </button>
        </SectionCard>

        <form onSubmit={handleSavePolicies} className="space-y-5">
          <SectionCard title="Agency Info">
            <p className="text-xs text-gray-400 mb-3">
              Shown on Invoice/Voucher documents — Address at the bottom, Branches under the
              logo/name, License No. under the reference/date badges.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Shown at the bottom of Invoice/Voucher"
                  value={settings.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Branches</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder={"One branch per line, e.g.:\nKarachi Branch — Main Road\nLahore Branch — Gulberg"}
                  value={settings.branches || ""}
                  onChange={(e) => updateField("branches", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>License No.</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Ministry of Hajj License No. 12345"
                  value={settings.licenseNo || ""}
                  onChange={(e) => updateField("licenseNo", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Policies">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>Important Contact</label>
                  <input
                    className={inputClass}
                    placeholder="General contact — kept for anything not covered by the voucher contacts below"
                    value={settings.importantContact || ""}
                    onChange={(e) => updateField("importantContact", e.target.value)}
                  />
                </div>

                {/* Phase 1b: voucher-only contact split. These three show on
                    the client-facing Voucher instead of Important Contact —
                    the numbers a traveler calls once they've landed. */}
                <div className="pt-1">
                  <p className="text-xs text-gray-400 mb-3">
                    Shown on the Voucher only (not the Invoice) — the contact numbers a traveler can
                    call once they've landed.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Makkah Contact</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={settings.makkahContact || ""}
                        onChange={(e) => updateField("makkahContact", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Madinah Contact</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={settings.madinahContact || ""}
                        onChange={(e) => updateField("madinahContact", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Hotline / Emergency</label>
                      <input
                        type="tel"
                        className={inputClass}
                        value={settings.hotlineContact || ""}
                        onChange={(e) => updateField("hotlineContact", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Cancellation Policy</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={settings.cancellationPolicy || ""}
                    onChange={(e) => updateField("cancellationPolicy", e.target.value)}
                  />
                </div>
                <div>
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
                {saving ? "Saving..." : "Save Policies"}
              </button>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  );
}