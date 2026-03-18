package com.nukkadshops.printer.android;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class PrinterDiscovery {
    private UsbManager usbManager;
    private static final int[] KNOWN_VENDOR_IDS = {
        0x0571, // Epson
        0x04B8, // Epson alternate
        0x0519, // Star
        0x0A5F  // Zebra
    };

    public PrinterDiscovery(Context context) {
        this.usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
    }

    public List<PrinterDevice> discoverPrinters() {
        List<PrinterDevice> printers = new ArrayList<>();

        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();

        for (UsbDevice device : deviceList.values()) {
            if (isKnownPrinter(device)) {
                PrinterDevice printer = new PrinterDevice();
                printer.id = device.getDeviceName();
                printer.name = device.getProductName();
                printer.vendorId = device.getVendorId();
                printer.productId = device.getProductId();
                printer.manufacturer = device.getManufacturerName();
                printer.model = device.getProductName();
                printers.add(printer);
            }
        }

        return printers;
    }

    private boolean isKnownPrinter(UsbDevice device) {
        for (int vid : KNOWN_VENDOR_IDS) {
            if (device.getVendorId() == vid) {
                return true;
            }
        }
        return false;
    }

    public static class PrinterDevice {
        public String id;
        public String name;
        public int vendorId;
        public int productId;
        public String manufacturer;
        public String model;
    }
}
