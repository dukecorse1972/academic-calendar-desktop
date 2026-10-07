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
    const report = await send('Runtime.evaluate', {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll('.XXcuqd'));
        const info = rows.map(r => {
          const style = window.getComputedStyle(r);
          return {
            transition: style.transition,
            transform: style.transform,
            display: style.display,
            height: style.height,
            text: r.textContent.trim().slice(0, 30)
          };
        });

        // Also check parent of .XXcuqd
        const parent = rows[0]?.parentElement;
        const parentStyle = parent ? window.getComputedStyle(parent) : null;

        return JSON.stringify({
          rowsCount: rows.length,
          parentTransition: parentStyle?.transition,
          parentHeight: parentStyle?.height,
          rows: info
        });
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(JSON.parse(report.result.value), null, 2));
    process.exit(0);
  };
}

main().catch(console.error);
