import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateTone } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { archiveTemplate } from "@/server/actions/archive-template";
import { deleteTemplate } from "@/server/actions/delete-template";
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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <Link href="/templates" className="text-sm text-slate-500 hover:text-blue-600">
            Volver a plantillas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Editar plantilla</h1>
          <p className="mt-2 text-slate-500">
            Modifica el texto reutilizable. No se enviará ninguna comunicación automáticamente.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <section className="max-w-4xl rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Contenido de la plantilla</h2>
            <p className="mt-1 text-sm text-slate-500">
              Puedes usar variables como {"{{cliente}}"}, {"{{factura}}"}, {"{{importe}}"} y {"{{fecha_control}}"}.
            </p>
          </div>

          <form action={updateTemplate} className="grid gap-5 p-6">
            <input type="hidden" name="templateId" value={template.id} />

            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm text-slate-500">
                Nombre interno
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={template.name}
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
                defaultValue={template.tone}
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
                defaultValue={template.subject}
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
                defaultValue={template.body}
                className="min-h-64 min-w-0 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <Button asChild variant="outline" className="h-11 rounded-lg border-slate-200 px-5">
              <Link href="/templates">Cancelar</Link>
            </Button>
            <Button type="submit" className="h-11 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
            </div>
          </form>

          <form action={archiveTemplate} className="border-t p-5">
            <input type="hidden" name="templateId" value={template.id} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium">Archivar plantilla</h3>
                <p className="mt-1 text-sm text-slate-500">
                  La plantilla dejará de aparecer en la lista principal, pero no se borrará definitivamente.
                </p>
              </div>
              <Button type="submit" variant="outline" className="min-h-11 shrink-0 rounded-lg border-slate-200">
                Archivar plantilla
              </Button>
            </div>
          </form>
        <form action={deleteTemplate} className="border-t p-5">
          <input type="hidden" name="templateId" value={template.id} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-700">Borrar plantilla</h3>
              <p className="mt-1 text-sm text-slate-500">
                Esta acción elimina la plantilla definitivamente. Las reclamaciones antiguas se conservarán.
              </p>
            </div>
            <Button type="submit" variant="outline" className="min-h-11 shrink-0 rounded-lg border-red-200 text-red-700 hover:bg-red-50">
              Borrar plantilla
            </Button>
          </div>
        </form>

        </section>
      </div>
    </main>
  );
}
