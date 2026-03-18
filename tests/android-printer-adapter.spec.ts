import { AndroidPrinterAdapter } from "../src/infrastructure/adapters/android/android-printer-adapter";
import { setAndroidNativePrinterModuleForTests } from "../src/react-native/native-printer-module";

describe("AndroidPrinterAdapter", () => {
  afterEach(() => {
    setAndroidNativePrinterModuleForTests(null);
  });

  it("discovers, connects, reports status, and prints a receipt", async () => {
    const adapter = new AndroidPrinterAdapter();

    await adapter.initialize();
    const printers = await adapter.discoverPrinters();
    const connectedPrinter = await adapter.connect(printers[0].id);
    const status = await adapter.getStatus(connectedPrinter.id);
    const result = await adapter.printReceipt(
      {
        id: "android-job-1",
        documentType: "receipt",
        targetPrinterId: connectedPrinter.id,
        createdAt: new Date().toISOString(),
        payload: {
          documentType: "receipt",
          printerWidthInches: 3,
          header: [{ kind: "text", id: "header", lines: ["Retail Store"] }],
          body: [{ kind: "text", id: "body", lines: ["Item A"] }],
          totals: [{ kind: "text", id: "total", lines: ["Total 10"] }],
          footer: [{ kind: "text", id: "footer", lines: ["Thank you"] }]
        }
      },
      {
        documentType: "receipt",
        printerWidthInches: 3,
        header: [{ kind: "text", id: "header", lines: ["Retail Store"] }],
        body: [{ kind: "text", id: "body", lines: ["Item A"] }],
        totals: [{ kind: "text", id: "total", lines: ["Total 10"] }],
        footer: [{ kind: "text", id: "footer", lines: ["Thank you"] }]
      }
    );

    expect(printers).toHaveLength(1);
    expect(status.state).toBe("connected");
    expect(result.status).toBe("completed");
    expect(result.printer?.platform).toBe("android");
  });

  it("prints a label after connecting", async () => {
    const adapter = new AndroidPrinterAdapter();
    const printers = await adapter.discoverPrinters();
    const connectedPrinter = await adapter.connect(printers[0].id);

    const result = await adapter.printLabel(
      {
        id: "android-label-1",
        documentType: "label",
        targetPrinterId: connectedPrinter.id,
        createdAt: new Date().toISOString(),
        payload: {
          documentType: "label",
          layout: "retail-default",
          sizeMm: "102x40",
          copyCount: 1,
          textFields: [{ id: "name", value: "Item A" }],
          codeFields: [{ id: "barcode", symbology: "code128", value: "12345" }]
        }
      },
      {
        documentType: "label",
        layout: "retail-default",
        sizeMm: "102x40",
        copyCount: 1,
        textFields: [{ id: "name", value: "Item A" }],
        codeFields: [{ id: "barcode", symbology: "code128", value: "12345" }]
      }
    );

    expect(result.status).toBe("completed");
  });

  it("fails clearly when printing without connection", async () => {
    const adapter = new AndroidPrinterAdapter();

    await expect(
      adapter.printReceipt(
        {
          id: "android-job-disconnected",
          documentType: "receipt",
          targetPrinterId: "missing-printer",
          createdAt: new Date().toISOString(),
          payload: {
            documentType: "receipt",
            printerWidthInches: 3,
            header: [],
            body: [],
            totals: [],
            footer: []
          }
        },
        {
          documentType: "receipt",
          printerWidthInches: 3,
          header: [],
          body: [],
          totals: [],
          footer: []
        }
      )
    ).rejects.toMatchObject({ code: "CONNECTION_FAILED" });
  });
});
