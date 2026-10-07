const http = require('http');

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    // Inspect DOM for events
    const code = `
      (() => {
        const el = document.querySelector('[data-eventchip]');
        if (!el) return null;
        return {
          innerHTML: el.innerHTML,
          innerText: el.innerText,
          classes: el.className,
          computedStyle: {
            padding: window.getComputedStyle(el).padding,
            fontSize: window.getComputedStyle(el).fontSize,
            lineHeight: window.getComputedStyle(el).lineHeight
          }
        };
      })()
    `;

    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: code, returnByValue: true }
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      console.log('Result:', JSON.stringify(data.result.result.value, null, 2));
      process.exit(0);
    }
  };
}

main().catch(console.error);
