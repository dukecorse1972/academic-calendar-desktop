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
    console.log('Testing instant flow layout...');

    // 1. Inject comprehensive instant CSS
    await send('Runtime.evaluate', {
      expression: `(() => {
        let style = document.getElementById('test-instant-flow-final');
        if (!style) {
          style = document.createElement('style');
          style.id = 'test-instant-flow-final';
          document.head.appendChild(style);
        }
        style.textContent = \`
          /* 1. Disable transforms and transitions on calendar rows for 0ms lag */
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

          /* 3. Pure instantaneous CSS tab filtering */
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

        // 2. Tag all rows by type and remove any inline display/transform
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
        const isOther = (name) => /task|tarea|festivo/i.test(name);

        const tagAll = () => {
          document.querySelectorAll('.XXcuqd').forEach(r => {
            r.style.display = '';
            r.style.transform = '';
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
        };

        tagAll();
        document.body.setAttribute('data-gcal-tab', 'CLASES');

        return 'tagged';
      })()`,
      returnByValue: true
    });

    console.log('Switching to ENTREGAS_EXAMENES...');
    const t0 = Date.now();
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.setAttribute('data-gcal-tab', 'ENTREGAS_EXAMENES');
        // sync checkboxes
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          const row = cb.closest('.XXcuqd');
          if (!row) return;
          const text = row.textContent || '';
          if (isBirthday(text)) {
            if (cb.checked) cb.click();
            return;
          }
          const should = isAcademic(text);
          if (cb.checked !== should) cb.click();
        });
      })()`,
      returnByValue: true
    });

    // Capture screenshot IMMEDIATELY (no sleep!)
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_ZERO_LAG_ENTREGAS.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved TEST_ZERO_LAG_ENTREGAS.png in', Date.now() - t0, 'ms');

    // Switch back to CLASES
    const t1 = Date.now();
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.setAttribute('data-gcal-tab', 'CLASES');
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
        const isOther = (name) => /task|tarea|festivo/i.test(name);
        const isClass = (name) => !isAcademic(name) && !isBirthday(name) && !isOther(name);
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          const row = cb.closest('.XXcuqd');
          if (!row) return;
          const text = row.textContent || '';
          if (isBirthday(text)) {
            if (cb.checked) cb.click();
            return;
          }
          const should = isClass(text);
          if (cb.checked !== should) cb.click();
        });
      })()`,
      returnByValue: true
    });

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_ZERO_LAG_CLASES.png', Buffer.from(ss2.data, 'base64'));
    console.log('Saved TEST_ZERO_LAG_CLASES.png in', Date.now() - t1, 'ms');

    process.exit(0);
  };
}

main().catch(console.error);
