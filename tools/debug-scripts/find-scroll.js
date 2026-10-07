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
        // Find main grid scroll container
        const all = Array.from(document.querySelectorAll('*'));
        const scrollable = all.find(el => {
          const style = window.getComputedStyle(el);
          return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight && el.clientHeight > 300;
        });
        if (scrollable) {
          scrollable.scrollTop = 450;
          return { found: true, tag: scrollable.tagName, cls: scrollable.className, scrollTop: scrollable.scrollTop };
        }
        return { found: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Scrollable check:', res.result.value);
  ws.close();
}
run().catch(console.error);
