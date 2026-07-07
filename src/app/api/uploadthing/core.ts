import { createUploadthing, type FileRouter } from "uploadthing/next";

import { InvoiceFileStatus } from "@/generated/prisma/enums";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

const f = createUploadthing();

export const uploadRouter = {
  invoicePdf: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const role = await getCurrentUserRole();

      if (!canManageData(role)) {
        throw new Error("No tienes permisos para subir facturas");
      }

      const organizationId = await getCurrentOrganizationId();

      return {
        organizationId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.invoiceFile.create({
        data: {
          organizationId: metadata.organizationId,
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
