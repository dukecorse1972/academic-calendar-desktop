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
            const jcb = chip ? chip.querySelector('.Jcb6qd') : null;
            const xu = chip ? chip.querySelector('.XuJrye') : null;
            return {
              jcbDisplay: jcb ? window.getComputedStyle(jcb).display : null,
              jcbVis: jcb ? window.getComputedStyle(jcb).visibility : null,
              jcbOpacity: jcb ? window.getComputedStyle(jcb).opacity : null,
              xuVis: xu ? window.getComputedStyle(xu).visibility : null,
              xuDisplay: xu ? window.getComputedStyle(xu).display : null,
              chipBg: chip ? window.getComputedStyle(chip).backgroundColor : null
            };
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = (e) => {
    console.log(JSON.parse(e.data).result.result.value);
    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
