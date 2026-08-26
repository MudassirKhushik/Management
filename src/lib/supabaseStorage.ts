// src/lib/supabaseStorage.ts
//
// Server-only Supabase client using the SERVICE ROLE key — this bypasses
// Storage RLS entirely, so it must NEVER be imported into a "use client"
// component or exposed to the browser. Only import this from API routes.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — media uploads will fail until these are added to .env"
  );
}

export const supabaseAdmin = createClient(supabaseUrl || "", serviceRoleKey || "");

export const MEDIA_BUCKET = "agency-media";