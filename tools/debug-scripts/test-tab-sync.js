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
    console.log('Testing switching to ENTREGAS_EXAMENES with checkbox synchronization...');
    
    await send('Runtime.evaluate', {
      expression: `(() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
        
        const isAcademic = (name) => /examen|entrega|entegra/i.test(name);
        const isBirthday = (name) => /cumpleaño|birthday/i.test(name);

        checkboxes.forEach(cb => {
          const row = cb.closest('.XXcuqd') || cb.closest('li, [role="listitem"]');
          const name = cb.getAttribute('aria-label') || row?.textContent?.trim() || '';
          
          if (isBirthday(name)) {
            if (cb.checked) cb.click();
            return;
          }

          const shouldBeChecked = isAcademic(name);
          if (cb.checked !== shouldBeChecked) {
            cb.click();
          }
        });

        // Also trigger tab button styling
        const tab = document.getElementById('gcal-hdr-tab-entregas');
        if (tab) tab.click();

        return 'synchronized';
      })()`,
      returnByValue: true
    });

    console.log('Waiting 1 second for calendar grid to update...');
    await new Promise(r => setTimeout(r, 1000));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_ONLY_ACADEMIC.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved to C:/Users/dario/Downloads/TEST_ONLY_ACADEMIC.png');

    process.exit(0);
  };
}

main().catch(console.error);
