export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          SaaS para pymes
        </p>

        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
          Gestor Inteligente de Cobros
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Controla facturas pendientes, organiza seguimientos y prepara
          reclamaciones con supervisión humana en cada paso.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Dashboard de cobros
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Seguimiento de facturas
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Recordatorios y tareas
          </div>
        </div>
      </section>
    </main>
  );
}
