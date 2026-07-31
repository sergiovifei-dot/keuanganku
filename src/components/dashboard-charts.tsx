"use client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { formatCompact, formatRupiah } from "@/lib/format";
import { colorHex } from "@/lib/colors";

export function TrenChart({ data }: { data: { bulan: string; pemasukan: number; pengeluaran: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0} /></linearGradient>
          <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={44} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
        <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="hsl(var(--income))" fill="url(#gIn)" strokeWidth={2} />
        <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="hsl(var(--expense))" fill="url(#gEx)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { nama: string; warna: string; total: number }[] }) {
  const top = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={top} dataKey="total" nameKey="nama" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
          {top.map((d, i) => <Cell key={i} fill={colorHex(d.warna)} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
