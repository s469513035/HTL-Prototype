# 远程 IIS 一键发布

把好利航原型（纯静态站）通过 **WinRM / PowerShell 远程**推送到远程 Windows Server 的指定文件夹，并可选自动配好 IIS 站点。远程**不需要装 Node**（只是静态托管，Tailwind/字体/QR 走 CDN，需服务器能出外网）。

## 文件

| 文件 | 作用 |
|---|---|
| `deploy-remote-iis.ps1` | 主脚本：推文件 + 可选配 IIS |
| `web.config` | 随站点一起发布（默认文档 index.html + UTF-8 MIME + 禁缓存）|
| `deploy-remote.config.example.json` | 配置模板 |
| `deploy-remote.config.json` | **你的真实配置（含密码，已 .gitignore，勿提交）** |

## 用法

### 1. 一键（推荐）
```powershell
# 复制模板并填写你的服务器信息
Copy-Item .\deploy-remote.config.example.json .\deploy-remote.config.json
notepad .\deploy-remote.config.json
# 发布
.\deploy-remote-iis.ps1
```

### 2. 命令行动态传参（覆盖 config，四个动态项都可传）
```powershell
.\deploy-remote-iis.ps1 -RemoteHost 10.0.0.9 -Username Administrator -Password 'P@ss!' -RemotePublishPath 'D:\sites\hlh' -Port 8080
```
不传 `-Password` 会弹窗安全输入。

### 3. 只测连通性，不改动任何东西
```powershell
.\deploy-remote-iis.ps1 -TestOnly
```

## 配置项

| 项 | 说明 | 默认 |
|---|---|---|
| `RemoteHost` | 远程地址（IP 或主机名）| 必填 |
| `Username` / `Password` | 远程管理员账号密码 | 必填 / 可弹窗 |
| `RemotePublishPath` | 发布到远程的文件夹 | 必填，如 `C:\inetpub\hlh-prototype` |
| `Port` | IIS 绑定端口 | 8080 |
| `SiteName` / `AppPoolName` | IIS 站点名 / 应用池名 | HLH-Prototype |
| `HostHeader` | 主机头（域名访问时填）| 空（按 IP+端口）|
| `UseSSL` | WinRM 走 HTTPS(5986) | false（HTTP 5985）|
| `ConfigureIIS` | 是否自动装/建 IIS 站点 | true。**设 false = 只推文件到目录**（站点你自己已配好）|
| `CleanTarget` | 发布前清空目标目录 | true |
| `OpenFirewall` | 远程放通该端口入站 | true |

## 前置条件 & 常见坑

1. **远程启用 PS 远程**：Windows Server 默认已开；否则远程【管理员】跑 `Enable-PSRemoting -Force`。
2. **TrustedHosts（工作组/IP 直连）**：本机【管理员】跑一次
   `Set-Item WSMan:\localhost\Client\TrustedHosts -Value '远程IP' -Concatenate -Force`
3. **本地管理员账号跨网络被 UAC 令牌过滤** → 远程装 IIS 报拒绝访问时，远程【管理员】设一次：
   `New-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System -Name LocalAccountTokenFilterPolicy -Value 1 -PropertyType DWord -Force`
   （用域管理员账号则无此问题。）
4. **WinRM 端口**：HTTP 5985 / HTTPS 5986 需在两端放通。
5. **外网访问**：如需公网访问，另在服务器所在网络做端口映射/反代，并注意安全。

## 只想更新内容（站点已建好）
把 `ConfigureIIS` 设为 `false`，脚本只清目录 + 推文件，秒级更新。

## 回滚
目标目录发布前会（可选）清空；如需保留历史，先关 `CleanTarget` 或自行备份目标目录。
