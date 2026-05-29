"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CirclePlus, Clock3, Home, Settings } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";
import { PwaRegister } from "@/components/app/pwa-register";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/add", label: "Add", icon: CirclePlus, primary: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrate = useCatStore((state) => state.hydrate);
  const theme = useCatStore((state) => state.preferences.theme);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
  }, [theme]);

  return (
    <>
      <PwaRegister />
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
        <main className="app-scroll flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl px-3 safe-bottom">
          <div className="glass grid grid-cols-5 gap-1 rounded-[2rem] p-2 shadow-2xl shadow-black/15">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl text-[11px] font-semibold text-[var(--muted)] transition active:scale-95",
                    active && "bg-black/5 text-[var(--foreground)] dark:bg-white/10",
                    item.primary && "bg-[var(--accent)] text-white shadow-lg shadow-teal-900/20",
                    item.primary && active && "bg-[var(--accent)] text-white"
                  )}
                >
                  <Icon size={item.primary ? 26 : 21} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <Link href="/calendar" aria-label="Open calendar" className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[var(--foreground)] shadow-lg shadow-black/10 backdrop-blur dark:bg-zinc-900/80">
        <CalendarDays size={20} />
      </Link>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
