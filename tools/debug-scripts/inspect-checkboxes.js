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
            const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
            return JSON.stringify(checkboxes.map(cb => {
              const row = cb.closest('.XXcuqd') || cb.closest('li, [role="listitem"]');
              return {
                tag: cb.tagName,
                ariaLabel: cb.getAttribute('aria-label'),
                checked: cb.checked !== undefined ? cb.checked : cb.getAttribute('aria-checked'),
                rowText: row?.textContent?.trim().slice(0, 40),
                rowDisplay: row ? window.getComputedStyle(row).display : null,
                cbOuterHTML: cb.outerHTML.slice(0, 150)
              };
            }));
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
