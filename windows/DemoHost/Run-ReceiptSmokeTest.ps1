Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Add-Type -ReferencedAssemblies @("System.dll", "System.Core.dll", "System.Drawing.dll") -Path @(
  (Join-Path $repoRoot "windows\SharedPrinterModule\RawPrinterClient.cs"),
  (Join-Path $repoRoot "windows\SharedPrinterModule\SerialPrinterClient.cs"),
  (Join-Path $repoRoot "windows\SharedPrinterModule\SharedPrinterModule.cs")
)

$module = New-Object SharedPrinterModule.SharedPrinterModule
$module.Initialize()

function Add-AsciiBytes {
  param(
    [System.Collections.Generic.List[int]]$Target,
    [string]$Text
  )

  foreach ($byteValue in [System.Text.Encoding]::ASCII.GetBytes($Text)) {
    [void]$Target.Add([int]$byteValue)
  }
}

$bytes = New-Object 'System.Collections.Generic.List[int]'
[void]$bytes.AddRange([int[]](0x1B, 0x40))
Add-AsciiBytes -Target $bytes -Text "Nukkad Demo Store`r`n"
Add-AsciiBytes -Target $bytes -Text "Item A x1  10.00`r`n"
Add-AsciiBytes -Target $bytes -Text "Total    10.00`r`n"
Add-AsciiBytes -Target $bytes -Text "Thank you`r`n`r`n`r`n"
[void]$bytes.AddRange([int[]](0x1D, 0x56, 0x41, 0x00))

$chunks = New-Object 'System.Collections.Generic.List[System.Collections.Generic.IList[int]]'
[void]$chunks.Add($bytes)

$module.Connect("POS-80C") | Out-Null
$result = $module.PrintReceipt("receipt-smoke-test", "POS-80C", $chunks)
Write-Output $result["message"]
