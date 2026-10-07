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
    const setTabAndSync = async (tabName) => {
      console.log(`Setting tab to ${tabName}...`);
      await send('Runtime.evaluate', {
        expression: `(() => {
          const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
          const isBirthday = (name) => /cumpleaño|birthday/i.test(name);
          const isOther = (name) => /task|tarea|festivo/i.test(name);
          const isClass = (name) => !isAcademic(name) && !isBirthday(name) && !isOther(name);

          const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
          checkboxes.forEach(cb => {
            const row = cb.closest('.XXcuqd') || cb.closest('li, [role="listitem"]');
            const name = cb.getAttribute('aria-label') || row?.textContent?.trim() || '';
            if (isBirthday(name)) {
              if (cb.checked) cb.click();
              return;
            }

            let shouldBeChecked = false;
            if ('${tabName}' === 'CLASES') {
              shouldBeChecked = isClass(name);
            } else if ('${tabName}' === 'ENTREGAS_EXAMENES') {
              shouldBeChecked = isAcademic(name);
            } else if ('${tabName}' === 'TODO') {
              shouldBeChecked = !isBirthday(name);
            }

            if (cb.checked !== shouldBeChecked) {
              cb.click();
            }
          });

          // Click header tab
          let btn = null;
          if ('${tabName}' === 'CLASES') btn = document.getElementById('gcal-hdr-tab-clases');
          if ('${tabName}' === 'ENTREGAS_EXAMENES') btn = document.getElementById('gcal-hdr-tab-entregas');
          if ('${tabName}' === 'TODO') btn = document.getElementById('gcal-hdr-tab-todo');
          if (btn) btn.click();
        })()`,
        returnByValue: true
      });
      await new Promise(r => setTimeout(r, 800));
    };

    // 1. Test CLASES
    await setTabAndSync('CLASES');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_CLASES_SYNC.png', Buffer.from(ss1.data, 'base64'));
    console.log('Saved TEST_CLASES_SYNC.png');

    // 2. Test TODO
    await setTabAndSync('TODO');
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_TODO_SYNC.png', Buffer.from(ss2.data, 'base64'));
    console.log('Saved TEST_TODO_SYNC.png');

    // 3. Return to CLASES
    await setTabAndSync('CLASES');

    process.exit(0);
  };
}

main().catch(console.error);
