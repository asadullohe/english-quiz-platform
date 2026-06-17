import Link from "next/link";
import { Bell, BookOpenCheck, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  children,
  navItems,
  title,
  subtitle,
  className,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border bg-card/88 p-5 shadow-soft backdrop-blur">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-black">QuizUstoz</span>
              <span className="block text-xs text-muted-foreground">English practice</span>
            </span>
          </Link>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <Link
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                <LayoutDashboard className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-secondary p-4 text-sm">
            <p className="font-bold">Pilot rejim</p>
            <p className="mt-1 text-muted-foreground">
              Bitta group bilan classroom quiz loop tekshiriladi.
            </p>
          </div>
        </aside>

        <section className={cn("space-y-6", className)}>
          <header className="flex flex-col justify-between gap-4 rounded-3xl border bg-card/88 p-6 shadow-soft backdrop-blur md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-accent">MVP dashboard</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Bildirishnoma
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Chiqish
              </Button>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
