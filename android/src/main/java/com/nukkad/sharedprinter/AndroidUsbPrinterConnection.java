package com.nukkad.sharedprinter;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;

import java.util.HashMap;
import java.util.Map;

final class AndroidUsbPrinterConnection {
    private final UsbManager usbManager;
    private UsbDevice connectedDevice;
    private UsbDeviceConnection connection;
    private UsbInterface claimedInterface;
    private UsbEndpoint outputEndpoint;

    AndroidUsbPrinterConnection(UsbManager usbManager) {
        this.usbManager = usbManager;
    }

    Map<String, UsbDevice> discoverDevices() {
        return new HashMap<>(usbManager.getDeviceList());
    }

    boolean hasPermission(UsbDevice device) {
        return usbManager.hasPermission(device);
    }

    UsbDevice getConnectedDevice() {
        return connectedDevice;
    }

    boolean isConnected(String printerId) {
        return connectedDevice != null && connectedDevice.getDeviceName().equals(printerId);
    }

    void connect(UsbDevice device) {
        disconnect();

        UsbInterface selectedInterface = null;
        UsbEndpoint selectedOutputEndpoint = null;

        for (int interfaceIndex = 0; interfaceIndex < device.getInterfaceCount(); interfaceIndex++) {
            UsbInterface usbInterface = device.getInterface(interfaceIndex);
            for (int endpointIndex = 0; endpointIndex < usbInterface.getEndpointCount(); endpointIndex++) {
                UsbEndpoint endpoint = usbInterface.getEndpoint(endpointIndex);
                if (endpoint.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK
                        && endpoint.getDirection() == UsbConstants.USB_DIR_OUT) {
                    selectedInterface = usbInterface;
                    selectedOutputEndpoint = endpoint;
                    break;
                }
            }

            if (selectedInterface != null) {
                break;
            }
        }

        if (selectedInterface == null || selectedOutputEndpoint == null) {
            throw new IllegalStateException("No writable USB printer endpoint found.");
        }

        UsbDeviceConnection usbConnection = usbManager.openDevice(device);
        if (usbConnection == null) {
            throw new IllegalStateException("Unable to open USB printer device.");
        }

        if (!usbConnection.claimInterface(selectedInterface, true)) {
            usbConnection.close();
            throw new IllegalStateException("Unable to claim USB printer interface.");
        }

        connectedDevice = device;
        connection = usbConnection;
        claimedInterface = selectedInterface;
        outputEndpoint = selectedOutputEndpoint;
    }

    void write(byte[] data, int timeoutMs) {
        if (connection == null || outputEndpoint == null || connectedDevice == null) {
            throw new IllegalStateException("Printer is not connected.");
        }

        int transferred = connection.bulkTransfer(outputEndpoint, data, data.length, timeoutMs);
        if (transferred < 0) {
            throw new IllegalStateException("USB bulk transfer failed.");
        }
    }

    void disconnect() {
        if (connection != null && claimedInterface != null) {
            connection.releaseInterface(claimedInterface);
        }

        if (connection != null) {
            connection.close();
        }

        connectedDevice = null;
        connection = null;
        claimedInterface = null;
        outputEndpoint = null;
    }
}
