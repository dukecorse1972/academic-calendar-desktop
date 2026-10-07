const http = require('http');

async function run() {
  const list = await new Promise((res, rej) => http.get('http://127.0.0.1:9222/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));
  const page = list.find(x => x.type === 'page' && x.url.includes('calendar.google.com'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 1;
  const send = (method, params={}) => new Promise((res, rej) => {
    const cur = id++;
    const onMsg = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === cur) {
        ws.removeEventListener('message', onMsg);
        if (m.error) rej(m.error); else res(m.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
        return checkboxes.map(cb => {
          const row = cb.closest('.XXcuqd') || cb.closest('li, .DYTqTd, [role="listitem"]');
          const name = (cb.getAttribute('aria-label') || row?.textContent?.trim() || '').replace(/\\bmore_vert.*$/i, '').trim();
          const el = row?.querySelector('[style*="--checkbox-color"]');
          const style = el?.getAttribute('style') || '';
          const m = style.match(/--checkbox-color:\\s*([^;]+)/);
          return { name, color: m ? m[1].trim() : null };
        });
      })()
    `,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
