import type { PrinterAdapter } from "../../../domain/contracts/adapter";
import type { PrintJob, PrintResult } from "../../../domain/models/job";
import type { LabelPayload, ReceiptPayload } from "../../../domain/models/payloads";
import type {
  AdapterCapabilityQuery,
  PrinterCapability,
  PrinterDevice,
  PrinterStatus
} from "../../../domain/models/printer";
import { PrinterError } from "../../../domain/models/errors";
import {
  getFallbackWindowsPrinterCapabilities,
  getWindowsNativePrinterModule,
  type NativeWindowsPrinterDevice,
  type WindowsNativePrinterModule
} from "../../../react-native/native-windows-printer-module";
import { EscPosReceiptRenderer } from "../../renderers/receipt/esc-pos-receipt-renderer";
import { SimpleLabelRenderer } from "../../renderers/label/simple-label-renderer";
import {
  requireConnectedPrinter,
  validateLabelPayload,
  validateReceiptPayload
} from "../shared/adapter-validators";

const windowsCapabilities: PrinterCapability = {
  ...getFallbackWindowsPrinterCapabilities(),
  labels: true,
  supportedTransports: ["usb", "serial", "socket", "wifi"],
  supportedDocumentTypes: ["receipt", "label", "kot", "token", "retail-document"],
  supportedLabelSizesMm: ["102x40", "82x25"]
};

export class WindowsPrinterAdapter implements PrinterAdapter {
  private readonly nativeModule: WindowsNativePrinterModule;
  private readonly receiptRenderer = new EscPosReceiptRenderer();
  private readonly labelRenderer = new SimpleLabelRenderer();
  private connectedPrinter: PrinterDevice | null = null;

  constructor(nativeModule: WindowsNativePrinterModule = getWindowsNativePrinterModule()) {
    this.nativeModule = nativeModule;
  }

  async initialize(): Promise<void> {
    await this.callNative(() => this.nativeModule.initialize());
  }

  async discoverPrinters(): Promise<PrinterDevice[]> {
    const printers = await this.callNative(() => this.nativeModule.discoverPrinters());
    return printers.map((printer) => this.mapPrinter(printer));
  }

  async connect(printerId: string): Promise<PrinterDevice> {
    const printer = await this.callNative(() => this.nativeModule.connect(printerId));
    this.connectedPrinter = this.mapPrinter(printer);
    return this.connectedPrinter;
  }

  async disconnect(printerId?: string): Promise<void> {
    await this.callNative(() => this.nativeModule.disconnect(printerId));
    this.connectedPrinter = null;
  }

  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    const printer = await this.callNative(() => this.nativeModule.getConnectedPrinter());
    this.connectedPrinter = printer ? this.mapPrinter(printer) : null;
    return this.connectedPrinter;
  }

  async getStatus(printerId?: string): Promise<PrinterStatus> {
    return this.callNative(() => this.nativeModule.getStatus(printerId));
  }

  async printReceipt(job: PrintJob, payload: ReceiptPayload): Promise<PrintResult> {
    validateReceiptPayload(payload, windowsCapabilities);
    const printer = await this.getRequiredPrinter(job.targetPrinterId);
    const renderedChunks = await this.receiptRenderer.render(payload);
    const chunks = renderedChunks.map((chunk) => Array.from(chunk));
    const result = await this.callNative(() =>
      this.nativeModule.printReceipt({
        jobId: job.id,
        printerId: printer.id,
        chunks
      })
    );

    return {
      jobId: job.id,
      printer,
      status: result.status,
      message: result.message
    };
  }

  async printLabel(job: PrintJob, payload: LabelPayload): Promise<PrintResult> {
    validateLabelPayload(payload, windowsCapabilities);
    const printer = await this.getRequiredPrinter(job.targetPrinterId);
    const renderedChunks = await this.labelRenderer.render(payload);
    const chunks = renderedChunks.map((chunk) => Array.from(chunk));
    const result = await this.callNative(() =>
      this.nativeModule.printLabel({
        jobId: job.id,
        printerId: printer.id,
        chunks
      })
    );

    return {
      jobId: job.id,
      printer,
      status: result.status,
      message: result.message
    };
  }

  async getCapabilities(query: AdapterCapabilityQuery): Promise<PrinterCapability[]> {
    if (query.platform !== "windows") {
      return [];
    }

    if (query.transportTypes?.length) {
      const supportsRequestedTransport = query.transportTypes.some((transportType) =>
        windowsCapabilities.supportedTransports.includes(transportType)
      );

      if (!supportsRequestedTransport) {
        return [];
      }
    }

    if (
      query.documentType &&
      !windowsCapabilities.supportedDocumentTypes.includes(query.documentType)
    ) {
      return [];
    }

    return [windowsCapabilities];
  }

  private async getRequiredPrinter(printerId: string): Promise<PrinterDevice> {
    const connectedPrinter = await this.getConnectedPrinter();
    return requireConnectedPrinter(connectedPrinter, printerId);
  }

  private mapPrinter(printer: NativeWindowsPrinterDevice): PrinterDevice {
    return {
      id: printer.id,
      name: printer.name,
      platform: "windows",
      transportType: printer.transportType,
      address: printer.address,
      capabilities: windowsCapabilities
    };
  }

  private async callNative<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PrinterError) {
        throw error;
      }

      throw new PrinterError("NATIVE_ERROR", "Windows native bridge call failed.", error);
    }
  }
}
