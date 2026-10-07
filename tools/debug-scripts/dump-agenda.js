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

  // Switch to Schedule / Agenda view ('a' key) so ALL events across the entire year are listed in a single list!
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const agendaKey = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', bubbles: true });
        document.dispatchEvent(agendaKey);
      })()
    `
  });

  await new Promise(r => setTimeout(r, 2000));

  const allAgendaEvents = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rows = Array.from(document.querySelectorAll('[data-eventid], [data-eventchip], [role="row"], .g1QPYe, .vB54Ff, .Yv02Pd'));
        return rows.map(r => ({
          text: r.innerText.replace(/\\n/g, ' -- '),
          aria: r.getAttribute('aria-label')
        })).filter(x => x.text && x.text.length > 3);
      })()
    `,
    returnByValue: true
  });

  console.log('All Events in Agenda View:');
  console.dir(allAgendaEvents.result.value, { depth: 5 });

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
