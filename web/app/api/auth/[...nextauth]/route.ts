import { GET as AuthGET, POST as AuthPOST } from "@/auth";

export const runtime = 'edge';

// NextAuth route handlers
export const GET = AuthGET;
export const POST = AuthPOST;
