import { PrinterSdk } from "../src/application/services/printer-sdk";
import { MockPrinterAdapter } from "../src/infrastructure/adapters/mock/mock-printer-adapter";

describe("PrinterSdk", () => {
  it("discovers and prints through the mock adapter", async () => {
    const sdk = new PrinterSdk(new MockPrinterAdapter());
    await sdk.initialize();
    const printers = await sdk.discoverPrinters();
    await sdk.connect(printers[0].id);

    const result = await sdk.printReceipt(
      {
        id: "job-1",
        documentType: "receipt",
        targetPrinterId: printers[0].id,
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
    );

    expect(result.status).toBe("completed");
  });
});
