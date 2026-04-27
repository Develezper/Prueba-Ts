import Link from "next/link";
import { headers } from "next/headers";

const roleLabelByValue: Record<string, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Empleado",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const roleValue = requestHeaders.get("x-user-role") ?? "EMPLOYEE";
  const roleLabel = roleLabelByValue[roleValue] ?? roleValue;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
              RV
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">RentVago</p>
              <p className="text-xs text-slate-500">Gestion residencial</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/search"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Buscar Propiedades
            </Link>
            <Link
              href="/favorites"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Mis Favoritos
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">
              Rol: {roleLabel}
            </p>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
