import { config } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  InvoiceStatus,
  OrganizationRole,
  PaymentStatus,
  TimelineEventType,
} from "../src/generated/prisma/enums";

config({ path: ".env.local" });

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!.replace(/\\\$/g, "$"),
  database: process.env.DATABASE_NAME!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Jorge Demo",
      email: "demo@gestorcobros.local",
    },
  });

  const organization = await prisma.organization.create({
    data: {
      id: "demo-organization",
      name: "Demo Pyme SL",
      taxId: "B00000000",
      billingEmail: "administracion@demopyme.local",
      defaultCurrency: "EUR",
      members: {
        create: {
          userId: user.id,
          role: OrganizationRole.OWNER,
        },
      },
    },
  });

  const alba = await prisma.customer.create({
    data: {
      organizationId: organization.id,
      name: "Alba Consulting",
      taxId: "B11111111",
      email: "pagos@albaconsulting.local",
      phone: "+34 600 111 222",
      contactName: "Laura Martin",
      notes: "Cliente con retrasos habituales en pagos trimestrales.",
    },
  });

  const norte = await prisma.customer.create({
    data: {
      organizationId: organization.id,
      name: "Norte Digital",
      taxId: "B22222222",
      email: "admin@nortedigital.local",
      phone: "+34 600 333 444",
      contactName: "Carlos Vidal",
    },
  });

  const mercurio = await prisma.customer.create({
    data: {
      organizationId: organization.id,
      name: "Mercurio Labs",
      taxId: "B33333333",
      email: "finance@mercuriolabs.local",
      contactName: "Marta Ruiz",
    },
  });

  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        organizationId: organization.id,
        customerId: alba.id,
        invoiceNumber: "FAC-2026-014",
        issueDate: new Date("2026-06-01"),
        dueDate: new Date("2026-06-30"),
        amountCents: 245000,
        status: InvoiceStatus.OVERDUE,
        paymentStatus: PaymentStatus.UNPAID,
        notes: "Pendiente de revisar antes de preparar reclamacion.",
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: organization.id,
        customerId: norte.id,
        invoiceNumber: "FAC-2026-019",
        issueDate: new Date("2026-06-10"),
        dueDate: new Date("2026-07-10"),
        amountCents: 118000,
        status: InvoiceStatus.ACTIVE,
        paymentStatus: PaymentStatus.UNPAID,
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: organization.id,
        customerId: mercurio.id,
        invoiceNumber: "FAC-2026-021",
        issueDate: new Date("2026-06-15"),
        dueDate: new Date("2026-07-15"),
        amountCents: 390000,
        status: InvoiceStatus.ACTIVE,
        paymentStatus: PaymentStatus.UNPAID,
      },
    }),
  ]);

  await prisma.timelineEvent.createMany({
    data: invoices.map((invoice) => ({
      organizationId: organization.id,
      invoiceId: invoice.id,
      userId: user.id,
      type: TimelineEventType.INVOICE_CREATED,
      title: "Factura creada",
      description: `Factura ${invoice.invoiceNumber} creada como dato de prueba.`,
    })),
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
