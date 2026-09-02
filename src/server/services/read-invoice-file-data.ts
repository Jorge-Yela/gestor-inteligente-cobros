import { createRequire } from "node:module";

const requirePdfParse = createRequire(import.meta.url);

type ReadInvoiceFileDataInput = {
  fileName: string;
  fileUrl: string;
};

function cleanText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getValueFromLine(text: string, labels: string[]) {
  const lines = getLines(text);

  for (const line of lines) {
    for (const label of labels) {
      const pattern = new RegExp(`^${label}\\s*[:\\-]?\\s*(.+)$`, "i");
      const match = line.match(pattern);

      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return "";
}

function extractInvoiceNumber(text: string, fileName: string) {
  const value = getValueFromLine(text, [
    "factura",
    "numero de factura",
    "nº factura",
    "num factura",
    "invoice",
    "invoice number",
  ]);

  if (value) {
    return value.split(" ")[0].trim();
  }

  const match = text.match(/(?:factura|invoice)\s*(?:n[ºo.]*)?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i);

  if (match?.[1]) {
    return match[1].trim();
  }

  return fileName.replace(/\.pdf$/i, "").trim();
}

function extractCustomerName(text: string, fileName: string) {
  const value = getValueFromLine(text, [
    "cliente",
    "razon social",
    "razón social",
    "nombre cliente",
    "customer",
    "bill to",
  ]);

  if (value) {
    return value;
  }

  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(factura|invoice)\b/gi, "")
    .trim() || "Cliente pendiente de revisar";
}

function extractTaxId(text: string) {
  const match = text.match(/\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b/i);

  return match?.[1]?.toUpperCase() || "";
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match?.[0] || "";
}

function normalizeDate(value: string) {
  const trimmed = value.trim();

  const isoMatch = trimmed.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const spanishMatch = trimmed.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (!spanishMatch) {
    return "";
  }

  const day = spanishMatch[1].padStart(2, "0");
  const month = spanishMatch[2].padStart(2, "0");
  const year = spanishMatch[3].length === 2 ? `20${spanishMatch[3]}` : spanishMatch[3];

  return `${year}-${month}-${day}`;
}

function extractIssueDate(text: string) {
  const value = getValueFromLine(text, [
    "fecha factura",
    "fecha de factura",
    "fecha emision",
    "fecha de emision",
    "fecha emisión",
    "fecha de emisión",
    "date",
    "invoice date",
  ]);

  if (value) {
    return normalizeDate(value);
  }

  return normalizeDate(text);
}

function parseAmountToCents(value: string) {
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return Math.round(amount * 100);
}

function extractAmountCents(text: string) {
  const lines = getLines(text);
  const totalLine = lines.find((line) =>
    /(?:total factura|importe total|total a pagar|total)\b/i.test(line),
  );

  if (totalLine) {
    const amounts = totalLine.match(/\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:[,.]\d{2})/g);
    const lastAmount = amounts?.at(-1);

    if (lastAmount) {
      return parseAmountToCents(lastAmount);
    }
  }

  const amounts = text.match(/\d{1,3}(?:\.\d{3})*(?:,\d{2})\s*(?:€|EUR)|\d+(?:[,.]\d{2})\s*(?:€|EUR)/gi);
  const lastAmount = amounts?.at(-1);

  return lastAmount ? parseAmountToCents(lastAmount) : undefined;
}

async function extractTextFromPdf(fileUrl: string) {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`No se pudo leer el PDF subido: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const { PDFParse } = requirePdfParse("pdf-parse");
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

  try {
    const result = await parser.getText();

    return cleanText(result.text || "");
  } finally {
    await parser.destroy();
  }
}

export async function readInvoiceFileData(input: ReadInvoiceFileDataInput) {
  const extractedText = await extractTextFromPdf(input.fileUrl);
  const customerName = extractCustomerName(extractedText, input.fileName);

  return {
    extractedText,
    extractedData: {
      invoiceNumber: extractInvoiceNumber(extractedText, input.fileName),
      customerName,
      customerTaxId: extractTaxId(extractedText),
      customerEmail: extractEmail(extractedText),
      issueDate: extractIssueDate(extractedText),
      amountCents: extractAmountCents(extractedText),
      currency: "EUR",
    },
  };
}
