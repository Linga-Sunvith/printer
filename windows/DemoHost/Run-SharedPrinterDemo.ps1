[CmdletBinding()]
param(
  [switch]$SmokeTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$moduleFiles = @(
  (Join-Path $repoRoot "windows\SharedPrinterModule\RawPrinterClient.cs"),
  (Join-Path $repoRoot "windows\SharedPrinterModule\SerialPrinterClient.cs"),
  (Join-Path $repoRoot "windows\SharedPrinterModule\SharedPrinterModule.cs")
)

Add-Type -ReferencedAssemblies @("System.dll", "System.Core.dll", "System.Drawing.dll") -Path $moduleFiles

function Add-AsciiBytes {
  param(
    [System.Collections.Generic.List[int]]$Target,
    [string]$Text
  )

  foreach ($byteValue in [System.Text.Encoding]::ASCII.GetBytes($Text)) {
    [void]$Target.Add([int]$byteValue)
  }
}

function New-ReceiptChunks {
  $bytes = New-Object 'System.Collections.Generic.List[int]'
  [void]$bytes.AddRange([int[]](0x1B, 0x40))
  Add-AsciiBytes -Target $bytes -Text "Nukkad Demo Store`r`n"
  Add-AsciiBytes -Target $bytes -Text "Item A x1  10.00`r`n"
  Add-AsciiBytes -Target $bytes -Text "Total    10.00`r`n"
  Add-AsciiBytes -Target $bytes -Text "Thank you`r`n`r`n`r`n"
  [void]$bytes.AddRange([int[]](0x1D, 0x56, 0x41, 0x00))

  $chunks = New-Object 'System.Collections.Generic.List[System.Collections.Generic.IList[int]]'
  [void]$chunks.Add($bytes)
  return ,$chunks
}

function New-LabelChunks {
  $bytes = New-Object 'System.Collections.Generic.List[int]'
  Add-AsciiBytes -Target $bytes -Text "SIZE 40 mm,30 mm`r`n"
  Add-AsciiBytes -Target $bytes -Text "GAP 2 mm,0 mm`r`n"
  Add-AsciiBytes -Target $bytes -Text "CLS`r`n"
  Add-AsciiBytes -Target $bytes -Text ('TEXT 20,20,"0",0,1,1,"ITEM A"' + "`r`n")
  Add-AsciiBytes -Target $bytes -Text ('TEXT 20,60,"0",0,1,1,"RS 10"' + "`r`n")
  Add-AsciiBytes -Target $bytes -Text ('BARCODE 20,100,"128",50,1,0,2,2,"123456"' + "`r`n")
  Add-AsciiBytes -Target $bytes -Text "PRINT 1,1`r`n"

  $chunks = New-Object 'System.Collections.Generic.List[System.Collections.Generic.IList[int]]'
  [void]$chunks.Add($bytes)
  return ,$chunks
}

function Get-PrinterSummary([object]$printer) {
  return "{0} | {1} | {2}" -f $printer["id"], $printer["transportType"], $printer["address"]
}

$module = New-Object SharedPrinterModule.SharedPrinterModule
$module.Initialize()

if ($SmokeTest) {
  $printers = $module.DiscoverPrinters()
  if (-not $printers -or $printers.Count -eq 0) {
    Write-Output "No printers discovered."
    exit 1
  }

  $printers | ForEach-Object { Write-Output (Get-PrinterSummary $_) }
  exit 0
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Shared Printer SDK Demo"
$form.Size = New-Object System.Drawing.Size(820, 560)
$form.StartPosition = "CenterScreen"

$discoverButton = New-Object System.Windows.Forms.Button
$discoverButton.Text = "Discover"
$discoverButton.Location = New-Object System.Drawing.Point(20, 20)
$discoverButton.Size = New-Object System.Drawing.Size(110, 32)

$connectButton = New-Object System.Windows.Forms.Button
$connectButton.Text = "Connect"
$connectButton.Location = New-Object System.Drawing.Point(140, 20)
$connectButton.Size = New-Object System.Drawing.Size(110, 32)

$receiptButton = New-Object System.Windows.Forms.Button
$receiptButton.Text = "Print Receipt"
$receiptButton.Location = New-Object System.Drawing.Point(260, 20)
$receiptButton.Size = New-Object System.Drawing.Size(130, 32)

$labelButton = New-Object System.Windows.Forms.Button
$labelButton.Text = "Print Label"
$labelButton.Location = New-Object System.Drawing.Point(400, 20)
$labelButton.Size = New-Object System.Drawing.Size(110, 32)

$printerList = New-Object System.Windows.Forms.ListBox
$printerList.Location = New-Object System.Drawing.Point(20, 70)
$printerList.Size = New-Object System.Drawing.Size(760, 180)

$detailsBox = New-Object System.Windows.Forms.TextBox
$detailsBox.Location = New-Object System.Drawing.Point(20, 270)
$detailsBox.Size = New-Object System.Drawing.Size(760, 220)
$detailsBox.Multiline = $true
$detailsBox.ScrollBars = "Vertical"
$detailsBox.ReadOnly = $true

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 500)
$statusLabel.Size = New-Object System.Drawing.Size(760, 24)
$statusLabel.Text = "Ready"

$form.Controls.AddRange(@(
  $discoverButton,
  $connectButton,
  $receiptButton,
  $labelButton,
  $printerList,
  $detailsBox,
  $statusLabel
))

$discoveredPrinters = @()
$connectedPrinterId = $null

function Write-Log([string]$message) {
  $timestamp = Get-Date -Format "HH:mm:ss"
  $detailsBox.AppendText("[$timestamp] $message`r`n")
  $statusLabel.Text = $message
}

function Refresh-Printers {
  $script:discoveredPrinters = @($module.DiscoverPrinters())
  $printerList.Items.Clear()
  foreach ($printer in $script:discoveredPrinters) {
    [void]$printerList.Items.Add((Get-PrinterSummary $printer))
  }

  Write-Log ("Discovered {0} printer target(s)." -f $script:discoveredPrinters.Count)
}

$discoverButton.Add_Click({
  try {
    Refresh-Printers
  } catch {
    Write-Log ("Discover failed: {0}" -f $_.Exception.Message)
  }
})

$connectButton.Add_Click({
  try {
    if ($printerList.SelectedIndex -lt 0) {
      throw "Select a printer first."
    }

    $printer = $script:discoveredPrinters[$printerList.SelectedIndex]
    $module.Connect([string]$printer["id"]) | Out-Null
    $script:connectedPrinterId = [string]$printer["id"]
    Write-Log ("Connected to {0}." -f $printer["name"])
  } catch {
    Write-Log ("Connect failed: {0}" -f $_.Exception.Message)
  }
})

$receiptButton.Add_Click({
  try {
    if (-not $script:connectedPrinterId) {
      throw "Connect a printer first."
    }

    $result = $module.PrintReceipt("demo-receipt", $script:connectedPrinterId, (New-ReceiptChunks))
    Write-Log ([string]$result["message"])
  } catch {
    Write-Log ("Receipt print failed: {0}" -f $_.Exception.Message)
  }
})

$labelButton.Add_Click({
  try {
    if (-not $script:connectedPrinterId) {
      throw "Connect a printer first."
    }

    $result = $module.PrintLabel("demo-label", $script:connectedPrinterId, (New-LabelChunks))
    Write-Log ([string]$result["message"])
  } catch {
    Write-Log ("Label print failed: {0}" -f $_.Exception.Message)
  }
})

Refresh-Printers
[void]$form.ShowDialog()
