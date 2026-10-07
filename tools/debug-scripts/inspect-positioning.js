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
        const row = document.querySelector('.XXcuqd');
        const style = window.getComputedStyle(row);
        const parent = row.parentElement;
        const parentStyle = window.getComputedStyle(parent);

        return JSON.stringify({
          row: {
            position: style.position,
            top: style.top,
            left: style.left,
            height: style.height,
            display: style.display,
            boxSizing: style.boxSizing
          },
          parent: {
            position: parentStyle.position,
            height: parentStyle.height,
            overflow: parentStyle.overflow,
            display: parentStyle.display
          }
        });
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(JSON.parse(report.result.value), null, 2));
    process.exit(0);
  };
}

main().catch(console.error);
