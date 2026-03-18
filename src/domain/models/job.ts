import type { LabelPayload, ReceiptPayload } from "./payloads";
import type { PrinterDevice } from "./printer";

export type PrintJobDocumentType = "receipt" | "label" | "kot" | "token" | "retail-document";

export interface PrintJob {
  id: string;
  documentType: PrintJobDocumentType;
  targetPrinterId: string;
  createdAt: string;
  payload: ReceiptPayload | LabelPayload;
  metadata?: Record<string, unknown>;
}

export interface PrintResult {
  jobId: string;
  printer?: PrinterDevice;
  status: "queued" | "completed" | "failed" | "cancelled";
  message?: string;
}
