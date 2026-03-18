import type { PrintJob, PrintResult } from "../models/job";
import type { LabelPayload, ReceiptPayload } from "../models/payloads";
import type {
  AdapterCapabilityQuery,
  PrinterCapability,
  PrinterDevice,
  PrinterStatus
} from "../models/printer";

export interface PrinterAdapter {
  initialize(): Promise<void>;
  discoverPrinters(): Promise<PrinterDevice[]>;
  connect(printerId: string): Promise<PrinterDevice>;
  disconnect(printerId?: string): Promise<void>;
  getConnectedPrinter(): Promise<PrinterDevice | null>;
  getStatus(printerId?: string): Promise<PrinterStatus>;
  printReceipt(job: PrintJob, payload: ReceiptPayload): Promise<PrintResult>;
  printLabel(job: PrintJob, payload: LabelPayload): Promise<PrintResult>;
  cancelJob?(jobId: string): Promise<PrintResult>;
  getCapabilities(query: AdapterCapabilityQuery): Promise<PrinterCapability[]>;
}

export interface ReceiptRenderer {
  render(payload: ReceiptPayload): Promise<Uint8Array[]>;
}

export interface LabelRenderer {
  render(payload: LabelPayload): Promise<Uint8Array[]>;
}
