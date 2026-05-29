import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";

export function MetricCard({ label, value, caption }: { label: string; value: number | string; caption?: string }) {
  return (
    <Card className="min-h-28">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-normal">{typeof value === "number" ? currency(value) : value}</p>
      {caption && <p className="mt-1 text-xs font-medium text-[var(--muted)]">{caption}</p>}
    </Card>
  );
}
