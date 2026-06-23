const fs = require('fs');
const path = require('path');

function findSourceHtml() {
    const files = fs.readdirSync(__dirname);
    const htmlFiles = files.filter((name) => name.toLowerCase().endsWith('.html'));
    if (htmlFiles.length === 0) {
        throw new Error('No prototype HTML file found in ' + __dirname);
    }
    const prototypeFile = htmlFiles.find((name) => name.includes('原型图'));
    return path.join(__dirname, prototypeFile || htmlFiles[0]);
}

const srcFile = findSourceHtml();
const destFile = path.join(__dirname, 'deploy', 'index.html');

function sync(reason) {
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.copyFileSync(srcFile, destFile);
    const now = new Date().toLocaleTimeString();
    console.log('[' + now + '] Auto deployed: ' + reason);
}

sync('startup');
let lastMtime = fs.statSync(srcFile).mtime.getTime();

console.log('[Auto Deploy] Watching for changes...');
console.log('[Auto Deploy] Source: ' + srcFile);
console.log('[Auto Deploy] Dest: ' + destFile);

setInterval(() => {
    try {
        const stat = fs.statSync(srcFile);
        const mtime = stat.mtime.getTime();
        if (mtime !== lastMtime) {
            lastMtime = mtime;
            sync('file changed');
        }
    } catch (err) {
        console.error('[Auto Deploy] ' + (err && err.message ? err.message : err));
    }
}, 1000);
