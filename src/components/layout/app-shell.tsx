import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Home,
  LogOut,
  Mail,
  Search,
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

type DashboardCalendarItem = {
  id: string;
  customer: string;
  invoiceNumber: string;
  amount: string;
  date: string;
  href: string;
};

type DashboardPaymentMonth = {
  label: string;
  paidCount: number;
  paidAmount: string;
  barHeight: number;
};

type DashboardDailyTask = {
  id: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  tone: "blue" | "amber" | "red";
};

type DashboardTopDebtor = {
  id: string;
  name: string;
  pendingAmount: string;
  unpaidCount: number;
};

type DashboardPaymentStats = {
  paidThisMonthCount: number;
  unpaidCount: number;
  paidThisMonthAmount: string;
  pendingAmount: string;
  monthly: DashboardPaymentMonth[];
};

type AppShellProps = {
  stats: DashboardStat[];
  quickLinks: DashboardQuickLink[];
  invoices: DashboardInvoice[];
  events: DashboardEvent[];
  paymentStats: DashboardPaymentStats;
  calendarItems: DashboardCalendarItem[];
  topDebtors: DashboardTopDebtor[];
  dailyTasks?: DashboardDailyTask[];
};

const navigationItems = [
  { label: "Panel de control", href: "/", icon: Home },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Reclamaciones", href: "/claim-drafts", icon: Mail },
  { label: "Plantillas", href: "/templates", icon: FileText },
  { label: "Informes", href: "/customer-stats", icon: BarChart3 },
];

export function AppShell({
  stats,
  paymentStats,
  topDebtors,
  dailyTasks = [],
}: AppShellProps) {
  const firstStat = stats[0];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-sky-700 text-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center px-7">
            <Link href="/" className="text-3xl font-bold tracking-wide">
              NE<span className="text-sky-100">X</span>UM
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
                    : "text-sky-50/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/20 p-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sky-50/90 transition hover:bg-white/15 hover:text-white"
            >
              <Settings className="size-5" />
              Configuracion
            </Link>

            <form action={signOutUser}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sky-50/90 transition hover:bg-white/15 hover:text-white"
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
              <div className="hidden items-center gap-3 pl-2 md:flex">
                <div>
                  <p className="text-sm font-semibold">Carlos Martinez</p>
                  <p className="text-xs text-slate-500">Administrador</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-5 p-5">
          <section className="grid items-start gap-4 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard icon={CircleDollarSign} label={firstStat?.label || "Pendiente de cobro"} value={firstStat?.value || "0 €"} detail={firstStat?.detail || "Sin facturas activas"} tone="amber" />
                <MetricCard icon={CheckCircle2} label="Cobrado este mes" value={paymentStats.paidThisMonthAmount} detail={`${paymentStats.paidThisMonthCount} facturas cobradas este mes`} tone="emerald" />
              </div>
              <DailyTasksCard tasks={dailyTasks} />
            </div>
            <DebtorRankingCard debtors={topDebtors} />
          </section>

          </div>
        </section>
      </div>
    </main>
  );
}

function DailyTasksCard({ tasks }: { tasks: DashboardDailyTask[] }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-semibold">Tareas del dia</h2>
        <p className="mt-1 text-sm text-slate-500">
          Facturas y clientes que requieren atencion segun importe, antiguedad y seguimiento.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        Recuerda marcar las facturas que ya hemos conseguido cobrar.
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No hay tareas urgentes detectadas.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} href={task.href} className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.detail}</p>
                </div>
                <span className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${tones[task.tone]}`}>
                  {task.action}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

function DebtorRankingCard({ debtors = [] }: { debtors?: DashboardTopDebtor[] }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <Users className="size-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Ranking de deuda</p>
          <p className="mt-1 text-lg font-bold">Top 3 clientes</p>
        </div>
      </div>

      {debtors.length === 0 ? (
        <p className="text-sm text-slate-500">No hay clientes con deuda pendiente.</p>
      ) : (
        <div className="space-y-2">
          {debtors.map((customer, index) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {index + 1}. {customer.name}
                </p>
                <p className="text-xs text-slate-500">
                  {customer.unpaidCount} factura{customer.unpaidCount === 1 ? "" : "s"} pendiente{customer.unpaidCount === 1 ? "" : "s"}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-amber-700">{customer.pendingAmount}</span>
            </Link>
          ))}
        </div>
      )}
    </article>
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

