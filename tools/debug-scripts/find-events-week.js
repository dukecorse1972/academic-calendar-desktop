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

  // Switch to TODO tab to see all events across all calendars
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const tabs = Array.from(document.querySelectorAll('#gcal-tab-selector button'));
        const todoTab = tabs.find(b => b.textContent.includes('TODO'));
        if (todoTab) todoTab.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 2000));

  // Check chips in current week and next 4 weeks
  for (let w = 0; w < 6; w++) {
    const info = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header')?.innerText || document.title;
          const chips = Array.from(document.querySelectorAll('[data-eventchip]')).map(c => c.innerText.replace(/\\n/g, ' '));
          return { header, chips };
        })()
      `,
      returnByValue: true
    });
    console.log('Week ' + w + ':', info.result.value);

    if (info.result.value.chips.length > 0) {
      break;
    }

    // Click next week button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const nextBtn = document.querySelector('button[aria-label*="siguiente" i], button[aria-label*="next" i]');
          if (nextBtn) nextBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));
  }

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
