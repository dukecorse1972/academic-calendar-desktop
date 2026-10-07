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

  console.log('Testing event:', eventId);

  if (eventId) {
    await win.loadURL(`https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}`);
    await new Promise(r => setTimeout(r, 6000));

    const testInputRes = await win.webContents.executeJavaScript(`(() => {
      const stDate = document.querySelector('#xStDaIn');
      const enDate = document.querySelector('#xEnDaIn');
      const stTime = document.querySelector('#xStTiIn');
      const enTime = document.querySelector('#xEnTiIn');
      const saveBtn = document.querySelector('#xSaveBu');

      return {
        hasStDate: Boolean(stDate),
        stDateVal: stDate?.value,
        hasEnDate: Boolean(enDate),
        enDateVal: enDate?.value,
        hasStTime: Boolean(stTime),
        stTimeVal: stTime?.value,
        hasEnTime: Boolean(enTime),
        enTimeVal: enTime?.value,
        hasSaveBtn: Boolean(saveBtn)
      };
    })()`);

    console.log('INPUT TEST RES:', JSON.stringify(testInputRes, null, 2));
  }

  win.destroy();
  app.quit();
});
