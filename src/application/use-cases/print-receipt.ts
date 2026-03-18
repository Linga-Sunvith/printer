import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { PrintJob, PrintResult } from "../../domain/models/job";
import type { ReceiptPayload } from "../../domain/models/payloads";

export class PrintReceipt {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(job: PrintJob, payload: ReceiptPayload): Promise<PrintResult> {
    return this.adapter.printReceipt(job, payload);
  }
}
