import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

const f = createUploadthing();

export const uploadRouter = {
  invoicePdf: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 10,
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
      await prisma.invoiceFile.create({
        data: {
          organizationId: metadata.organizationId,
          customerId: metadata.customerId,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          mimeType: file.type || "application/pdf",
          sizeBytes: file.size,
          status: InvoiceFileStatus.UPLOADED,
        },
      });
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
