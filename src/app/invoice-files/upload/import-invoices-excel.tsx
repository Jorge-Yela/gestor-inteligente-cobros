"use client";

import { FileSpreadsheet, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { importInvoicesFromExcelRows } from "@/server/actions/import-invoices-excel";

type InvoiceImportRow = {
  customerName: string;
  customerTaxId: string;
  customerEmail: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  currency: string;
};

const emptyRow: InvoiceImportRow = {
  customerName: "",
  customerTaxId: "",
  customerEmail: "",
  invoiceNumber: "",
  issueDate: "",
  dueDate: "",
  amount: "",
  currency: "EUR",
};

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getValue(row: Record<string, unknown>, aliases: string[]) {
  const entry = Object.entries(row).find(([key]) =>
    aliases.includes(normalizeHeader(key)),
  );

  return entry?.[1] ?? "";
}

function formatExcelValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").trim();
}

function mapSheetRow(row: Record<string, unknown>): InvoiceImportRow {
  return {
    customerName: formatExcelValue(getValue(row, ["cliente", "nombrecliente", "empresa", "customer", "customername"])),
    customerTaxId: formatExcelValue(getValue(row, ["cif", "nif", "cifnif", "taxid", "vat"])),
    customerEmail: formatExcelValue(getValue(row, ["email", "correo", "correoelectronico"])),
    invoiceNumber: formatExcelValue(getValue(row, ["factura", "numerofactura", "nfactura", "numfactura", "invoice", "invoicenumber"])),
    issueDate: formatExcelValue(getValue(row, ["fecha", "fechafactura", "fechaemision", "issue", "issuedate"])),
    dueDate: formatExcelValue(getValue(row, ["fechavencimiento", "fechacontrol", "vencimiento", "duedate"])),
    amount: formatExcelValue(getValue(row, ["importe", "total", "importe total", "amount"])),
    currency: formatExcelValue(getValue(row, ["moneda", "currency"])) || "EUR",
  };
}

function updateRow(rows: InvoiceImportRow[], index: number, field: keyof InvoiceImportRow, value: string) {
  return rows.map((row, rowIndex) =>
    rowIndex === index ? { ...row, [field]: value } : row,
  );
}

export function ImportInvoicesExcel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<InvoiceImportRow[]>([]);
  const [message, setMessage] = useState("Todavia no has seleccionado ningun Excel.");

  async function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        type: "array",
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const importedRows = rawRows
        .map(mapSheetRow)
        .filter((row) => row.customerName || row.invoiceNumber || row.amount);

      setRows(importedRows);
      setMessage(`${importedRows.length} factura${importedRows.length === 1 ? "" : "s"} detectada${importedRows.length === 1 ? "" : "s"}. Revisa antes de registrar.`);
    } catch {
      setRows([]);
      setMessage("No se ha podido leer el Excel. Revisa que sea .xlsx, .xls o .csv.");
    }

    event.target.value = "";
  }

  function removeRow(index: number) {
    setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Importar facturas desde Excel</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube un listado con cliente, factura, fecha e importe. Podras revisar las filas antes de registrarlas.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Seleccionar Excel</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Columnas recomendadas: cliente, CIF, email, numero factura, fecha factura, importe y fecha vencimiento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleSelectFile}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-slate-200 bg-white"
                onClick={() => inputRef.current?.click()}
              >
                Seleccionar Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </div>

        {rows.length > 0 ? (
          <form action={importInvoicesFromExcelRows} className="space-y-4">
            <input type="hidden" name="rows" value={JSON.stringify(rows)} />

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Cliente</th>
                    <th className="px-3 py-3 font-medium">CIF/NIF</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Factura</th>
                    <th className="px-3 py-3 font-medium">Fecha factura</th>
                    <th className="px-3 py-3 font-medium">Vencimiento</th>
                    <th className="px-3 py-3 font-medium">Importe</th>
                    <th className="px-3 py-3 font-medium">Moneda</th>
                    <th className="px-3 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={`${row.invoiceNumber}-${index}`}>
                      {Object.keys(emptyRow).map((field) => (
                        <td key={field} className="px-3 py-3">
                          <input
                            value={row[field as keyof InvoiceImportRow]}
                            onChange={(event) =>
                              setRows((currentRows) =>
                                updateRow(currentRows, index, field as keyof InvoiceImportRow, event.target.value),
                              )
                            }
                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeRow(index)}
                          aria-label="Eliminar fila"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-slate-200"
                onClick={() => {
                  setRows([]);
                  setMessage("Todavia no has seleccionado ningun Excel.");
                }}
              >
                Limpiar
              </Button>
              <Button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700">
                Registrar facturas pendientes
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
