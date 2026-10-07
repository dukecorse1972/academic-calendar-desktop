const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createMainWindow } = require(path.join(__dirname, '../../dist/main/window.js'));

app.whenReady().then(async () => {
  const win = createMainWindow();
  win.hide();

  console.log('[Diag] Main window created. Waiting 5s for page and preload...');
  await new Promise(r => setTimeout(r, 6000));

  const diag = await win.webContents.executeJavaScript(`
    (() => {
      const tabs = document.querySelector('#gcal-header-academic-tabs');
      const gbAe = document.querySelector('.gb_ae');
      const gbV = document.querySelector('.gb_v');
      const header = document.querySelector('header');
      const headerClasses = header ? header.className : null;
      const allGb = Array.from(document.querySelectorAll('[class*="gb_"]')).map(el => el.className).slice(0, 15);
      return {
        url: window.location.href,
        hasTabs: Boolean(tabs),
        hasGbAe: Boolean(gbAe),
        hasGbV: Boolean(gbV),
        hasHeader: Boolean(header),
        headerClasses,
        sampleGbClasses: allGb,
        isCustomLayerDefined: typeof window.gcalDesktopAPI !== 'undefined'
      };
    })()
  `);

  console.log('[Diag Results]:', JSON.stringify(diag, null, 2));

  win.destroy();
  app.quit();
  process.exit(0);
});
