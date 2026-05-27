# ==============================================================================
# MFT Hardware Inventory - Collector Agent for Windows
# ==============================================================================
# Este script recopila especificaciones de hardware y software locales usando
# WMI/CIM nativos y llaves de registro, y las envía al endpoint del inventario.
# ==============================================================================

# --- Parámetros de Configuración ---
$API_URL = "https://mft-inventory.vercel.app"  # Cambiar por la URL del servidor Next.js
$AGENT_TOKEN = "INGRESA_TU_TOKEN_DE_INQUILINO_AQUI"

# ==============================================================================
# 0. Instalación Persistente (Tarea Programada)
# ==============================================================================
$taskName = "MFTInventoryCollector"
$taskPath = "C:\ProgramData\MFTInventory"
$taskScript = "$taskPath\collector.ps1"

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin -and $MyInvocation.MyCommand.Path -ne $taskScript) {
    Write-Host "Instalando agente como tarea programada para ejecutarse los dias 15..." -ForegroundColor Cyan
    
    if (-not (Test-Path $taskPath)) {
        New-Item -ItemType Directory -Force -Path $taskPath | Out-Null
    }
    
    if ($MyInvocation.MyCommand.Path) {
        Copy-Item -Path $MyInvocation.MyCommand.Path -Destination $taskScript -Force
    } elseif ($script) {
        Set-Content -Path $taskScript -Value $script -Encoding UTF8
    } else {
        Write-Host "No se pudo copiar el agente a la carpeta segura para la tarea programada." -ForegroundColor Red
    }
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Usamos una definición XML para garantizar máxima compatibilidad con StartWhenAvailable y DaysOfMonth
    $xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2020-01-01T10:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByMonth>
        <DaysOfMonth>
          <Day>15</Day>
        </DaysOfMonth>
        <Months>
          <January/><February/><March/><April/><May/><June/><July/><August/><September/><October/><November/><December/>
        </Months>
      </ScheduleByMonth>
    </CalendarTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>true</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-WindowStyle Hidden -ExecutionPolicy Bypass -File "$taskScript"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

    try {
        Register-ScheduledTask -TaskName $taskName -Xml $xml -User "NT AUTHORITY\SYSTEM" -Force | Out-Null
        Write-Host "Tarea programada instalada exitosamente. Se ejecutará los días 15 de cada mes y al encender si estuvo apagado." -ForegroundColor Green
    } catch {
        Write-Host "Error al registrar tarea programada. Mensaje: $_" -ForegroundColor Red
    }
} elseif (-not $isAdmin) {
    Write-Host "ADVERTENCIA: No se ejecuto como administrador. El agente se ejecutara una vez, pero no podra instalarse permanentemente." -ForegroundColor Yellow
}

# 1. Obtener información general del sistema
Write-Host "Recopilando información básica del sistema..." -ForegroundColor Cyan
$computerSystem = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
$operatingSystem = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
$bios = Get-CimInstance Win32_Bios -ErrorAction SilentlyContinue
$processorObj = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue

$hostname = $computerSystem.Name
$domain = $computerSystem.Domain
$os = $operatingSystem.Caption
$processor = $processorObj.Name
$manufacturer = $computerSystem.Manufacturer
$model = $computerSystem.Model
$serial_number = $bios.SerialNumber

# Obtener último usuario que inició sesión de forma robusta
$lastUser = $computerSystem.UserName
if (-not $lastUser) {
    $lastUser = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI" -ErrorAction SilentlyContinue).LastLoggedOnUser
}
if (-not $lastUser) {
    $lastUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
}

# 2. Obtener detalles de memoria RAM por cada módulo
Write-Host "Analizando módulos de memoria RAM..." -ForegroundColor Cyan
$ramModules = Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue
$totalRamGb = 0
$modulesJson = @()

if ($ramModules) {
    foreach ($ram in $ramModules) {
        $capGb = [Math]::Round($ram.Capacity / 1GB)
        $totalRamGb += $capGb

        $memoryType = "Desconocido"
        $typeCode = $ram.SMBIOSMemoryType
        if (-not $typeCode) { $typeCode = $ram.MemoryType }
        
        if ($typeCode -eq 20) { $memoryType = "DDR" }
        elseif ($typeCode -eq 21) { $memoryType = "DDR2" }
        elseif ($typeCode -eq 24) { $memoryType = "DDR3" }
        elseif ($typeCode -eq 26) { $memoryType = "DDR4" }
        elseif ($typeCode -eq 34) { $memoryType = "DDR5" }
        elseif ($typeCode -eq 35) { $memoryType = "LPDDR5" }

        $formFactor = "Desconocido"
        if ($ram.FormFactor -eq 8) { $formFactor = "DIMM" }
        elseif ($ram.FormFactor -eq 12) { $formFactor = "SODIMM" }

        $modulesJson += @{
            capacity_gb  = $capGb
            speed_mhz    = $ram.Speed
            part_number  = ([string]$ram.PartNumber).Trim()
            manufacturer = ([string]$ram.Manufacturer).Trim()
            memory_type  = $memoryType
            form_factor  = $formFactor
        }
    }
} else {
    # Fallback si no hay acceso a módulos físicos (e.g. Máquina Virtual)
    $totalRamGb = [Math]::Round($computerSystem.TotalPhysicalMemory / 1GB)
    $modulesJson += @{
        capacity_gb  = $totalRamGb
        speed_mhz    = 0
        part_number  = "Virtual Memory"
        manufacturer = "Virtual Machine"
        memory_type  = "N/A"
        form_factor  = "N/A"
    }
}

$ramDetails = @{
    total_gb = $totalRamGb
    modules  = $modulesJson
}

# 3. Obtener detalles de discos (HDD/SSD) y espacio lógico
Write-Host "Escaneando unidades de almacenamiento..." -ForegroundColor Cyan

# Mapear tipos de disco físico (HDD/SSD)
$physDiskMap = @{}
$physDisks = Get-CimInstance -Namespace root\Microsoft\Windows\Storage -ClassName MSFT_PhysicalDisk -ErrorAction SilentlyContinue
if ($physDisks) {
    foreach ($pd in $physDisks) {
        # MediaType: 3 es HDD, 4 es SSD, 0 es no especificado (usar SSD por defecto)
        $type = "SSD"
        if ($pd.MediaType -eq 3) { $type = "HDD" }
        $physDiskMap[[string]$pd.DeviceId] = $type
    }
} else {
    $pdCmd = Get-PhysicalDisk -ErrorAction SilentlyContinue
    if ($pdCmd) {
        foreach ($pd in $pdCmd) {
            $type = "SSD"
            if ($pd.MediaType -eq "HDD") { $type = "HDD" }
            $physDiskMap[[string]$pd.DeviceID] = $type
        }
    }
}

# Obtener particiones y drives lógicos
$logicalDisks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" -ErrorAction SilentlyContinue
$totalDiskGb = 0
$drivesJson = @()

foreach ($ld in $logicalDisks) {
    $sizeGb = [Math]::Round($ld.Size / 1GB)
    $freeGb = [Math]::Round($ld.FreeSpace / 1GB)
    $usedGb = $sizeGb - $freeGb
    $totalDiskGb += $sizeGb

    # Intentar asociar disco físico para obtener tipo SSD/HDD
    $driveType = "SSD" # Valor por defecto
    $partition = Get-Partition -DriveLetter $ld.DeviceID.Replace(":", "") -ErrorAction SilentlyContinue
    if ($partition -and $null -ne $partition.DiskNumber -and $physDiskMap.ContainsKey([string]$partition.DiskNumber)) {
        $driveType = $physDiskMap[[string]$partition.DiskNumber]
    } elseif ($physDiskMap.Count -gt 0) {
        # Fallback al primer tipo disponible
        $driveType = ($physDiskMap.Values | Select-Object -First 1)
    }

    $drivesJson += @{
        drive_letter  = $ld.DeviceID
        type          = $driveType
        size_gb       = $sizeGb
        free_space_gb = $freeGb
        used_space_gb = $usedGb
    }
}

$diskDetails = @{
    total_gb = $totalDiskGb
    drives   = $drivesJson
}

# 4. Obtener Antivirus detectado (Security Center)
Write-Host "Consultando antivirus instalados..." -ForegroundColor Cyan
$avProducts = Get-CimInstance -Namespace "root\SecurityCenter2" -ClassName "AntiVirusProduct" -ErrorAction SilentlyContinue
$antivirus = "Ninguno"
if ($avProducts) {
    $avNames = @()
    foreach ($av in $avProducts) {
        $avNames += $av.displayName
    }
    $antivirus = $avNames -join ", "
}

# 5. Obtener versión de Microsoft Office instalada
Write-Host "Leyendo registros de software..." -ForegroundColor Cyan
$officeVersion = "Ninguno"

$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
)
$officeApps = Get-ItemProperty $regPaths -ErrorAction SilentlyContinue | 
    Where-Object { $_.DisplayName -like "*Microsoft Office*" -or $_.DisplayName -like "*Microsoft 365*" }

if ($officeApps) {
    $names = @()
    foreach ($app in $officeApps) {
        if ($app.DisplayName -and $app.DisplayName -notlike "*Update*" -and $app.DisplayName -notlike "*Language*") {
            $names += $app.DisplayName
        }
    }
    $uniqueNames = $names | Select-Object -Unique
    if ($uniqueNames) {
        $officeVersion = $uniqueNames -join ", "
    }
}

# Fallback por llaves específicas de instalación
if ($officeVersion -eq "Ninguno") {
    if (Test-Path "HKLM:\SOFTWARE\Microsoft\Office\16.0\Common\InstallRoot") {
        $officeVersion = "Microsoft Office 2016 / 365"
    } elseif (Test-Path "HKLM:\SOFTWARE\Microsoft\Office\15.0\Common\InstallRoot") {
        $officeVersion = "Microsoft Office 2013"
    } elseif (Test-Path "HKLM:\SOFTWARE\Microsoft\Office\14.0\Common\InstallRoot") {
        $officeVersion = "Microsoft Office 2010"
    }
}

# 6. Estructurar el objeto Payload
$payload = @{
    hostname       = $hostname
    domain         = $domain
    os             = $os
    processor      = $processor
    ram_details    = $ramDetails
    disk_details   = $diskDetails
    last_user      = $lastUser
    serial_number  = $serial_number
    model          = $model
    manufacturer   = $manufacturer
    antivirus      = $antivirus
    office_version = $officeVersion
}

# Convertir a JSON
$jsonPayload = $payload | ConvertTo-Json -Depth 5 -Compress

# 7. Enviar datos por HTTP POST
Write-Host "Enviando reporte de inventario a: $API_URL/api/collector..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $AGENT_TOKEN"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/collector" `
                                  -Method Post `
                                  -Headers $headers `
                                  -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonPayload)) `
                                  -ContentType "application/json; charset=utf-8"
    
    if ($response.success) {
        Write-Host "¡Inventario enviado con éxito! Servidor respondió: $($response.message)" -ForegroundColor Green
    } else {
        Write-Host "El servidor recibió los datos pero falló al procesar: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error al intentar contactar al servidor de inventario." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalles del error: $responseBody" -ForegroundColor Red
    }
}
