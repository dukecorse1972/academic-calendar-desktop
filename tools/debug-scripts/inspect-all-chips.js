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

  // Switch to month view to see all events across the whole month!
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Press 'm' or click month view to see all chips
        const monthKeyEv = new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true });
        document.dispatchEvent(monthKeyEv);
      })()
    `
  });

  await new Promise(r => setTimeout(r, 2000));

  const allChips = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chips = Array.from(document.querySelectorAll('[data-eventchip], [role="button"]'));
        const academicChips = chips.filter(c => {
          const txt = c.textContent + ' ' + (c.getAttribute('aria-label') || '');
          return /examen|entrega|entegra/i.test(txt);
        });
        return academicChips.map(c => ({
          aria: c.getAttribute('aria-label'),
          text: c.innerText.replace(/\\n/g, ' -- '),
          enhanced: c.getAttribute('data-gcal-enhanced'),
          containerBg: c.querySelector('.custom-academic-container')?.style.backgroundColor,
          containerBorder: c.querySelector('.custom-academic-container')?.style.border,
          containerHTML: c.querySelector('.custom-academic-container')?.innerHTML
        }));
      })()
    `,
    returnByValue: true
  });

  console.log('All Academic Chips in Month view:');
  console.dir(allChips.result.value, { depth: 5 });

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
