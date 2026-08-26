// src/components/settings/ImageUploadGrid.tsx
//
// Shared by Carousel (max 6) and Memories/Gallery (max 12) sections.

"use client";

import { useRef, useState } from "react";

type MediaItem = { id: string; url: string };

export default function ImageUploadGrid({
  section,
  items,
  maxCount,
  onChange,
}: {
  section: "carousel" | "gallery";
  items: MediaItem[];
  maxCount: number;
  onChange: (items: MediaItem[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again later
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
      onChange([...items, data.media]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this image?")) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onChange(items.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not remove this image.");
    }
  }

  const atLimit = items.length >= maxCount;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-lg overflow-hidden border border-gray-100 aspect-square bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-xs font-semibold gap-1 transition-colors hover:bg-black/[0.02] disabled:opacity-50"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
          >
            <span className="text-lg leading-none">+</span>
            {uploading ? "Uploading..." : "Add Image"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {items.length} / {maxCount} images · max 1MB each
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
    </div>
  );
}