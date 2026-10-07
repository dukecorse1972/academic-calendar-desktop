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

  if (!page) {
    console.error('No calendar page found');
    child.kill();
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(msg.error);
      else p.resolve(msg.result);
    }
  });

  await new Promise(r => ws.addEventListener('open', r));

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
        return checkboxes.map(cb => {
          const row = cb.closest('.XXcuqd') || cb.closest('li, .DYTqTd, [role="listitem"]');
          const name = cb.getAttribute('aria-label') || row?.textContent?.trim() || '';
          
          // Look for background color or fill on cb or its children/parents
          let color = '';
          const coloredEl = row ? row.querySelector('[style*="background"], [style*="color"], [style*="border"], svg, .u3bW4e, .Ce9Y1c, .KKc07b, .F263xd') : null;
          
          const cbStyle = cb.getAttribute('style') || '';
          const rowColoredEls = row ? Array.from(row.querySelectorAll('*')).map(el => {
            const cs = window.getComputedStyle(el);
            const styleAttr = el.getAttribute('style') || '';
            const fill = el.getAttribute('fill') || '';
            return {
              tag: el.tagName,
              cls: el.className,
              styleAttr,
              fill,
              bg: cs.backgroundColor,
              color: cs.color,
              borderColor: cs.borderColor
            };
          }).filter(x => (x.bg && x.bg !== 'rgba(0, 0, 0, 0)') || x.fill || x.styleAttr) : [];

          return {
            name,
            rowColoredEls
          };
        });
      })()
    `,
    returnByValue: true
  });

  console.log('Detected calendar color details:');
  console.dir(res.result.value, { depth: 4 });

  ws.close();
  child.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
