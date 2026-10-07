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
            const tabEntregas = document.getElementById('gcal-side-tab-entregas');
            if (tabEntregas) {
              tabEntregas.click();
              return 'clicked';
            }
            return 'not found';
          })()`,
          returnByValue: true
        }
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      console.log('Result:', data.result.result.value);
      process.exit(0);
    }
  };
}

main().catch(console.error);
