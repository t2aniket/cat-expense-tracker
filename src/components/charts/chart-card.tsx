"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";

const tooltip = {
  formatter: (value: unknown) => currency(Number(value || 0))
};

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

export function BarChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const mounted = useMounted();
  return (
    <Card className="h-80">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {mounted ? <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 11 }} width={42} />
          <Tooltip formatter={tooltip.formatter} />
          <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer> : <div className="h-[82%] rounded-2xl bg-black/5 dark:bg-white/10" />}
    </Card>
  );
}

export function LineChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const mounted = useMounted();
  return (
    <Card className="h-80">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {mounted ? <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 11 }} width={42} />
          <Tooltip formatter={tooltip.formatter} />
          <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer> : <div className="h-[82%] rounded-2xl bg-black/5 dark:bg-white/10" />}
    </Card>
  );
}

export function PieChartCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  const mounted = useMounted();
  return (
    <Card className="h-96">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {mounted ? <ResponsiveContainer width="100%" height="62%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={3}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={tooltip.formatter} />
        </PieChart>
      </ResponsiveContainer> : <div className="h-[62%] rounded-2xl bg-black/5 dark:bg-white/10" />}
      <div className="grid gap-2">
        {data.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.name}</span>
            <span className="text-[var(--muted)]">{currency(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
