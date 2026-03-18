import type { PrinterAdapter } from "../../../domain/contracts/adapter";
import type { PrintJob, PrintResult } from "../../../domain/models/job";
import type { LabelPayload, ReceiptPayload } from "../../../domain/models/payloads";
import type {
  AdapterCapabilityQuery,
  PrinterCapability,
  PrinterDevice,
  PrinterStatus
} from "../../../domain/models/printer";

const mockCapabilities: PrinterCapability = {
  receipts: true,
  labels: true,
  supportsBarcode: true,
  supportsQrCode: true,
  supportsCashDrawer: false,
  supportsCancellation: true,
  supportedTransports: ["mock"],
  supportedDocumentTypes: ["receipt", "label", "kot", "token", "retail-document"],
  maxReceiptWidthInches: 3,
  supportedLabelSizesMm: ["102x40", "82x25"]
};

export class MockPrinterAdapter implements PrinterAdapter {
  private connectedPrinter: PrinterDevice | null = null;

  async initialize(): Promise<void> {}

  async discoverPrinters(): Promise<PrinterDevice[]> {
    return [
      {
        id: "mock-printer-1",
        name: "Mock Shared Printer",
        platform: "mock",
        transportType: "mock",
        capabilities: mockCapabilities
      }
    ];
  }

  async connect(printerId: string): Promise<PrinterDevice> {
    this.connectedPrinter = {
      id: printerId,
      name: "Mock Shared Printer",
      platform: "mock",
      transportType: "mock",
      capabilities: mockCapabilities
    };
    return this.connectedPrinter;
  }

  async disconnect(): Promise<void> {
    this.connectedPrinter = null;
  }

  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    return this.connectedPrinter;
  }

  async getStatus(): Promise<PrinterStatus> {
    return {
      state: this.connectedPrinter ? "connected" : "disconnected",
      updatedAt: new Date().toISOString()
    };
  }

  async printReceipt(job: PrintJob, payload: ReceiptPayload): Promise<PrintResult> {
    return {
      jobId: job.id,
      printer: this.connectedPrinter ?? undefined,
      status: "completed",
      message: `Mock receipt printed with ${payload.body.length} body sections.`
    };
  }

  async printLabel(job: PrintJob, payload: LabelPayload): Promise<PrintResult> {
    return {
      jobId: job.id,
      printer: this.connectedPrinter ?? undefined,
      status: "completed",
      message: `Mock label printed with ${payload.copyCount} copies.`
    };
  }

  async cancelJob(jobId: string): Promise<PrintResult> {
    return {
      jobId,
      printer: this.connectedPrinter ?? undefined,
      status: "cancelled",
      message: "Cancelled in mock adapter."
    };
  }

  async getCapabilities(_query: AdapterCapabilityQuery): Promise<PrinterCapability[]> {
    return [mockCapabilities];
  }
}
