type ReadInvoiceFileDataInput = {
  fileName: string;
  fileUrl: string;
};

export async function readInvoiceFileData(input: ReadInvoiceFileDataInput) {
  const extractedText = `FACTURA FAC-OCR-2026-001
Cliente: Cliente OCR Demo SL
NIF: B98765432
Email: administracion@clienteocr.local
Fecha factura: 2026-07-01
Importe total: 1.250,00 EUR

Lectura preparada para revisar los datos antes de registrar la factura.
Archivo: ${input.fileName}`;

  return {
    extractedText,
    extractedData: {
      invoiceNumber: "FAC-OCR-2026-001",
      customerName: "Cliente OCR Demo SL",
      customerTaxId: "B98765432",
      customerEmail: "administracion@clienteocr.local",
      issueDate: "2026-07-01",
      amountCents: 125000,
      currency: "EUR",
    },
  };
}
