/**
 * Shared Printer SDK — Interactive Demo
 *
 * Demonstrates both Retail POS and Dino POS flows running against
 * the same shared SDK using MockAdapter, AndroidAdapter (in-memory),
 * and WindowsAdapter (in-memory).
 *
 * Run:  npx ts-node example-app/src/demo.ts
 * Or:   npm run demo
 */

import { PrinterSdk } from "../../src/application/services/printer-sdk";
import { createAndroidPrinterSdk, createWindowsPrinterSdk } from "../../src/application/services/printer-sdk-factory";
import { MockPrinterAdapter } from "../../src/infrastructure/adapters/mock/mock-printer-adapter";
import { DinoLabelMapper, DinoReceiptMapper } from "../../src/mappers/dino/dino-printer-mapper";
import { RetailLabelMapper, RetailReceiptMapper } from "../../src/mappers/retail/retail-printer-mapper";
import type { DeviceEvent, JobEvent } from "../../src/domain/models/events";
import type { PrintJob } from "../../src/domain/models/job";
import type { LabelPayload, ReceiptPayload } from "../../src/domain/models/payloads";

// ─── helpers ─────────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";
const DIM   = "\x1b[2m";
const GREEN = "\x1b[32m";
const CYAN  = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED   = "\x1b[31m";
const BLUE  = "\x1b[34m";
const MAGENTA = "\x1b[35m";

function header(text: string): void {
  console.log(`\n${BOLD}${CYAN}${"═".repeat(60)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${text}${RESET}`);
  console.log(`${BOLD}${CYAN}${"═".repeat(60)}${RESET}`);
}

function section(text: string): void {
  console.log(`\n${BOLD}${BLUE}── ${text} ──${RESET}`);
}

function ok(text: string): void {
  console.log(`  ${GREEN}✓${RESET}  ${text}`);
}

function info(text: string): void {
  console.log(`  ${DIM}ℹ  ${text}${RESET}`);
}

function warn(text: string): void {
  console.log(`  ${YELLOW}⚠  ${text}${RESET}`);
}

function fail(text: string): void {
  console.log(`  ${RED}✗  ${text}${RESET}`);
}

function event(source: string, text: string): void {
  console.log(`  ${MAGENTA}⚡ [${source}]${RESET} ${DIM}${text}${RESET}`);
}

let jobCounter = 0;
function makeJob(documentType: PrintJob["documentType"], targetPrinterId: string, payload: ReceiptPayload | LabelPayload): PrintJob {
  return {
    id: `demo-job-${++jobCounter}`,
    documentType,
    targetPrinterId,
    createdAt: new Date().toISOString(),
    payload
  };
}

function subscribeEvents(sdk: PrinterSdk, adapterLabel: string): () => void {
  const unsubJob = sdk.observeJobEvents((e: JobEvent) => {
    event(adapterLabel, `job(${e.jobId}) → ${e.type}${e.message ? ` | ${e.message}` : ""}`);
  });
  const unsubDevice = sdk.observeDeviceEvents((e: DeviceEvent) => {
    const detail = e.printer ? ` [${e.printer.name}]` : e.status ? ` [${e.status.state}]` : "";
    event(adapterLabel, `device → ${e.type}${detail}`);
  });
  return () => { unsubJob(); unsubDevice(); };
}

// ─── mappers ─────────────────────────────────────────────────────────────────

const retailReceiptMapper = new RetailReceiptMapper();
const retailLabelMapper   = new RetailLabelMapper();
const dinoReceiptMapper   = new DinoReceiptMapper();
const dinoLabelMapper     = new DinoLabelMapper();

// ─── sample source models ────────────────────────────────────────────────────

const retailReceiptSource = {
  invoiceNumber: "INV-20240315-001",
  shopName:      "Nukkad Retail Store",
  shopAddress:   "12 MG Road, Bangalore 560001",
  items: [
    { name: "Basmati Rice 5kg",  quantity: 2, total: 700 },
    { name: "Sunflower Oil 1L",  quantity: 1, total: 180 },
    { name: "Tata Salt 1kg",     quantity: 3, total:  60 }
  ],
  grandTotal: 940,
  currency:   "INR"
};

const retailLabelSource = {
  name:      "Basmati Rice 5kg",
  priceText: "INR 350",
  barcode:   "8901234567890"
};

const dinoReceiptSource = {
  billNumber:  "DINO-B-0042",
  outletName:  "Dino Cafe — Koramangala",
  tableName:   "Table 7",
  waiterName:  "Ravi Kumar",
  items: [
    { itemName: "Masala Dosa",    quantity: 2, lineTotal: 240 },
    { itemName: "Filter Coffee",  quantity: 2, lineTotal:  80 },
    { itemName: "Vada",           quantity: 1, lineTotal:  40 }
  ],
  subtotal: 360,
  currency: "INR"
};

const dinoLabelSource = {
  title: "Token Order #42",
  token: "DINO-TKN-0042"
};

// ─── demo flows ──────────────────────────────────────────────────────────────

async function runMockFlow(): Promise<void> {
  header("FLOW 1 — Mock Adapter (both Retail and Dino)");

  const sdk = new PrinterSdk(new MockPrinterAdapter());
  const unsub = subscribeEvents(sdk, "mock");

  section("Initialize");
  await sdk.initialize();
  ok("SDK initialized");

  section("Discover");
  const printers = await sdk.discoverPrinters();
  ok(`Found ${printers.length} printer(s)`);
  printers.forEach((p) => info(`  id=${p.id}  name=${p.name}  transport=${p.transportType}`));

  section("Connect");
  const printer = await sdk.connect(printers[0].id);
  ok(`Connected → ${printer.name}`);

  section("Status");
  const status = await sdk.getStatus(printer.id);
  ok(`State = ${status.state}`);

  section("Retail POS — Receipt");
  const retailReceiptPayload = retailReceiptMapper.map(retailReceiptSource);
  const retailReceiptResult  = await sdk.printReceipt(makeJob("receipt", printer.id, retailReceiptPayload), retailReceiptPayload);
  ok(`Retail receipt → ${retailReceiptResult.status} | ${retailReceiptResult.message}`);

  section("Dino POS — Receipt");
  const dinoReceiptPayload = dinoReceiptMapper.map(dinoReceiptSource);
  const dinoReceiptResult  = await sdk.printReceipt(makeJob("receipt", printer.id, dinoReceiptPayload), dinoReceiptPayload);
  ok(`Dino receipt → ${dinoReceiptResult.status} | ${dinoReceiptResult.message}`);

  section("Retail POS — Label");
  const retailLabelPayload = retailLabelMapper.map(retailLabelSource);
  const retailLabelResult  = await sdk.printLabel(makeJob("label", printer.id, retailLabelPayload), retailLabelPayload);
  ok(`Retail label → ${retailLabelResult.status} | ${retailLabelResult.message}`);

  section("Dino POS — Label (token)");
  const dinoLabelPayload = dinoLabelMapper.map(dinoLabelSource);
  const dinoLabelResult  = await sdk.printLabel(makeJob("label", printer.id, dinoLabelPayload), dinoLabelPayload);
  ok(`Dino label → ${dinoLabelResult.status} | ${dinoLabelResult.message}`);

  section("Cancel Job");
  const cancelResult = await sdk.cancelJob("demo-job-1");
  ok(`Cancel → ${cancelResult.status} | ${cancelResult.message}`);

  section("Disconnect");
  await sdk.disconnect(printer.id);
  ok("Disconnected");

  const statusAfter = await sdk.getStatus(printer.id);
  info(`Status after disconnect = ${statusAfter.state}`);

  unsub();
}

async function runAndroidFlow(): Promise<void> {
  header("FLOW 2 — Android Adapter (in-memory native stub)");

  const sdk   = createAndroidPrinterSdk();
  const unsub = subscribeEvents(sdk, "android");

  await sdk.initialize();
  ok("Android SDK initialized");

  const printers = await sdk.discoverPrinters();
  ok(`Found ${printers.length} printer(s) — platform=${printers[0]?.platform}`);

  const printer = await sdk.connect(printers[0].id);
  ok(`Connected → ${printer.name} (transport=${printer.transportType})`);

  const caps = await sdk.getCapabilities({ platform: "android" });
  ok(`Capabilities: receipts=${caps[0]?.receipts} labels=${caps[0]?.labels}`);
  info(`  Transports: ${caps[0]?.supportedTransports.join(", ")}`);
  info(`  Documents:  ${caps[0]?.supportedDocumentTypes.join(", ")}`);

  section("Retail POS — Android Receipt");
  const retailReceiptPayload = retailReceiptMapper.map(retailReceiptSource);
  const result1 = await sdk.printReceipt(makeJob("receipt", printer.id, retailReceiptPayload), retailReceiptPayload);
  ok(`Status=${result1.status} | ${result1.message}`);

  section("Dino POS — Android Receipt");
  const dinoReceiptPayload = dinoReceiptMapper.map(dinoReceiptSource);
  const result2 = await sdk.printReceipt(makeJob("receipt", printer.id, dinoReceiptPayload), dinoReceiptPayload);
  ok(`Status=${result2.status} | ${result2.message}`);

  section("Retail POS — Android Label");
  const retailLabelPayload = retailLabelMapper.map(retailLabelSource);
  const result3 = await sdk.printLabel(makeJob("label", printer.id, retailLabelPayload), retailLabelPayload);
  ok(`Status=${result3.status} | ${result3.message}`);

  section("Dino POS — Android Label (token)");
  const dinoLabelPayload = dinoLabelMapper.map(dinoLabelSource);
  const result4 = await sdk.printLabel(makeJob("label", printer.id, dinoLabelPayload), dinoLabelPayload);
  ok(`Status=${result4.status} | ${result4.message}`);

  await sdk.disconnect();
  ok("Android disconnected");

  unsub();
}

async function runWindowsFlow(): Promise<void> {
  header("FLOW 3 — Windows Adapter (in-memory native stub)");

  const sdk   = createWindowsPrinterSdk();
  const unsub = subscribeEvents(sdk, "windows");

  await sdk.initialize();
  ok("Windows SDK initialized");

  const printers = await sdk.discoverPrinters();
  ok(`Found ${printers.length} printer(s) — platform=${printers[0]?.platform}`);

  const printer = await sdk.connect(printers[0].id);
  ok(`Connected → ${printer.name} (transport=${printer.transportType})`);

  const caps = await sdk.getCapabilities({ platform: "windows" });
  ok(`Capabilities: receipts=${caps[0]?.receipts} labels=${caps[0]?.labels}`);
  info(`  Transports: ${caps[0]?.supportedTransports.join(", ")}`);

  section("Retail POS — Windows Receipt");
  const retailReceiptPayload = retailReceiptMapper.map(retailReceiptSource);
  const result1 = await sdk.printReceipt(makeJob("receipt", printer.id, retailReceiptPayload), retailReceiptPayload);
  ok(`Status=${result1.status} | ${result1.message}`);

  section("Dino POS — Windows Receipt");
  const dinoReceiptPayload = dinoReceiptMapper.map(dinoReceiptSource);
  const result2 = await sdk.printReceipt(makeJob("receipt", printer.id, dinoReceiptPayload), dinoReceiptPayload);
  ok(`Status=${result2.status} | ${result2.message}`);

  section("Windows Label");
  const retailLabelPayload = retailLabelMapper.map(retailLabelSource);
  const result3 = await sdk.printLabel(makeJob("label", printer.id, retailLabelPayload), retailLabelPayload);
  ok(`Status=${result3.status} | ${result3.message}`);

  await sdk.disconnect();
  ok("Windows disconnected");

  unsub();
}

async function runErrorHandlingFlow(): Promise<void> {
  header("FLOW 4 — Error Handling");

  const sdk = createAndroidPrinterSdk();
  await sdk.initialize();

  section("Print without connecting (expects CONNECTION_FAILED)");
  const payload = retailReceiptMapper.map(retailReceiptSource);
  try {
    await sdk.printReceipt(makeJob("receipt", "nonexistent-printer", payload), payload);
    fail("Expected error but none was thrown");
  } catch (err: unknown) {
    const printerError = err as { code?: string; message?: string };
    if (printerError.code === "CONNECTION_FAILED") {
      ok(`Caught PrinterError code=${printerError.code} — "${printerError.message}"`);
    } else {
      warn(`Unexpected error: ${printerError.message ?? String(err)}`);
    }
  }

  section("Capabilities filter — wrong platform returns empty");
  const androidSdk = createAndroidPrinterSdk();
  const windowsCaps = await androidSdk.getCapabilities({ platform: "windows" });
  if (windowsCaps.length === 0) {
    ok("Android adapter correctly returns [] for windows platform query");
  }

  section("Capabilities filter — unsupported transport returns empty");
  const btOnlyCaps = await androidSdk.getCapabilities({ platform: "android", transportTypes: ["mock"] });
  if (btOnlyCaps.length === 0) {
    ok("Android adapter correctly returns [] for mock transport query");
  }
}

async function runMapperValidationFlow(): Promise<void> {
  header("FLOW 5 — Mapper Payload Validation");

  section("Retail mapper output");
  const retailPayload = retailReceiptMapper.map(retailReceiptSource);
  ok(`documentType = ${retailPayload.documentType}`);
  ok(`documentVariant = ${retailPayload.documentVariant}`);
  ok(`printerWidthInches = ${retailPayload.printerWidthInches}`);
  ok(`header sections: ${retailPayload.header.length}`);
  ok(`body sections: ${retailPayload.body.length}`);
  ok(`totals sections: ${retailPayload.totals.length}`);
  ok(`footer sections: ${retailPayload.footer.length}`);
  const bodyItems = retailPayload.body[0];
  if (bodyItems.kind === "items") {
    ok(`items count: ${bodyItems.items.length}`);
    bodyItems.items.forEach((item) => {
      info(`  ${item.name} x${item.quantity} = ${item.total.currency} ${item.total.amount}`);
    });
  }

  section("Dino mapper output");
  const dinoPayload = dinoReceiptMapper.map(dinoReceiptSource);
  ok(`documentVariant = ${dinoPayload.documentVariant}`);
  ok(`header rows:`);
  dinoPayload.header.forEach((section) => {
    if (section.kind === "keyValue") {
      section.rows.forEach((row) => info(`  ${row.label}: ${row.value}`));
    } else if (section.kind === "text") {
      section.lines.forEach((line) => info(`  ${line}`));
    }
  });

  section("Retail label mapper output");
  const lbl = retailLabelMapper.map(retailLabelSource);
  ok(`layout = ${lbl.layout}  size = ${lbl.sizeMm}`);
  lbl.textFields.forEach((f) => info(`  text[${f.id}] = ${f.value}`));
  lbl.codeFields.forEach((f) => info(`  code[${f.id}] = ${f.symbology}:${f.value}`));

  section("Dino label mapper output");
  const dinoLbl = dinoLabelMapper.map(dinoLabelSource);
  ok(`layout = ${dinoLbl.layout}  size = ${dinoLbl.sizeMm}`);
  dinoLbl.textFields.forEach((f) => info(`  text[${f.id}] = ${f.value}`));
  dinoLbl.codeFields.forEach((f) => info(`  code[${f.id}] = ${f.symbology}:${f.value}`));
}

async function runMvvmFlow(): Promise<void> {
  header("FLOW 6 — MVVM PrinterViewModel (Retail + Dino through same SDK)");

  // Inline a minimal MVVM demo to keep the demo self-contained
  const { PrinterViewModel } = await import("./viewmodels/printer-view-model");
  const sdk = new PrinterSdk(new MockPrinterAdapter());
  const vm  = new PrinterViewModel(sdk);

  section("ViewModel initialize + discover + connect");
  await vm.initialize();
  const discovered = await vm.discover();
  ok(`Discovered ${discovered.length} printer(s)`);

  const connected = await vm.connect(discovered[0].id);
  ok(`ViewModel connected to: ${connected.name}`);

  section("ViewModel printRetailReceipt");
  const r1 = await vm.printRetailReceipt(retailReceiptSource);
  ok(`Retail receipt via ViewModel → ${r1.status}`);

  section("ViewModel printDinoReceipt");
  const r2 = await vm.printDinoReceipt(dinoReceiptSource);
  ok(`Dino receipt via ViewModel  → ${r2.status}`);

  section("ViewModel printRetailLabel");
  const r3 = await vm.printRetailLabel(retailLabelSource);
  ok(`Retail label via ViewModel  → ${r3.status}`);
}

// ─── summary ─────────────────────────────────────────────────────────────────

function printSummary(results: Array<{ name: string; passed: boolean; error?: string }>): void {
  header("DEMO SUMMARY");
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      ok(`${r.name}`);
    } else {
      fail(`${r.name} — ${r.error}`);
      allPassed = false;
    }
  }
  console.log();
  if (allPassed) {
    console.log(`${BOLD}${GREEN}  All flows completed successfully.${RESET}\n`);
  } else {
    console.log(`${BOLD}${RED}  Some flows failed. See errors above.${RESET}\n`);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${BOLD}  Nukkad Shops — Shared Printer SDK Demo${RESET}`);
  console.log(`  @nukkad/shared-printer-sdk v0.1.0\n`);

  const flows: Array<{ name: string; fn: () => Promise<void> }> = [
    { name: "Mock Adapter (Retail + Dino)",     fn: runMockFlow             },
    { name: "Android Adapter (in-memory)",      fn: runAndroidFlow          },
    { name: "Windows Adapter (in-memory)",      fn: runWindowsFlow          },
    { name: "Error Handling",                   fn: runErrorHandlingFlow    },
    { name: "Mapper Payload Validation",        fn: runMapperValidationFlow },
    { name: "MVVM ViewModel",                   fn: runMvvmFlow             }
  ];

  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  for (const flow of flows) {
    try {
      await flow.fn();
      results.push({ name: flow.name, passed: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fail(`Flow "${flow.name}" threw: ${msg}`);
      results.push({ name: flow.name, passed: false, error: msg });
    }
  }

  printSummary(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
