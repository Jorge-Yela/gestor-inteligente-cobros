import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

import { InvoiceFileStatus, InvoiceStatus, PaymentStatus, TimelineEventType } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { readInvoiceFileData } from "@/server/services/read-invoice-file-data";

const f = createUploadthing();

type ExtractedInvoiceData = {
  invoiceNumber?: string;
  customerName?: string;
  customerTaxId?: string;
  customerEmail?: string;
  issueDate?: string;
  amountCents?: number;
  currency?: string;
};

function getExtractedInvoiceData(value: unknown): ExtractedInvoiceData {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as ExtractedInvoiceData;
}

function getFallbackInvoiceNumber(fileKey: string | null | undefined, fileName: string) {
  const baseName = fileName.replace(/\.pdf$/i, "").trim();
  const suffix = fileKey?.slice(-8) || Date.now().toString();

  return baseName ? `${baseName}-${suffix}` : `factura-${suffix}`;
}

async function getUniqueInvoiceNumber(
  organizationId: string,
  preferredInvoiceNumber: string,
  fallbackInvoiceNumber: string,
) {
  const candidates = [preferredInvoiceNumber, fallbackInvoiceNumber];

  for (const candidate of candidates) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existingInvoice) {
      return candidate;
    }
  }

  for (let index = 2; index < 100; index++) {
    const candidate = `${fallbackInvoiceNumber}-${index}`;
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existingInvoice) {
      return candidate;
    }
  }

  return `${fallbackInvoiceNumber}-${Date.now()}`;
}

async function findExistingCustomerId(
  organizationId: string,
  taxId?: string,
  email?: string,
) {
  const filters = [
    ...(taxId ? [{ taxId }] : []),
    ...(email ? [{ email }] : []),
  ];

  if (filters.length === 0) {
    return null;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      organizationId,
      OR: filters,
    },
    select: {
      id: true,
    },
  });

  return customer?.id || null;
}

function getCustomerName(extractedData: ExtractedInvoiceData, fileName: string) {
  return extractedData.customerName?.trim() ||
    fileName
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b(factura|invoice)\b/gi, "")
      .trim() ||
    "Cliente pendiente de revisar";
}

export const uploadRouter = {
  invoicePdf: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 50,
    },
  })
    .input(
      z.object({
        customerId: z.string().optional(),
      }),
    )
    .middleware(async ({ input }) => {
      const role = await getCurrentUserRole();

      if (!canManageData(role)) {
        throw new Error("No tienes permisos para subir facturas");
      }

      const organizationId = await getCurrentOrganizationId();

      let customerId: string | undefined;

      if (input.customerId) {
        const customer = await prisma.customer.findFirst({
          where: {
            id: input.customerId,
            organizationId,
          },
          select: {
            id: true,
          },
        });

        if (!customer) {
          throw new Error("Cliente no encontrado");
        }

        customerId = customer.id;
      }

      return {
        organizationId,
        customerId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      let extractedText = "";
      let extractedData: ExtractedInvoiceData = {};
      let fileStatus = InvoiceFileStatus.OCR_COMPLETED;

      try {
        const reading = await readInvoiceFileData({
          fileName: file.name,
          fileUrl: file.ufsUrl,
        });

        extractedText = reading.extractedText;
        extractedData = getExtractedInvoiceData(reading.extractedData);
      } catch (error) {
        fileStatus = InvoiceFileStatus.OCR_FAILED;
        extractedText = error instanceof Error ? error.message : "No se pudo leer el PDF.";
      }

      const fallbackInvoiceNumber = getFallbackInvoiceNumber(file.key, file.name);
      const invoiceNumber = await getUniqueInvoiceNumber(
        metadata.organizationId,
        extractedData.invoiceNumber || fallbackInvoiceNumber,
        fallbackInvoiceNumber,
      );

      const invoice = await prisma.$transaction(async (tx) => {
        const existingCustomerId = metadata.customerId || await findExistingCustomerId(
          metadata.organizationId,
          extractedData.customerTaxId,
          extractedData.customerEmail,
        );
        const customerName = getCustomerName(extractedData, file.name);
        const customer = existingCustomerId
          ? await tx.customer.update({
              where: {
                id: existingCustomerId,
              },
              data: {
                name: customerName || undefined,
                taxId: extractedData.customerTaxId || undefined,
                email: extractedData.customerEmail || undefined,
              },
            })
          : await tx.customer.create({
              data: {
                organizationId: metadata.organizationId,
                name: customerName,
                taxId: extractedData.customerTaxId || null,
                email: extractedData.customerEmail || null,
              },
            });

        const createdInvoice = await tx.invoice.create({
          data: {
            organizationId: metadata.organizationId,
            customerId: customer.id,
            invoiceNumber,
            issueDate: extractedData.issueDate ? new Date(`${extractedData.issueDate}T00:00:00.000Z`) : null,
            amountCents: extractedData.amountCents || 1,
            currency: extractedData.currency || "EUR",
            status: InvoiceStatus.PENDING_REVIEW,
            paymentStatus: PaymentStatus.UNPAID,
            notes: fileStatus === InvoiceFileStatus.OCR_COMPLETED
              ? "Factura registrada desde carga masiva. Revisar datos detectados."
              : "Factura registrada desde carga masiva, pero no se pudo leer automaticamente el PDF.",
          },
        });

        await tx.invoiceFile.create({
          data: {
            organizationId: metadata.organizationId,
            customerId: customer.id,
            invoiceId: createdInvoice.id,
            fileName: file.name,
            fileUrl: file.ufsUrl,
            fileKey: file.key,
            mimeType: file.type || "application/pdf",
            sizeBytes: file.size,
            status: fileStatus,
            extractedText,
            extractedData,
          },
        });

        await tx.timelineEvent.create({
          data: {
            organizationId: metadata.organizationId,
            invoiceId: createdInvoice.id,
            type: TimelineEventType.INVOICE_CREATED,
            title: "Factura registrada desde carga masiva",
            description: "La factura se registro despues de aceptar la seleccion de PDFs.",
          },
        });

        return createdInvoice;
      });

      revalidatePath("/");
      revalidatePath("/customers");
      revalidatePath(`/customers/${invoice.customerId}`);
      revalidatePath("/invoice-files");
      revalidatePath("/invoices");
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;