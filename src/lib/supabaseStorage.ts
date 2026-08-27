// src/lib/supabaseStorage.ts
//
// Server-only Supabase client using the SERVICE ROLE key — this bypasses
// Storage RLS entirely, so it must NEVER be imported into a "use client"
// component or exposed to the browser. Only import this from API routes.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazily created — constructing the client eagerly at module load time
// means a missing env var throws immediately during Next.js's build-time
// page data collection, which crashes the ENTIRE build (not just media
// upload routes). Deferring creation until first actual use means only a
// real upload/delete attempt fails, with a clear message, instead of
// taking down unrelated routes.
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (_client) return _client;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Add both to your environment variables (in Vercel: Settings → Environment Variables) and redeploy."
    );
  }

  _client = createClient(supabaseUrl, serviceRoleKey);
  return _client;
}

export const MEDIA_BUCKET = "agency-media";