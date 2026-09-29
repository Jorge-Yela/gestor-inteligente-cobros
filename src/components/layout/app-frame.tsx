"use client";

import Image from "next/image";
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
  { label: "Inicio", href: "/", icon: Home },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Facturas", href: "/invoices", icon: FileText },
  { label: "Reclamaciones", href: "/claim-drafts", icon: Mail },
  { label: "Plantillas", href: "/templates", icon: FileText },
  { label: "Informes", href: "/customer-stats", icon: BarChart3 },
];

function isActivePath(pathname: string, href: string) {
  if (
    href === "/invoices" &&
    (pathname === "/invoice-files" || pathname.startsWith("/invoice-files/"))
  ) {
    return true;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppFrame({ children, userIdentity }: { children: React.ReactNode; userIdentity: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/settings/billing")) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950 print:min-h-0 print:bg-white">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr] print:!block print:min-h-0">
        <aside className="hidden bg-[#071a3d] text-white lg:flex lg:flex-col print:!hidden">
          <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
      <Image src="/norvalor-logo.png" alt="" width={48} height={48} className="size-12 shrink-0 object-contain" />
      <span>NORVALOR</span>
    </Link>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-4">
            {navigationItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-white/10 p-4">
            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActivePath(pathname, "/settings")
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings className="size-5" />
              Configuración
            </Link>

            <form action={signOutUser}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-5" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col print:block">
          <header className="print:!hidden flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar clientes, facturas, reclamaciones..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                {userIdentity}
              </div>
            </div>
          </header>

          <div className="min-w-0 flex-1 print:flex-none">{children}</div>
        </section>
      </div>
    </main>
  );
}
