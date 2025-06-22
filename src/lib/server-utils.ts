import { cookies } from 'next/headers';

/**
 * Helper to get CSRF token from cookies
 * Only use this in Server Components or Route Handlers
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('next-auth.csrf-token')?.value ?? null;
}