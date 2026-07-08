import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { updateTemplate } from "@/server/actions/update-template";

type TemplateDetailPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "missing-fields": "Completa nombre, asunto y cuerpo de la plantilla.",
  };

  return error ? messages[error] : null;
}

export default async function TemplateDetailPage({
  params,
  searchParams,
}: TemplateDetailPageProps) {
  const { templateId } = await params;
  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);
  const organizationId = await getCurrentOrganizationId();

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      organizationId,
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a plantillas
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Editar plantilla</h1>
          <p className="mt-2 text-muted-foreground">
            Modifica el texto reutilizable. No se enviara ninguna comunicacion automaticamente.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Contenido de la plantilla</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Puedes usar variables como {"{{cliente}}"}, {"{{factura}}"}, {"{{importe}}"} y {"{{fecha_control}}"}.
            </p>
          </div>

          <form action={updateTemplate} className="grid gap-5 p-5">
            <input type="hidden" name="templateId" value={template.id} />

            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm text-muted-foreground">
                Nombre interno
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={template.name}
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
                defaultValue={template.tone}
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
                defaultValue={template.subject}
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
                defaultValue={template.body}
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
              <Button asChild variant="outline">
                <Link href="/templates">Cancelar</Link>
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
