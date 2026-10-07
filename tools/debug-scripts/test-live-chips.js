const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

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

  // Wait 3s
  await new Promise(r => setTimeout(r, 3000));

  // Ensure checkboxes for Examenes and Entegras are checked
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
        checkboxes.forEach(cb => {
          const row = cb.closest('.XXcuqd') || cb.closest('li, .DYTqTd, [role="listitem"]');
          const name = cb.getAttribute('aria-label') || row?.textContent?.trim() || '';
          const isAcademic = /examen|entrega|entegra/i.test(name);
          const isChecked = cb instanceof HTMLInputElement ? cb.checked : cb.getAttribute('aria-checked') === 'true';
          if (isAcademic && !isChecked) {
            cb.click();
          }
        });
      })()
    `
  });

  // Wait 3s for events to load on grid
  await new Promise(r => setTimeout(r, 3000));

  // Check chips and trigger enhancement
  const inspectRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const adapter = window.gcalDesktopAPI?.adapter || window.GoogleCalendarAdapter?.instance;
        // Trigger enhanceAcademicChips directly if possible
        const chips = Array.from(document.querySelectorAll('[data-eventchip]'));
        return {
          chipCount: chips.length,
          chips: chips.map(c => ({
            text: c.innerText,
            enhanced: c.getAttribute('data-gcal-enhanced'),
            containerStyle: c.querySelector('.custom-academic-container')?.getAttribute('style'),
            containerHTML: c.querySelector('.custom-academic-container')?.innerHTML
          }))
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Grid Chips:', JSON.stringify(inspectRes.result.value, null, 2));

  // Scroll first chip into view
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chip = document.querySelector('[data-eventchip]');
        if (chip) chip.scrollIntoView({ block: 'center', behavior: 'instant' });
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dario/Downloads/VERIFIED_BADGE_PRO.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved to C:/Users/dario/Downloads/VERIFIED_BADGE_PRO.png');

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(console.error);
