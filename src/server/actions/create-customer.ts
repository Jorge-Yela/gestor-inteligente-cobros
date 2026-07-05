"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const taxId = String(formData.get("taxId") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) {
    throw new Error("Customer name is required");
  }

  await prisma.customer.create({
    data: {
      organizationId: "demo-organization",
      name,
      taxId: taxId || null,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    },
  });

  revalidatePath("/customers");
  revalidatePath("/");

  redirect("/customers");
}
