const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  let filePath = './public' + (req.url === '/' ? '/index.html' : req.url);
  let ext = path.extname(filePath);
  let contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css'
  }[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

const wss = new WebSocket.Server({ server });

function broadcastClientCount() {
  const message = JSON.stringify({
    type: 'clientCount',
    count: wss.clients.size
  });
  for (let client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  broadcastClientCount();

  ws.on('message', (message) => {
    // クライアントからの通常メッセージを全員にブロードキャスト
    for (let client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on('close', () => {
    broadcastClientCount();
  });
});

const PORT = 8080;
server.listen(PORT);
