import { PrinterError } from "../../../domain/models/errors";
import type { LabelPayload, ReceiptPayload } from "../../../domain/models/payloads";
import type { PrinterCapability, PrinterDevice } from "../../../domain/models/printer";

export function requireConnectedPrinter(
  connectedPrinter: PrinterDevice | null,
  printerId: string
): PrinterDevice {
  if (!connectedPrinter || connectedPrinter.id !== printerId) {
    throw new PrinterError("CONNECTION_FAILED", `Printer ${printerId} is not connected.`);
  }

  return connectedPrinter;
}

export function validateReceiptPayload(
  payload: ReceiptPayload,
  capability: PrinterCapability
): void {
  if (!capability.receipts) {
    throw new PrinterError("UNSUPPORTED_DOCUMENT", "Receipt printing is not supported by this printer.");
  }

  if (payload.printerWidthInches !== 3) {
    throw new PrinterError("PAYLOAD_INVALID", `Unsupported receipt width: ${payload.printerWidthInches}.`);
  }
}

export function validateLabelPayload(
  payload: LabelPayload,
  capability: PrinterCapability
): void {
  if (!capability.labels) {
    throw new PrinterError("UNSUPPORTED_DOCUMENT", "Label printing is not supported by this printer.");
  }

  if (
    capability.supportedLabelSizesMm?.length &&
    !capability.supportedLabelSizesMm.includes(payload.sizeMm)
  ) {
    throw new PrinterError("PAYLOAD_INVALID", `Unsupported label size: ${payload.sizeMm}.`);
  }
}
