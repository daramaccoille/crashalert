import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.query.subscribers.findFirst({
          where: eq(subscribers.email, credentials.email as string)
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (!user.active) {
            throw new Error("Subscription is not active");
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password);

        if (!isMatch) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0], 
          plan: user.plan
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.plan = (user as any).plan;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            (session.user as any).plan = token.plan;
        }
        return session;
    }
  },
  secret: process.env.AUTH_SECRET || process.env.STRIPE_SECRET_KEY,
  pages: {
    signIn: '/login',
  }
});
