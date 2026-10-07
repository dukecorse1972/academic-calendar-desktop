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
            // Save in localStorage
            let meta = {};
            try {
              meta = JSON.parse(localStorage.getItem('gcal_academic_meta') || '{}');
            } catch (_) {}
            meta['examen1'] = { description: 'Pito ricoooo' };
            localStorage.setItem('gcal_academic_meta', JSON.stringify(meta));

            // Force re-enhancement
            const chip = document.querySelector('[data-eventchip]');
            if (!chip) return 'no chip';
            chip.removeAttribute('data-gcal-enhanced');

            // Find adapter and call enhance
            const adapter = window.__gcalAdapter || null;
            return 'meta saved, will re-enhance';
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = (e) => {
    console.log(JSON.parse(e.data));
    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
