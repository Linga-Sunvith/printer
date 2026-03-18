import type { ReceiptRenderer } from "../../../domain/contracts/adapter";
import type { ReceiptPayload, ReceiptSection } from "../../../domain/models/payloads";

export class EscPosReceiptRenderer implements ReceiptRenderer {
  async render(payload: ReceiptPayload): Promise<Uint8Array[]> {
    const chunks: Uint8Array[] = [];
    const lines = [...payload.header, ...payload.body, ...payload.totals, ...payload.footer]
      .flatMap((section) => this.renderSection(section))
      .join("\n");
    chunks.push(new TextEncoder().encode(lines + "\n"));
    return chunks;
  }

  private renderSection(section: ReceiptSection): string[] {
    switch (section.kind) {
      case "text":
        return [...(section.title ? [section.title] : []), ...section.lines];
      case "keyValue":
        return [
          ...(section.title ? [section.title] : []),
          ...section.rows.map((row) => `${row.label}: ${row.value}`)
        ];
      case "items":
        return [
          ...(section.title ? [section.title] : []),
          ...section.items.map((item) => `${item.name} x${item.quantity} ${item.total.amount}`)
        ];
      case "barcode":
      case "qrcode":
        return [section.label ? `${section.label}: ${section.value}` : section.value];
      case "extension":
        return [`[${section.extensionType}]`];
    }
  }
}
