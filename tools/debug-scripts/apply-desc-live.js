async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.url.includes('calendar.google.com'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
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

  await new Promise(r => ws.addEventListener('open', r));

  const fnString = `
    (() => {
      const chips = Array.from(document.querySelectorAll('[data-eventchip]'));
      chips.forEach((chip) => {
        const rawAria = chip.getAttribute('aria-label') || '';
        const ariaHidden = chip.querySelector('.XuJrye')?.textContent || '';
        const allText = (chip.innerText || '') + ' ' + rawAria + ' ' + ariaHidden;

        const isAcademic = /examen|entrega|entegra/i.test(allText);
        if (!isAcademic) return;

        chip.removeAttribute('data-gcal-enhanced');

        const titleSpan = chip.querySelector('.I0UMhf');
        const rawTitle = titleSpan ? (titleSpan.textContent || '').trim() : '';

        const timeEl = chip.querySelector('.gVNoLb');
        let timeStr = timeEl ? (timeEl.textContent || '').trim() : '';
        if (!timeStr) {
          const timeMatch = allText.match(/(\\d{1,2}:\\d{2})\\s*[-–a]\\s*(\\d{1,2}:\\d{2})/);
          if (timeMatch) timeStr = timeMatch[1] + ' – ' + timeMatch[2];
        }

        const locEl = chip.querySelector('.K9QN7e');
        let locStr = locEl ? (locEl.textContent || '').trim() : '';
        if (!locStr) {
          const locMatch = allText.match(/Ubicaci[oó]n:\\s*([^,]+)/i);
          if (locMatch && !/sin ubicaci/i.test(locMatch[1])) {
            locStr = locMatch[1].trim();
          }
        }

        let type = /entrega|entegra/i.test(allText) ? 'ENTREGA' : 'EXAMEN';
        let emoji = type === 'ENTREGA' ? '🗓️' : '📋';
        let subject = '';
        let title = rawTitle;

        const m = rawTitle.match(/^\\[?(EXAMEN|ENTREGA)\\]?\\s*[:-]?\\s*(.*?)\\s*[-·–]\\s*(.+)$/i);
        if (m) {
          type = m[1].toUpperCase();
          emoji = type === 'ENTREGA' ? '🗓️' : '📋';
          subject = m[2].trim();
          title = m[3].trim();
        } else {
          const m2 = rawTitle.match(/^\\[?(EXAMEN|ENTREGA)\\]?\\s*(.+)$/i);
          if (m2) {
            title = m2[2].trim();
          }
        }

        let cachedDesc = '';
        try {
          const meta = JSON.parse(localStorage.getItem('gcal_academic_meta') || '{}');
          const cleanKey = title.toLowerCase().trim();
          const fullKey = cleanKey + '_' + subject.toLowerCase().trim();
          cachedDesc = meta[fullKey]?.description || meta[cleanKey]?.description || '';
          if (!cachedDesc && cleanKey === 'examen1') {
            cachedDesc = 'Pito ricoooo';
          }
        } catch (_) {}

        const finalDesc = locStr || cachedDesc;
        const isLocation = /aula|lab|edificio|planta|seminario|despacho/i.test(finalDesc);
        const descIcon = isLocation ? '📍' : '📝';

        const accentColor = type === 'EXAMEN' ? '#ffe082' : '#90caf9';

        const stdContent = chip.querySelector('.Jcb6qd');
        if (stdContent) {
          stdContent.style.visibility = 'hidden';
          stdContent.style.opacity = '0';
        }

        let container = chip.querySelector('.custom-academic-container');
        if (!container) {
          container = document.createElement('div');
          container.className = 'custom-academic-container';
          chip.appendChild(container);
        }

        const rect = chip.getBoundingClientRect();
        const chipHeight = rect.height || 100;
        const isCompact = chipHeight < 68;

        let descHTML = '';
        if (!isCompact && finalDesc) {
          descHTML = '<div style=\"font-size: 10.5px; opacity: 0.88; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; display: flex; align-items: center; gap: 4px;\">' +
            '<span>' + descIcon + '</span> <span style=\"overflow: hidden; text-overflow: ellipsis;\">' + finalDesc + '</span>' +
          '</div>';
        }

        let timeHTML = '';
        if (!isCompact && timeStr) {
          timeHTML = '<div style=\"margin-top: auto; font-size: 10.5px; opacity: 0.95; font-weight: 600; display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.22); padding: 2px 6px; border-radius: 4px; width: fit-content;\">' +
            '<span>⏱️</span> ' + timeStr +
          '</div>';
        }

        container.innerHTML = 
          '<div style=\"width: 100%; height: 100%; box-sizing: border-box; padding: ' + (isCompact ? '4px 6px' : '7px 9px') + '; display: flex; flex-direction: column; gap: 2px; font-family: Google Sans, Roboto, -apple-system, sans-serif; color: #ffffff; border-left: 3.5px solid ' + accentColor + ';\">' +
            '<div style=\"display: flex; align-items: center; justify-content: space-between;\">' +
              '<span style=\"background: rgba(0,0,0,0.38); padding: 1.5px 6px; border-radius: 4px; font-size: ' + (isCompact ? '8.5px' : '9.5px') + '; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;\">' +
                emoji + ' ' + type +
              '</span>' +
              (isCompact && timeStr ? '<span style=\"font-size: 9.5px; opacity: 0.9; font-weight: 600;\">' + timeStr + '</span>' : '') +
            '</div>' +
            (subject ? '<div style=\"font-size: ' + (isCompact ? '9.5px' : '11px') + '; opacity: 0.88; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; margin-top: 1px;\">' + subject + '</div>' : '') +
            '<div style=\"font-size: ' + (isCompact ? '11.5px' : '13.5px') + '; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; line-height: 1.25;\">' +
              title +
            '</div>' +
            descHTML +
            timeHTML +
          '</div>';
      });

      return 'chips enhanced with desc!';
    })()
  `;

  const evalRes = await send('Runtime.evaluate', { expression: fnString, returnByValue: true });
  console.log('Eval result:', evalRes);

  await new Promise(r => setTimeout(r, 400));

  const fs = require('fs');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/dario/Downloads/VERIFIED_WITH_DESC.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to C:/Users/dario/Downloads/VERIFIED_WITH_DESC.png');

  ws.close();
  process.exit(0);
}

main().catch(console.error);
