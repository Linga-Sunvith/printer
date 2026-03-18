package com.nukkadshops.printer.android;

import android.content.Context;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AndroidPrinterAdapter {
    private Context context;
    private UsbAndroidTransport transport;
    private PrinterDiscovery discovery;
    private String connectedDeviceId;

    public AndroidPrinterAdapter(Context context) {
        this.context = context;
        this.transport = new UsbAndroidTransport(context);
        this.discovery = new PrinterDiscovery(context);
    }

    // Discover all USB printers
    public List<PrinterDiscovery.PrinterDevice> discoverPrinters() throws Exception {
        return discovery.discoverPrinters();
    }

    // Connect to a specific printer
    public boolean connect(String deviceId, int vendorId, int productId) throws Exception {
        boolean connected = transport.connect(deviceId, vendorId, productId);
        if (connected) {
            connectedDeviceId = deviceId;
        }
        return connected;
    }

    // Disconnect from printer
    public void disconnect() throws Exception {
        transport.disconnect();
        connectedDeviceId = null;
    }

    // Get printer status
    public Map<String, Object> getStatus() throws Exception {
        Map<String, Object> status = new HashMap<>();
        try {
            Object statusResult = transport.getStatus();
            status.put("status", statusResult);
            status.put("connected", connectedDeviceId != null);
            return status;
        } catch (Exception e) {
            status.put("error", e.getMessage());
            return status;
        }
    }

    // Print receipt
    public Map<String, Object> printReceipt(String jobId, String printerId, Map<String, Object> receiptPayload) throws Exception {
        Map<String, Object> result = new HashMap<>();
        try {
            EscPosReceiptRenderer renderer = new EscPosReceiptRenderer();
            byte[] receiptData = renderer.render(receiptPayload);

            boolean sent = transport.sendData(receiptData);
            if (sent) {
                result.put("status", "completed");
                result.put("message", "Receipt printed successfully");
                result.put("jobId", jobId);
            } else {
                result.put("status", "failed");
                result.put("message", "Failed to send data to printer");
            }
        } catch (Exception e) {
            result.put("status", "failed");
            result.put("message", "Error: " + e.getMessage());
        }
        return result;
    }

    // Print label
    public Map<String, Object> printLabel(String jobId, String printerId, Map<String, Object> labelPayload) throws Exception {
        Map<String, Object> result = new HashMap<>();
        try {
            SimpleLabelRenderer renderer = new SimpleLabelRenderer();
            byte[] labelData = renderer.render(labelPayload);

            boolean sent = transport.sendData(labelData);
            if (sent) {
                result.put("status", "completed");
                result.put("message", "Label printed successfully");
                result.put("jobId", jobId);
            } else {
                result.put("status", "failed");
                result.put("message", "Failed to send data to printer");
            }
        } catch (Exception e) {
            result.put("status", "failed");
            result.put("message", "Error: " + e.getMessage());
        }
        return result;
    }

    // Get capabilities
    public Map<String, Object> getCapabilities() throws Exception {
        Map<String, Object> capabilities = new HashMap<>();
        capabilities.put("printQuality", "MEDIUM");
        capabilities.put("maxPrintWidth", 384);
        capabilities.put("supportsReceipts", true);
        capabilities.put("supportsLabels", true);
        capabilities.put("protocols", new String[]{"ESC/POS", "TSC"});
        return capabilities;
    }
}
