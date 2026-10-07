const fs = require('fs');

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find((p) => p.url.includes('calendar.google.com'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = () => {
    console.log('Connected to CDP');
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
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
  };

  // Wait for open
  await new Promise(r => setTimeout(r, 500));

  // Let's test modifying the event chip to Opción A, Opción B, Opción C
  const styles = `
    .custom-academic-event-chip {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 3px;
      font-family: 'Google Sans', Roboto, sans-serif;
      overflow: hidden;
      color: #fff;
    }
    .cae-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.25);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      width: fit-content;
    }
    .cae-subject {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.82);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }
    .cae-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cae-desc {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cae-time {
      font-size: 10.5px;
      color: rgba(255, 255, 255, 0.85);
      margin-top: auto;
      font-weight: 500;
    }
  `;

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        let styleTag = document.getElementById('custom-event-styles');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-event-styles';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = \`${styles}\`;
      })()
    `
  });

  console.log('Injected custom styles');
  process.exit(0);
}

main().catch(console.error);
