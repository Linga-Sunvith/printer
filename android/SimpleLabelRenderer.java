package com.nukkadshops.printer.android;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class SimpleLabelRenderer {

    public byte[] render(Map<String, Object> labelPayload) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        // TSC/DSP label printing commands

        // Set label size (100mm x 150mm)
        buffer.write("SIZE 100mm,150mm\r\n".getBytes(StandardCharsets.UTF_8));

        // Set speed
        buffer.write("SPEED 6\r\n".getBytes(StandardCharsets.UTF_8));

        // Density
        buffer.write("DENSITY 15\r\n".getBytes(StandardCharsets.UTF_8));

        // Gap (0.2 inches)
        buffer.write("GAP 0.2\r\n".getBytes(StandardCharsets.UTF_8));

        // Clear buffer
        buffer.write("CLS\r\n".getBytes(StandardCharsets.UTF_8));

        // Product name (text)
        String productName = (String) labelPayload.getOrDefault("productName", "LABEL");
        String nameCmd = String.format("TEXT 50,50,\"ARIAL.TTF\",0,1,1,\"%s\"\r\n", productName);
        buffer.write(nameCmd.getBytes(StandardCharsets.UTF_8));

        // Barcode
        String barcode = (String) labelPayload.getOrDefault("barcode", "1234567890");
        String barcodeCmd = String.format("BARCODE 50,100,\"CODE128\",100,1,0,2,4,\"%s\"\r\n", barcode);
        buffer.write(barcodeCmd.getBytes(StandardCharsets.UTF_8));

        // MRP / Price
        Object priceObj = labelPayload.get("mrp");
        String priceText = priceObj != null ? "₹" + priceObj.toString() : "N/A";
        String priceCmd = String.format("TEXT 50,200,\"ARIAL.TTF\",0,1,1,\"%s\"\r\n", priceText);
        buffer.write(priceCmd.getBytes(StandardCharsets.UTF_8));

        // Batch number if available
        String batch = (String) labelPayload.getOrDefault("batchNumber", "");
        if (!batch.isEmpty()) {
            String batchCmd = String.format("TEXT 50,250,\"ARIAL.TTF\",0,0.7,0.7,\"Batch: %s\"\r\n", batch);
            buffer.write(batchCmd.getBytes(StandardCharsets.UTF_8));
        }

        // Print label
        buffer.write("PRINT 1\r\n".getBytes(StandardCharsets.UTF_8));

        return buffer.toByteArray();
    }
}
