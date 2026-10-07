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
    console.log('Testing static flow CSS for .XXcuqd...');

    await send('Runtime.evaluate', {
      expression: `(() => {
        let style = document.getElementById('test-static-flow');
        if (!style) {
          style = document.createElement('style');
          style.id = 'test-static-flow';
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
        \`;
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 200));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/TEST_STATIC_FLOW.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved TEST_STATIC_FLOW.png');

    process.exit(0);
  };
}

main().catch(console.error);
