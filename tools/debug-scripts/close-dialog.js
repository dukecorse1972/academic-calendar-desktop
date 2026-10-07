async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.url.includes('calendar.google.com'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const closeBtn = document.querySelector('[role="dialog"] [aria-label*="Cerrar" i], [role="dialog"] button');
            if (closeBtn) closeBtn.click();
            return 'closed';
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = () => {
    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
