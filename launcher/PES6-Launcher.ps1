# ============================================================
# PES 6 Online — Launcher de escritorio
# Configura la red (hosts) y lanza PES 6 / PECH Classic Patch.
# Requiere Windows; pide admin solo para escribir el archivo hosts.
# ============================================================

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Windows.Forms

$LauncherDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath  = Join-Path $LauncherDir "launcher.config.json"
$HostsPath   = "$env:SystemRoot\System32\drivers\etc\hosts"
$MarkerBegin = "# PES6-ONLINE BEGIN"
$MarkerEnd   = "# PES6-ONLINE END"

# ---------- Config ----------
function Load-Config {
    if (Test-Path $ConfigPath) {
        return Get-Content $ConfigPath -Raw | ConvertFrom-Json
    }
    return [pscustomobject]@{
        gameDir = "D:\Games\pech\PECH CLASSIC PATCH"
        exeCandidates = @("PECHCP.exe", "PES6.exe")
        gateHost = "pes6gate-ec.winning-eleven.net"
        stunHost = "we9stun.winning-eleven.net"
        gateIp = ""
        stunIp = ""
    }
}

function Save-Config($cfg) {
    $cfg | ConvertTo-Json | Set-Content $ConfigPath -Encoding UTF8
}

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]$id).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Find-GameExe($cfg) {
    foreach ($exe in $cfg.exeCandidates) {
        $p = Join-Path $cfg.gameDir $exe
        if (Test-Path $p) { return $p }
    }
    return $null
}

# ---------- hosts ----------
function Remove-ManagedBlock {
    $lines = Get-Content $HostsPath -ErrorAction Stop
    $out = @()
    $inside = $false
    foreach ($l in $lines) {
        if ($l -match [regex]::Escape($MarkerBegin)) { $inside = $true; continue }
        if ($l -match [regex]::Escape($MarkerEnd))   { $inside = $false; continue }
        if (-not $inside) { $out += $l }
    }
    Set-Content $HostsPath $out -Encoding ASCII
}

function Set-OnlineHosts($gateIp, $stunIp, $gateHost, $stunHost) {
    Remove-ManagedBlock
    $block = @($MarkerBegin, "$gateIp $gateHost", "$stunIp $stunHost", $MarkerEnd)
    Add-Content $HostsPath $block -Encoding ASCII
    # Refrescar caché DNS para que el juego resuelva ya.
    ipconfig /flushdns | Out-Null
}

function Elevate-IfNeeded {
    if (Test-Admin) { return $true }
    $answer = [System.Windows.MessageBox]::Show(
        "Escribir el archivo hosts requiere administrador. ¿Reiniciar el launcher elevado?",
        "PES 6 Online Launcher", "YesNo", "Question")
    if ($answer -eq "Yes") {
        Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    }
    return $false
}

# ---------- GUI ----------
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Title="PES 6 Online Launcher" Width="520" Height="510"
        WindowStartupLocation="CenterScreen" ResizeMode="NoResize"
        Background="#FF111113" Foreground="#FFEDEDED" FontFamily="Segoe UI">
  <Grid Margin="16">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="*"/>
      <RowDefinition Height="Auto"/>
    </Grid.RowDefinitions>
    <Grid.ColumnDefinitions>
      <ColumnDefinition Width="*"/><ColumnDefinition Width="*"/>
    </Grid.ColumnDefinitions>

    <TextBlock Grid.Row="0" Grid.ColumnSpan="2" Text="PES 6 ONLINE"
               FontSize="24" FontWeight="Bold" Foreground="#FF16A34A"
               HorizontalAlignment="Center"/>

    <StackPanel Grid.Row="1" Grid.ColumnSpan="2" Margin="0,12,0,0">
      <TextBlock Text="Carpeta del juego" Foreground="#FF9CA3AF"/>
      <DockPanel>
        <TextBox Name="GameDirBox" DockPanel.Dock="Left" Width="390"
                 Background="#FF1A1A1D" Foreground="#FFEDEDED" BorderBrush="#FF3A3A41"/>
        <Button Name="BrowseBtn" Content="…" Width="40" Margin="6,0,0,0"
                Background="#FF26262B" Foreground="#FFEDEDED" BorderBrush="#FF3A3A41"/>
      </DockPanel>
    </StackPanel>

    <StackPanel Grid.Row="2" Grid.Column="0" Margin="0,12,6,0">
      <TextBlock Text="Servidor" Foreground="#FF9CA3AF"/>
      <ComboBox Name="ServerCombo" Background="#FF1A1A1D" Foreground="#FFEDEDED"
                BorderBrush="#FF3A3A41"/>
    </StackPanel>
    <StackPanel Grid.Row="2" Grid.Column="1" Margin="6,12,0,0" VerticalAlignment="Bottom">
      <Button Name="SignupBtn" Content="Crear cuenta en el servidor" Height="26"
              Background="#FF26262B" Foreground="#FF4ADE80" BorderBrush="#FF3A3A41"/>
    </StackPanel>

    <StackPanel Grid.Row="3" Grid.Column="0" Margin="0,10,6,0">
      <TextBlock Text="IP del servidor (gate)" Foreground="#FF9CA3AF"/>
      <TextBox Name="GateIpBox" Background="#FF1A1A1D" Foreground="#FFEDEDED"
               BorderBrush="#FF3A3A41"/>
    </StackPanel>
    <StackPanel Grid.Row="3" Grid.Column="1" Margin="6,10,0,0">
      <TextBlock Text="IP del servidor STUN" Foreground="#FF9CA3AF"/>
      <TextBox Name="StunIpBox" Background="#FF1A1A1D" Foreground="#FFEDEDED"
               BorderBrush="#FF3A3A41"/>
    </StackPanel>

    <TextBlock Grid.Row="4" Grid.ColumnSpan="2" Margin="0,8,0,0" FontSize="11"
               Name="ServerNoteText" TextWrapping="Wrap" Foreground="#FF6B7280"/>

    <!-- Acciones principales -->
    <StackPanel Grid.Row="5" Grid.ColumnSpan="2" Margin="0,14,0,0" Orientation="Horizontal" HorizontalAlignment="Center">
      <Button Name="PlayOnlineBtn" Content="JUGAR ONLINE" Width="200" Height="38" Margin="6,0"
              Background="#FF16A34A" Foreground="#FF0A0A0B" FontWeight="Bold" BorderThickness="0"/>
      <Button Name="PlayOfflineBtn" Content="JUGAR OFFLINE" Width="200" Height="38" Margin="6,0"
              Background="#FF26262B" Foreground="#FFEDEDED" BorderBrush="#FF3A3A41"/>
    </StackPanel>

    <!-- Acciones secundarias -->
    <StackPanel Grid.Row="6" Grid.ColumnSpan="2" Margin="0,10,0,0" Orientation="Horizontal" HorizontalAlignment="Center">
      <Button Name="RestoreBtn" Content="Restaurar hosts" Width="190" Height="30" Margin="6,0"
              Background="#FF26262B" Foreground="#FF9CA3AF" BorderBrush="#FF3A3A41"
              ToolTip="Quita las entradas PES6-ONLINE del archivo hosts"/>
      <Button Name="UpdateServersBtn" Content="Actualizar servidores" Width="190" Height="30" Margin="6,0"
              Background="#FF26262B" Foreground="#FF9CA3AF" BorderBrush="#FF3A3A41"
              ToolTip="Descargar la lista de servidores actualizada desde la web"/>
    </StackPanel>

    <TextBlock Grid.Row="8" Grid.ColumnSpan="2" Name="StatusText"
               Margin="0,14,0,0" TextWrapping="Wrap" Foreground="#FF9CA3AF"/>
  </Grid>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)

$GameDirBox     = $window.FindName("GameDirBox")
$BrowseBtn      = $window.FindName("BrowseBtn")
$ServerCombo    = $window.FindName("ServerCombo")
$SignupBtn      = $window.FindName("SignupBtn")
$ServerNoteText = $window.FindName("ServerNoteText")
$GateIpBox      = $window.FindName("GateIpBox")
$StunIpBox      = $window.FindName("StunIpBox")
$PlayOnlineBtn  = $window.FindName("PlayOnlineBtn")
$PlayOfflineBtn = $window.FindName("PlayOfflineBtn")
$RestoreBtn     = $window.FindName("RestoreBtn")
$UpdateServersBtn = $window.FindName("UpdateServersBtn")
$StatusText     = $window.FindName("StatusText")

$cfg = Load-Config
$GameDirBox.Text = $cfg.gameDir

# ---------- Presets de servidor ----------
foreach ($s in $cfg.servers) { [void]$ServerCombo.Items.Add($s.name) }

function Select-Server($name) {
    $srv = $cfg.servers | Where-Object { $_.name -eq $name } | Select-Object -First 1
    if (-not $srv) { return }
    $GateIpBox.Text = $srv.gateIp
    $StunIpBox.Text = $srv.stunIp
    $ServerNoteText.Text = $srv.note
    $SignupBtn.Visibility = $(if ($srv.signupUrl) { "Visible" } else { "Collapsed" })
    $script:currentSignupUrl = $srv.signupUrl
}

$ServerCombo.Add_SelectionChanged({ Select-Server $ServerCombo.SelectedItem })

$SignupBtn.Add_Click({
    if ($script:currentSignupUrl) { Start-Process $script:currentSignupUrl }
})

$sel = [Math]::Max(0, [Array]::IndexOf(@($cfg.servers | ForEach-Object { $_.name }), $cfg.selectedServer))
$ServerCombo.SelectedIndex = $sel
if ($sel -ge 0) { Select-Server $ServerCombo.SelectedItem }

# Actualiza la lista de servidores desde la API de la plataforma web.
$UpdateServersBtn.Add_Click({
    $apiUrl = $cfg.serversUrl
    if (-not $apiUrl) {
        Set-Status "No hay URL de servidores configurada (serversUrl en launcher.config.json)." "#FFEAB308"
        return
    }
    try {
        $remote = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10
        if (-not $remote.servers) { throw "respuesta sin lista de servidores" }
        # Conservar IPs editadas a mano en presets existentes con el mismo nombre.
        foreach ($rs in $remote.servers) {
            $local = $cfg.servers | Where-Object { $_.name -eq $rs.name } | Select-Object -First 1
            if ($local -and $local.gateIp -and $rs.name -eq "Personalizado") { continue }
        }
        $cfg.servers = $remote.servers
        Save-Config $cfg
        $ServerCombo.Items.Clear()
        foreach ($s in $cfg.servers) { [void]$ServerCombo.Items.Add($s.name) }
        $ServerCombo.SelectedIndex = 0
        Select-Server $ServerCombo.SelectedItem
        Set-Status "Lista de servidores actualizada desde la web." "#FF4ADE80"
    } catch {
        Set-Status "No se pudo descargar la lista: $_" "#FFEF4444"
    }
})

function Set-Status($msg, $color = "#FF9CA3AF") {
    $StatusText.Text = $msg
    $StatusText.Foreground = $color
}

function Update-ConfigFromUi {
    $cfg.gameDir = $GameDirBox.Text.Trim()
    $cfg.selectedServer = $ServerCombo.SelectedItem
    # Guardar IPs editadas en el preset seleccionado (o en Personalizado).
    $srv = $cfg.servers | Where-Object { $_.name -eq $ServerCombo.SelectedItem } | Select-Object -First 1
    if ($srv) {
        $srv.gateIp = $GateIpBox.Text.Trim()
        $srv.stunIp = $StunIpBox.Text.Trim()
    }
    Save-Config $cfg
}

$BrowseBtn.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.SelectedPath = $GameDirBox.Text
    if ($dlg.ShowDialog() -eq "OK") { $GameDirBox.Text = $dlg.SelectedPath }
})

$PlayOnlineBtn.Add_Click({
    Update-ConfigFromUi
    $gateIp = $GateIpBox.Text.Trim()
    $stunIp = $StunIpBox.Text.Trim()
    if (-not $gateIp -or -not $stunIp) {
        Set-Status "Faltan las IPs del servidor gate y/o STUN." "#FFEAB308"; return
    }
    $exe = Find-GameExe $cfg
    if (-not $exe) {
        Set-Status "No se encontro PES6.exe/PECHCP.exe en $($cfg.gameDir)" "#FFEF4444"; return
    }
    if (-not (Elevate-IfNeeded)) { return }
    try {
        Set-OnlineHosts $gateIp $stunIp $cfg.gateHost $cfg.stunHost
        Start-Process $exe -WorkingDirectory $cfg.gameDir
        Set-Status "Hosts → $gateIp ($($cfg.gateHost)) / $stunIp ($($cfg.stunHost)). Juego lanzado. En la pantalla de red: usuario-contrasena." "#FF4ADE80"
    } catch {
        Set-Status "Error al escribir hosts: $_" "#FFEF4444"
    }
})

$PlayOfflineBtn.Add_Click({
    Update-ConfigFromUi
    $exe = Find-GameExe $cfg
    if (-not $exe) {
        Set-Status "No se encontro el ejecutable en $($cfg.gameDir)" "#FFEF4444"; return
    }
    if (Test-Admin) { try { Remove-ManagedBlock } catch {} }
    Start-Process $exe -WorkingDirectory $cfg.gameDir
    Set-Status "Juego lanzado en modo offline (hosts restaurado si habia permisos)." "#FF4ADE80"
})

$RestoreBtn.Add_Click({
    if (-not (Elevate-IfNeeded)) { return }
    try {
        Remove-ManagedBlock
        ipconfig /flushdns | Out-Null
        Set-Status "Entradas PES6-ONLINE eliminadas del archivo hosts." "#FF4ADE80"
    } catch {
        Set-Status "Error: $_" "#FFEF4444"
    }
})

$exe = Find-GameExe $cfg
Set-Status ($(if ($exe) { "Ejecutable detectado: $exe" } else { "AVISO: no se encontro el ejecutable del juego." }),
           $(if ($exe) { "#FF9CA3AF" } else { "#FFEAB308" }))

$window.ShowDialog() | Out-Null
