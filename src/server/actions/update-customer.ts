"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateCustomerSchema } from "@/modules/customers/schemas/customer.schema";
import { getCurrentOrganizationId } from "@/lib/auth/get-current-organization";
import { prisma } from "@/lib/db/prisma";
import { canManageData, getCurrentUserRole } from "@/lib/permissions/current-role";

export async function updateCustomer(formData: FormData) {
  const currentRole = await getCurrentUserRole();

  if (!canManageData(currentRole)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }

  const organizationId = await getCurrentOrganizationId();
  const result = updateCustomerSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    contactName: formData.get("contactName"),
    address: formData.get("address"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  const contactIds = formData.getAll("contactId").map((value) => String(value));
  const contactNames = formData.getAll("contactNameList").map((value) => String(value).trim());
  const contactEmails = formData.getAll("contactEmail").map((value) => String(value).trim());
  const contactPhones = formData.getAll("contactPhone").map((value) => String(value).trim());

  const contacts = contactNames
    .map((name, index) => ({
      id: contactIds[index] || "",
      name: name || null,
      email: contactEmails[index] || null,
      phone: contactPhones[index] || null,
    }))
    .filter((contact) => contact.name || contact.email || contact.phone);

  if (!result.success) {
    throw new Error("Customer form is invalid");
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: result.data.customerId,
      organizationId,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        name: result.data.name,
        taxId: result.data.taxId,
        contactName: result.data.contactName,
        address: result.data.address,
        email: result.data.email,
        phone: result.data.phone,
        notes: result.data.notes,
      },
    }),
    prisma.customerContact.deleteMany({
      where: {
        customerId: customer.id,
      },
    }),
    ...(contacts.length > 0
      ? [
          prisma.customerContact.createMany({
            data: contacts.map((contact) => ({
              customerId: customer.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/customers");
  revalidatePath(`/customers/${customer.id}`);
  revalidatePath("/");

  redirect(`/customers/${customer.id}`);
}
