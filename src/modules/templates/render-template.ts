type TemplateVariables = {
  customerName: string;
  invoiceNumber: string;
  amount: string;
  controlDate: string;
};

export function renderTemplate(template: string, variables: TemplateVariables) {
  return template
    .replaceAll("{{customerName}}", variables.customerName)
    .replaceAll("{{invoiceNumber}}", variables.invoiceNumber)
    .replaceAll("{{amount}}", variables.amount)
    .replaceAll("{{controlDate}}", variables.controlDate);
}
