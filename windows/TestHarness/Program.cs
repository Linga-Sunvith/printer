using System;
using System.Collections.Generic;
using System.Text;
using SharedPrinterModule;

namespace SharedPrinterTestHarness
{
    internal static class Program
    {
        private static int Main(string[] args)
        {
            try
            {
                var module = new SharedPrinterModule.SharedPrinterModule();
                module.Initialize();

                if (args.Length == 0 || string.Equals(args[0], "discover", StringComparison.OrdinalIgnoreCase))
                {
                    RunDiscover(module);
                    return 0;
                }

                if (args.Length < 2)
                {
                    Console.Error.WriteLine("Usage:");
                    Console.Error.WriteLine("  discover");
                    Console.Error.WriteLine("  print-receipt <printerId>");
                    Console.Error.WriteLine("  print-label <printerId>");
                    return 1;
                }

                var command = args[0];
                var printerId = args[1];
                var printer = module.Connect(printerId);
                Console.WriteLine(string.Format("Connected: {0} ({1})", printer["name"], printer["transportType"]));

                if (string.Equals(command, "print-receipt", StringComparison.OrdinalIgnoreCase))
                {
                    var result = module.PrintReceipt("receipt-smoke-test", printerId, BuildReceiptChunks());
                    Console.WriteLine(result["message"]);
                    return 0;
                }

                if (string.Equals(command, "print-label", StringComparison.OrdinalIgnoreCase))
                {
                    var result = module.PrintLabel("label-smoke-test", printerId, BuildLabelChunks());
                    Console.WriteLine(result["message"]);
                    return 0;
                }

                Console.Error.WriteLine(string.Format("Unknown command: {0}", command));
                return 1;
            }
            catch (Exception error)
            {
                Console.Error.WriteLine(error);
                return 1;
            }
        }

        private static void RunDiscover(SharedPrinterModule.SharedPrinterModule module)
        {
            var printers = module.DiscoverPrinters();
            foreach (var printer in printers)
            {
                Console.WriteLine(
                    string.Format(
                        "{0} | {1} | {2} | {3}",
                        printer["id"],
                        printer["name"],
                        printer["transportType"],
                        printer["address"]));
            }
        }

        private static List<IList<int>> BuildReceiptChunks()
        {
            var bytes = new List<int>();
            bytes.AddRange(new[] { 0x1B, 0x40 });
            bytes.AddRange(ToBytes("Nukkad Test Store\r\n"));
            bytes.AddRange(ToBytes("Item A x1  10.00\r\n"));
            bytes.AddRange(ToBytes("Total    10.00\r\n"));
            bytes.AddRange(ToBytes("Thank you\r\n\r\n\r\n"));
            bytes.AddRange(new[] { 0x1D, 0x56, 0x41, 0x00 });
            return new List<IList<int>> { bytes };
        }

        private static List<IList<int>> BuildLabelChunks()
        {
            var bytes = new List<int>();
            bytes.AddRange(ToBytes("SIZE 40 mm,30 mm\r\n"));
            bytes.AddRange(ToBytes("GAP 2 mm,0 mm\r\n"));
            bytes.AddRange(ToBytes("CLS\r\n"));
            bytes.AddRange(ToBytes("TEXT 20,20,\"0\",0,1,1,\"ITEM A\"\r\n"));
            bytes.AddRange(ToBytes("TEXT 20,60,\"0\",0,1,1,\"RS 10\"\r\n"));
            bytes.AddRange(ToBytes("BARCODE 20,100,\"128\",50,1,0,2,2,\"123456\"\r\n"));
            bytes.AddRange(ToBytes("PRINT 1,1\r\n"));
            return new List<IList<int>> { bytes };
        }

        private static IEnumerable<int> ToBytes(string value)
        {
            foreach (var valueByte in Encoding.ASCII.GetBytes(value))
            {
                yield return valueByte;
            }
        }
    }
}
