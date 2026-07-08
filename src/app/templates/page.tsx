import Link from "next/link";

import { TemplateTone } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

import { Button } from "@/components/ui/button";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";

function formatTone(tone: TemplateTone) {
  const labels: Record<TemplateTone, string> = {
    FRIENDLY: "Amable",
    FIRM: "Firme",
    FINAL_NOTICE: "Ultimo aviso",
  };

  return labels[tone];
}

export default async function TemplatesPage() {
  const organizationId = await getCurrentOrganizationId();

  const templates = await prisma.template.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Volver al dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Plantillas</h1>
            <p className="mt-2 text-muted-foreground">
              Textos base para preparar reclamaciones. Nada se envia sin aprobacion del usuario.
            </p>
          </div>

          <Button asChild>
            <Link href="/templates/new">Nueva plantilla</Link>
          </Button>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <article key={template.id} className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{template.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{formatTone(template.tone)}</p>
                </div>

                {template.isDefault ? (
                  <span className="rounded-md border px-2.5 py-1 text-xs font-medium">
                    Defecto
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-medium">Asunto</p>
                  <p className="mt-1 text-sm text-muted-foreground">{template.subject}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Cuerpo</p>
                  <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {template.body}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/templates/${template.id}`}>Editar</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
