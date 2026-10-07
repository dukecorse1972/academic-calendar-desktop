async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  const send = (method, params) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  ws.onopen = async () => {
    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const rows = document.querySelectorAll('.XXcuqd');
        return JSON.stringify(Array.from(rows).map(row => ({
          text: row.textContent.trim().slice(0, 30),
          dataset: row.dataset,
          display: window.getComputedStyle(row).display,
          parentHeight: row.parentElement?.offsetHeight,
          parentParentHeight: row.parentElement?.parentElement?.offsetHeight,
          parentParentStyle: row.parentElement?.parentElement ? window.getComputedStyle(row.parentElement.parentElement).height : null
        })));
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(JSON.parse(r.result.value), null, 2));
    process.exit(0);
  };
}

main().catch(console.error);
