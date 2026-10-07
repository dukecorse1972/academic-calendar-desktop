const { app } = require('electron');
const path = require('path');
const { createMainWindow } = require(path.join(__dirname, '../../dist/main/window.js'));

app.whenReady().then(async () => {
  const win = createMainWindow();
  win.hide();

  // Wait for Google Calendar / accounts navigation to settle
  await new Promise((r) => setTimeout(r, 6000));

  const state = await win.webContents.executeJavaScript(`
    (() => ({
      url: window.location.href,
      title: document.title,
      isRejected: window.location.href.includes('rejected'),
      isIdentifier: window.location.href.includes('identifier') || window.location.href.includes('ServiceLogin'),
      hasEmailInput: !!document.querySelector('input[type="email"]')
    }))()
  `);

  console.log('END_TO_END_AUTH_STATE:', JSON.stringify(state, null, 2));

  win.destroy();
  app.quit();

  if (state.isRejected) {
    console.error('FAILED: Google redirected to /rejected page!');
    process.exit(1);
  } else {
    console.log('SUCCESS: Legitimate Google sign-in loaded without security rejection.');
    process.exit(0);
  }
});
