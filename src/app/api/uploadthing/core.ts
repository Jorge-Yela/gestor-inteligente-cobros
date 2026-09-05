import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";
import { readInvoiceFileData } from "@/server/services/read-invoice-file-data";

const f = createUploadthing();

type ExtractedInvoiceData = {
  customerName?: string;
  customerTaxId?: string;
  customerEmail?: string;
};

function getExtractedInvoiceData(value: unknown): ExtractedInvoiceData {
  return value && typeof value === "object" ? value as ExtractedInvoiceData : {};
}

function normalizeText(value?: string) {
  return value?.trim() || "";
}

async function findMatchingCustomer({
  organizationId,
  extractedData,
  customerId,
}: {
  organizationId: string;
  extractedData: ExtractedInvoiceData;
  customerId?: string;
}) {
  if (customerId) {
    return prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        id: true,
      },
    });
  }

  const customerTaxId = normalizeText(extractedData.customerTaxId);
  const customerEmail = normalizeText(extractedData.customerEmail).toLowerCase();
  const customerName = normalizeText(extractedData.customerName);

  const filters = [
    ...(customerTaxId ? [{ taxId: { equals: customerTaxId, mode: "insensitive" as const } }] : []),
    ...(customerEmail ? [{ email: { equals: customerEmail, mode: "insensitive" as const } }] : []),
    ...(customerName ? [{ name: { equals: customerName, mode: "insensitive" as const } }] : []),
  ];

  if (filters.length === 0) {
    return null;
  }

  return prisma.customer.findFirst({
    where: {
      organizationId,
      OR: filters,
    },
    select: {
      id: true,
    },
  });
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
        invoiceId: z.string().optional(),
      }),
    )
    .middleware(async ({ input }) => {
      const role = await getCurrentUserRole();

      if (!canManageData(role)) {
        throw new Error("No tienes permisos para subir facturas");
      }

      const organizationId = await getCurrentOrganizationId();

      let customerId = input.customerId;
      let invoiceId = input.invoiceId;

      if (invoiceId) {
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: invoiceId,
            organizationId,
          },
          select: {
            id: true,
            customerId: true,
          },
        });

        if (!invoice) {
          throw new Error("Factura no encontrada");
        }

        customerId = invoice.customerId;
        invoiceId = invoice.id;
      }

      if (customerId) {
        const customer = await prisma.customer.findFirst({
          where: {
            id: customerId,
            organizationId,
          },
          select: {
            id: true,
          },
        });

        if (!customer) {
          throw new Error("Cliente no encontrado");
        }
      }

      return {
        organizationId,
        customerId,
        invoiceId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      let extractedText = "";
      let extractedData: ExtractedInvoiceData = {};
      let status: InvoiceFileStatus = InvoiceFileStatus.OCR_COMPLETED;

      try {
        const reading = await readInvoiceFileData({
          fileName: file.name,
        });

        extractedText = reading.extractedText;
        extractedData = getExtractedInvoiceData(reading.extractedData);
      } catch (error) {
        status = InvoiceFileStatus.OCR_FAILED;
        extractedText = error instanceof Error ? error.message : "No se pudo preparar el PDF para revision.";
      }

      const matchedCustomer = await findMatchingCustomer({
        organizationId: metadata.organizationId,
        customerId: metadata.customerId,
        extractedData,
      });

      const invoiceFile = await prisma.invoiceFile.create({
        data: {
          organizationId: metadata.organizationId,
          customerId: matchedCustomer?.id || null,
          invoiceId: metadata.invoiceId || null,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          mimeType: file.type || "application/pdf",
          sizeBytes: file.size,
          status,
          extractedText,
          extractedData,
        },
      });

      revalidatePath("/");
      revalidatePath("/invoice-files");
      revalidatePath("/invoices");
      revalidatePath("/customers");
      if (metadata.invoiceId) {
        revalidatePath(`/invoices/${metadata.invoiceId}`);
      }

      return {
        invoiceFileId: invoiceFile.id,
        matchedCustomerId: matchedCustomer?.id || null,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
