import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const SECRET_COOKIE = "kku_s";

export function appSecret(): string {
  return process.env.APP_SECRET_SLUG || "";
}

/** Bandingkan aman terhadap timing attack. */
export function secretCocok(input: string | undefined | null): boolean {
  const expected = appSecret();
  if (!expected || !input || input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  return diff === 0;
}

/**
 * Dipanggil di setiap Server Action / route handler.
 * Sumber kebenaran = cookie httpOnly yang diset middleware. 404 jika tidak cocok.
 */
export async function wajibSecret(): Promise<void> {
  const store = await cookies();
  const val = store.get(SECRET_COOKIE)?.value;
  if (!secretCocok(val)) notFound();
}
