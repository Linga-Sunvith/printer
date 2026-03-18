import { DinoReceiptMapper } from "../src/mappers/dino/dino-printer-mapper";
import { RetailReceiptMapper } from "../src/mappers/retail/retail-printer-mapper";

describe("app mappers", () => {
  it("maps Retail source into normalized receipt payload", () => {
    const mapper = new RetailReceiptMapper();
    const payload = mapper.map({
      invoiceNumber: "INV-1",
      shopName: "Retail Store",
      shopAddress: "Main Road",
      items: [{ name: "Item A", quantity: 1, total: 10 }],
      grandTotal: 10,
      currency: "INR"
    });

    expect(payload.documentType).toBe("receipt");
    expect(payload.body[0].kind).toBe("items");
  });

  it("maps Dino source into normalized receipt payload", () => {
    const mapper = new DinoReceiptMapper();
    const payload = mapper.map({
      billNumber: "D-1",
      outletName: "Dino Cafe",
      tableName: "T1",
      waiterName: "Amit",
      items: [{ itemName: "Dosa", quantity: 2, lineTotal: 120 }],
      subtotal: 120,
      currency: "INR"
    });

    expect(payload.documentVariant).toBe("dino-prebill");
    expect(payload.header.length).toBeGreaterThan(0);
  });
});
