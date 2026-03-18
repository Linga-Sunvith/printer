package com.nukkadshops.printer.android;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class EscPosReceiptRenderer {
    private static final int PAPER_WIDTH = 384; // pixels for 58mm paper

    public byte[] render(Map<String, Object> receiptPayload) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        // Initialize printer
        buffer.write(new byte[]{0x1B, 0x40}); // ESC @

        // Set alignment to center
        buffer.write(new byte[]{0x1B, 0x61, 0x01});

        // Print header
        String shopName = (String) receiptPayload.getOrDefault("shopName", "");
        buffer.write(shopName.getBytes(StandardCharsets.UTF_8));
        buffer.write("\n".getBytes(StandardCharsets.UTF_8));

        String shopAddress = (String) receiptPayload.getOrDefault("shopAddress", "");
        buffer.write(shopAddress.getBytes(StandardCharsets.UTF_8));
        buffer.write("\n\n".getBytes(StandardCharsets.UTF_8));

        // Set alignment to left
        buffer.write(new byte[]{0x1B, 0x61, 0x00});

        // Invoice number and date
        String invoiceNumber = (String) receiptPayload.getOrDefault("invoiceNumber", "");
        buffer.write(("Invoice: " + invoiceNumber + "\n").getBytes(StandardCharsets.UTF_8));

        // Items
        List<Map<String, Object>> items = (List<Map<String, Object>>) receiptPayload.get("items");
        if (items != null) {
            buffer.write("----------------------------\n".getBytes(StandardCharsets.UTF_8));
            for (Map<String, Object> item : items) {
                String itemName = (String) item.getOrDefault("name", "");
                Object qtyObj = item.get("quantity");
                Object totalObj = item.get("total");

                int qty = qtyObj instanceof Number ? ((Number) qtyObj).intValue() : 0;
                double total = totalObj instanceof Number ? ((Number) totalObj).doubleValue() : 0;

                String line = String.format("%s x%d\n", itemName, qty);
                buffer.write(line.getBytes(StandardCharsets.UTF_8));

                String priceLine = String.format("              ₹%.2f\n", total);
                buffer.write(priceLine.getBytes(StandardCharsets.UTF_8));
            }
        }

        // Totals
        buffer.write("----------------------------\n".getBytes(StandardCharsets.UTF_8));

        Object subObj = receiptPayload.get("subtotal");
        double subtotal = subObj instanceof Number ? ((Number) subObj).doubleValue() : 0;
        buffer.write(String.format("Subtotal: ₹%.2f\n", subtotal).getBytes(StandardCharsets.UTF_8));

        Object taxObj = receiptPayload.get("tax");
        double tax = taxObj instanceof Number ? ((Number) taxObj).doubleValue() : 0;
        buffer.write(String.format("Tax: ₹%.2f\n", tax).getBytes(StandardCharsets.UTF_8));

        Object totalObj = receiptPayload.get("grandTotal");
        double total = totalObj instanceof Number ? ((Number) totalObj).doubleValue() : 0;
        buffer.write(String.format("TOTAL: ₹%.2f\n", total).getBytes(StandardCharsets.UTF_8));

        // Footer
        buffer.write("\n\nThank you!\n\n".getBytes(StandardCharsets.UTF_8));

        // Paper cut
        buffer.write(new byte[]{0x1D, 0x56, 0x41}); // GS V A (partial cut)

        return buffer.toByteArray();
    }
}
