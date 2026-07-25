import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
 
// This is THE central place that defines how login works.
// It lives at the project root (not inside app/) — that's just
// where Auth.js v5 expects to find it.
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" }, // session info is stored in a signed cookie, not a database table — simpler, fine for our scale
  pages: {
    signIn: "/portal/login", // our custom login page, instead of Auth.js's default one
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;
 
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
 
        // Compare the typed password against the stored scrambled version.
        // We never decrypt the stored hash — we hash the attempt and compare.
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
 
        // Whatever we return here becomes available in the session
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});