const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1300,
    height: 700,
    show: false
  });

  const htmlPath = path.join(__dirname, 'preview-week-events.html');
  await win.loadFile(htmlPath);
  await new Promise(r => setTimeout(r, 600));

  const image = await win.webContents.capturePage();
  fs.writeFileSync('C:/Users/dario/Downloads/OPCIONES_VISTA_SEMANAL.png', image.toPNG());
  console.log('Saved C:/Users/dario/Downloads/OPCIONES_VISTA_SEMANAL.png');

  app.quit();
});
