const fs = require('fs');
const path = require('path');

// 拆分后 app 代码在 hlhResouce/；部署镜像仍产出到 deploy/(server.js 服务 deploy/)
const APP = path.join(__dirname, 'hlhResouce');

function findSourceHtml() {
    const files = fs.readdirSync(APP);
    const htmlFiles = files.filter((name) => name.toLowerCase().endsWith('.html'));
    if (htmlFiles.length === 0) {
        throw new Error('No prototype HTML file found in ' + APP);
    }
    const prototypeFile = htmlFiles.find((name) => name.includes('原型图') && !name.includes('backup'));
    return path.join(APP, prototypeFile || htmlFiles.find((name) => name.includes('原型图')) || htmlFiles[0]);
}

const srcFile = findSourceHtml();
const deployDir = path.join(__dirname, 'deploy');
const destFile = path.join(deployDir, 'index.html');
// hlhResouce 下这些资源随 shell 一并镜像到 deploy/(保持 deploy/ 扁平结构不变)
const assetDirs = ['css', 'js'];               // 递归镜像
const assetFiles = ['inline-editor.js'];        // 单文件

function mirrorDir(name) {
    const from = path.join(APP, name);
    if (!fs.existsSync(from)) return;
    const to = path.join(deployDir, name);
    fs.rmSync(to, { recursive: true, force: true });   // 清掉旧切片，防止改名后残留
    fs.cpSync(from, to, { recursive: true });
}

function sync(reason) {
    fs.mkdirSync(deployDir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);
    assetDirs.forEach(mirrorDir);
    assetFiles.forEach((f) => {
        const from = path.join(APP, f);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(deployDir, f));
    });
    const now = new Date().toLocaleTimeString();
    console.log('[' + now + '] Auto deployed: ' + reason);
}

// 监听 shell + css/** + js/**(均在 hlhResouce/)的合并最新 mtime，任一变更即重部署
function combinedMtime() {
    let latest = 0;
    const stamp = (p) => { try { const m = fs.statSync(p).mtimeMs; if (m > latest) latest = m; } catch (e) {} };
    const walk = (dir) => {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full); else stamp(full);
        }
    };
    stamp(srcFile);
    assetDirs.forEach((d) => walk(path.join(APP, d)));
    assetFiles.forEach((f) => stamp(path.join(APP, f)));
    return latest;
}

sync('startup');
let lastMtime = combinedMtime();

console.log('[Auto Deploy] Watching for changes (hlhResouce: shell + css/ + js/)...');
console.log('[Auto Deploy] Source: ' + srcFile);
console.log('[Auto Deploy] Dest:   ' + destFile);

setInterval(() => {
    try {
        const mtime = combinedMtime();
        if (mtime !== lastMtime) {
            lastMtime = mtime;
            sync('file changed');
        }
    } catch (err) {
        console.error('[Auto Deploy] ' + (err && err.message ? err.message : err));
    }
}, 1000);
