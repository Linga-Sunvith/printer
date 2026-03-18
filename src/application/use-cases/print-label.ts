import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { PrintJob, PrintResult } from "../../domain/models/job";
import type { LabelPayload } from "../../domain/models/payloads";

export class PrintLabel {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(job: PrintJob, payload: LabelPayload): Promise<PrintResult> {
    return this.adapter.printLabel(job, payload);
  }
}
