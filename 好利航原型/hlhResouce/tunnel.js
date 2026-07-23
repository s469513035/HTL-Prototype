const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const localtunnel = require('localtunnel');

const port = Number(process.env.PORT || 8090);
const subdomain = process.env.PUBLIC_SUBDOMAIN || 'hlh-haolihang-clientdemo';
const fixedUrl = 'https://' + subdomain + '.loca.lt';
const addressFile = path.join(__dirname, '公网地址.txt');

let tunnel = null;
let reconnectTimer = null;
let healthTimer = null;

function now() {
  return new Date().toLocaleString();
}

function keepLocalServerWarm() {
  setInterval(() => {
    http.get('http://127.0.0.1:' + port + '/index.html', (res) => {
      res.resume();
    }).on('error', () => {});
  }, 30000);
}

function writeAddressFile() {
    const text = [
    '固定公网访问地址：',
    fixedUrl + '/index.html',
    '',
    '本地服务地址：',
    'http://localhost:' + port + '/index.html',
    '',
    '说明：',
    '1. 这个地址使用固定子域名 ' + subdomain + '.loca.lt。',
    '2. 需要保持本机、Node 服务和 tunnel.js 正在运行。',
    '3. 修改原型文件后，auto_deploy.js 会同步到 deploy/index.html，用户刷新固定地址即可看到最新效果。'
  ].join('\r\n');
  fs.writeFileSync(addressFile, '\ufeff' + text, 'utf8');
}

function printUrl() {
  console.log('');
  console.log('========================================');
  console.log('  Fixed Prototype Public URL');
  console.log('');
  console.log('  ' + fixedUrl + '/index.html');
  console.log('');
  console.log('========================================');
  console.log('');
}

function scheduleReconnect(reason) {
  if (reconnectTimer) return;
  const waitMs = 5000;
  console.log('[' + now() + '] Tunnel disconnected: ' + reason);
  console.log('[' + now() + '] Reconnecting in ' + waitMs / 1000 + 's...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, waitMs);
}

function restartTunnel(reason) {
  if (tunnel) {
    const activeTunnel = tunnel;
    tunnel = null;
    try { activeTunnel.close(); } catch (e) {}
  }
  scheduleReconnect(reason);
}

function startHealthCheck() {
  if (healthTimer) return;
  healthTimer = setInterval(() => {
    if (!tunnel || reconnectTimer) return;
    const req = https.get(fixedUrl + '/index.html', { timeout: 10000 }, (res) => {
      res.resume();
      if (res.statusCode !== 200) {
        console.log('[' + now() + '] Fixed URL health check failed with HTTP ' + res.statusCode);
        restartTunnel('health check failed');
      }
    });
    req.on('timeout', () => {
      req.destroy();
      console.log('[' + now() + '] Fixed URL health check timed out');
      restartTunnel('health check timeout');
    });
    req.on('error', (err) => {
      console.log('[' + now() + '] Fixed URL health check error: ' + (err && err.message ? err.message : err));
      restartTunnel('health check error');
    });
  }, 20000);
}

async function connect() {
  try {
    tunnel = await localtunnel({
      port,
      subdomain,
      local_host: '127.0.0.1'
    });

    if (tunnel.url !== fixedUrl) {
      const assignedUrl = tunnel.url;
      console.log('[' + now() + '] Requested fixed URL is not ready yet. Assigned: ' + assignedUrl);
      try { tunnel.close(); } catch (e) {}
      tunnel = null;
      scheduleReconnect('fixed subdomain unavailable');
      return;
    }

    writeAddressFile();
    printUrl();
    console.log('[' + now() + '] Tunnel connected: ' + tunnel.url);

    tunnel.on('close', () => {
      tunnel = null;
      scheduleReconnect('closed');
    });

    tunnel.on('error', (err) => {
      console.error('[' + now() + '] Tunnel error:', err && err.message ? err.message : err);
      if (tunnel) {
        try { tunnel.close(); } catch (e) {}
      }
      tunnel = null;
      scheduleReconnect('error');
    });
  } catch (err) {
    console.error('[' + now() + '] Failed to create fixed tunnel:', err && err.message ? err.message : err);
    scheduleReconnect('connect failed');
  }
}

process.on('SIGINT', () => {
  if (tunnel) tunnel.close();
  process.exit(0);
});

keepLocalServerWarm();
startHealthCheck();
connect();
