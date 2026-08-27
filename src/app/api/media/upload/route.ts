// src/app/api/media/upload/route.ts
//
// Handles image uploads for Settings sections ("logo"/"about" update a
// single field on Agency; "carousel"/"gallery" create Media rows) AND for
// individual Website Package images ("package" — just uploads and returns
// a URL; the caller saves that URL onto their own Package record via the
// existing /api/packages routes, same as the old URL-paste flow did).

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/src/lib/prisma";
import { getSupabaseAdmin, MEDIA_BUCKET } from "@/src/lib/supabaseStorage";

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1MB
const SECTION_LIMITS: Record<string, number> = {
  carousel: 6,
  gallery: 12,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agencyId = session.user.agencyId;

  const formData = await request.formData();
  const file = formData.get("file");
  const section = formData.get("section");

  if (!(file instanceof Blob) || typeof section !== "string") {
    return NextResponse.json({ error: "Missing file or section." }, { status: 400 });
  }

  if (!["carousel", "gallery", "logo", "about", "package"].includes(section)) {
    return NextResponse.json({ error: "Invalid section." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image must be 1MB or smaller." }, { status: 400 });
  }

  // Enforce per-section max count BEFORE uploading, so a rejected request
  // never leaves an orphaned file sitting in Storage. Package images aren't
  // capped here — the 20-package limit is already enforced in the
  // /api/packages POST route.
  if (section === "carousel" || section === "gallery") {
    const count = await prisma.media.count({ where: { agencyId, section } });
    if (count >= SECTION_LIMITS[section]) {
      return NextResponse.json(
        {
          error: `${section === "carousel" ? "Carousel" : "Gallery"} already has the maximum of ${SECTION_LIMITS[section]} images. Remove one before adding another.`,
        },
        { status: 400 }
      );
    }
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${agencyId}/${section}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Supabase Storage upload failed:", uploadError);
    return NextResponse.json(
      { error: `Could not upload image: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  if (section === "logo" || section === "about") {
    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: section === "logo" ? { logoUrl: publicUrl } : { aboutImageUrl: publicUrl },
    });
    return NextResponse.json({ url: publicUrl, agency: updated });
  }

  if (section === "package") {
    // No DB write here — the caller (Package Add/Edit page) saves this URL
    // onto its own Package record via the existing /api/packages routes.
    return NextResponse.json({ url: publicUrl });
  }

  // carousel / gallery — create a Media row, appended after the current max position
  const maxPosition = await prisma.media.aggregate({
    where: { agencyId, section },
    _max: { position: true },
  });
  const media = await prisma.media.create({
    data: {
      agencyId,
      section,
      url: publicUrl,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ media });
}