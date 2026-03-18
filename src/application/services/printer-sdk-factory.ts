import { PrinterSdk } from "./printer-sdk";
import { AndroidPrinterAdapter } from "../../infrastructure/adapters/android/android-printer-adapter";
import { WindowsPrinterAdapter } from "../../infrastructure/adapters/windows/windows-printer-adapter";
import type { AndroidNativePrinterModule } from "../../react-native/native-printer-module";
import type { WindowsNativePrinterModule } from "../../react-native/native-windows-printer-module";

export function createAndroidPrinterSdk(nativeModule?: AndroidNativePrinterModule): PrinterSdk {
  return new PrinterSdk(new AndroidPrinterAdapter(nativeModule));
}

export function createWindowsPrinterSdk(nativeModule?: WindowsNativePrinterModule): PrinterSdk {
  return new PrinterSdk(new WindowsPrinterAdapter(nativeModule));
}
