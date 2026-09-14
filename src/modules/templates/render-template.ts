type TemplateVariables = {
  customerName?: string;
  cliente?: string;
  invoiceNumber?: string;
  amount?: string;
  importe?: string;
  controlDate?: string;
  facturas?: string;
};

export function renderTemplate(template: string, variables: TemplateVariables) {
  const customerName = variables.customerName || variables.cliente || "";
  const amount = variables.amount || variables.importe || "";

  return template
    .replaceAll("{{customerName}}", customerName)
    .replaceAll("{{cliente}}", customerName)
    .replaceAll("{{invoiceNumber}}", variables.invoiceNumber || "")
    .replaceAll("{{amount}}", amount)
    .replaceAll("{{importe}}", amount)
    .replaceAll("{{controlDate}}", variables.controlDate || "")
    .replaceAll("{{facturas}}", variables.facturas || "");
}
