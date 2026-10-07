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
            // Click on tab ENTREGAS_EXAMENES
            const tabEntregas = document.getElementById('gcal-side-tab-entregas');
            tabEntregas?.click();

            // Wait a tick and click creator button
            setTimeout(() => {
              const btn = document.getElementById('gcal-side-creator-btn');
              if (btn) btn.click();
            }, 100);

            return 'modal trigger sent';
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
      setTimeout(() => process.exit(0), 500);
    }
  };
}

main().catch(console.error);
