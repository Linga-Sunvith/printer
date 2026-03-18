import type { PrinterCapability, PrinterDevice, PrinterStatus } from "../domain/models/printer";

export interface NativeWindowsPrinterStatus extends PrinterStatus {}

export interface NativeWindowsPrinterDevice {
  id: string;
  name: string;
  transportType: PrinterDevice["transportType"];
  address?: string;
}

export interface NativeWindowsPrintResult {
  status: "completed" | "failed" | "cancelled";
  message?: string;
}

export interface NativeWindowsPrintRequest {
  jobId: string;
  printerId: string;
  chunks: number[][];
}

export interface WindowsNativePrinterModule {
  initialize(): Promise<void>;
  discoverPrinters(): Promise<NativeWindowsPrinterDevice[]>;
  connect(printerId: string): Promise<NativeWindowsPrinterDevice>;
  disconnect(printerId?: string): Promise<void>;
  getConnectedPrinter(): Promise<NativeWindowsPrinterDevice | null>;
  getStatus(printerId?: string): Promise<NativeWindowsPrinterStatus>;
  printReceipt(request: NativeWindowsPrintRequest): Promise<NativeWindowsPrintResult>;
  printLabel(request: NativeWindowsPrintRequest): Promise<NativeWindowsPrintResult>;
}

const fallbackCapabilities: PrinterCapability = {
  receipts: true,
  labels: false,
  supportsBarcode: true,
  supportsQrCode: true,
  supportsCashDrawer: false,
  supportsCancellation: false,
  supportedTransports: ["usb", "serial", "socket", "wifi"],
  supportedDocumentTypes: ["receipt"],
  maxReceiptWidthInches: 3,
  supportedLabelSizesMm: []
};

class InMemoryWindowsNativePrinterModule implements WindowsNativePrinterModule {
  private readonly printers: NativeWindowsPrinterDevice[] = [
    {
      id: "windows-usb-demo-printer",
      name: "Windows USB Demo Printer",
      transportType: "usb",
      address: "USB001"
    }
  ];

  private connectedPrinter: NativeWindowsPrinterDevice | null = null;

  async initialize(): Promise<void> {}

  async discoverPrinters(): Promise<NativeWindowsPrinterDevice[]> {
    return this.printers;
  }

  async connect(printerId: string): Promise<NativeWindowsPrinterDevice> {
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

  async getConnectedPrinter(): Promise<NativeWindowsPrinterDevice | null> {
    return this.connectedPrinter;
  }

  async getStatus(): Promise<NativeWindowsPrinterStatus> {
    return {
      state: this.connectedPrinter ? "connected" : "disconnected",
      updatedAt: new Date().toISOString()
    };
  }

  async printReceipt(request: NativeWindowsPrintRequest): Promise<NativeWindowsPrintResult> {
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

  async printLabel(request: NativeWindowsPrintRequest): Promise<NativeWindowsPrintResult> {
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
    __sharedPrinterWindowsNativeModule__?: WindowsNativePrinterModule;
  }
}

let overrideModule: WindowsNativePrinterModule | null = null;

function getGlobalNativeModule(): WindowsNativePrinterModule | null {
  const globalScope = globalThis as typeof globalThis & {
    __sharedPrinterWindowsNativeModule__?: WindowsNativePrinterModule;
  };
  const globalModule = globalScope.__sharedPrinterWindowsNativeModule__;
  return globalModule ?? null;
}

export function setWindowsNativePrinterModuleForTests(
  module: WindowsNativePrinterModule | null
): void {
  overrideModule = module;
}

export function getWindowsNativePrinterModule(): WindowsNativePrinterModule {
  return overrideModule ?? getGlobalNativeModule() ?? new InMemoryWindowsNativePrinterModule();
}

export function getFallbackWindowsPrinterCapabilities(): PrinterCapability {
  return fallbackCapabilities;
}
