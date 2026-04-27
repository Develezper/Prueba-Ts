import { SearchLoadingSkeleton } from "./search-page.components";

export default function Loading() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="h-11 rounded-xl bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-11 rounded-xl bg-slate-200" />
              <div className="h-11 rounded-xl bg-slate-200" />
            </div>
            <div className="h-11 rounded-xl bg-slate-200" />
            <div className="h-11 rounded-xl bg-slate-200" />
            <div className="h-11 rounded-xl bg-slate-200" />
          </div>
        </aside>

        <div className="space-y-4">
          <div className="h-16 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <SearchLoadingSkeleton />
        </div>
      </section>
    </div>
  );
}