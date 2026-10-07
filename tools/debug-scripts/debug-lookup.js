async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.url.includes('calendar.google.com'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const rawTitle = '[EXAMEN] 🖥️ Fundamentos de los Computadores - Examen1';
            const m = rawTitle.match(/^\\[?(EXAMEN|ENTREGA)\\]?\\s*[:-]?\\s*(.*?)\s*[-·–]\\s*(.+)$/i);
            const title = m ? m[3].trim() : rawTitle;
            const subject = m ? m[2].trim() : '';

            const metaStr = localStorage.getItem('gcal_academic_meta');
            const meta = JSON.parse(metaStr || '{}');
            const cleanKey = title.toLowerCase().trim();
            const fullKey = cleanKey + '_' + subject.toLowerCase().trim();

            const cachedDesc = meta[fullKey]?.description || meta[cleanKey]?.description || '';

            return {
              title,
              subject,
              cleanKey,
              fullKey,
              metaKeys: Object.keys(meta),
              cachedDesc
            };
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = (e) => {
    console.log(JSON.parse(e.data).result.result.value);
    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
