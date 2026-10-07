const { app } = require('electron');
const path = require('path');
const { createMainWindow } = require(path.join(__dirname, '../../dist/main/window.js'));

const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
app.setPath('userData', legacyUserData);

app.whenReady().then(async () => {
  const win = createMainWindow();
  win.hide();

  console.log('[Inspect] Window created, navigating...');

  // Capture all console logs from page/preload
  win.webContents.on('console-message', (ev, level, msg, line, src) => {
    console.log(`[PAGE LOG L${level}]: ${msg} (${src}:${line})`);
  });

  // Wait 12 seconds for Google Calendar to fully load and SPA to render
  await new Promise(r => setTimeout(r, 12000));

  const pageInfo = await win.webContents.executeJavaScript(`
    (() => {
      const url = window.location.href;
      const title = document.title;
      const tabs = document.querySelector('#gcal-header-academic-tabs');
      const gbAe = document.querySelector('.gb_ae');
      const gbV = document.querySelector('.gb_v');
      const header = document.querySelector('header');
      
      // Look for any header children or top bar elements
      const headerHtml = header ? header.outerHTML.slice(0, 500) : 'NO_HEADER';
      const searchBox = document.querySelector('input[type="text"]');
      const settingsBtn = document.querySelector('button[aria-label*="Configuración" i], button[aria-label*="Settings" i]');
      
      return {
        url,
        title,
        hasTabs: Boolean(tabs),
        hasGbAe: Boolean(gbAe),
        hasGbV: Boolean(gbV),
        hasHeader: Boolean(header),
        headerClass: header?.className,
        hasSearchBox: Boolean(searchBox),
        hasSettingsBtn: Boolean(settingsBtn),
        headerChildrenCount: header?.children.length,
        headerHtml
      };
    })()
  `);

  console.log('[Inspect Results]:', JSON.stringify(pageInfo, null, 2));

  win.destroy();
  app.quit();
  process.exit(0);
});
