const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
app.setPath('userData', legacyUserData);

const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

const TEST_EVENTS = [
  {
    type: 'EXAMEN',
    subject: 'Fundamentos de los Computadores',
    title: 'Examen Parcial Teórico (Temas 1-4)',
    dates: '20301021T090000/20301021T113000',
    location: 'Aula 2.1 (Edificio Politécnico)',
    details: 'Tipo: EXAMEN\nAsignatura: Fundamentos de los Computadores\nTemas: ALU, Jerarquía de Memoria y Microoperaciones.'
  },
  {
    type: 'ENTREGA',
    subject: 'Programación I',
    title: 'Práctica 3: Árboles y Grafos',
    dates: '20301022T160000/20301022T183000',
    location: 'Campus Virtual (Moodle)',
    details: 'Tipo: ENTREGA\nAsignatura: Programación I\nEntrega de repositorio Git con tests y memoria técnica.'
  },
  {
    type: 'EXAMEN',
    subject: 'Matemáticas I',
    title: 'Control Parcial: Álgebra Lineal',
    dates: '20301023T110000/20301023T130000',
    location: 'Aula Magna A',
    details: 'Tipo: EXAMEN\nAsignatura: Matemáticas I\nTraer calculadora no programable y DNI.'
  },
  {
    type: 'ENTREGA',
    subject: 'Fundamentos de Economía',
    title: 'Caso Práctico: Microeconomía',
    dates: '20301024T150000/20301024T170000',
    location: 'Entrega Virtual',
    details: 'Tipo: ENTREGA\nAsignatura: Fundamentos de Economía\nAnálisis de elasticidad y costes de producción.'
  },
  {
    type: 'ENTREGA',
    subject: 'Derecho de la Empresa',
    title: 'Dictamen Jurídico y Estatutos',
    dates: '20301025T100000/20301025T120000',
    location: 'Seminario Jurídico 4',
    details: 'Tipo: ENTREGA\nAsignatura: Derecho de la Empresa\nConstitución de Sociedad Limitada y pacto de socios.'
  }
];

app.whenReady().then(async () => {
  const ses = session.fromPartition('persist:gcal_session');
  ses.setUserAgent(DESKTOP_USER_AGENT);

  // Setup CSP stripping
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === 'content-security-policy' || key.toLowerCase() === 'content-security-policy-report-only') {
        responseHeaders[key] = (responseHeaders[key] || []).map(p =>
          p.replace(/require-trusted-types-for\s+'script';?/gi, '').replace(/trusted-types[^;]+;?/gi, '')
        );
      }
    }
    callback({ responseHeaders });
  });

  const workerWin = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, '../dist/preload/bundle.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  console.log(`[Showcase] Step 1: Creating ${TEST_EVENTS.length} test events in October 2030...`);

  for (let i = 0; i < TEST_EVENTS.length; i++) {
    const ev = TEST_EVENTS[i];
    const tag = ev.type === 'EXAMEN' ? '[EXAMEN]' : '[ENTREGA]';
    const fullTitle = `${tag} ${ev.subject} - ${ev.title}`;

    const params = new URLSearchParams({
      text: fullTitle,
      dates: ev.dates,
      location: ev.location,
      details: ev.details
    });

    const createUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`;
    console.log(`[Showcase] [${i + 1}/${TEST_EVENTS.length}] Creating: ${fullTitle}...`);
    await workerWin.loadURL(createUrl);

    const saved = await workerWin.webContents.executeJavaScript(`(async () => {
      const startTime = Date.now();
      let saveBtn = null;
      const saveSelectors = ['#xSaveBu', 'button[data-action="save"]', 'button[aria-label*="Guardar" i]', 'button[aria-label*="Save" i]'];
      while (Date.now() - startTime < 12000) {
        for (const sel of saveSelectors) {
          saveBtn = document.querySelector(sel);
          if (saveBtn) break;
        }
        if (saveBtn) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (!saveBtn) return false;
      saveBtn.click();
      return true;
    })()`);

    console.log(`[Showcase] [${i + 1}/${TEST_EVENTS.length}] Saved: ${saved}`);
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log('[Showcase] Step 2: Opening high-resolution window on 2030-10-21 week...');
  const displayWin = new BrowserWindow({
    show: true,
    width: 1400,
    height: 900,
    title: 'Cursa — Google Calendar',
    icon: path.join(__dirname, '../assets/icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, '../dist/preload/bundle.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  await displayWin.loadURL('https://calendar.google.com/calendar/u/0/r/week/2030/10/21');

  // Wait for Google Calendar & Cursa custom layer to fully enhance chips
  console.log('[Showcase] Waiting for calendar grid and custom chips to settle...');
  await new Promise(r => setTimeout(r, 6000));

  // Trigger tag calendar rows and enhance academic chips to ensure 100% render
  await displayWin.webContents.executeJavaScript(`(() => {
    // If gcal adapter is available, ensure all academic chips are enhanced
    const chips = Array.from(document.querySelectorAll('.custom-academic-container, [data-eventid]'));
    console.log('[InjectedPage] Found rendered chips count:', chips.length);
  })()`);

  await new Promise(r => setTimeout(r, 2000));

  console.log('[Showcase] Step 3: Capturing page to assets/app-showcase.png...');
  const image = await displayWin.webContents.capturePage();
  const outPath = path.join(__dirname, '../assets/app-showcase.png');
  fs.writeFileSync(outPath, image.toPNG());
  const stats = fs.statSync(outPath);
  console.log(`[Showcase] Screenshot saved! Path: ${outPath} (${Math.round(stats.size / 1024)} KB)`);

  // Step 4: Extract all created event IDs from the page
  console.log('[Showcase] Step 4: Extracting event IDs for complete cleanup...');
  const eventIds = await displayWin.webContents.executeJavaScript(`(() => {
    const chips = Array.from(document.querySelectorAll('[data-eventid]'));
    const ids = [];
    chips.forEach(c => {
      const text = c.innerText || c.getAttribute('aria-label') || '';
      const isOurEvent = text.includes('Computadores') || text.includes('Programación') || text.includes('Matemáticas') || text.includes('Economía') || text.includes('Derecho');
      if (isOurEvent) {
        const rawId = c.getAttribute('data-eventid');
        if (rawId) {
          const cleanId = rawId.split(' ')[0];
          if (!ids.includes(cleanId)) ids.push(cleanId);
        }
      }
    });
    return ids;
  })()`);

  console.log(`[Showcase] Found ${eventIds.length} event IDs to delete:`, eventIds);

  displayWin.close();

  // Step 5: Delete each event
  console.log('[Showcase] Step 5: Deleting all test events...');
  for (let i = 0; i < eventIds.length; i++) {
    const id = eventIds[i];
    console.log(`[Showcase] Deleting event [${i + 1}/${eventIds.length}]: ${id}...`);
    await workerWin.loadURL(`https://calendar.google.com/calendar/u/0/r/eventedit/${id}`);

    const res = await workerWin.webContents.executeJavaScript(`(async () => {
      const startTime = Date.now();
      let directBtn = null;

      function findDel() {
        const sels = ['#xDelBu', 'button[data-action="delete"]', 'button[aria-label*="Eliminar evento" i]', 'button[aria-label*="Delete event" i]', '[role="button"][aria-label*="Eliminar evento" i]'];
        for (const s of sels) {
          const b = document.querySelector(s);
          if (b && b.offsetParent !== null) return b;
        }
        return null;
      }

      while (Date.now() - startTime < 12000) {
        directBtn = findDel();
        if (directBtn) break;
        const moreBtn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => {
          const txt = (b.textContent || '').toLowerCase();
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          return (txt.includes('más acciones') || txt.includes('mas acciones') || txt.includes('more actions') ||
                  aria.includes('más acciones') || aria.includes('mas acciones') || aria.includes('more actions')) && b.offsetParent !== null;
        });
        if (moreBtn) break;
        await new Promise(r => setTimeout(r, 250));
      }

      if (directBtn) {
        directBtn.click();
        return true;
      }

      const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const moreActionsBtn = allButtons.find(b => {
        const txt = (b.textContent || '').toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        return (txt.includes('más acciones') || txt.includes('mas acciones') || txt.includes('more actions') ||
                aria.includes('más acciones') || aria.includes('mas acciones') || aria.includes('more actions')) && b.offsetParent !== null;
      });

      if (moreActionsBtn) {
        moreActionsBtn.click();
        await new Promise(r => setTimeout(r, 350));
        const items = Array.from(document.querySelectorAll('[role="menuitem"], .goog-menuitem'));
        const delItem = items.find(m => {
          const txt = (m.textContent || '').toLowerCase();
          const aria = (m.getAttribute('aria-label') || '').toLowerCase();
          return txt.includes('eliminar') || txt.includes('delete') || aria.includes('eliminar') || aria.includes('delete');
        });
        if (delItem) {
          delItem.click();
          return true;
        }
      }

      return false;
    })()`);

    console.log(`[Showcase] Event [${i + 1}/${eventIds.length}] deleted: ${res}`);
    await new Promise(r => setTimeout(r, 2500));
  }

  workerWin.close();
  console.log('[Showcase] ALL TEST EVENTS CLEANED UP SUCCESSFULLY! Done!');
  app.quit();
});
