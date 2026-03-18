import type { LabelRenderer } from "../../../domain/contracts/adapter";
import type { LabelPayload } from "../../../domain/models/payloads";

export class SimpleLabelRenderer implements LabelRenderer {
  async render(payload: LabelPayload): Promise<Uint8Array[]> {
    const lines = [
      `LAYOUT:${payload.layout}`,
      `SIZE:${payload.sizeMm}`,
      ...payload.textFields.map((field) => `${field.id}=${field.value}`),
      ...payload.codeFields.map((field) => `${field.symbology}:${field.value}`)
    ];
    return [new TextEncoder().encode(lines.join("\n"))];
  }
}
