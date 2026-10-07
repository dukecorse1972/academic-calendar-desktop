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
            const gbMd = document.querySelector('.gb_Md');
            const gbSd = document.querySelector('.gb_sd');
            return JSON.stringify({
              gbMdChildren: Array.from(gbMd?.children || []).map(c => ({
                tag: c.tagName,
                className: c.className,
                ariaLabel: c.getAttribute('aria-label') || c.querySelector('[aria-label]')?.getAttribute('aria-label'),
                width: c.offsetWidth,
                outerHTML: c.outerHTML.slice(0, 150)
              })),
              gbSdChildren: Array.from(gbSd?.children || []).map(c => ({
                tag: c.tagName,
                className: c.className,
                ariaLabel: c.getAttribute('aria-label') || c.querySelector('[aria-label]')?.getAttribute('aria-label'),
                width: c.offsetWidth,
                outerHTML: c.outerHTML.slice(0, 150)
              }))
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
