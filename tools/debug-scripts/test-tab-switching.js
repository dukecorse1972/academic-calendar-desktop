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
    console.log('Testing EXÁMENES Y ENTREGAS tab click...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab="entregas"]');
        if (btn) btn.click();
        return !!btn;
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_ENTREGAS.png', Buffer.from(ss1.data, 'base64'));
    console.log('Saved TEST_ENTREGAS.png');

    console.log('Testing TODO tab click...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab="todo"]');
        if (btn) btn.click();
        return !!btn;
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_TODO.png', Buffer.from(ss2.data, 'base64'));
    console.log('Saved TEST_TODO.png');

    // Return back to CLASES
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab="clases"]');
        if (btn) btn.click();
        return !!btn;
      })()`,
      returnByValue: true
    });

    process.exit(0);
  };
}

main().catch(console.error);
