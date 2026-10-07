const fs = require('fs');

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  const send = (method, params) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  ws.onopen = async () => {
    console.log('Applying test CSS rules...');

    const cssToInject = `
      /* 1. Header: Help button (?) */
      .bMWlzf:has([aria-label="Ayuda"]),
      .bMWlzf:has([aria-label="Help"]),
      .bMWlzf[data-tooltip="Ayuda"],
      .bMWlzf[data-tooltip="Help"],
      #M842Cd {
        display: none !important;
      }

      /* 2. Header: Google Apps launcher (:::) */
      #gbwa,
      .gb_sd:has(#gbwa),
      .gb_sd:has([aria-label*="Google apps" i]),
      .gb_sd:has([aria-label*="Aplicaciones de Google" i]) {
        display: none !important;
      }

      /* 3. Sidebar: Buscar a gente */
      .qXIcZc.ZtL5hd,
      .qXIcZc:has([aria-label*="Buscar a gente" i]),
      .qXIcZc:has([aria-label*="Search for people" i]) {
        display: none !important;
      }

      /* 4. Sidebar: Páginas de reserva */
      .qOsM1d.f477s,
      .qOsM1d:has([aria-label*="Páginas de reserva" i]),
      .qOsM1d:has(.az313e) {
        display: none !important;
      }

      /* 5. Sidebar: Otros calendarios (header, divider & list) */
      .qZvm2d-clz4Ic,
      .GSVYRe:has([aria-label*="Otros calendarios" i]),
      .GSVYRe:has(.aIwHYe),
      #tkQpTb,
      [jsname="tkQpTb"] {
        display: none !important;
      }

      /* 6. Sidebar footer: Términos – Privacidad */
      .erDb5d,
      .erDb5d:has(a[href*="terms"]),
      .erDb5d:has(a[href*="privacy"]) {
        display: none !important;
      }
    `;

    await send('Runtime.evaluate', {
      expression: `(() => {
        let style = document.getElementById('test-cleanup-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'test-cleanup-style';
          document.head.appendChild(style);
        }
        style.textContent = ${JSON.stringify(cssToInject)};
        return 'Style injected successfully';
      })()`,
      returnByValue: true
    });

    console.log('Capturing screenshot...');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_CLEANUP.png', buffer);
    console.log('Saved to C:/Users/dario/Downloads/TEST_CLEANUP.png');
    process.exit(0);
  };
}

main().catch(console.error);
