// apps/web/types/next-auth.d.ts — augment NextAuth session/token with id + RBAC. Powered by 2T9COME.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    roles?: string[];
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    roles?: string[];
    permissions?: string[];
  }
}
