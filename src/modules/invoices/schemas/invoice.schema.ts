import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.iso.date().nullable());

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

export const registerInvoiceSchema = z.object({
  customerId: z.string().trim().min(1, "El cliente es obligatorio"),
  invoiceNumber: z.string().trim().min(1, "El numero de factura es obligatorio"),
  amount: z
    .string()
    .trim()
    .min(1, "El importe es obligatorio")
    .refine((value) => {
      const amount = Number(value.replace(",", "."));

      return Number.isFinite(amount) && amount > 0;
    }, "El importe debe ser un numero positivo"),
  issueDate: optionalDate,
  controlDate: optionalDate,
  notes: optionalText,
});
