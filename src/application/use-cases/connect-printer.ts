import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { PrinterDevice } from "../../domain/models/printer";

export class ConnectPrinter {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(printerId: string): Promise<PrinterDevice> {
    return this.adapter.connect(printerId);
  }
}
