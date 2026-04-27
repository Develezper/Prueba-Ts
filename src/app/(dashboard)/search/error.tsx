"use client";

interface SearchErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SearchError({ error, reset }: SearchErrorProps) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
        Error de busqueda
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        No pudimos cargar los resultados
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Intenta nuevamente en unos segundos."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Reintentar
      </button>
    </div>
  );
}