// apps/web/app/api/auth/[...nextauth]/route.ts — NextAuth handler. หอมฉลุย — Powered by 2T9COME.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
