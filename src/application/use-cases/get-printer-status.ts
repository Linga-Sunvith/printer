import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { PrinterStatus } from "../../domain/models/printer";

export class GetPrinterStatus {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(printerId?: string): Promise<PrinterStatus> {
    return this.adapter.getStatus(printerId);
  }
}
