import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { PrinterDevice } from "../../domain/models/printer";

export class DiscoverPrinters {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(): Promise<PrinterDevice[]> {
    return this.adapter.discoverPrinters();
  }
}
