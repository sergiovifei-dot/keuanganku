"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Printer size={15} /> Cetak / PDF</button>;
}
