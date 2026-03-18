import type { LabelPayloadMapper, ReceiptPayloadMapper } from "../../domain/contracts/mapper";
import type { LabelPayload, ReceiptPayload } from "../../domain/models/payloads";

export interface DinoReceiptSource {
  billNumber: string;
  outletName: string;
  tableName?: string;
  waiterName?: string;
  items: Array<{ itemName: string; quantity: number; lineTotal: number }>;
  subtotal: number;
  currency: string;
}

export interface DinoLabelSource {
  title: string;
  token: string;
}

export class DinoReceiptMapper implements ReceiptPayloadMapper<DinoReceiptSource> {
  map(source: DinoReceiptSource): ReceiptPayload {
    return {
      documentType: "receipt",
      documentVariant: "dino-prebill",
      printerWidthInches: 3,
      header: [
        { kind: "text", id: "outlet", lines: [source.outletName] },
        {
          kind: "keyValue",
          id: "bill-meta",
          rows: [
            { label: "Bill", value: source.billNumber },
            ...(source.tableName ? [{ label: "Table", value: source.tableName }] : []),
            ...(source.waiterName ? [{ label: "Waiter", value: source.waiterName }] : [])
          ]
        }
      ],
      body: [
        {
          kind: "items",
          id: "items",
          title: "Order",
          items: source.items.map((item) => ({
            name: item.itemName,
            quantity: item.quantity,
            total: { amount: item.lineTotal, currency: source.currency }
          }))
        }
      ],
      totals: [
        {
          kind: "keyValue",
          id: "subtotal",
          rows: [{ label: "Subtotal", value: `${source.currency} ${source.subtotal}` }]
        }
      ],
      footer: [{ kind: "text", id: "footer", lines: ["Visit again"] }]
    };
  }
}

export class DinoLabelMapper implements LabelPayloadMapper<DinoLabelSource> {
  map(source: DinoLabelSource): LabelPayload {
    return {
      documentType: "label",
      layout: "dino-token",
      sizeMm: "82x25",
      copyCount: 1,
      textFields: [{ id: "title", value: source.title }],
      codeFields: [{ id: "token", symbology: "code128", value: source.token }]
    };
  }
}
