"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, ArrowLeftRight, Wallet2, HandCoins, Target, PieChart, Settings,
  Plus, Moon, Sun, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransaction, type WOpt, type COpt, type DOpt } from "@/components/add-transaction";

const NAV = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/anggaran", label: "Anggaran", icon: Wallet2 },
  { href: "/hutang", label: "Hutang", icon: HandCoins },
  { href: "/target", label: "Target", icon: Target },
  { href: "/laporan", label: "Laporan", icon: PieChart },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];
// Tab bawah mobile: 4 utama + tombol tengah
const MOBILE = [NAV[0], NAV[1], NAV[3], NAV[5]];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return (
    <button aria-label="Ganti tema" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      {m && resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Shell({ secret, wallets, categories, debts, children }: { secret: string; wallets: WOpt[]; categories: COpt[]; debts: DOpt[]; children: React.ReactNode }) {
  const path = usePathname();
  const base = `/${secret}`;
  const [add, setAdd] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const isActive = (href: string) => (href === "" ? path === base || path === base + "/" : path.startsWith(base + href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-card/60 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">K</div>
          <span className="font-display text-lg font-bold">Keuanganku</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={base + n.href}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(n.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <n.icon size={18} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between px-2">
          <button onClick={() => setAdd(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus size={16} /> Catat
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">K</div>
          <span className="font-display font-bold">Keuanganku</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button aria-label="Menu" onClick={() => setOpenMenu(true)} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><Menu size={20} /></button>
        </div>
      </header>

      {/* Drawer menu mobile (halaman sekunder) */}
      {openMenu && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpenMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 h-full w-64 bg-card p-4 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex justify-between"><span className="font-display font-semibold">Menu</span><button onClick={() => setOpenMenu(false)}><X size={20} /></button></div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link key={n.href} href={base + n.href} onClick={() => setOpenMenu(false)}
                  className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive(n.href) ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                  <n.icon size={18} /> {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Konten */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10">{children}</main>

      {/* Tab bar bawah mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
        {MOBILE.slice(0, 2).map((n) => <TabItem key={n.href} base={base} n={n} active={isActive(n.href)} />)}
        <div className="relative grid place-items-center">
          <button aria-label="Catat transaksi" onClick={() => setAdd(true)}
            className="absolute -top-6 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95">
            <Plus size={26} />
          </button>
        </div>
        {MOBILE.slice(2).map((n) => <TabItem key={n.href} base={base} n={n} active={isActive(n.href)} />)}
      </nav>

      {add && <AddTransaction secret={secret} wallets={wallets} categories={categories} debts={debts} onClose={() => setAdd(false)} />}
    </div>
  );
}

function TabItem({ base, n, active }: { base: string; n: { href: string; label: string; icon: any }; active: boolean }) {
  return (
    <Link href={base + n.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
      <n.icon size={20} /> {n.label}
    </Link>
  );
}
