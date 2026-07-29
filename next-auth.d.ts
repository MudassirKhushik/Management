import { DefaultSession } from "next-auth";

// This file doesn't run any code - it just teaches TypeScript that our
// session object has extra fields beyond the built-in defaults, so we
// don't get red squiggly-line errors everywhere we use them.
declare module "next-auth" {
  interface Session {
    user: {
      isSuperAdmin: boolean;
      agencyId: string | null;
      agencySlug: string | null;
      agencyName: string | null;
    } & DefaultSession["user"];
  }
}