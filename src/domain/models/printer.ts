export type TransportType = "usb" | "bluetooth" | "wifi" | "socket" | "serial" | "mock";

export interface PrinterCapability {
  receipts: boolean;
  labels: boolean;
  supportsBarcode: boolean;
  supportsQrCode: boolean;
  supportsCashDrawer: boolean;
  supportsCancellation: boolean;
  supportedTransports: TransportType[];
  supportedDocumentTypes: string[];
  maxReceiptWidthInches?: 3;
  supportedLabelSizesMm?: string[];
}

export type PrinterConnectionState =
  | "disconnected"
  | "discovering"
  | "connecting"
  | "connected"
  | "error";

export interface PrinterStatus {
  state: PrinterConnectionState;
  isPaperOut?: boolean;
  isCoverOpen?: boolean;
  isOffline?: boolean;
  reason?: string;
  updatedAt: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  platform: "android" | "windows" | "mock";
  transportType: TransportType;
  vendorId?: string;
  productId?: string;
  address?: string;
  capabilities: PrinterCapability;
}

export interface AdapterCapabilityQuery {
  platform: PrinterDevice["platform"];
  transportTypes?: TransportType[];
  documentType?: string;
}
