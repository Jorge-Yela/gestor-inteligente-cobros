import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Home,
  LogOut,
  Mail,
  Phone,
  Search,
  Send,
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
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Reclamaciones", href: "/claim-drafts", icon: Mail },
  { label: "Informes", href: "/customer-stats", icon: BarChart3 },
];

const taskItems = [
  { label: "Revisar facturas vencidas", priority: "Alta", time: "09:00", tone: "text-red-600 bg-red-50" },
  { label: "Preparar reclamaciones", priority: "Alta", time: "10:30", tone: "text-red-600 bg-red-50" },
  { label: "Asignar fechas de control", priority: "Media", time: "12:00", tone: "text-amber-600 bg-amber-50" },
  { label: "Confirmar cobros recientes", priority: "Baja", time: "15:00", tone: "text-sky-600 bg-sky-50" },
];

export function AppShell({ stats, quickLinks, invoices, events }: AppShellProps) {
  const primaryInvoices = invoices.slice(0, 5);
  const recentEvents = events.slice(0, 4);
  const firstStat = stats[0];
  const secondStat = stats[1];
  const thirdStat = stats[2];
  const fourthStat = quickLinks[0];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-[#0d1624] text-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center px-7">
            <Link href="/" className="text-3xl font-bold tracking-wide">
              NE<span className="text-blue-400">X</span>UM
            </Link>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-4">
            {navigationItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  index === 0
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/10 p-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Settings className="size-5" />
              Configuracion
            </Link>

            <form action={signOutUser}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-5" />
                Cerrar sesion
              </button>
            </form>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar clientes, facturas, reclamaciones..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Button asChild className="bg-blue-600 shadow-sm hover:bg-blue-700">
                <Link href="/invoice-files/upload">
                  <Upload className="size-4" />
                  Subir factura
                </Link>
              </Button>
              <Button variant="outline" size="icon" aria-label="Notificaciones" className="rounded-xl">
                <Bell className="size-4" />
              </Button>
              <div className="hidden items-center gap-3 pl-2 md:flex">
                <div className="flex size-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  CM
                </div>
                <div>
                  <p className="text-sm font-semibold">Carlos Martinez</p>
                  <p className="text-xs text-slate-500">Administrador</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-5 p-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={CircleDollarSign} label={firstStat?.label || "Pendiente de cobro"} value={firstStat?.value || "0 €"} detail={firstStat?.detail || "Sin facturas activas"} tone="amber" />
              <MetricCard icon={CheckCircle2} label="Cobrado este mes" value={secondStat?.value || "0 €"} detail={secondStat?.detail || "Actividad registrada"} tone="emerald" />
              <MetricCard icon={FileText} label="Facturas vencidas" value={thirdStat?.value || "0"} detail={thirdStat?.detail || "Requieren revision"} tone="blue" />
              <MetricCard icon={Users} label={fourthStat?.label || "Clientes en riesgo"} value={fourthStat?.value || "0"} detail={fourthStat?.detail || "Seguimiento prioritario"} tone="violet" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_1.05fr_300px]">
              <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <PanelHeader title="Que debes hacer hoy" />
                <div className="space-y-1 p-5">
                  {taskItems.map((task) => (
                    <div key={task.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg px-1 py-3 text-sm">
                      <span className="size-4 rounded border border-slate-300" />
                      <span className="font-medium text-slate-700">{task.label}</span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${task.tone}`}>{task.priority}</span>
                      <span className="text-xs text-slate-500">{task.time}</span>
                    </div>
                  ))}
                  <Link href="/customers" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                    Ver clientes prioritarios
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <PanelHeader title="Facturas prioritarias" actionHref="/invoices" />
                {primaryInvoices.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Todavia no hay facturas cargadas.</p>
                ) : (
                  <div className="overflow-x-auto px-5 pb-5">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="text-xs text-slate-500">
                        <tr>
                          <th className="py-3 font-medium">Cliente</th>
                          <th className="py-3 font-medium">Importe</th>
                          <th className="py-3 font-medium">Estado</th>
                          <th className="py-3 font-medium">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {primaryInvoices.map((invoice, index) => (
                          <tr key={invoice.id}>
                            <td className="py-3 font-medium">{invoice.customer}</td>
                            <td className="py-3">{invoice.amount}</td>
                            <td className="py-3">
                              <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">{invoice.status}</span>
                            </td>
                            <td className="py-3">
                              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
                                <Link href={`/invoices/${invoice.id}`}>
                                  {index % 2 === 0 ? <Phone className="size-3.5" /> : <Send className="size-3.5" />}
                                  Revisar
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              <aside className="space-y-5">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Salud de tus cobros</h2>
                    <AlertTriangle className="size-4 text-slate-400" />
                  </div>
                  <div className="mx-auto mt-7 flex size-36 items-center justify-center rounded-full border-[12px] border-emerald-500 bg-emerald-50 text-3xl font-bold text-emerald-700">
                    82%
                  </div>
                  <p className="mt-5 text-center font-semibold text-emerald-700">Situacion buena</p>
                  <p className="mt-1 text-center text-sm text-slate-500">Vas por buen camino</p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <PanelHeader title="Actividad reciente" actionHref="/timeline" />
                  <div className="space-y-4 p-5 pt-0">
                    {recentEvents.length === 0 ? (
                      <p className="text-sm text-slate-500">Todavia no hay actividad registrada.</p>
                    ) : (
                      recentEvents.map((event) => (
                        <div key={event.id} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-slate-500">{event.customerName || event.description}</p>
                          </div>
                          <span className="ml-auto text-xs text-slate-400">{event.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </aside>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard title="Evolucion de cobros" variant="line" />
              <ChartCard title="Importe pendiente por antiguedad" variant="bars" />
              <ChartCard title="Cobros mensuales" variant="area" />
            </section>

            <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Copiloto de Cobros</h2>
                  <p className="mt-2 max-w-2xl rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Buenos dias. Hoy te recomendamos centrarte en las facturas prioritarias y revisar los clientes con importes vencidos.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelHeader({ title, actionHref }: { title: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="font-semibold">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
          Ver todo
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald" | "blue" | "violet";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex size-12 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function ChartCard({ title, variant }: { title: string; variant: "line" | "bars" | "area" }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 flex h-40 items-end gap-3 border-t border-slate-100 pt-5">
        {variant === "bars" ? (
          [72, 56, 43, 48].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end gap-2">
              <div
                className={`rounded-t-lg ${index === 0 ? "bg-red-400" : index === 1 ? "bg-orange-400" : index === 2 ? "bg-yellow-400" : "bg-emerald-400"}`}
                style={{ height: `${height}%` }}
              />
              <span className="text-center text-[11px] text-slate-500">{index === 0 ? "0-30" : index === 1 ? "31-60" : index === 2 ? "61-90" : "+90"}</span>
            </div>
          ))
        ) : (
          [18, 26, 38, 52, 68, 58].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end gap-2">
              <div
                className={`${variant === "area" ? "bg-blue-200" : "bg-blue-500"} rounded-t-full`}
                style={{ height: `${height}%` }}
              />
              <span className="text-center text-[11px] text-slate-500">{["Ene", "Feb", "Mar", "Abr", "May", "Jun"][index]}</span>
            </div>
          ))
        )}
      </div>
    </article>
  );
}