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

  if (!page) process.exit(1);

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

  await new Promise(r => setTimeout(r, 2000));

  // Let's search for "Entrega" in Google Calendar to find all entrega events!
  const searchInput = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Press '/' to focus search
        const searchBtn = document.querySelector('button[aria-label*="Buscar" i], button[aria-label*="Search" i]');
        if (searchBtn) searchBtn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  // Type "Entrega" and press Enter
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('input[aria-label*="Buscar" i], input[type="text"][placeholder*="Buscar" i], input.gb_te');
        if (input) {
          input.value = 'Entrega';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 3000));

  const searchResults = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rows = Array.from(document.querySelectorAll('[role="row"], [data-eventid], [data-eventchip], .g1QPYe, .vB54Ff'));
        return rows.map(r => r.innerText.replace(/\\n/g, ' -- ')).filter(Boolean);
      })()
    `,
    returnByValue: true
  });

  console.log('Search Results for Entrega:', searchResults.result.value);

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
