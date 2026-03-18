export type PrinterErrorCode =
  | "NOT_INITIALIZED"
  | "DEVICE_NOT_FOUND"
  | "CONNECTION_FAILED"
  | "PAYLOAD_INVALID"
  | "UNSUPPORTED_DOCUMENT"
  | "UNSUPPORTED_TRANSPORT"
  | "JOB_CANCEL_NOT_SUPPORTED"
  | "NATIVE_ERROR";

export class PrinterError extends Error {
  constructor(
    public readonly code: PrinterErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PrinterError";
  }
}
