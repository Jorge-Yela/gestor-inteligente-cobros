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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a avisos
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Crea tu propio aviso</h1>
          <p className="mt-2 text-muted-foreground">
            Redacta un aviso propio y guardalo en el tono que corresponda. No se enviara ningun email automaticamente.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Contenido del aviso</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes usar variables como {"{{cliente}}"}, {"{{factura}}"}, {"{{importe}}"} y {"{{fecha_control}}"}.
            </p>
          </div>

          <form action={createTemplate} className="grid gap-5 p-5">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm text-muted-foreground">
                Nombre del aviso
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Aviso amable personalizado"
                className="h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="tone" className="text-sm text-muted-foreground">
                Tono
              </label>
              <select
                id="tone"
                name="tone"
                defaultValue={TemplateTone.FRIENDLY}
                className="h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value={TemplateTone.FRIENDLY}>Amistoso</option>
                <option value={TemplateTone.FIRM}>Firme</option>
                <option value={TemplateTone.FINAL_NOTICE}>Ultimo aviso</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm text-muted-foreground">
                Asunto
              </label>
              <input
                id="subject"
                name="subject"
                required
                placeholder="Recordatorio de factura {{factura}}"
                className="h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm text-muted-foreground">
                Cuerpo
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={12}
                placeholder="Hola {{cliente}},&#10;&#10;Te escribimos en relacion con la factura {{factura}}..."
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
              <Button asChild variant="outline">
                <Link href="/templates">Cancelar</Link>
              </Button>
              <Button type="submit">Guardar aviso</Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
