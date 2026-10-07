const { app } = require('electron');
const path = require('path');

const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
app.setPath('userData', legacyUserData);

const { createMainWindow } = require(path.join(__dirname, '../../dist/main/window.js'));

app.whenReady().then(async () => {
  const win = createMainWindow();
  win.hide();
  await new Promise(r => setTimeout(r, 10000));

  const eventId = await win.webContents.executeJavaScript(`(() => {
    const chip = document.querySelector('[data-eventchip]');
    return chip?.getAttribute('data-eventid') || null;
  })()`);

  if (eventId) {
    await win.loadURL(`https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}`);
    await new Promise(r => setTimeout(r, 5000));

    const testChange = await win.webContents.executeJavaScript(`(() => {
      const stDate = document.querySelector('#xStDaIn');
      const stTime = document.querySelector('#xStTiIn');
      const enTime = document.querySelector('#xEnTiIn');
      
      // Let's see what events or properties exist
      return {
        stDateType: stDate?.tagName,
        stDateVal: stDate?.value,
        dataInitialValue: stDate?.getAttribute('data-initial-value'),
        jsaction: stDate?.getAttribute('jsaction')
      };
    })()`);

    console.log('INPUT DETAILS:', JSON.stringify(testChange, null, 2));
  }

  win.destroy();
  app.quit();
});
