import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>{children}</div>;
}
export function SectionTitle({ children, aksi }: { children: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
      {aksi}
    </div>
  );
}
export function Money({ value, className, sign = false, size = "md" }: { value: number; className?: string; sign?: boolean; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl", xl: "text-3xl sm:text-4xl" };
  const prefix = sign ? (value > 0 ? "+" : value < 0 ? "" : "") : "";
  return <span className={cn("tnum font-display font-semibold", sizes[size], className)}>{prefix}{formatRupiah(value)}</span>;
}
export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center animate-fade-in">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-display font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}
export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "income" | "expense" | "transfer" | "warn" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground", income: "bg-income/15 text-income",
    expense: "bg-expense/15 text-expense", transfer: "bg-transfer/15 text-transfer",
    warn: "bg-c3/15 text-c3",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "income" | "expense" | "warn" }) {
  const pct = Math.min(100, Math.max(0, value));
  const colors = { primary: "bg-primary", income: "bg-income", expense: "bg-expense", warn: "bg-c3" };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
