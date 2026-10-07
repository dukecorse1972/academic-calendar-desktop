const http = require('http');

async function run() {
  const list = await new Promise((res, rej) => http.get('http://127.0.0.1:9222/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));
  const page = list.find(x => x.type === 'page' && x.url.includes('calendar.google.com'));
  if (!page) {
    console.log('No page found');
    return;
  }
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
        const chip = document.querySelector('[data-eventchip]');
        if (!chip) return 'No chip found';
        const children = Array.from(chip.children).map(c => ({
          tag: c.tagName,
          className: c.className,
          style: c.getAttribute('style'),
          text: c.innerText
        }));
        return {
          chipClass: chip.className,
          chipStyle: chip.getAttribute('style'),
          children
        };
      })()
    `,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
