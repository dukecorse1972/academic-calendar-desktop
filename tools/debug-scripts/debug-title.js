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
            const titleSpan = chip.querySelector('.I0UMhf');
            const rawTitle = titleSpan ? (titleSpan.textContent || '').trim() : '';
            const allText = (chip.innerText || '') + ' ' + (chip.getAttribute('aria-label') || '');

            const m = rawTitle.match(/^\\[?(EXAMEN|ENTREGA)\\]?\\s*[:-]?\\s*(.*?)\s*[-·–]\\s*(.+)$/i);
            const m2 = rawTitle.match(/^\\[?(EXAMEN|ENTREGA)\\]?\\s*(.+)$/i);

            return {
              rawTitle,
              allText,
              match1: m,
              match2: m2
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
