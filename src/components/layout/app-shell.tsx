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

type DashboardCollectionMonth = {
  label: string;
  collectedAmount: string;
  pendingAmount: string;
  collectedHeight: number;
  pendingHeight: number;
};

type DashboardPortfolioHealth = {
  score: number;
  tone: "green" | "amber" | "red";
  label: string;
  detail: string;
  trendLabel?: string;
  trendDetail?: string;
  concentrationLabel?: string;
  concentrationDetail?: string;
  followUpLabel?: string;
  followUpDetail?: string;
  ageLabel?: string;
  ageDetail?: string;
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
};

type AppShellProps = {
  stats: DashboardStat[];
  paymentStats: DashboardPaymentStats;
  topDebtors: DashboardTopDebtor[];
  dailyTasks?: DashboardDailyTask[];
  portfolioHealth?: DashboardPortfolioHealth;
  collectionChart?: DashboardCollectionMonth[];
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
  portfolioHealth,
  collectionChart = [],
}: AppShellProps) {
  const firstStat = stats[0];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-sky-700 text-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center px-7">
            <Link href="/" className="text-3xl font-bold tracking-wide">
              NOR<span className="text-sky-100">VAL</span>OR
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
            <div className="space-y-4">
              <DebtorRankingCard debtors={topDebtors} />
              <PortfolioHealthCard health={portfolioHealth} />
            </div>
          </section>

          <CollectionChartCard months={collectionChart} />

          </div>
        </section>
      </div>
    </main>
  );
}

function DailyTasksCard({ tasks }: { tasks: DashboardDailyTask[] }) {
  const riskAmount = tasks.reduce((total, task) => {
    const match = task.detail.match(/([\d.]+,\d{2})\s*€/);

    if (!match) {
      return total;
    }

    return total + Number(match[1].replace(/\./g, "").replace(",", "."));
  }, 0);
  const oldestDays = tasks.reduce((maxDays, task) => {
    const match = task.detail.match(/(\d+)\s*dias/);

    if (!match) {
      return maxDays;
    }

    return Math.max(maxDays, Number(match[1]));
  }, 0);
  const riskAmountLabel = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(riskAmount);

  const taskTones = {
    blue: {
      card: "border-blue-100 bg-blue-50/60 hover:border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      dot: "bg-blue-500",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/60 hover:border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
    },
    red: {
      card: "border-red-100 bg-red-50/60 hover:border-red-200",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
    },
  };

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Agenda inteligente</p>
            <h2 className="mt-1 font-semibold">Tareas del dia</h2>
            <p className="mt-1 text-sm text-slate-500">
              Prioridades detectadas segun importe pendiente, antiguedad y seguimiento reciente.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
            <p className="text-2xl font-bold text-blue-700">{tasks.length}</p>
            <p className="text-xs font-medium text-blue-700">acciones</p>
          </div>
        </div>

      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        Recuerda marcar las facturas que ya hemos conseguido cobrar.
      </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-lg font-bold text-amber-700">{riskAmountLabel}</p>
            <p className="text-xs text-amber-700">importe en riesgo</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-lg font-bold text-red-700">{oldestDays || 0} dias</p>
            <p className="text-xs text-red-700">factura mas antigua</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No hay tareas urgentes detectadas.
          </p>
        ) : (
          tasks.map((task) => {
            const tone = taskTones[task.tone];

            return (
              <Link
                key={task.id}
                href={task.href}
                className={`block rounded-xl border p-4 transition ${tone.card}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 size-2.5 shrink-0 rounded-full ${tone.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{task.title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">{task.detail}</p>
                      </div>
                      <span className={`w-fit shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                        {task.action}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

    </article>
  );
}

function CollectionChartCard({ months }: { months: DashboardCollectionMonth[] }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Cobrado vs pendiente</h2>
          <p className="mt-1 text-sm text-slate-500">Evolucion de los ultimos 6 meses.</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" />Cobrado</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-500" />Pendiente</span>
        </div>
      </div>

      <div className="mt-5 flex h-56 items-end justify-between gap-4">
        {months.map((month) => (
          <div key={month.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-40 w-full max-w-16 items-end justify-center gap-1.5">
              <div
                className="w-5 rounded-t-md bg-emerald-500"
                style={{ height: `${month.collectedHeight}%` }}
                title={`Cobrado: ${month.collectedAmount}`}
              />
              <div
                className="w-5 rounded-t-md bg-amber-500"
                style={{ height: `${month.pendingHeight}%` }}
                title={`Pendiente: ${month.pendingAmount}`}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold capitalize">{month.label}</p>
              <p className="mt-1 text-[11px] text-emerald-700">{month.collectedAmount}</p>
              <p className="text-[11px] text-amber-700">{month.pendingAmount}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PortfolioHealthCard({ health }: { health?: DashboardPortfolioHealth }) {
  const score = health?.score ?? 100;
  const tone = health?.tone ?? "green";
  const tones = {
    green: {
      ring: "border-emerald-500 bg-emerald-50 text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700",
    },
    amber: {
      ring: "border-amber-500 bg-amber-50 text-amber-700",
      badge: "bg-amber-50 text-amber-700",
    },
    red: {
      ring: "border-red-500 bg-red-50 text-red-700",
      badge: "bg-red-50 text-red-700",
    },
  };

  const indicators = [
    {
      name: "Tendencia",
      value: health?.trendLabel || "Estable",
      detail: health?.trendDetail || "Mide si el ritmo de cobros mejora o empeora frente a la deuda pendiente.",
    },
    {
      name: "Concentracion",
      value: health?.concentrationLabel || "Repartida",
      detail: health?.concentrationDetail || "Indica si la deuda esta repartida o depende demasiado de pocos clientes.",
    },
    {
      name: "Seguimiento",
      value: health?.followUpLabel || "Al dia",
      detail: health?.followUpDetail || "Revisa si hay facturas pendientes sin recordatorio o accion reciente.",
    },
    {
      name: "Antiguedad",
      value: health?.ageLabel || "Controlada",
      detail: health?.ageDetail || "Mide cuantos dias lleva abierta la deuda pendiente mas antigua.",
    },
  ];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Salud de cartera</p>
          <h2 className="mt-1 font-semibold">{health?.label || "Cartera sana"}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone].badge}`}>
          Semaforo
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className={`flex size-24 shrink-0 items-center justify-center rounded-full border-[10px] text-2xl font-bold ${tones[tone].ring}`}>
          {score}
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-700">{score}/100</p>
          <p className="mt-1 text-slate-500">{health?.detail || "Los cobros evolucionan bien."}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4">
        {indicators.map((indicator) => (
          <div key={indicator.name} className="group relative flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
            <span className="text-sm text-slate-500">{indicator.name}</span>
            <span className="max-w-[150px] truncate text-right text-sm font-semibold text-slate-900">
              {indicator.value}
            </span>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg group-hover:block">
              {indicator.detail}
            </div>
          </div>
        ))}
      </div>
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
