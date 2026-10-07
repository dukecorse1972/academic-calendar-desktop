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
    console.log('Injecting instant CSS and tagging rows...');

    await send('Runtime.evaluate', {
      expression: `(() => {
        let style = document.getElementById('test-instant-filter');
        if (!style) {
          style = document.createElement('style');
          style.id = 'test-instant-filter';
          document.head.appendChild(style);
        }
        style.textContent = \`
          .XXcuqd {
            position: static !important;
            transform: none !important;
            transition: none !important;
          }
          div:has(> .XXcuqd) {
            height: auto !important;
            transition: none !important;
          }
          .XXcuqd[data-gcal-type="birthday"] {
            display: none !important;
          }
          body[data-gcal-tab="CLASES"] .XXcuqd:not([data-gcal-type="class"]) {
            display: none !important;
          }
          body[data-gcal-tab="ENTREGAS_EXAMENES"] .XXcuqd:not([data-gcal-type="academic"]) {
            display: none !important;
          }
          body[data-gcal-tab="TODO"] .XXcuqd[data-gcal-type="birthday"] {
            display: none !important;
          }
        \`;

        // Tag all rows
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
        const isOther = (name) => /task|tarea|festivo/i.test(name);

        const rows = document.querySelectorAll('.XXcuqd');
        rows.forEach(r => {
          const text = r.textContent || '';
          if (isBirthday(text)) {
            r.dataset.gcalType = 'birthday';
          } else if (isAcademic(text)) {
            r.dataset.gcalType = 'academic';
          } else if (isOther(text)) {
            r.dataset.gcalType = 'other';
          } else {
            r.dataset.gcalType = 'class';
          }
        });

        // Set body tab
        document.body.dataset.gcalTab = 'ENTREGAS_EXAMENES';

        return Array.from(rows).map(r => ({
          type: r.dataset.gcalType,
          text: r.textContent.trim().slice(0, 30),
          display: window.getComputedStyle(r).display
        }));
      })()`,
      returnByValue: true
    });

    // Check right away (10ms!)
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_INSTANT_ENTREGAS.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved TEST_INSTANT_ENTREGAS.png');

    // Switch to CLASES instantly
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.dataset.gcalTab = 'CLASES';
      })()`,
      returnByValue: true
    });

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_INSTANT_CLASES.png', Buffer.from(ss2.data, 'base64'));
    console.log('Saved TEST_INSTANT_CLASES.png');

    process.exit(0);
  };
}

main().catch(console.error);
