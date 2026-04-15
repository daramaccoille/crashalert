import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
      
      // Bypass auth during Playwright tests
      if (request.headers.get('x-playwright-test') === 'true') {
        return true;
      }

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; 
      }
      return true;
    },
  },
  providers: [],
  secret: process.env.AUTH_SECRET || process.env.STRIPE_SECRET_KEY,
} satisfies NextAuthConfig;
