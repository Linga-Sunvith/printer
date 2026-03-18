# Shared API Contract

## Public Models

- `PrinterDevice`
- `PrinterCapability`
- `TransportType`
- `PrinterStatus`
- `ReceiptPayload`
- `LabelPayload`
- `PrintJob`
- `PrintResult`
- `PrinterError`
- `JobEvent`
- `DeviceEvent`
- `AdapterCapabilityQuery`

## Public Operations

- `initialize`
- `discoverPrinters`
- `connect`
- `disconnect`
- `getConnectedPrinter`
- `getStatus`
- `printReceipt`
- `printLabel`
- `observeJobEvents`
- `observeDeviceEvents`
- `cancelJob`

## Extension Points

- `ReceiptPayload.extensions`
- `PrintJob.documentType`
- renderer registry
- adapter capability query

Future examples:

- Dino KOT/token/pre-bill
- Retail refund/report/document variants

These stay as extensible document types or section extensions, not hardcoded first-class POC flows.
