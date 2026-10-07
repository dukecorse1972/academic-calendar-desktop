async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const el = document.elementFromPoint(100, 550);
            return JSON.stringify({
              tag: el?.tagName,
              className: el?.className,
              id: el?.id,
              text: el?.textContent?.trim().slice(0, 100)
            });
          })()`,
          returnByValue: true
        }
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      console.log(JSON.stringify(JSON.parse(data.result.result.value), null, 2));
      process.exit(0);
    }
  };
}

main().catch(console.error);
