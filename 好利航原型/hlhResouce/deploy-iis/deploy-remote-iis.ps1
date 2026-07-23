<#
.SYNOPSIS
  好利航原型 -> 远程 Windows Server IIS 一键发布（纯静态站）。
.DESCRIPTION
  通过 WinRM / PowerShell 远程，把静态原型（index.html + css/ + js/ + inline-editor.js + web.config）
  推送到远程服务器的指定文件夹；并可选地在远程自动：装 IIS 静态功能 -> 建应用池/站点 -> 设权限 -> 放防火墙 -> 启动。
  远程地址 / 账号 / 密码 / 发布路径 均可动态配置：命令行参数优先，其次读同目录 deploy-remote.config.json。
.EXAMPLE
  # 用 config 文件（推荐，一键）
  .\deploy-remote-iis.ps1
.EXAMPLE
  # 命令行动态传参（覆盖 config）
  .\deploy-remote-iis.ps1 -RemoteHost 10.0.0.9 -Username Administrator -Password 'P@ss' -RemotePublishPath 'D:\sites\hlh' -Port 8080
.EXAMPLE
  # 只测连通性，不做任何更改
  .\deploy-remote-iis.ps1 -TestOnly
.NOTES
  前置条件：
  - 远程已启用 PS 远程（Windows Server 默认开；否则远程管理员跑 Enable-PSRemoting -Force）。
  - 工作组/IP 直连时，本机 TrustedHosts 需含目标（脚本会给出命令）。
  - 密码写进 config 时切勿提交 git（deploy-remote.config.json 已被 .gitignore 忽略）。
#>
[CmdletBinding()]
param(
  [string]$ConfigFile = "$PSScriptRoot\deploy-remote.config.json",
  [string]$RemoteHost,
  [string]$Username,
  [string]$Password,
  [string]$RemotePublishPath,
  [int]$Port,
  [string]$SiteName,
  [string]$AppPoolName,
  [string]$HostHeader,
  [string]$LocalAppRoot,
  [switch]$TestOnly,
  [switch]$SkipClientPrep
)

$ErrorActionPreference = 'Stop'
$session = $null
$sec = $null
function Step($m){ Write-Host "`n==== $m ====" -ForegroundColor Cyan }
function Log($m,$c='Gray'){ Write-Host ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m) -ForegroundColor $c }

# ---- 1. 读配置：config 文件为底，命令行参数覆盖 ----
$cfg = $null
if (Test-Path -LiteralPath $ConfigFile) {
    try { $cfg = Get-Content -LiteralPath $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json }
    catch { throw "配置文件解析失败: $ConfigFile -> $($_.Exception.Message)" }
}
$bound = $PSBoundParameters
function Val($name,$default){
    if ($bound.ContainsKey($name)) { return $bound[$name] }
    if ($cfg -and ($cfg.PSObject.Properties.Name -contains $name)) { return $cfg.$name }
    return $default
}

$RemoteHost        = Val 'RemoteHost' $RemoteHost
$Username          = Val 'Username' $Username
$Password          = Val 'Password' $Password
$RemotePublishPath = Val 'RemotePublishPath' $RemotePublishPath
$Port              = [int](Val 'Port' 8080)
$SiteName          = Val 'SiteName' 'HLH-Prototype'
$AppPoolName       = Val 'AppPoolName' 'HLH-Prototype'
$HostHeader        = [string](Val 'HostHeader' '')
$UseSSL            = [bool](Val 'UseSSL' $false)
$ConfigureIIS      = [bool](Val 'ConfigureIIS' $true)
$CleanTarget       = [bool](Val 'CleanTarget' $true)
$OpenFirewall      = [bool](Val 'OpenFirewall' $true)
$LocalAppRoot      = Val 'LocalAppRoot' ((Resolve-Path (Join-Path $PSScriptRoot '..')).Path)

# ---- 2. 校验参数与本地静态包 ----
Step '校验参数与本地静态包'
foreach ($k in 'RemoteHost','Username','RemotePublishPath') {
    if (-not (Get-Variable $k).Value) { throw "缺少必填项: $k（用命令行参数或 config 文件配置）" }
}
# 发布路径安全护栏：不是盘符根、不在 \Windows 下、至少两级
if ($RemotePublishPath -match '^[A-Za-z]:\\?$' -or $RemotePublishPath -match '(?i)\\Windows(\\|$)' -or (($RemotePublishPath.TrimEnd('\') -split '\\').Count -lt 2)) {
    throw "发布路径不安全或过浅：$RemotePublishPath（请指定明确站点目录，如 C:\inetpub\hlh-prototype）"
}

$shell = Get-ChildItem -LiteralPath $LocalAppRoot -Filter '*.html' |
         Where-Object { $_.Name -like '*原型图*' -and $_.Name -notlike '*backup*' } | Select-Object -First 1
if (-not $shell) { throw "在 $LocalAppRoot 找不到 shell（*原型图*.html）" }
foreach ($p in 'css','js','inline-editor.js') {
    if (-not (Test-Path (Join-Path $LocalAppRoot $p))) { throw "本地缺少 $p（应与 shell 同目录）" }
}
$jsCount = (Get-ChildItem (Join-Path $LocalAppRoot 'js') -Filter *.js).Count
$webConfig = Join-Path $PSScriptRoot 'web.config'
if (-not (Test-Path $webConfig)) { throw "缺少 web.config: $webConfig" }
Log ("本地包 OK: shell={0} | js={1} 个 | css/ | inline-editor.js | web.config" -f $shell.Name, $jsCount) Green
Log ("目标: {0} \\ {1}  ->  {2}:{3}  站点={4}  应用池={5}  配IIS={6}" -f $RemoteHost,$RemotePublishPath,$RemoteHost,$Port,$SiteName,$AppPoolName,$ConfigureIIS) Gray

# ---- 3. 凭据 ----
if ($Password) {
    $sec = ConvertTo-SecureString $Password -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential($Username, $sec)
} else {
    Log '未提供密码，弹窗输入' Yellow
    $cred = Get-Credential -UserName $Username -Message "远程服务器 $RemoteHost 凭据"
}

# ---- 3.5 本机 WinRM 客户端前置（尽力而为：启服务 + TrustedHosts）----
# 这两步需管理员；若已由管理员提前配好，此处非管理员运行会告警并跳过，连接交给下一步判定。
if (-not $UseSSL -and -not $SkipClientPrep) {
    try {
        $winrm = Get-Service WinRM -ErrorAction SilentlyContinue
        if ($winrm -and $winrm.Status -ne 'Running') { Log '启动本机 WinRM 客户端服务…' Yellow; Start-Service WinRM -ErrorAction Stop }
    } catch { Log "无法启动本机 WinRM 服务（需管理员；若已提前启用可忽略）：$($_.Exception.Message)" Yellow }
    try {
        $th = (Get-Item WSMan:\localhost\Client\TrustedHosts -ErrorAction SilentlyContinue).Value
        if ($th -ne '*' -and ($th -notmatch [regex]::Escape($RemoteHost))) {
            Log "把 $RemoteHost 加入本机 TrustedHosts…" Yellow
            Set-Item WSMan:\localhost\Client\TrustedHosts -Value $RemoteHost -Concatenate -Force -ErrorAction Stop
        }
    } catch { Log "无法设置 TrustedHosts（需管理员；若已提前配置可忽略）：$($_.Exception.Message)" Yellow }
}

# ---- 4. 连接 WinRM ----
Step ("连接远程 {0}（WinRM/{1}）" -f $RemoteHost, $(if($UseSSL){'HTTPS'}else{'HTTP'}))
$sp = @{ ComputerName = $RemoteHost; Credential = $cred; ErrorAction = 'Stop' }
if ($UseSSL) { $sp.UseSSL = $true; $sp.SessionOption = New-PSSessionOption -SkipCACheck -SkipCNCheck }
try {
    $session = New-PSSession @sp
} catch {
    Log "连接失败: $($_.Exception.Message)" Red
    Write-Host "排查方向：" -ForegroundColor Yellow
    Write-Host "  1) 工作组/IP 直连需把目标加入本机 TrustedHosts，【管理员】跑一次：" -ForegroundColor Yellow
    Write-Host "       Set-Item WSMan:\localhost\Client\TrustedHosts -Value '$RemoteHost' -Concatenate -Force" -ForegroundColor White
    Write-Host "  2) 远程未开 PS 远程：远程【管理员】跑 Enable-PSRemoting -Force" -ForegroundColor Yellow
    Write-Host "  3) 端口/防火墙：默认 HTTP 5985 / HTTPS 5986 需放通" -ForegroundColor Yellow
    Write-Host "  4) 账号密码或权限不足（本地管理员账号跨网络可能被 UAC 令牌过滤，见 README）" -ForegroundColor Yellow
    throw
}

try {
    $rinfo = Invoke-Command -Session $session -ScriptBlock {
        [pscustomobject]@{
            OS  = (Get-CimInstance Win32_OperatingSystem).Caption
            PS  = $PSVersionTable.PSVersion.ToString()
            IIS = [bool](Get-Service W3SVC -ErrorAction SilentlyContinue)
        }
    }
    Log ("远程: {0} | PS {1} | IIS已装={2}" -f $rinfo.OS, $rinfo.PS, $rinfo.IIS) Green

    if ($TestOnly) { Log '仅测试连接（-TestOnly），不做任何更改。' Yellow; return }

    # ---- 5. 准备远程目录 ----
    Step ("准备远程目录 {0}（清理旧内容={1}）" -f $RemotePublishPath, $CleanTarget)
    Invoke-Command -Session $session -ScriptBlock {
        param($p, $clean)
        if ($clean -and (Test-Path -LiteralPath $p)) { Get-ChildItem -LiteralPath $p -Force | Remove-Item -Recurse -Force }
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    } -ArgumentList $RemotePublishPath, $CleanTarget

    # ---- 6. 推送静态文件（shell 改名 index.html）----
    Step '推送静态文件'
    Copy-Item -LiteralPath $shell.FullName -Destination (Join-Path $RemotePublishPath 'index.html') -ToSession $session -Force
    Copy-Item -LiteralPath (Join-Path $LocalAppRoot 'css') -Destination $RemotePublishPath -ToSession $session -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $LocalAppRoot 'js')  -Destination $RemotePublishPath -ToSession $session -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $LocalAppRoot 'inline-editor.js') -Destination $RemotePublishPath -ToSession $session -Force
    Copy-Item -LiteralPath $webConfig -Destination (Join-Path $RemotePublishPath 'web.config') -ToSession $session -Force
    $remoteJs = Invoke-Command -Session $session -ScriptBlock { param($p) (Get-ChildItem -LiteralPath (Join-Path $p 'js') -Filter *.js -ErrorAction SilentlyContinue).Count } -ArgumentList $RemotePublishPath
    Log ("已推送: index.html + css/ + js/({0}) + inline-editor.js + web.config" -f $remoteJs) Green

    # ---- 7. 配置 IIS（可选）----
    if ($ConfigureIIS) {
        Step ("远程配置 IIS: 站点 {0} 绑定 :{1} -> {2}" -f $SiteName, $Port, $RemotePublishPath)
        $iisResult = Invoke-Command -Session $session -ScriptBlock {
            param($SitePath, $SiteName, $Port, $HostHeader, $AppPool, $OpenFw)
            $ErrorActionPreference = 'Stop'
            # 装 IIS 静态功能（Server 用 Install-WindowsFeature；客户端 OS 兜底 Enable-WindowsOptionalFeature）
            if (Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue) {
                Install-WindowsFeature Web-Server, Web-Static-Content, Web-Default-Doc, Web-Http-Errors, Web-Mgmt-Console | Out-Null
            } elseif (Get-Command Enable-WindowsOptionalFeature -ErrorAction SilentlyContinue) {
                Enable-WindowsOptionalFeature -Online -All -NoRestart -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-StaticContent, IIS-DefaultDocument | Out-Null
            }
            Import-Module WebAdministration
            # 应用池：无托管代码（纯静态）
            if (-not (Test-Path "IIS:\AppPools\$AppPool")) { New-WebAppPool -Name $AppPool | Out-Null }
            Set-ItemProperty "IIS:\AppPools\$AppPool" -Name managedRuntimeVersion -Value ''
            Set-ItemProperty "IIS:\AppPools\$AppPool" -Name startMode -Value 'AlwaysRunning'
            # 站点：不存在则建，存在则更新物理路径 + 绑定
            if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) {
                if ($HostHeader) { New-Website -Name $SiteName -PhysicalPath $SitePath -Port $Port -HostHeader $HostHeader -ApplicationPool $AppPool -Force | Out-Null }
                else             { New-Website -Name $SiteName -PhysicalPath $SitePath -Port $Port -ApplicationPool $AppPool -Force | Out-Null }
            } else {
                Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $SitePath
                Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPool
                Get-WebBinding -Name $SiteName | Remove-WebBinding
                if ($HostHeader) { New-WebBinding -Name $SiteName -Protocol http -Port $Port -HostHeader $HostHeader }
                else             { New-WebBinding -Name $SiteName -Protocol http -Port $Port }
            }
            # 权限：IIS_IUSRS 读
            & icacls $SitePath /grant "IIS_IUSRS:(OI)(CI)(RX)" /T | Out-Null
            # 防火墙（可选）
            if ($OpenFw -and (Get-Command New-NetFirewallRule -ErrorAction SilentlyContinue)) {
                $rn = "HLH-Prototype-$Port"
                if (-not (Get-NetFirewallRule -DisplayName $rn -ErrorAction SilentlyContinue)) {
                    New-NetFirewallRule -DisplayName $rn -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
                }
            }
            Start-WebAppPool -Name $AppPool -ErrorAction SilentlyContinue
            Start-Website -Name $SiteName -ErrorAction SilentlyContinue
            return "OK"
        } -ArgumentList $RemotePublishPath, $SiteName, $Port, $HostHeader, $AppPoolName, $OpenFirewall
        Log "IIS 配置完成 ($iisResult)" Green

        # ---- 8. 远程自测 ----
        Step '远程自测'
        $verify = Invoke-Command -Session $session -ScriptBlock {
            param($port)
            try {
                $r = Invoke-WebRequest "http://localhost:$port/index.html" -UseBasicParsing -TimeoutSec 20
                "HTTP {0} | {1} 个 <script src=js/> 标签" -f $r.StatusCode, ([regex]::Matches($r.Content, '<script src="js/')).Count
            } catch { "自测失败: $($_.Exception.Message)" }
        } -ArgumentList $Port
        Log $verify Green
    } else {
        Log '按配置跳过 IIS 配置（仅推送文件到目录）。' Yellow
    }

    Step '完成'
    $hostShown = if ($HostHeader) { $HostHeader } else { $RemoteHost }
    Write-Host ("  访问地址: http://{0}:{1}/" -f $hostShown, $Port) -ForegroundColor Green
    if ($HostHeader) { Write-Host "  （已配 HostHeader=$HostHeader，需把该域名 DNS/hosts 指向 $RemoteHost）" -ForegroundColor DarkGray }
}
finally {
    if ($session) { Remove-PSSession $session }
    if ($sec) { try { $sec.Dispose() } catch {} }
}
