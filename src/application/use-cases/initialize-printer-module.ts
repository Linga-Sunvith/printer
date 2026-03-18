import type { PrinterAdapter } from "../../domain/contracts/adapter";

export class InitializePrinterModule {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(): Promise<void> {
    await this.adapter.initialize();
  }
}
