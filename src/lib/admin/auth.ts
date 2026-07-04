// Shared admin password check.
// In production: set ADMIN_PASSWORD env var to override the dev default.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jurivon-internal-2026";

export function isAdminAuthorized(provided: string | null): boolean {
  if (!provided) return false;
  return provided === ADMIN_PASSWORD;
}
