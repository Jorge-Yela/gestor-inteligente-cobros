type ReadInvoiceFileDataInput = {
  fileName: string;
};

type ExtractedInvoiceData = {
  invoiceNumber: string;
  customerName: string;
  customerTaxId: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  issueDate: string;
  amountCents?: number;
  currency: string;
  confidence: number;
  notes: string;
};

function getFallbackInvoiceNumber(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/\s+/g, "-").trim();
}

export async function readInvoiceFileData(input: ReadInvoiceFileDataInput) {
  const extractedData: ExtractedInvoiceData = {
    invoiceNumber: getFallbackInvoiceNumber(input.fileName),
    customerName: "",
    customerTaxId: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    issueDate: "",
    amountCents: undefined,
    currency: "EUR",
    confidence: 0,
    notes: "Lectura automatica con IA desactivada para evitar costes. Revisa y completa los datos manualmente.",
  };

  return {
    extractedText: extractedData.notes,
    extractedData,
  };
}
