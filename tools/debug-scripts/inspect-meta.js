const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

async function main() {
  const exePath = path.resolve(__dirname, '..', 'release', 'win-unpacked', 'Google Calendar.exe');
  const cwd = path.dirname(exePath);

  const child = spawn(exePath, [], { cwd, stdio: 'ignore', detached: false });

  let page = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const list = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      page = list.find(x => x.type === 'page' && x.url.includes('calendar.google.com'));
      if (page) break;
    } catch (_) {}
  }

  if (!page) { process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const msgId = id++;
    const onMsg = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === msgId) {
        ws.removeEventListener('message', onMsg);
        if (m.error) rej(m.error); else res(m.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  await new Promise(r => ws.addEventListener('open', r));

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const meta = localStorage.getItem('gcal_academic_meta');
        const chips = Array.from(document.querySelectorAll('[data-eventchip]')).map(c => c.textContent);
        const ariaAll = Array.from(document.querySelectorAll('[aria-label*="2026"]')).map(a => a.getAttribute('aria-label'));
        return {
          meta,
          chips,
          ariaCount: ariaAll.length
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Inspection:', JSON.stringify(res.result.value, null, 2));

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
