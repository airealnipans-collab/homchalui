// apps/web/lib/auth.ts
// NextAuth (credentials + JWT) for the backoffice. หอมฉลุย — Powered by 2T9COME.
// Roles + permissions are loaded once at sign-in and carried in the JWT, so RBAC checks need no
// DB round-trip on the hot path. See docs/SECURITY.md.
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@homchalui/db";
import { env } from "@homchalui/config/env";

async function loadRbac(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: { role: { select: { name: true, permissions: { select: { permission: { select: { key: true } } } } } } },
      },
    },
  });
  const roles: string[] = [];
  const permissions = new Set<string>();
  for (const ur of u?.roles ?? []) {
    roles.push(ur.role.name);
    for (const rp of ur.role.permissions) permissions.add(rp.permission.key);
  }
  return { roles, permissions: [...permissions] };
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // short-lived (8h)
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;
        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, isActive: true },
        });
        if (!user || !user.isActive || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const { roles, permissions } = await loadRbac(user.id);
        token.uid = user.id;
        token.roles = roles;
        token.permissions = permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? "";
        session.user.roles = token.roles ?? [];
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  permissions: string[];
}

/** Resolve the signed-in admin (or null) in a Server Component / Route Handler. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    roles: session.user.roles ?? [],
    permissions: session.user.permissions ?? [],
  };
}
