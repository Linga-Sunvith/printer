# Android Printer SDK Setup Guide

## 📁 File Structure

```
printer/
├── android/
│   ├── PrinterDiscovery.java              ✅ USB enumeration
│   ├── UsbAndroidTransport.java           ✅ USB communication
│   ├── EscPosReceiptRenderer.java         ✅ Receipt formatting
│   ├── SimpleLabelRenderer.java           ✅ Label formatting
│   ├── AndroidPrinterAdapter.java         ✅ Main orchestrator
│   ├── SharedPrinterModule.java           ✅ React Native bridge
│   └── SharedPrinterPackage.java          ✅ React Native package
│
└── shared-printer-demo/
    ├── App.tsx                            ✅ Platform-aware UI
    ├── android/
    │   └── app/
    │       └── src/
    │           └── main/
    │               ├── AndroidManifest.xml
    │               └── java/
    │                   └── com/nukkadshops/printer/
    │                       ├── MainActivity.java
    │                       └── MainApplication.java
```

## 🔧 Setup Instructions

### Step 1: Add Java Files to Android Project

Copy all Java files from `printer/android/` to your React Native Android project:

```
android/app/src/main/java/com/nukkadshops/printer/
├── PrinterDiscovery.java
├── UsbAndroidTransport.java
├── EscPosReceiptRenderer.java
├── SimpleLabelRenderer.java
├── AndroidPrinterAdapter.java
├── SharedPrinterModule.java
└── SharedPrinterPackage.java
```

### Step 2: Update MainApplication.java

Add the SharedPrinterPackage to your MainApplication:

```java
import com.nukkadshops.printer.android.SharedPrinterPackage;

public class MainApplication extends ReactApplication {
    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.asList(
            new MainReactPackage(),
            new SharedPrinterPackage()  // Add this line
        );
    }
}
```

### Step 3: Update AndroidManifest.xml

Add USB permissions:

```xml
<uses-permission android:name="android.permission.USB_PERMISSION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<uses-feature android:name="android.hardware.usb.host" android:required="true" />
```

### Step 4: Update build.gradle

Ensure you have the correct React Native and Android support libraries:

```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        targetSdkVersion 33
        minSdkVersion 21
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
```

### Step 5: Rebuild and Run

```bash
cd shared-printer-demo
npm install
npx react-native run-android
```

## 📋 Java Files Overview

### 1. PrinterDiscovery.java
- Enumerates all USB devices connected to Android
- Filters by known thermal printer VIDs (Epson, Star, Zebra)
- Returns list of PrinterDevice objects

**Methods:**
- `discoverPrinters()` - Find all thermal printers
- `isKnownPrinter()` - Check if device is a known printer

### 2. UsbAndroidTransport.java
- Handles USB communication with printers
- Opens/closes USB connections
- Sends ESC/POS commands
- Receives printer status

**Methods:**
- `connect()` - Open USB connection
- `disconnect()` - Close connection
- `sendData()` - Send bytes to printer
- `readData()` - Read response from printer
- `getStatus()` - Get printer status

### 3. EscPosReceiptRenderer.java
- Converts receipt data to ESC/POS format
- Formats text, alignment, prices
- Adds paper cut commands

**Methods:**
- `render()` - Convert receipt to bytes

### 4. SimpleLabelRenderer.java
- Converts label data to TSC/DSP format
- Supports barcodes, product names, prices
- Batch number support

**Methods:**
- `render()` - Convert label to bytes

### 5. AndroidPrinterAdapter.java
- Main orchestrator implementing adapter pattern
- Manages printer lifecycle
- Coordinates all operations

**Methods:**
- `discoverPrinters()`
- `connect()`
- `disconnect()`
- `getStatus()`
- `printReceipt()`
- `printLabel()`
- `getCapabilities()`

### 6. SharedPrinterModule.java
- React Native bridge module
- Exposes all printer methods to JavaScript
- Handles promise-based async calls

**Methods:**
- All methods callable from React Native App.tsx

### 7. SharedPrinterPackage.java
- Registers SharedPrinterModule with React Native
- Part of React Native package system

## 🎯 Testing Checklist

- [ ] Java files compile without errors
- [ ] AndroidManifest.xml has USB permissions
- [ ] MainApplication registers SharedPrinterPackage
- [ ] App builds and runs on Android device/emulator
- [ ] Discover finds Box P printer
- [ ] Connect establishes USB connection
- [ ] Print Receipt sends data to printer
- [ ] Print Label sends data to printer
- [ ] Logs show all operations

## ⚠️ Common Issues

### USB Permission Denied
- Ensure `android.permission.USB_PERMISSION` is in AndroidManifest.xml
- Check UsbDeviceConnection is granted

### Printer Not Found
- Verify USB cable is connected
- Check VID/PID matches known printers
- Enable USB debugging on device

### Print Fails
- Ensure printer is connected and powered on
- Check ESC/POS/TSC format is correct
- Verify USB endpoints are found (bulkOut, bulkIn)

## 🔄 Platform Comparison

| Feature | Windows (C#) | Android (Java) |
|---------|--------------|----------------|
| Discovery | WMI API | UsbManager |
| Transport | Windows USB API | UsbDeviceConnection |
| Receipt Format | ESC/POS | ESC/POS |
| Label Format | TSC/DSP | TSC/DSP |
| React Bridge | C# NativeModule | Java NativeModule |

## ✅ Success Criteria

- App launches on Android
- Discovers Box P printer
- Connects successfully
- Prints receipt on Box P
- Prints label on label printer
- Shows real-time logs
- Same UI as Windows version
