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
            const chips = Array.from(document.querySelectorAll('[data-eventchip]'));
            return chips.map(c => ({
              text: c.innerText,
              aria: c.getAttribute('aria-label'),
              enhanced: c.getAttribute('data-gcal-enhanced'),
              containerHTML: c.querySelector('.custom-academic-container')?.innerHTML || null
            }));
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id === 1) {
      console.log('Result:', JSON.stringify(d.result.result.value, null, 2));
      process.exit(0);
    }
  };
}

main().catch(console.error);
