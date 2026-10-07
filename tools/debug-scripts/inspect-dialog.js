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
            const chip = document.querySelector('[data-eventchip]');
            if (!chip) return 'no chip';
            chip.click();
            return 'clicked';
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = async (e) => {
    const d = JSON.parse(e.data);
    if (d.id === 1) {
      console.log('Clicked chip, waiting for dialog...');
      await new Promise(r => setTimeout(r, 1000));
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              const dialog = document.querySelector('[role="dialog"]');
              if (!dialog) return 'no dialog';
              return {
                text: dialog.innerText,
                html: dialog.innerHTML.slice(0, 1500)
              };
            })()
          `,
          returnByValue: true
        }
      }));
    } else if (d.id === 2) {
      console.log('Dialog content:', JSON.stringify(d.result.result.value, null, 2));
      process.exit(0);
    }
  };
}

main().catch(console.error);
