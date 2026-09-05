"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

const invoiceRowSchema = z.object({
  customerName: z.string().trim().min(1),
  customerTaxId: z.string().trim().optional(),
  customerEmail: z.string().trim().optional(),
  invoiceNumber: z.string().trim().min(1),
  issueDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  amount: z.string().trim().min(1),
  currency: z.string().trim().optional(),
});

const invoiceRowsSchema = z.array(invoiceRowSchema).min(1);

type InvoiceRow = z.infer<typeof invoiceRowSchema>;

function normalizeText(value?: string) {
  return value?.trim() || "";
}

function parseAmountToCents(value: string) {
  const amount = Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Importe no valido: ${value}`);
  }

  return Math.round(amount * 100);
}

function parseDate(value?: string) {
  const cleanValue = normalizeText(value);

  if (!cleanValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return new Date(`${cleanValue}T00:00:00.000Z`);
  }

  const europeanDate = cleanValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (europeanDate) {
    const [, day, month, year] = europeanDate;

    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`);
  }

  const parsedDate = new Date(cleanValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

async function getUniqueInvoiceNumber(organizationId: string, invoiceNumber: string) {
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber,
    },
    select: {
      id: true,
    },
  });

  if (!existingInvoice) {
    return invoiceNumber;
  }

  for (let index = 2; index < 100; index++) {
    const candidate = `${invoiceNumber}-${index}`;
    const duplicate = await prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!duplicate) {
      return candidate;
    }
  }

  return `${invoiceNumber}-${Date.now()}`;
}

async function findOrCreateCustomer(organizationId: string, row: InvoiceRow) {
  const customerName = normalizeText(row.customerName);
  const customerTaxId = normalizeText(row.customerTaxId);
  const customerEmail = normalizeText(row.customerEmail).toLowerCase();

  const filters = [
    ...(customerTaxId ? [{ taxId: { equals: customerTaxId, mode: "insensitive" as const } }] : []),
    ...(customerEmail ? [{ email: { equals: customerEmail, mode: "insensitive" as const } }] : []),
    { name: { equals: customerName, mode: "insensitive" as const } },
  ];

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      organizationId,
      OR: filters,
    },
    select: {
      id: true,
    },
  });

  if (existingCustomer) {
    return existingCustomer;
  }

  return prisma.customer.create({
    data: {
      organizationId,
      name: customerName,
      taxId: customerTaxId || null,
      email: customerEmail || null,
      notes: "Cliente creado desde importacion Excel de facturas.",
    },
    select: {
      id: true,
    },
  });
}

export async function importInvoicesFromExcelRows(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para importar facturas");
  }

  const organizationId = await getCurrentOrganizationId();
  const rowsValue = String(formData.get("rows") || "[]");
  const parsedRows = invoiceRowsSchema.safeParse(JSON.parse(rowsValue));

  if (!parsedRows.success) {
    throw new Error("Revisa el Excel: faltan datos obligatorios en alguna fila");
  }

  await prisma.$transaction(async (tx) => {
    for (const row of parsedRows.data) {
      const customer = await findOrCreateCustomer(organizationId, row);
      const invoiceNumber = await getUniqueInvoiceNumber(
        organizationId,
        normalizeText(row.invoiceNumber),
      );

      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          customerId: customer.id,
          invoiceNumber,
          issueDate: parseDate(row.issueDate),
          dueDate: parseDate(row.dueDate),
          amountCents: parseAmountToCents(row.amount),
          currency: normalizeText(row.currency).toUpperCase() || "EUR",
          status: InvoiceStatus.PENDING_REVIEW,
          paymentStatus: PaymentStatus.UNPAID,
          notes: "Factura importada desde Excel.",
        },
      });

      await tx.timelineEvent.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          type: TimelineEventType.INVOICE_CREATED,
          title: "Factura importada desde Excel",
          description: "La factura se registro desde una importacion general de Excel.",
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/customers");
  revalidatePath("/customer-stats");

  redirect("/invoices");
}
