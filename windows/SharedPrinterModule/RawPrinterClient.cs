using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace SharedPrinterModule
{
    internal sealed class RawPrinterClient
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private sealed class DocInfo
        {
            [MarshalAs(UnmanagedType.LPWStr)]
            public string DocumentName = string.Empty;

            [MarshalAs(UnmanagedType.LPWStr)]
            public string OutputFile = string.Empty;

            [MarshalAs(UnmanagedType.LPWStr)]
            public string DataType = "RAW";
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern bool OpenPrinter(string printerName, out IntPtr printerHandle, IntPtr defaults);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
        private static extern bool ClosePrinter(IntPtr printerHandle);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern bool StartDocPrinter(IntPtr printerHandle, int level, [In] DocInfo documentInfo);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
        private static extern bool EndDocPrinter(IntPtr printerHandle);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
        private static extern bool StartPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
        private static extern bool EndPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
        private static extern bool WritePrinter(
            IntPtr printerHandle,
            byte[] bytes,
            int count,
            out int writtenBytes);

        public void Write(string printerName, byte[] bytes, string documentName)
        {
            IntPtr printerHandle;
            if (!OpenPrinter(printerName, out printerHandle, IntPtr.Zero))
            {
                throw new Win32Exception(Marshal.GetLastWin32Error(), string.Format("Unable to open printer {0}.", printerName));
            }

            try
            {
                var documentInfo = new DocInfo
                {
                    DocumentName = documentName
                };

                if (!StartDocPrinter(printerHandle, 1, documentInfo))
                {
                    throw new Win32Exception(Marshal.GetLastWin32Error(), string.Format("Unable to start print document on {0}.", printerName));
                }

                try
                {
                    if (!StartPagePrinter(printerHandle))
                    {
                        throw new Win32Exception(Marshal.GetLastWin32Error(), string.Format("Unable to start print page on {0}.", printerName));
                    }

                    try
                    {
                        int writtenBytes;
                        if (!WritePrinter(printerHandle, bytes, bytes.Length, out writtenBytes) || writtenBytes != bytes.Length)
                        {
                            throw new Win32Exception(Marshal.GetLastWin32Error(), string.Format("Unable to write all bytes to {0}.", printerName));
                        }
                    }
                    finally
                    {
                        EndPagePrinter(printerHandle);
                    }
                }
                finally
                {
                    EndDocPrinter(printerHandle);
                }
            }
            finally
            {
                ClosePrinter(printerHandle);
            }
        }
    }
}
