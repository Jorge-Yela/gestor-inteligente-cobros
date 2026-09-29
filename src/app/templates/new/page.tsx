import Link from "next/link";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { createTemplate } from "@/server/actions/create-template";

type NewTemplatePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-fields": "Completa nombre, asunto y cuerpo del aviso.",
  };

  return error ? messages[error] : null;
}

export default async function NewTemplatePage({ searchParams }: NewTemplatePageProps) {
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <Link href="/templates" className="text-sm text-slate-500 hover:text-blue-600">
            Volver a plantillas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Crear aviso</h1>
          <p className="mt-2 text-slate-500">
            Redacta un aviso propio y guárdalo en el tono que corresponda. No se enviará ningún correo automáticamente.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 max-w-4xl rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <section className="max-w-4xl rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold">Contenido del aviso</h2>
            <p className="mt-1 text-sm text-slate-500">
              Puedes usar variables como {"{{cliente}}"}, {"{{factura}}"}, {"{{importe}}"} y {"{{fecha_control}}"}.
            </p>
          </div>

          <form action={createTemplate} className="grid gap-5 p-6">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm text-slate-500">
                Nombre del aviso
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Aviso amable personalizado"
                className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="tone" className="text-sm text-slate-500">
                Tono
              </label>
              <select
                id="tone"
                name="tone"
                defaultValue={TemplateTone.FRIENDLY}
                className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value={TemplateTone.FRIENDLY}>Amable</option>
                <option value={TemplateTone.FIRM}>Firme</option>
                <option value={TemplateTone.FINAL_NOTICE}>Último aviso</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm text-slate-500">
                Asunto
              </label>
              <input
                id="subject"
                name="subject"
                required
                placeholder="Recordatorio de factura {{factura}}"
                className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm text-slate-500">
                Cuerpo
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={12}
                placeholder="Hola {{cliente}},&#10;&#10;Te escribimos en relación con la factura {{factura}}..."
                className="min-h-64 min-w-0 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <Button asChild variant="outline" className="h-11 rounded-lg border-slate-200 px-5">
                <Link href="/templates">Cancelar</Link>
              </Button>
              <Button type="submit" className="h-11 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700">Guardar aviso</Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
