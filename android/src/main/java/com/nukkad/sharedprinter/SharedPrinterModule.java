package com.nukkad.sharedprinter;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SharedPrinterModule {
    private static final int USB_WRITE_TIMEOUT_MS = 4_000;

    private final AndroidUsbPrinterConnection usbPrinterConnection;

    public SharedPrinterModule(UsbManager usbManager) {
        this.usbPrinterConnection = new AndroidUsbPrinterConnection(usbManager);
    }

    public void initialize() {
        // Kept for API symmetry with the TypeScript bridge.
    }

    public List<Map<String, Object>> discoverPrinters() {
        List<Map<String, Object>> printers = new ArrayList<>();

        for (UsbDevice device : usbPrinterConnection.discoverDevices().values()) {
            if (!isPotentialPrinter(device)) {
                continue;
            }

            printers.add(mapPrinter(device));
        }

        return printers;
    }

    public Map<String, Object> connect(String printerId) {
        UsbDevice device = findDevice(printerId);
        if (device == null) {
            throw new IllegalArgumentException("Printer not found: " + printerId);
        }

        if (!usbPrinterConnection.hasPermission(device)) {
            throw new IllegalStateException("USB permission missing for printer: " + printerId);
        }

        usbPrinterConnection.connect(device);
        return mapPrinter(device);
    }

    public void disconnect(String printerId) {
        if (printerId == null || usbPrinterConnection.isConnected(printerId)) {
            usbPrinterConnection.disconnect();
        }
    }

    public Map<String, Object> getConnectedPrinter() {
        UsbDevice connectedDevice = usbPrinterConnection.getConnectedDevice();
        return connectedDevice == null ? null : mapPrinter(connectedDevice);
    }

    public Map<String, Object> getStatus(String printerId) {
        boolean isConnected = printerId == null
                ? usbPrinterConnection.getConnectedDevice() != null
                : usbPrinterConnection.isConnected(printerId);

        HashMap<String, Object> status = new HashMap<>();
        status.put("state", isConnected ? "connected" : "disconnected");
        status.put("updatedAt", Instant.now().toString());
        status.put("isOffline", !isConnected);
        return status;
    }

    public Map<String, Object> printReceipt(String jobId, String printerId, List<List<Integer>> chunks) {
        writeChunks(printerId, chunks);
        return buildPrintResult(jobId, "Receipt printed successfully.");
    }

    public Map<String, Object> printLabel(String jobId, String printerId, List<List<Integer>> chunks) {
        writeChunks(printerId, chunks);
        return buildPrintResult(jobId, "Label printed successfully.");
    }

    private void writeChunks(String printerId, List<List<Integer>> chunks) {
        if (!usbPrinterConnection.isConnected(printerId)) {
            throw new IllegalStateException("Printer is not connected: " + printerId);
        }

        for (List<Integer> chunk : chunks) {
            usbPrinterConnection.write(toByteArray(chunk), USB_WRITE_TIMEOUT_MS);
        }
    }

    private UsbDevice findDevice(String printerId) {
        for (UsbDevice device : usbPrinterConnection.discoverDevices().values()) {
            if (device.getDeviceName().equals(printerId)) {
                return device;
            }
        }

        return null;
    }

    private boolean isPotentialPrinter(UsbDevice device) {
        return device.getDeviceClass() == UsbConstants.USB_CLASS_PRINTER
                || device.getInterfaceCount() > 0;
    }

    private Map<String, Object> mapPrinter(UsbDevice device) {
        HashMap<String, Object> printer = new HashMap<>();
        printer.put("id", device.getDeviceName());
        printer.put("name", device.getProductName() == null ? "USB Printer" : device.getProductName());
        printer.put("transportType", "usb");
        printer.put("vendorId", String.format("0x%04X", device.getVendorId()));
        printer.put("productId", String.format("0x%04X", device.getProductId()));
        printer.put("address", device.getDeviceName());
        printer.put("hasPermission", usbPrinterConnection.hasPermission(device));
        return printer;
    }

    private Map<String, Object> buildPrintResult(String jobId, String message) {
        HashMap<String, Object> result = new HashMap<>();
        result.put("jobId", jobId);
        result.put("status", "completed");
        result.put("message", message);
        return result;
    }

    private byte[] toByteArray(List<Integer> values) {
        byte[] bytes = new byte[values.size()];
        for (int index = 0; index < values.size(); index++) {
            bytes[index] = (byte) (values.get(index) & 0xFF);
        }
        return bytes;
    }
}
