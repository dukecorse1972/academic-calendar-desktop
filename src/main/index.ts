import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DESKTOP_USER_AGENT } from './session';
import { createMainWindow, getMainWindow, setIsQuitting } from './window';
import { logger } from '../shared/logger';

// Ensure user session and partition persist identically across dev and packaged executables
// (Adopts canonical cursa-desktop path while preserving existing user logins if present)
const cursaUserData = path.join(app.getPath('appData'), 'cursa-desktop');
const legacyUserData1 = path.join(app.getPath('appData'), 'academic-calendar-win');
const legacyUserData2 = path.join(app.getPath('appData'), 'google-calendar-win');

let persistentUserData = cursaUserData;
if (fs.existsSync(legacyUserData1)) {
  persistentUserData = legacyUserData1;
} else if (fs.existsSync(legacyUserData2)) {
  persistentUserData = legacyUserData2;
}
app.setPath('userData', persistentUserData);
logger.info('Application starting with userData path:', persistentUserData);

// Set application identity for Windows Start Menu & Taskbar
app.setName('Cursa');
app.setAppUserModelId('com.cursa.desktop');

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
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('before-quit', () => {
    setIsQuitting(true);
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
