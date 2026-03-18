# Windows Demo Host

This is a small PowerShell-based Windows demo host for the shared printer SDK native module.

It can:

- discover available Windows printer targets
- connect the selected target
- print a sample receipt
- print a sample label

## Run

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\windows\DemoHost\Run-SharedPrinterDemo.ps1
```

## Smoke Test

This mode only compiles/loads the Windows module and prints the discovered targets to the terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\windows\DemoHost\Run-SharedPrinterDemo.ps1 -SmokeTest
```

## Notes

- This demo host uses the Windows native module C# files in `windows/SharedPrinterModule/`.
- Receipt and label print payloads are intentionally small for demo purposes.
- Real printer success still depends on Windows exposing the printer as a queue or usable serial target.
