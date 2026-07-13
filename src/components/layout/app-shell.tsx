import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutUser } from "@/server/actions/sign-out";

type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

type DashboardQuickLink = {
  label: string;
  value: string;
  detail: string;
  href: string;
};

type DashboardInvoice = {
  id: string;
  customer: string;
  number: string;
  amount: string;
  status: string;
};

type DashboardEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  customerName: string | null;
};

type AppShellProps = {
  stats: DashboardStat[];
  quickLinks: DashboardQuickLink[];
  invoices: DashboardInvoice[];
  events: DashboardEvent[];
};

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Plantillas", href: "/templates", icon: Mail },
  { label: "Reclamaciones", href: "/claim-drafts", icon: BarChart3 },
  { label: "Cronologia", href: "/timeline", icon: Bell },
  { label: "Estadisticas", href: "/customer-stats", icon: BarChart3 },
];

export function AppShell({ stats, quickLinks, invoices, events }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-muted/30 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Gestor Inteligente</p>
              <p className="text-xs text-muted-foreground">Cobros para pymes</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-1 border-t p-4">
            <Link
              href="/settings"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
            >
              <Settings className="size-4" />
              Ajustes
            </Link>

            <form action={signOutUser}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <LogOut className="size-4" />
                Cerrar sesion
              </button>
            </form>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b px-6">
            <div>
              <p className="text-sm text-muted-foreground">Dashboard</p>
              <h1 className="text-xl font-semibold">Control de cobros</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Notificaciones">
                <Bell className="size-4" />
              </Button>
              <Button asChild>
                <Link href="/invoice-files/upload">
                  <Upload className="size-4" />
                  Subir PDF
                </Link>
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-6">
            <section className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <article key={stat.label} className="rounded-lg border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.detail}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg border bg-card p-5 shadow-sm transition hover:border-foreground/30"
                >
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </Link>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <article className="rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b p-5">
                  <div>
                    <h2 className="font-semibold">Facturas a revisar</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Facturas cargadas para controlar cobro y reclamaciones.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/invoices">Ver todas</Link>
                  </Button>
                </div>

                {invoices.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    Todavia no hay facturas controladas.
                  </p>
                ) : (
                  <div className="divide-y">
                    {invoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/invoices/${invoice.id}`}
                        className="grid gap-3 p-5 transition hover:bg-muted/40 md:grid-cols-[1fr_auto_auto] md:items-center"
                      >
                        <div>
                          <p className="font-medium">{invoice.customer}</p>
                          <p className="text-sm text-muted-foreground">{invoice.number}</p>
                        </div>
                        <p className="font-medium">{invoice.amount}</p>
                        <span className="w-fit rounded-md border px-2.5 py-1 text-xs font-medium">
                          {invoice.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b p-5">
                  <div>
                    <h2 className="font-semibold">Actividad reciente</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ultimas actuaciones registradas.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/timeline">Ver todo</Link>
                  </Button>
                </div>

                {events.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    Todavia no hay actividad registrada.
                  </p>
                ) : (
                  <div className="divide-y">
                    {events.map((event) => (
                      <div key={event.id} className="p-5">
                        <div className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{event.date}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                            {event.invoiceId ? (
                              <Link
                                href={`/invoices/${event.invoiceId}`}
                                className="mt-3 inline-flex text-sm font-medium hover:underline"
                              >
                                {event.invoiceNumber} · {event.customerName}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
