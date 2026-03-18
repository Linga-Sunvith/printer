import type { LabelPayloadMapper, ReceiptPayloadMapper } from "../../domain/contracts/mapper";
import type { LabelPayload, ReceiptPayload } from "../../domain/models/payloads";

export interface RetailReceiptSource {
  invoiceNumber: string;
  shopName: string;
  shopAddress: string;
  items: Array<{ name: string; quantity: number; total: number }>;
  grandTotal: number;
  currency: string;
}

export interface RetailLabelSource {
  name: string;
  priceText: string;
  barcode: string;
}

export class RetailReceiptMapper implements ReceiptPayloadMapper<RetailReceiptSource> {
  map(source: RetailReceiptSource): ReceiptPayload {
    return {
      documentType: "receipt",
      documentVariant: "retail-sale",
      printerWidthInches: 3,
      header: [
        { kind: "text", id: "shop", lines: [source.shopName, source.shopAddress] },
        { kind: "keyValue", id: "invoice", rows: [{ label: "Invoice", value: source.invoiceNumber }] }
      ],
      body: [
        {
          kind: "items",
          id: "items",
          title: "Items",
          items: source.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            total: { amount: item.total, currency: source.currency }
          }))
        }
      ],
      totals: [
        {
          kind: "keyValue",
          id: "totals",
          rows: [{ label: "Grand Total", value: `${source.currency} ${source.grandTotal}` }]
        }
      ],
      footer: [{ kind: "text", id: "footer", lines: ["Thank you"] }]
    };
  }
}

export class RetailLabelMapper implements LabelPayloadMapper<RetailLabelSource> {
  map(source: RetailLabelSource): LabelPayload {
    return {
      documentType: "label",
      layout: "retail-default",
      sizeMm: "102x40",
      copyCount: 1,
      textFields: [
        { id: "name", value: source.name },
        { id: "price", value: source.priceText }
      ],
      codeFields: [{ id: "barcode", symbology: "code128", value: source.barcode }]
    };
  }
}
