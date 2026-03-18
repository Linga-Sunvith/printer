using System;
using System.Collections.Generic;
using System.Drawing.Printing;
using System.IO.Ports;
using System.Linq;

namespace SharedPrinterModule
{
    public class SharedPrinterModule
    {
        private readonly RawPrinterClient rawPrinterClient = new RawPrinterClient();
        private readonly SerialPrinterClient serialPrinterClient = new SerialPrinterClient();
        private Dictionary<string, object> connectedPrinter;

        public void Initialize()
        {
            // Kept for parity with the SDK bridge.
        }

        public IList<Dictionary<string, object>> DiscoverPrinters()
        {
            var printers = new List<Dictionary<string, object>>();

            printers.AddRange(
                PrinterSettings.InstalledPrinters
                    .Cast<string>()
                    .Select(MapQueuePrinter));

            printers.AddRange(
                SerialPort.GetPortNames()
                    .OrderBy(portName => portName)
                    .Select(MapSerialPrinter));

            return printers;
        }

        public Dictionary<string, object> Connect(string printerId)
        {
            var printer = DiscoverPrinters().FirstOrDefault(candidate =>
                string.Equals(GetValue(candidate, "id"), printerId, StringComparison.Ordinal));

            if (printer == null)
            {
                throw new InvalidOperationException(string.Format("Printer not found: {0}", printerId));
            }

            connectedPrinter = printer;
            return printer;
        }

        public void Disconnect(string printerId)
        {
            if (connectedPrinter == null)
            {
                return;
            }

            if (printerId == null ||
                string.Equals(GetValue(connectedPrinter, "id"), printerId, StringComparison.Ordinal))
            {
                connectedPrinter = null;
            }
        }

        public Dictionary<string, object> GetConnectedPrinter()
        {
            return connectedPrinter;
        }

        public Dictionary<string, object> GetStatus(string printerId)
        {
            var isConnected = connectedPrinter != null &&
                (printerId == null ||
                 string.Equals(GetValue(connectedPrinter, "id"), printerId, StringComparison.Ordinal));

            return new Dictionary<string, object>
            {
                { "state", isConnected ? "connected" : "disconnected" },
                { "updatedAt", DateTimeOffset.UtcNow.ToString("O") },
                { "isOffline", !isConnected }
            };
        }

        public Dictionary<string, object> PrintReceipt(string jobId, string printerId, IList<IList<int>> chunks)
        {
            var printer = RequireConnectedPrinter(printerId);
            WriteToConnectedPrinter(printer, FlattenChunks(chunks), "Receipt-" + jobId);

            return new Dictionary<string, object>
            {
                { "status", "completed" },
                { "message", string.Format("Receipt job {0} sent to {1}.", jobId, GetValue(printer, "name")) }
            };
        }

        public Dictionary<string, object> PrintLabel(string jobId, string printerId, IList<IList<int>> chunks)
        {
            var printer = RequireConnectedPrinter(printerId);
            WriteToConnectedPrinter(printer, FlattenChunks(chunks), "Label-" + jobId);

            return new Dictionary<string, object>
            {
                { "status", "completed" },
                { "message", string.Format("Label job {0} sent to {1}.", jobId, GetValue(printer, "name")) }
            };
        }

        private Dictionary<string, object> RequireConnectedPrinter(string printerId)
        {
            if (connectedPrinter == null ||
                !string.Equals(GetValue(connectedPrinter, "id"), printerId, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(string.Format("Printer is not connected: {0}", printerId));
            }

            return connectedPrinter;
        }

        private void WriteToConnectedPrinter(Dictionary<string, object> printer, byte[] bytes, string documentName)
        {
            var transportType = GetValue(printer, "transportType");
            var address = GetValue(printer, "address");
            var name = GetValue(printer, "name");

            if (string.Equals(transportType, "serial", StringComparison.OrdinalIgnoreCase))
            {
                serialPrinterClient.Write(address, bytes);
                return;
            }

            rawPrinterClient.Write(name, bytes, documentName);
        }

        private Dictionary<string, object> MapQueuePrinter(string printerName)
        {
            var settings = new PrinterSettings { PrinterName = printerName };
            var transportType = InferQueueTransportType(printerName);

            return new Dictionary<string, object>
            {
                { "id", printerName },
                { "name", printerName },
                { "transportType", transportType },
                { "address", printerName },
                { "isDefault", settings.IsDefaultPrinter },
                { "isValid", settings.IsValid }
            };
        }

        private Dictionary<string, object> MapSerialPrinter(string portName)
        {
            return new Dictionary<string, object>
            {
                { "id", portName },
                { "name", string.Format("Serial Printer ({0})", portName) },
                { "transportType", "serial" },
                { "address", portName },
                { "isDefault", false },
                { "isValid", true }
            };
        }

        private string InferQueueTransportType(string portName)
        {
            if (portName.StartsWith("USB", StringComparison.OrdinalIgnoreCase))
            {
                return "usb";
            }

            if (portName.StartsWith("COM", StringComparison.OrdinalIgnoreCase))
            {
                return "serial";
            }

            if (portName.StartsWith("IP_", StringComparison.OrdinalIgnoreCase) ||
                portName.Contains("."))
            {
                return "wifi";
            }

            return "socket";
        }

        private byte[] FlattenChunks(IList<IList<int>> chunks)
        {
            var bytes = new List<byte>();
            foreach (var chunk in chunks)
            {
                bytes.AddRange(chunk.Select(value => (byte)(value & 0xFF)));
            }

            return bytes.ToArray();
        }

        private string GetValue(Dictionary<string, object> printer, string key)
        {
            object value;
            if (!printer.TryGetValue(key, out value) || value == null)
            {
                return string.Empty;
            }

            return value.ToString();
        }
    }
}
