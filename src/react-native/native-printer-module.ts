import type { PrinterCapability, PrinterDevice, PrinterStatus } from "../domain/models/printer";

export interface NativePrinterStatus extends PrinterStatus {}

export interface NativePrinterDevice {
  id: string;
  name: string;
  transportType: PrinterDevice["transportType"];
  vendorId?: string;
  productId?: string;
  address?: string;
}

export interface NativePrintResult {
  status: "completed" | "failed" | "cancelled";
  message?: string;
}

export interface NativePrintRequest {
  jobId: string;
  printerId: string;
  chunks: number[][];
}

export interface AndroidNativePrinterModule {
  initialize(): Promise<void>;
  discoverPrinters(): Promise<NativePrinterDevice[]>;
  connect(printerId: string): Promise<NativePrinterDevice>;
  disconnect(printerId?: string): Promise<void>;
  getConnectedPrinter(): Promise<NativePrinterDevice | null>;
  getStatus(printerId?: string): Promise<NativePrinterStatus>;
  printReceipt(request: NativePrintRequest): Promise<NativePrintResult>;
  printLabel(request: NativePrintRequest): Promise<NativePrintResult>;
}

const fallbackCapabilities: PrinterCapability = {
  receipts: true,
  labels: false,
  supportsBarcode: true,
  supportsQrCode: true,
  supportsCashDrawer: false,
  supportsCancellation: false,
  supportedTransports: ["usb"],
  supportedDocumentTypes: ["receipt"],
  maxReceiptWidthInches: 3,
  supportedLabelSizesMm: []
};

class InMemoryAndroidNativePrinterModule implements AndroidNativePrinterModule {
  private readonly printers: NativePrinterDevice[] = [
    {
      id: "android-usb-demo-printer",
      name: "Android USB Demo Printer",
      transportType: "usb",
      vendorId: "0x1234",
      productId: "0x0001"
    }
  ];

  private connectedPrinter: NativePrinterDevice | null = null;

  async initialize(): Promise<void> {}

  async discoverPrinters(): Promise<NativePrinterDevice[]> {
    return this.printers;
  }

  async connect(printerId: string): Promise<NativePrinterDevice> {
    const printer = this.printers.find((candidate) => candidate.id === printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found.`);
    }

    this.connectedPrinter = printer;
    return printer;
  }

  async disconnect(): Promise<void> {
    this.connectedPrinter = null;
  }

  async getConnectedPrinter(): Promise<NativePrinterDevice | null> {
    return this.connectedPrinter;
  }

  async getStatus(): Promise<NativePrinterStatus> {
    return {
      state: this.connectedPrinter ? "connected" : "disconnected",
      updatedAt: new Date().toISOString()
    };
  }

  async printReceipt(request: NativePrintRequest): Promise<NativePrintResult> {
    const totalBytes = request.chunks.reduce((count, chunk) => count + chunk.length, 0);

    if (!this.connectedPrinter || this.connectedPrinter.id !== request.printerId) {
      return {
        status: "failed",
        message: `Printer ${request.printerId} is not connected.`
      };
    }

    return {
      status: "completed",
      message: `Printed ${totalBytes} bytes to ${this.connectedPrinter.name}.`
    };
  }

  async printLabel(request: NativePrintRequest): Promise<NativePrintResult> {
    const totalBytes = request.chunks.reduce((count, chunk) => count + chunk.length, 0);

    if (!this.connectedPrinter || this.connectedPrinter.id !== request.printerId) {
      return {
        status: "failed",
        message: `Printer ${request.printerId} is not connected.`
      };
    }

    return {
      status: "completed",
      message: `Printed label payload of ${totalBytes} bytes to ${this.connectedPrinter.name}.`
    };
  }
}

declare global {
  interface GlobalThis {
    __sharedPrinterAndroidNativeModule__?: AndroidNativePrinterModule;
  }
}

let overrideModule: AndroidNativePrinterModule | null = null;

function getGlobalNativeModule(): AndroidNativePrinterModule | null {
  const globalScope = globalThis as typeof globalThis & {
    __sharedPrinterAndroidNativeModule__?: AndroidNativePrinterModule;
  };
  const globalModule = globalScope.__sharedPrinterAndroidNativeModule__;
  return globalModule ?? null;
}

export function setAndroidNativePrinterModuleForTests(
  module: AndroidNativePrinterModule | null
): void {
  overrideModule = module;
}

export function getAndroidNativePrinterModule(): AndroidNativePrinterModule {
  return overrideModule ?? getGlobalNativeModule() ?? new InMemoryAndroidNativePrinterModule();
}

export function getFallbackAndroidPrinterCapabilities(): PrinterCapability {
  return fallbackCapabilities;
}
