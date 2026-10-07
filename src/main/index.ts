import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DESKTOP_USER_AGENT } from './session';
import { createMainWindow, getMainWindow } from './window';

// Ensure user session and partition persist identically across dev and packaged executables
// (Preserves existing logins from legacy directory if present)
const legacyUserData = path.join(app.getPath('appData'), 'google-calendar-win');
const newUserData = path.join(app.getPath('appData'), 'academic-calendar-win');
const persistentUserData = fs.existsSync(legacyUserData) ? legacyUserData : newUserData;
app.setPath('userData', persistentUserData);

// Set application identity for Windows Start Menu & Taskbar
app.setName('AcademiCal Desktop');
app.setAppUserModelId('com.academic.calendar.desktop');

// Set standard desktop User-Agent globally
app.userAgentFallback = DESKTOP_USER_AGENT;

// Remote debugging for inspection and diagnostics (enabled only via explicit environment flag)
if (process.env.ENABLE_REMOTE_DEBUG === '1' || process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
      if (getMainWindow() === null) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
