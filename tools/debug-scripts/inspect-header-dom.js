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
            const help = document.querySelector('[aria-label="Ayuda"], [aria-label="Help"]');
            let cur = help;
            const chain = [];
            for (let i = 0; i < 5 && cur; i++) {
              chain.push({
                tag: cur.tagName,
                className: cur.className,
                ariaLabel: cur.getAttribute('aria-label'),
                dataTooltip: cur.getAttribute('data-tooltip'),
                outerHTML: cur.outerHTML.slice(0, 100)
              });
              cur = cur.parentElement;
            }
            return JSON.stringify(chain);
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
