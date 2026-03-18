import type { PrinterAdapter } from "../../domain/contracts/adapter";
import { PrinterError } from "../../domain/models/errors";
import type { PrintResult } from "../../domain/models/job";

export class CancelJob {
  constructor(private readonly adapter: PrinterAdapter) {}

  async execute(jobId: string): Promise<PrintResult> {
    if (!this.adapter.cancelJob) {
      throw new PrinterError("JOB_CANCEL_NOT_SUPPORTED", "Cancel is not supported by this adapter.");
    }
    return this.adapter.cancelJob(jobId);
  }
}
