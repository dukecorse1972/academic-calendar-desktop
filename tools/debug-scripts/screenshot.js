const fs = require('fs');

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        id: 1,
        method: 'Page.captureScreenshot',
        params: { format: 'png' }
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      const buffer = Buffer.from(data.result.data, 'base64');
      fs.writeFileSync('C:/Users/dario/Downloads/VERIFIED_VIEW.png', buffer);
      console.log('Screenshot saved to C:/Users/dario/Downloads/VERIFIED_VIEW.png');
      process.exit(0);
    }
  };
}

main().catch(console.error);
