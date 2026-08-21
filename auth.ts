import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/portal/login" },
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

        const user = await prisma.user.findUnique({
          where: { email },
          include: { agency: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          agencyId: user.agencyId,
          agencySlug: user.agency?.slug || null,
          agencyName: user.agency?.name || null,
          agencyColor: user.agency?.primaryColor || null,
          agencyLogoUrl: user.agency?.logoUrl || null,
        };
      },
    }),
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } });
        return !!existing;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user && account?.provider !== "google") {
        const u = user as any;
        token.isSuperAdmin = u.isSuperAdmin;
        token.agencyId = u.agencyId;
        token.agencySlug = u.agencySlug;
        token.agencyName = u.agencyName;
        token.agencyColor = u.agencyColor;
        token.agencyLogoUrl = u.agencyLogoUrl;
      }

      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { agency: true },
        });
        if (dbUser) {
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.agencyId = dbUser.agencyId;
          token.agencySlug = dbUser.agency?.slug || null;
          token.agencyName = dbUser.agency?.name || null;
          token.agencyColor = dbUser.agency?.primaryColor || null;
          token.agencyLogoUrl = dbUser.agency?.logoUrl || null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      const s = session as any;
      s.user.isSuperAdmin = token.isSuperAdmin as boolean;
      s.user.agencyId = token.agencyId as string | null;
      s.user.agencySlug = token.agencySlug as string | null;
      s.user.agencyName = token.agencyName as string | null;
      s.user.agencyColor = token.agencyColor as string | null;
      s.user.agencyLogoUrl = token.agencyLogoUrl as string | null;
      return session;
    },
  },
});