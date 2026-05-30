import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const providers =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
      ]
    : [];

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async session({ session, token }) {
      if (session.user?.email) {
        session.user.id = String(token.email || session.user.email).toLowerCase();
      }
      return session;
    }
  }
};
