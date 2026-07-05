"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCustomerSchema } from "@/modules/customers/schemas/customer.schema";
import { prisma } from "@/lib/db/prisma";

export async function createCustomer(formData: FormData) {
  const result = createCustomerSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    throw new Error("Customer form is invalid");
  }

  await prisma.customer.create({
    data: {
      organizationId: "demo-organization",
      name: result.data.name,
      taxId: result.data.taxId,
      contactName: result.data.contactName,
      email: result.data.email,
      phone: result.data.phone,
      notes: result.data.notes,
    },
  });

  revalidatePath("/customers");
  revalidatePath("/");

  redirect("/customers");
}
