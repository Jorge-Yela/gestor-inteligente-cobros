import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { TemplateTone } from "../src/generated/prisma/enums";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const organizationId = "demo-organization";

  await prisma.template.deleteMany({
    where: {
      organizationId,
    },
  });

  await prisma.template.createMany({
    data: [
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
        name: "Reclamacion firme",
        subject: "Factura vencida {{invoiceNumber}}",
        body: "Hola {{customerName}},\n\nLa factura {{invoiceNumber}}, por importe de {{amount}}, figura como vencida desde la fecha de control {{controlDate}}.\n\nPor favor, indicanos la fecha prevista de pago.\n\nGracias.",
        tone: TemplateTone.FIRM,
        language: "es",
        isDefault: false,
      },
      {
        organizationId,
        name: "Ultimo aviso",
        subject: "Ultimo aviso sobre factura {{invoiceNumber}}",
        body: "Hola {{customerName}},\n\nSeguimos sin tener constancia del pago de la factura {{invoiceNumber}} por importe de {{amount}}.\n\nSi no recibimos respuesta, valoraremos las siguientes acciones disponibles.\n\nGracias.",
        tone: TemplateTone.FINAL_NOTICE,
        language: "es",
        isDefault: false,
      },
    ],
  });

  console.log("Template seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
