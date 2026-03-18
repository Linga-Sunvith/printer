# Comparative Legacy Analysis

## Source Coverage

Retail source was available locally and analyzed from:

- `Printer.java`
- `UsbController.java`
- `BillFormatter.java`
- `BillFormatterSmaller.java`
- `TwoInchTemplateParser.java`
- `ThreeInchTemplateParser.java`
- `BarcodePrinterHelper.java`
- `PrinterSettingsFragmentNew.java`

Dino-specific files named in the prompt (`PrintUtils.java`, `KOTFormatter.java`, `KOTFormatterTwoInch.java`) were not present in the local workspace on March 11, 2026. Dino conclusions below are therefore limited to the prompt context and must be validated against the missing sources before implementation sign-off.

## 1. Shared Behaviors

- Device discovery and filtering by printer-capable USB devices.
- Permission-gated connection flow before any write.
- Receipt printing pipeline: validate config, prepare header/body/summary/tax/payment/footer, send bytes, finalize print.
- Separate label-printing flow from thermal receipt flow.
- Size-specific formatting variants for 2-inch and 3-inch printers in legacy Android code.
- Optional logo, barcode, QR, totals, tax breakup, customer/address, notes, and payment sections.
- Printer settings influence rendering: font size, capitalization, barcode toggle, UOM toggle, content selection.
- ESC/POS-style command emission for thermal printers.

## 2. Retail-Only Behaviors

- Retail `Printer.java` is coupled to many business documents: billing, duplicate bills, refunds, purchase orders, GRN, settlement, shift reports, SOH, credit payments, and laser/A4/A5 flows.
- Tax logic is Retail-heavy: GST/VAT/composite scheme, invoice breakup, exemption handling, FSSAI/GSTIN, excise, and e-invoice QR/URL.
- Retail formatter layout is driven by Retail invoice/report semantics, not generic receipt sections.
- `PrinterSettingsFragmentNew.java` mixes hardware selection with Retail bill-content configuration.

## 3. Dino-Only Behaviors

- Expected Dino-specific flows from prompt: KOT, token, pre-bill, table-oriented printing, and likely hospitality sequencing.
- Dino likely needs transport seams beyond USB because the prompt explicitly references Bluetooth and Wi-Fi/socket printing in legacy behavior.
- Dino-specific domain concepts should remain outside the shared core and enter only through mapper-produced normalized sections or future document extension types.

## 4. Transport-Level Differences

- Retail local source shows USB as the primary implemented path for thermal and label flows.
- Retail label printing supports vendor-specific behavior: raw USB byte write for some label vendors and TSC command mode for others.
- `UsbController.java` exposes low-level ESC/POS commands, alignment, buzzer, cash drawer, cut, reset, and USB device permission handling.
- Dino requirements imply Bluetooth and socket/Wi-Fi transport support must exist as first-class abstractions even if the POC implements USB only.

## 5. Formatter / Rendering Differences

- Retail has separate receipt formatters for printer widths and content density.
- Retail also supports JSON-template-driven rendering for 2-inch and 3-inch receipts through `TwoInchTemplateParser` and `ThreeInchTemplateParser`.
- Retail label printing is command-driven and vendor-specific rather than sharing thermal receipt rendering.
- Shared SDK should separate content model, renderer strategy, and transport adapter.

## 6. Data Model Differences

- Retail legacy printer accepts app models directly: `BillingDetails`, `Refund`, `PurchaseOrder`, `GRN`, `Data`, `PaymentMethod`, `TaxDetails`, and more.
- Dino is expected to use hospitality-focused models such as `TableData`, KOT/token/pre-bill models, and service-context metadata.
- Shared SDK must normalize both into app-agnostic payloads: `ReceiptPayload`, `LabelPayload`, and future document extensions.

## 7. What Belongs In The Shared Module

- Public printer API and job lifecycle
- Printer device/capability/status contracts
- Normalized print payload contracts
- Receipt and label renderer abstractions
- Transport abstractions and platform adapters
- Discovery, connection, permission, and status services
- Eventing, errors, retries, graceful degradation, and mock mode

## 8. What Should Stay In Each Consuming App

- Retail and Dino domain models
- Retail/Dino mapper implementations
- App-specific feature toggles and composition
- Screen-level printer settings UX
- Business-specific sections such as KOT metadata or Retail refund/legal content

## 9. Migration Map

Retail migration:

- `Printer.java` -> split into use cases, renderer strategies, document orchestrators, and platform adapters
- `UsbController.java` -> Android USB transport service
- `BillFormatter.java` / `BillFormatterSmaller.java` -> renderer implementations, not public API
- `TwoInchTemplateParser.java` / `ThreeInchTemplateParser.java` -> renderer/template strategy input, not domain model
- `BarcodePrinterHelper.java` -> label adapter + vendor strategy
- `PrinterSettingsFragmentNew.java` -> app integration UX, not SDK core

Dino migration:

- `PrintUtils.java` -> likely split into print orchestration use cases and app mapper entry points
- `KOTFormatter*.java` -> future document renderer strategies behind normalized section contracts
- socket/Bluetooth code -> transport implementations behind common adapter contracts

## 10. Risks And Assumptions

- Risk: Dino legacy code was not available locally, so Dino-specific behavior must be validated before native implementation.
- Risk: Retail legacy Android code conflates transport, rendering, business rules, and settings; migration must avoid carrying that coupling forward.
- Risk: label vendors may require command-dialect strategies rather than a single generic renderer.
- Assumption: USB is sufficient for the POC; Bluetooth and Wi-Fi/socket stay as explicit seams.
- Assumption: normalized receipt sections can cover current Retail receipt behavior and future Dino KOT/token behavior without hardcoding business models.
