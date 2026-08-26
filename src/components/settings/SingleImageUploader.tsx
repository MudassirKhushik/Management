// src/components/settings/SingleImageUploader.tsx
//
// Shared by Logo and About sections — each holds exactly one image, stored
// directly on the Agency row (logoUrl / aboutImageUrl), not in Media.

"use client";

import { useRef, useState } from "react";

export default function SingleImageUploader({
  section,
  currentUrl,
  onChange,
  label,
}: {
  section: "logo" | "about";
  currentUrl: string | null;
  onChange: (url: string) => void;
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    if (file.size > 1024 * 1024) {
      setError("Image must be 1MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("section", section);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-300">No image</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          {uploading ? "Uploading..." : currentUrl ? "Replace Image" : "Upload Image"}
        </button>
        <p className="text-xs text-gray-400 mt-1.5">Max 1MB</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
    </div>
  );
}