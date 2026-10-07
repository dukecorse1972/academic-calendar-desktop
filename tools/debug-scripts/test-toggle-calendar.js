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
    console.log('Testing checkbox click...');
    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const cb = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(c => 
          c.getAttribute('aria-label')?.includes('Fundamentos de los Computadores')
        );
        if (!cb) return 'not found';
        const before = cb.checked;
        cb.click();
        const after = cb.checked;
        return { before, after };
      })()`,
      returnByValue: true
    });

    console.log('Click result:', result.result.value);

    // Click it again to restore
    await send('Runtime.evaluate', {
      expression: `(() => {
        const cb = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(c => 
          c.getAttribute('aria-label')?.includes('Fundamentos de los Computadores')
        );
        if (cb && !cb.checked) cb.click();
      })()`,
      returnByValue: true
    });

    process.exit(0);
  };
}

main().catch(console.error);
