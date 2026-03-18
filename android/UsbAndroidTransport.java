package com.nukkadshops.printer.android;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import java.io.IOException;

public class UsbAndroidTransport {
    private UsbManager usbManager;
    private UsbDevice usbDevice;
    private UsbDeviceConnection connection;
    private UsbInterface usbInterface;
    private UsbEndpoint bulkOut;
    private UsbEndpoint bulkIn;

    public UsbAndroidTransport(Context context) {
        this.usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
    }

    public boolean connect(String deviceId, int vendorId, int productId) {
        try {
            usbDevice = usbManager.getDeviceList().get(deviceId);
            if (usbDevice == null) {
                return false;
            }

            connection = usbManager.openDevice(usbDevice);
            if (connection == null) {
                return false;
            }

            // Find bulk endpoints
            usbInterface = usbDevice.getInterface(0);
            connection.claimInterface(usbInterface, true);

            for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                UsbEndpoint endpoint = usbInterface.getEndpoint(i);
                if (endpoint.getDirection() == UsbEndpoint.ENDPOINT_DIR_OUT) {
                    bulkOut = endpoint;
                } else {
                    bulkIn = endpoint;
                }
            }

            return bulkOut != null && bulkIn != null;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void disconnect() {
        try {
            if (connection != null) {
                if (usbInterface != null) {
                    connection.releaseInterface(usbInterface);
                }
                connection.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean sendData(byte[] data) {
        try {
            if (bulkOut == null || connection == null) {
                return false;
            }
            int sent = connection.bulkTransfer(bulkOut, data, data.length, 5000);
            return sent > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public byte[] readData(int length) {
        try {
            if (bulkIn == null || connection == null) {
                return new byte[0];
            }
            byte[] buffer = new byte[length];
            int read = connection.bulkTransfer(bulkIn, buffer, length, 5000);
            if (read > 0) {
                byte[] result = new byte[read];
                System.arraycopy(buffer, 0, result, 0, read);
                return result;
            }
            return new byte[0];
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    public Object getStatus() {
        try {
            byte[] statusCommand = {0x1F, 0x01, 0x01};
            sendData(statusCommand);
            byte[] response = readData(1024);
            return response.length > 0 ? "OK" : "NO_RESPONSE";
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }
}
