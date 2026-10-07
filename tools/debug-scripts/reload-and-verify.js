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
    console.log('Reloading page...');
    await send('Page.reload');

    console.log('Waiting 3.5 seconds for full initialization...');
    await new Promise(r => setTimeout(r, 3500));

    console.log('Taking screenshot...');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/dario/Downloads/VERIFIED_VIEW.png', Buffer.from(ss.data, 'base64'));
    console.log('Done! Saved to C:/Users/dario/Downloads/VERIFIED_VIEW.png');
    process.exit(0);
  };
}

main().catch(console.error);
