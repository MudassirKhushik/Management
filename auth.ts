import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/portal/login" },
  providers: [
    Credentials({
      credentials: {
        agencySlug: {},
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const agencySlug = ((credentials?.agencySlug as string) || "").trim().toLowerCase();
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        if (!agencySlug) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.isSuperAdmin) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, isSuperAdmin: true, agencyId: null, agencySlug: null, agencyName: null };
        }

        const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
        if (!agency || !agency.isActive) return null;

        const user = await prisma.user.findFirst({ where: { agencyId: agency.id } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          isSuperAdmin: false,
          agencyId: agency.id,
          agencySlug: agency.slug,
          agencyName: agency.name, // NEW - this is what fixes the sidebar
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isSuperAdmin = user.isSuperAdmin;
        token.agencyId = user.agencyId;
        token.agencySlug = user.agencySlug;
        token.agencyName = user.agencyName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.isSuperAdmin = token.isSuperAdmin as boolean;
      session.user.agencyId = token.agencyId as string | null;
      session.user.agencySlug = token.agencySlug as string | null;
      session.user.agencyName = token.agencyName as string | null;
      return session;
    },
  },
});