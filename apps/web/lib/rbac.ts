// apps/web/lib/rbac.ts
// Role-based access control helpers. หอมฉลุย — Powered by 2T9COME.
// "Super Admin" implies all permissions; everyone else needs the explicit permission key.
import type { Permission } from "@homchalui/validators";
import { getCurrentUser, type CurrentUser } from "./auth";

export function hasPermission(user: Pick<CurrentUser, "roles" | "permissions">, perm: Permission): boolean {
  if (user.roles.includes("Super Admin")) return true;
  return user.permissions.includes(perm);
}

export class AuthError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Throw 401 if not signed in, 403 if missing the permission. Returns the user otherwise. */
export function requirePermission(user: CurrentUser | null, perm: Permission): CurrentUser {
  if (!user) throw new AuthError(401, "unauthorized", "Sign in required");
  if (!hasPermission(user, perm)) throw new AuthError(403, "forbidden", `Missing permission: ${perm}`);
  return user;
}

/** API helper: resolve the user and enforce a permission in one call. */
export async function authorize(perm: Permission): Promise<CurrentUser> {
  return requirePermission(await getCurrentUser(), perm);
}

/** Map an AuthError (or any error) to a JSON error Response for API routes. */
export function toErrorResponse(e: unknown): Response {
  if (e instanceof AuthError) {
    return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  console.error("[admin] unexpected error:", e);
  return Response.json({ error: { code: "internal", message: "Internal error" } }, { status: 500 });
}
