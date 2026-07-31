import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy singleton — TIDAK membuat koneksi saat import (agar `next build` tidak butuh DB).
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset. Sambungkan Neon di Vercel lalu isi env.");
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
