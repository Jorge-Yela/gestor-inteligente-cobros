import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

type DashboardInvoice = {
  customer: string;
  number: string;
  amount: string;
  status: string;
};

type AppShellProps = {
  stats: DashboardStat[];
  invoices: DashboardInvoice[];
};

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Facturas", icon: FileText },
  { label: "Clientes", icon: Users },
  { label: "Seguimientos", icon: Clock3 },
  { label: "Plantillas", icon: Mail },
  { label: "Informes", icon: BarChart3 },
];

export function AppShell({ stats, invoices }: AppShellProps) {
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
              <button
                key={item.label}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t p-4">
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground">
              <Settings className="size-4" />
              Ajustes
            </button>
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
              <Button>
                <Upload className="size-4" />
                Subir factura
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

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <article className="rounded-lg border bg-card shadow-sm">
                <div className="border-b p-5">
                  <h2 className="font-semibold">Facturas en seguimiento</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Datos leidos desde PostgreSQL mediante Prisma.
                  </p>
                </div>

                <div className="divide-y">
                  {invoices.map((invoice) => (
                    <div key={invoice.number} className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div>
                        <p className="font-medium">{invoice.customer}</p>
                        <p className="text-sm text-muted-foreground">{invoice.number}</p>
                      </div>
                      <p className="font-medium">{invoice.amount}</p>
                      <span className="w-fit rounded-md border px-2.5 py-1 text-xs font-medium">
                        {invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border bg-card p-5 shadow-sm">
                <h2 className="font-semibold">Tareas de hoy</h2>
                <div className="mt-5 space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">Revisar OCR pendiente</p>
                      <p className="text-sm text-muted-foreground">2 facturas necesitan confirmacion.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 size-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">Preparar reclamacion</p>
                      <p className="text-sm text-muted-foreground">Alba Consulting vence hoy.</p>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
