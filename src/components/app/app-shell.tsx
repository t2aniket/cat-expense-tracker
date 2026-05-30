"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CirclePlus, Clock3, Home, LogOut, Settings } from "lucide-react";
import { useEffect } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
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

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const hydrate = useCatStore((state) => state.hydrate);
  const sync = useCatStore((state) => state.sync);
  const theme = useCatStore((state) => state.preferences.theme);
  const projects = useCatStore((state) => state.projects);
  const invites = useCatStore((state) => state.invites);
  const selectedProjectId = useCatStore((state) => state.selectedProjectId);
  const selectProject = useCatStore((state) => state.selectProject);
  const authReady = status !== "loading";

  useEffect(() => {
    if (status === "authenticated") void hydrate();
  }, [hydrate, status]);

  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const interval = window.setInterval(syncWhenVisible, 3000);
    window.addEventListener("focus", syncWhenVisible);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncWhenVisible);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [sync]);

  useEffect(() => {
    void sync();
  }, [pathname, sync]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
  }, [theme]);

  return (
    <>
      {authReady && status === "unauthenticated" ? (
        <main className="mx-auto grid min-h-dvh w-full max-w-md content-center gap-5 px-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Cat Expense Tracker</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">Sign in to your projects</h1>
            <p className="mt-3 text-[var(--muted)]">Use Google to access shared project expenses, members, and paid-by tracking.</p>
          </div>
          <Button size="lg" onClick={() => void signIn("google")}>Continue with Google</Button>
        </main>
      ) : (
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
        <main className="app-scroll flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          {status === "authenticated" && (
            <div className="mb-4 grid grid-cols-[1fr_auto] gap-2 pr-12">
              <select aria-label="Project" value={selectedProjectId} onChange={(event) => selectProject(event.target.value)} className="min-h-11 rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm font-bold text-[var(--foreground)] dark:bg-zinc-900">
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <Button type="button" variant="secondary" size="icon" aria-label="Sign out" onClick={() => void signOut()}>
                <LogOut size={18} />
              </Button>
            </div>
          )}
          {status === "authenticated" && projects.length === 0 && invites.length === 0 ? (
            <div className="grid min-h-[60dvh] content-center gap-4">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">No Projects</p>
              <h1 className="text-4xl font-bold tracking-normal">Create a project</h1>
              <p className="text-[var(--muted)]">You do not have access to any project yet. Create one in Settings or ask an owner to invite your Google email.</p>
              <Link href="/settings"><Button size="lg" className="w-full">Open Settings</Button></Link>
            </div>
          ) : children}
        </main>
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
      )}
      <Link href="/calendar" aria-label="Open calendar" className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[var(--foreground)] shadow-lg shadow-black/10 backdrop-blur dark:bg-zinc-900/80">
        <CalendarDays size={20} />
      </Link>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      <ShellContent>{children}</ShellContent>
    </SessionProvider>
  );
}
