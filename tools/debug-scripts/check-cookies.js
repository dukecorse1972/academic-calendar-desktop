const { app, session } = require('electron');
const path = require('path');

const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
const newUserData = path.join(app.getPath('appData'), 'academic-calendar-win');
const persistentUserData = require('fs').existsSync(legacyUserData) ? legacyUserData : newUserData;
app.setPath('userData', persistentUserData);

app.whenReady().then(async () => {
  const ses = session.fromPartition('persist:gcal_session');
  const cookies = await ses.cookies.get({});
  console.log('UserData Path:', app.getPath('userData'));
  console.log('All cookies count in persist:gcal_session:', cookies.length);
  const googleCookies = cookies.filter(c => c.domain.includes('google'));
  console.log('Google cookies count:', googleCookies.length);
  console.log('Domains found:', Array.from(new Set(cookies.map(c => c.domain))));
  app.quit();
});
