"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
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

const navigationItems = [
  { label: "Panel de control", href: "/", icon: Home },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Reclamaciones", href: "/claim-drafts", icon: Mail },
  { label: "Plantillas", href: "/templates", icon: FileText },
  { label: "Informes", href: "/customer-stats", icon: BarChart3 },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/login")) {
    return <>{children}</>;
  }

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
            {navigationItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-sky-50/90 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-white/20 p-4">
            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActivePath(pathname, "/settings")
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-sky-50/90 hover:bg-white/15 hover:text-white"
              }`}
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

          <div className="min-w-0 flex-1">{children}</div>
        </section>
      </div>
    </main>
  );
}
