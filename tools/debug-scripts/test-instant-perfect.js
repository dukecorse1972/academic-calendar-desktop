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
    console.log('Testing instant CSS rules with display block & none !important...');

    await send('Runtime.evaluate', {
      expression: `(() => {
        let style = document.getElementById('test-instant-flow-perfect');
        if (!style) {
          style = document.createElement('style');
          style.id = 'test-instant-flow-perfect';
          document.head.appendChild(style);
        }
        style.textContent = \`
          /* 1. Static natural flow & zero transition lag */
          .XXcuqd {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            transition: none !important;
          }
          div:has(> .XXcuqd) {
            height: auto !important;
            transition: none !important;
          }

          /* 2. Birthday always hidden */
          .XXcuqd[data-gcal-type="birthday"] {
            display: none !important;
          }

          /* 3. Instant CSS tab filtering */
          body[data-gcal-tab="CLASES"] .XXcuqd[data-gcal-type="class"] {
            display: block !important;
          }
          body[data-gcal-tab="CLASES"] .XXcuqd:not([data-gcal-type="class"]) {
            display: none !important;
          }

          body[data-gcal-tab="ENTREGAS_EXAMENES"] .XXcuqd[data-gcal-type="academic"] {
            display: block !important;
          }
          body[data-gcal-tab="ENTREGAS_EXAMENES"] .XXcuqd:not([data-gcal-type="academic"]) {
            display: none !important;
          }

          body[data-gcal-tab="TODO"] .XXcuqd:not([data-gcal-type="birthday"]) {
            display: block !important;
          }
          body[data-gcal-tab="TODO"] .XXcuqd[data-gcal-type="birthday"] {
            display: none !important;
          }
        \`;

        // Tag all rows
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
        const isOther = (name) => /task|tarea|festivo/i.test(name);

        document.querySelectorAll('.XXcuqd').forEach(r => {
          const text = r.textContent || '';
          if (isBirthday(text)) {
            r.setAttribute('data-gcal-type', 'birthday');
          } else if (isAcademic(text)) {
            r.setAttribute('data-gcal-type', 'academic');
          } else if (isOther(text)) {
            r.setAttribute('data-gcal-type', 'other');
          } else {
            r.setAttribute('data-gcal-type', 'class');
          }
        });

        // Set tab to ENTREGAS_EXAMENES
        document.body.setAttribute('data-gcal-tab', 'ENTREGAS_EXAMENES');

        return 'tagged and set to ENTREGAS_EXAMENES';
      })()`,
      returnByValue: true
    });

    // Capture immediately
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_INSTANT_PERFECT_ENTREGAS.png', Buffer.from(ss1.data, 'base64'));
    console.log('Saved TEST_INSTANT_PERFECT_ENTREGAS.png');

    // Set tab to TODO
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.setAttribute('data-gcal-tab', 'TODO');
      })()`,
      returnByValue: true
    });

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_INSTANT_PERFECT_TODO.png', Buffer.from(ss2.data, 'base64'));
    console.log('Saved TEST_INSTANT_PERFECT_TODO.png');

    // Set tab to CLASES
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.setAttribute('data-gcal-tab', 'CLASES');
      })()`,
      returnByValue: true
    });

    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_INSTANT_PERFECT_CLASES.png', Buffer.from(ss3.data, 'base64'));
    console.log('Saved TEST_INSTANT_PERFECT_CLASES.png');

    process.exit(0);
  };
}

main().catch(console.error);
