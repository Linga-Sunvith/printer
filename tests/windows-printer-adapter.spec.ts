import { WindowsPrinterAdapter } from "../src/infrastructure/adapters/windows/windows-printer-adapter";
import { setWindowsNativePrinterModuleForTests } from "../src/react-native/native-windows-printer-module";

describe("WindowsPrinterAdapter", () => {
  afterEach(() => {
    setWindowsNativePrinterModuleForTests(null);
  });

  it("discovers, connects, reports status, and prints a receipt", async () => {
    const adapter = new WindowsPrinterAdapter();

    await adapter.initialize();
    const printers = await adapter.discoverPrinters();
    const connectedPrinter = await adapter.connect(printers[0].id);
    const status = await adapter.getStatus(connectedPrinter.id);
    const result = await adapter.printReceipt(
      {
        id: "windows-job-1",
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
    expect(result.printer?.platform).toBe("windows");
  });

  it("prints a label after connecting", async () => {
    const adapter = new WindowsPrinterAdapter();
    const printers = await adapter.discoverPrinters();
    const connectedPrinter = await adapter.connect(printers[0].id);

    const result = await adapter.printLabel(
      {
        id: "windows-label-1",
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
    const adapter = new WindowsPrinterAdapter();

    await expect(
      adapter.printReceipt(
        {
          id: "windows-job-disconnected",
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
