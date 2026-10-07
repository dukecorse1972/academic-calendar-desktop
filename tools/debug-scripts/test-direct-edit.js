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
    await new Promise(r => setTimeout(r, 5000));

    const testRes = await win.webContents.executeJavaScript(`(() => {
      const stTime = document.querySelector('#xStTiIn');
      const saveBtn = document.querySelector('#xSaveBu');
      
      const prevVal = stTime?.value;
      // Change value and trigger events
      if (stTime) {
        stTime.value = '15:00';
        stTime.dispatchEvent(new Event('input', { bubbles: true }));
        stTime.dispatchEvent(new Event('change', { bubbles: true }));
        stTime.dispatchEvent(new Event('blur', { bubbles: true }));
      }
      
      return {
        prevVal,
        newVal: stTime?.value,
        saveBtnDisabled: saveBtn?.disabled,
        saveBtnAriaDisabled: saveBtn?.getAttribute('aria-disabled')
      };
    })()`);

    console.log('EVENT EDIT TEST:', JSON.stringify(testRes, null, 2));
  }

  win.destroy();
  app.quit();
});
