const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'deploy');
const port = Number(process.env.PORT || 8090);

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml; charset=utf-8'
};

function resolveFilePath(reqUrl) {
    const raw = String(reqUrl || '/').split('?')[0] || '/';
    let pathname = raw;
    try {
        pathname = new URL(raw, 'http://local').pathname;
    } catch (err) {
        pathname = raw;
    }

    try {
        pathname = decodeURIComponent(pathname);
    } catch (err) {
        pathname = '/';
    }

    pathname = pathname.replace(/^\/+/, '');
    if (!pathname) pathname = 'index.html';

    const normalized = path.normalize(pathname);
    if (path.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('..' + path.sep)) {
        return null;
    }
    return path.join(root, normalized);
}

const server = http.createServer((req, res) => {
    const filePath = resolveFilePath(req.url);
    const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;

    if (!filePath || (filePath !== root && !filePath.startsWith(rootPrefix))) {
        console.log('[HTTP 403]', req.method, req.url, '=>', filePath || '(null)');
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }
        res.writeHead(200, {
            'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log('[HTTP] Prototype server running at http://localhost:' + port + '/index.html');
});
