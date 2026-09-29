import { TemplateTone } from "@/generated/prisma/enums";

export function getDefaultTemplates(organizationId: string) {
  return [
      {
        organizationId,
        name: "Recordatorio amable",
        subject: "Recordatorio de factura pendiente {{invoiceNumber}}",
        body: "Hola {{customerName}},\n\nTe escribimos para recordar que la factura {{invoiceNumber}} por importe de {{amount}} sigue pendiente de pago.\n\nSi ya ha sido abonada, puedes ignorar este mensaje.\n\nGracias.",
        tone: TemplateTone.FRIENDLY,
        language: "es",
        isDefault: true,
      },
      {
        organizationId,
        name: "Reclamación firme",
        subject: "Factura vencida {{invoiceNumber}}",
        body: "Hola {{customerName}},\n\nLa factura {{invoiceNumber}}, por importe de {{amount}}, figura como vencida desde la fecha de control {{controlDate}}.\n\nPor favor, indícanos la fecha prevista de pago.\n\nGracias.",
        tone: TemplateTone.FIRM,
        language: "es",
        isDefault: false,
      },
      {
        organizationId,
        name: "Último aviso",
        subject: "Último aviso sobre factura {{invoiceNumber}}",
        body: "Hola {{customerName}},\n\nSeguimos sin tener constancia del pago de la factura {{invoiceNumber}} por importe de {{amount}}.\n\nSi no recibimos respuesta, valoraremos las siguientes acciones disponibles.\n\nGracias.",
        tone: TemplateTone.FINAL_NOTICE,
        language: "es",
        isDefault: false,
      },
    ];
}
