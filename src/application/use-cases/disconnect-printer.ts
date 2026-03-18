import type { PrinterAdapter } from "../../domain/contracts/adapter";

export class DisconnectPrinter {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(printerId?: string): Promise<void> {
    await this.adapter.disconnect(printerId);
  }
}
