const { app } = require('electron');
const path = require('path');

const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
app.setPath('userData', legacyUserData);

const { createMainWindow } = require(path.join(__dirname, '../../dist/main/window.js'));

app.whenReady().then(async () => {
  const win = createMainWindow();
  win.hide();
  await new Promise(r => setTimeout(r, 10000));

  // Find an event ID from chips in DOM
  const eventId = await win.webContents.executeJavaScript(`(() => {
    const chip = document.querySelector('[data-eventchip]');
    return chip?.getAttribute('data-eventid') || null;
  })()`);

  console.log('Found eventId:', eventId);

  if (eventId) {
    // Navigate to eventedit page
    await win.loadURL(`https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}`);
    await new Promise(r => setTimeout(r, 6000));

    const editDomInfo = await win.webContents.executeJavaScript(`(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        ariaLabel: i.getAttribute('aria-label'),
        value: i.value,
        id: i.id,
        className: i.className
      }));

      const dateInputs = inputs.filter(i => 
        (i.ariaLabel && (i.ariaLabel.includes('Fecha') || i.ariaLabel.includes('Date'))) ||
        /\\d{1,2}\\/\\d{1,2}\\/\\d{4}/.test(i.value) ||
        /\\d{1,2}\\s+de\\s+[a-z]+/i.test(i.value)
      );

      const timeInputs = inputs.filter(i =>
        (i.ariaLabel && (i.ariaLabel.includes('Hora') || i.ariaLabel.includes('Time'))) ||
        /\\d{1,2}:\\d{2}/.test(i.value)
      );

      return {
        url: window.location.href,
        totalInputs: inputs.length,
        dateInputs,
        timeInputs,
        allAriaLabels: inputs.map(i => i.ariaLabel).filter(Boolean)
      };
    })()`);

    console.log('EDIT DOM INFO:', JSON.stringify(editDomInfo, null, 2));
  }

  win.destroy();
  app.quit();
});
