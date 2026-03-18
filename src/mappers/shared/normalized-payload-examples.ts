import type { LabelPayload, ReceiptPayload } from "../../domain/models/payloads";

export const sampleRetailReceiptPayload: ReceiptPayload = {
  documentType: "receipt",
  documentVariant: "retail-sale",
  printerWidthInches: 3,
  header: [{ kind: "text", id: "header-store", lines: ["Retail Store", "Main Road"] }],
  body: [
    {
      kind: "items",
      id: "items",
      title: "Items",
      items: [
        {
          name: "Rice 5kg",
          quantity: 1,
          total: { amount: 350, currency: "INR" }
        }
      ]
    }
  ],
  totals: [
    {
      kind: "keyValue",
      id: "totals",
      rows: [{ label: "Grand Total", value: "INR 350", emphasis: "strong" }]
    }
  ],
  footer: [{ kind: "text", id: "footer", lines: ["Thank you"] }]
};

export const sampleDinoReceiptPayload: ReceiptPayload = {
  documentType: "receipt",
  documentVariant: "dino-prebill",
  printerWidthInches: 3,
  header: [{ kind: "text", id: "header-table", lines: ["Dino Cafe", "Table 12"] }],
  body: [
    {
      kind: "items",
      id: "items",
      title: "Order",
      items: [
        {
          name: "Masala Dosa",
          quantity: 2,
          total: { amount: 240, currency: "INR" }
        }
      ]
    },
    {
      kind: "extension",
      id: "dino-table-extension",
      extensionType: "dino.table",
      data: { table: "12", waiter: "Amit" }
    }
  ],
  totals: [
    {
      kind: "keyValue",
      id: "totals",
      rows: [{ label: "Subtotal", value: "INR 240" }]
    }
  ],
  footer: [{ kind: "text", id: "footer", lines: ["Pre-bill"] }]
};

export const sampleLabelPayload: LabelPayload = {
  documentType: "label",
  layout: "default-product-label",
  sizeMm: "102x40",
  copyCount: 1,
  textFields: [
    { id: "name", value: "Retail Sample Product" },
    { id: "price", value: "INR 99" }
  ],
  codeFields: [{ id: "barcode", symbology: "code128", value: "1234567890" }]
};
