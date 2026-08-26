// src/app/api/media/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/src/lib/prisma";
import { supabaseAdmin, MEDIA_BUCKET } from "@/src/lib/supabaseStorage";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort delete of the underlying Storage object, extracted from the
  // public URL. If this fails we still remove the DB row — an orphaned file
  // is a minor cleanup issue, not a correctness one, and shouldn't block
  // the user from removing the image from their site.
  try {
    const marker = `/object/public/${MEDIA_BUCKET}/`;
    const idx = existing.url.indexOf(marker);
    if (idx !== -1) {
      const path = existing.url.slice(idx + marker.length);
      await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([path]);
    }
  } catch (err) {
    console.error("Could not remove storage object (continuing):", err);
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}