import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.email().nullable());

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  taxId: optionalText,
  contactName: optionalText,
  address: optionalText,
  email: optionalEmail,
  phone: optionalText,
  notes: optionalText,
});


export const updateCustomerSchema = createCustomerSchema.extend({
  customerId: z.string().trim().min(1, "El cliente es obligatorio"),
});
