using System;
using System.IO.Ports;

namespace SharedPrinterModule
{
    internal sealed class SerialPrinterClient
    {
        private static readonly int[] CandidateBaudRates = { 9600, 19200, 38400, 57600, 115200 };

        public void Write(string portName, byte[] bytes)
        {
            Exception lastError = null;

            foreach (var baudRate in CandidateBaudRates)
            {
                try
                {
                    using (var serialPort = new SerialPort(portName, baudRate, Parity.None, 8, StopBits.One)
                    {
                        Handshake = Handshake.None,
                        DtrEnable = true,
                        RtsEnable = true,
                        WriteTimeout = 4000,
                        ReadTimeout = 4000
                    })
                    {
                        serialPort.Open();
                        serialPort.Write(bytes, 0, bytes.Length);
                        serialPort.BaseStream.Flush();
                        return;
                    }
                }
                catch (Exception error)
                {
                    lastError = error;
                }
            }

            throw new InvalidOperationException(string.Format("Unable to write to serial printer port {0}.", portName), lastError);
        }
    }
}
