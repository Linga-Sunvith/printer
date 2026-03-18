package com.nukkadshops.printer.android;

import android.content.Context;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.util.List;
import java.util.Map;

public class SharedPrinterModule extends NativeModule {
    private static final String NAME = "SharedPrinterModule";
    private AndroidPrinterAdapter adapter;
    private ReactApplicationContext reactContext;

    public SharedPrinterModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.adapter = new AndroidPrinterAdapter(context);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void discoverPrinters(Promise promise) {
        try {
            List<PrinterDiscovery.PrinterDevice> printers = adapter.discoverPrinters();
            WritableArray array = Arguments.createArray();

            for (PrinterDiscovery.PrinterDevice printer : printers) {
                WritableMap map = Arguments.createMap();
                map.putString("id", printer.id);
                map.putString("name", printer.name);
                map.putInt("vendorId", printer.vendorId);
                map.putInt("productId", printer.productId);
                map.putString("manufacturer", printer.manufacturer);
                map.putString("transportType", "USB");
                array.pushMap(map);
            }

            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("DISCOVERY_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void connect(String printerId, int vendorId, int productId, Promise promise) {
        try {
            boolean connected = adapter.connect(printerId, vendorId, productId);
            if (connected) {
                WritableMap map = Arguments.createMap();
                map.putString("id", printerId);
                map.putString("name", "Box P");
                map.putInt("vendorId", vendorId);
                map.putInt("productId", productId);
                promise.resolve(map);
            } else {
                promise.reject("CONNECT_ERROR", "Failed to connect");
            }
        } catch (Exception e) {
            promise.reject("CONNECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            adapter.disconnect();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("DISCONNECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getStatus(Promise promise) {
        try {
            Map<String, Object> status = adapter.getStatus();
            WritableMap map = Arguments.createMap();
            for (String key : status.keySet()) {
                Object value = status.get(key);
                if (value instanceof String) {
                    map.putString(key, (String) value);
                } else if (value instanceof Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof Integer) {
                    map.putInt(key, (Integer) value);
                }
            }
            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("STATUS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void printReceipt(String jobId, String printerId, Map<String, Object> payload, Promise promise) {
        try {
            Map<String, Object> result = adapter.printReceipt(jobId, printerId, payload);
            WritableMap resultMap = Arguments.createMap();
            resultMap.putString("status", (String) result.get("status"));
            resultMap.putString("message", (String) result.getOrDefault("message", ""));
            promise.resolve(resultMap);
        } catch (Exception e) {
            WritableMap errorMap = Arguments.createMap();
            errorMap.putString("status", "failed");
            errorMap.putString("message", e.getMessage());
            promise.resolve(errorMap);
        }
    }

    @ReactMethod
    public void printLabel(String jobId, String printerId, Map<String, Object> payload, Promise promise) {
        try {
            Map<String, Object> result = adapter.printLabel(jobId, printerId, payload);
            WritableMap resultMap = Arguments.createMap();
            resultMap.putString("status", (String) result.get("status"));
            resultMap.putString("message", (String) result.getOrDefault("message", ""));
            promise.resolve(resultMap);
        } catch (Exception e) {
            WritableMap errorMap = Arguments.createMap();
            errorMap.putString("status", "failed");
            errorMap.putString("message", e.getMessage());
            promise.resolve(errorMap);
        }
    }

    @ReactMethod
    public void getCapabilities(Promise promise) {
        try {
            Map<String, Object> capabilities = adapter.getCapabilities();
            WritableMap map = Arguments.createMap();
            for (String key : capabilities.keySet()) {
                Object value = capabilities.get(key);
                if (value instanceof String) {
                    map.putString(key, (String) value);
                } else if (value instanceof Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof Integer) {
                    map.putInt(key, (Integer) value);
                }
            }
            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("CAPABILITIES_ERROR", e.getMessage());
        }
    }
}
