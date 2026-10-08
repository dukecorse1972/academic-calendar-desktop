import { BrowserWindow, shell, ipcMain, Session } from 'electron';
import * as path from 'path';
import { GOOGLE_CALENDAR_URL } from '../shared/constants';
import { setupSession } from './session';
import { AcademicEventPayload } from '../shared/types';
import { formatAcademicEvent } from '../shared/formatters';
import { validateAcademicEventPayload, isValidEventId } from '../shared/validators';

let mainWindow: BrowserWindow | null = null;
let ipcRegistered = false;

class AsyncOperationQueue {
  private queue: Promise<any> = Promise.resolve();

  public enqueue<T>(op: () => Promise<T>): Promise<T> {
    const next = this.queue.then(op, op);
    this.queue = next.catch(() => {});
    return next;
  }
}

const bgTaskQueue = new AsyncOperationQueue();

function setupBackgroundEventCreation(customSession: Session): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('create-academic-event-background', async (_event, payload: AcademicEventPayload) => {
    return bgTaskQueue.enqueue(async () => {
      // 1. Strict runtime payload validation on IPC boundary
      const validation = validateAcademicEventPayload(payload);
      if (!validation.valid) {
        console.error('[BackgroundEventCreate] Validation failed:', validation.errors);
        return { success: false, error: validation.errors.join('; ') };
      }

      // 2. Format standardized academic event payload and edit URL
      const { targetUrl } = formatAcademicEvent(payload);

      const bgWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 768,
        webPreferences: {
          session: customSession,
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      try {
        await bgWindow.loadURL(targetUrl);

        // Wait for save button, switch calendar if Entrega, and click Guardar
        const isEntrega = payload.type === 'ENTREGA';
        await bgWindow.webContents.executeJavaScript(`(async () => {
          const startTime = Date.now();
          let saveBtn = null;
          
          // Resilient save button selectors
          const saveSelectors = [
            '#xSaveBu',
            'button[data-action="save"]',
            'button[aria-label*="Guardar" i]',
            'button[aria-label*="Save" i]',
            '[role="button"][aria-label*="Guardar" i]'
          ];

          while (Date.now() - startTime < 12000) {
            for (const sel of saveSelectors) {
              saveBtn = document.querySelector(sel);
              if (saveBtn) break;
            }
            if (!saveBtn) {
              saveBtn = Array.from(document.querySelectorAll('button')).find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                return txt === 'guardar' || txt === 'save';
              });
            }
            if (saveBtn) break;
            await new Promise(r => setTimeout(r, 250));
          }

          if (!saveBtn) {
            throw new Error('Save button not found on Google Calendar event edit page');
          }

          // Switch to targeted academic calendar (Exámenes vs Entregas) if present
          const spans = Array.from(document.querySelectorAll('span'));
          const calSpan = spans.find(s => (s.textContent.includes('Calendario') || s.textContent.includes('Calendar') || s.className.includes('haAclf') || s.closest('[role="combobox"]')));
          const calTrigger = calSpan?.closest('[role="combobox"], [role="listbox"], [role="button"], div[jsname], button');
          if (calTrigger) {
            calTrigger.click();
            await new Promise(r => setTimeout(r, 300));

            const options = Array.from(document.querySelectorAll('[role="option"], [data-value], [role="menuitem"]'));
            const matchOpt = options.find(o => {
              const txt = (o.textContent || '').toLowerCase();
              return ${JSON.stringify(isEntrega)}
                ? (txt.includes('entrega') || txt.includes('entegras') || txt.includes('assignment') || txt.includes('deadline') || txt.includes('due'))
                : (txt.includes('examen') || txt.includes('exam'));
            });
            if (matchOpt) {
              matchOpt.click();
              await new Promise(r => setTimeout(r, 300));
            }
          }

          saveBtn.click();
        })()`);

        // Wait up to 3.5s for navigation back to /r or save completion
        await new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve(true);
            }
          };
          bgWindow.webContents.once('did-navigate', finish);
          setTimeout(finish, 3500);
        });

        return { success: true };
      } catch (err: any) {
        console.error('[BackgroundEventCreate] Failed to create event in background:', err);
        return { success: false, error: err.message };
      } finally {
        if (!bgWindow.isDestroyed()) {
          bgWindow.destroy();
        }
      }
    });
  });

  ipcMain.handle('delete-academic-event-background', async (_event, eventId: string) => {
    return bgTaskQueue.enqueue(async () => {
      // 1. Validate eventId strictly
      if (!isValidEventId(eventId)) {
        return { success: false, error: 'Invalid or malformed eventId provided' };
      }

      const targetUrl = `https://calendar.google.com/calendar/u/0/r/eventedit/${eventId}`;
      const bgWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 768,
        webPreferences: {
          session: customSession,
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      try {
        await bgWindow.loadURL(targetUrl);
        await bgWindow.webContents.executeJavaScript(`(async () => {
          const startTime = Date.now();
          let delBtn = null;
          
          const deleteSelectors = [
            '#xDelBu',
            'button[data-action="delete"]',
            'button[aria-label*="Eliminar" i]',
            'button[aria-label*="Delete" i]',
            '[role="button"][aria-label*="Eliminar" i]'
          ];

          while (Date.now() - startTime < 10000) {
            for (const sel of deleteSelectors) {
              delBtn = document.querySelector(sel);
              if (delBtn) break;
            }
            if (!delBtn) {
              delBtn = Array.from(document.querySelectorAll('button')).find(b => {
                const label = (b.getAttribute('aria-label') || '').toLowerCase();
                const txt = (b.textContent || '').trim().toLowerCase();
                return label.includes('eliminar') || label.includes('delete') || txt === 'eliminar' || txt === 'delete';
              });
            }
            if (delBtn) break;
            await new Promise(r => setTimeout(r, 250));
          }

          if (!delBtn) {
            throw new Error('Delete button not found on Google Calendar event edit page');
          }

          delBtn.click();
        })()`);

        // Wait up to 3.5s for navigation or deletion completion
        await new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve(true);
            }
          };
          bgWindow.webContents.once('did-navigate', finish);
          setTimeout(finish, 3500);
        });

        return { success: true };
      } catch (err: any) {
        console.error('[BackgroundEventDelete] Failed to delete event in background:', err);
        return { success: false, error: err.message };
      } finally {
        if (!bgWindow.isDestroyed()) {
          bgWindow.destroy();
        }
      }
    });
  });

  ipcMain.handle('move-academic-event-background', async (_event, data: { eventId?: string; payload: AcademicEventPayload }) => {
    return bgTaskQueue.enqueue(async () => {
      // 1. Strict validation of new payload
      const validation = validateAcademicEventPayload(data?.payload);
      if (!validation.valid) {
        console.error('[BackgroundEventMove] Validation failed:', validation.errors);
        return { success: false, error: validation.errors.join('; ') };
      }

      const { targetUrl } = formatAcademicEvent(data.payload);
      const isEntrega = data.payload.type === 'ENTREGA';

      const bgWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 768,
        webPreferences: {
          session: customSession,
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      try {
        // Step 1: Create new event in background at the new date and time
        await bgWindow.loadURL(targetUrl);

        await bgWindow.webContents.executeJavaScript(`(async () => {
          const startTime = Date.now();
          let saveBtn = null;
          
          const saveSelectors = [
            '#xSaveBu',
            'button[data-action="save"]',
            'button[aria-label*="Guardar" i]',
            'button[aria-label*="Save" i]',
            '[role="button"][aria-label*="Guardar" i]'
          ];

          while (Date.now() - startTime < 12000) {
            for (const sel of saveSelectors) {
              saveBtn = document.querySelector(sel);
              if (saveBtn) break;
            }
            if (!saveBtn) {
              saveBtn = Array.from(document.querySelectorAll('button')).find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                return txt === 'guardar' || txt === 'save';
              });
            }
            if (saveBtn) break;
            await new Promise(r => setTimeout(r, 250));
          }

          if (!saveBtn) {
            throw new Error('Save button not found on Google Calendar event edit page');
          }

          // Switch to targeted academic calendar (Exámenes vs Entregas) if present
          const spans = Array.from(document.querySelectorAll('span'));
          const calSpan = spans.find(s => (s.textContent.includes('Calendario') || s.textContent.includes('Calendar') || s.className.includes('haAclf') || s.closest('[role="combobox"]')));
          const calTrigger = calSpan?.closest('[role="combobox"], [role="listbox"], [role="button"], div[jsname], button');
          if (calTrigger) {
            calTrigger.click();
            await new Promise(r => setTimeout(r, 300));

            const options = Array.from(document.querySelectorAll('[role="option"], [data-value], [role="menuitem"]'));
            const matchOpt = options.find(o => {
              const txt = (o.textContent || '').toLowerCase();
              return ${JSON.stringify(isEntrega)}
                ? (txt.includes('entrega') || txt.includes('entegras') || txt.includes('assignment') || txt.includes('deadline') || txt.includes('due'))
                : (txt.includes('examen') || txt.includes('exam'));
            });
            if (matchOpt) {
              matchOpt.click();
              await new Promise(r => setTimeout(r, 300));
            }
          }

          saveBtn.click();
        })()`);

        await new Promise((resolve) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve(true);
            }
          };
          bgWindow.webContents.once('did-navigate', finish);
          setTimeout(finish, 3500);
        });

        // Step 2: Delete old event if eventId provided
        if (data.eventId && isValidEventId(data.eventId)) {
          const deleteUrl = `https://calendar.google.com/calendar/u/0/r/eventedit/${data.eventId}`;
          await bgWindow.loadURL(deleteUrl);

          await bgWindow.webContents.executeJavaScript(`(async () => {
            const startTime = Date.now();
            let delBtn = null;
            
            const deleteSelectors = [
              '#xDelBu',
              'button[data-action="delete"]',
              'button[aria-label*="Eliminar" i]',
              'button[aria-label*="Delete" i]',
              '[role="button"][aria-label*="Eliminar" i]'
            ];

            while (Date.now() - startTime < 8000) {
              for (const sel of deleteSelectors) {
                delBtn = document.querySelector(sel);
                if (delBtn) break;
              }
              if (!delBtn) {
                delBtn = Array.from(document.querySelectorAll('button')).find(b => {
                  const label = (b.getAttribute('aria-label') || '').toLowerCase();
                  const txt = (b.textContent || '').trim().toLowerCase();
                  return label.includes('eliminar') || label.includes('delete') || txt === 'eliminar' || txt === 'delete';
                });
              }
              if (delBtn) break;
              await new Promise(r => setTimeout(r, 250));
            }

            if (delBtn) {
              delBtn.click();
            }
          })()`);

          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (!done) {
                done = true;
                resolve(true);
              }
            };
            bgWindow.webContents.once('did-navigate', finish);
            setTimeout(finish, 3000);
          });
        }

        return { success: true };
      } catch (err: any) {
        console.error('[BackgroundEventMove] Failed to move event in background:', err);
        return { success: false, error: err.message };
      } finally {
        if (!bgWindow.isDestroyed()) {
          bgWindow.destroy();
        }
      }
    });
  });

  ipcMain.handle('ensure-academic-calendars-background', async (_event, calendarNames?: string[]) => {
    return bgTaskQueue.enqueue(async () => {
      const namesToCreate = Array.isArray(calendarNames) && calendarNames.length > 0
        ? calendarNames
        : ['Exámenes', 'Entregas'];

      for (const calName of namesToCreate) {
        const bgWindow = new BrowserWindow({
          show: false,
          width: 1024,
          height: 768,
          webPreferences: {
            session: customSession,
            contextIsolation: true,
            nodeIntegration: false
          }
        });

        try {
          await bgWindow.loadURL('https://calendar.google.com/calendar/u/0/r/settings/createcalendar');

          await bgWindow.webContents.executeJavaScript(`(async () => {
            const targetName = ${JSON.stringify(calName)};
            const startTime = Date.now();
            let nameInput = null;

            while (Date.now() - startTime < 10000) {
              nameInput = document.querySelector('input[aria-label*="Nombre" i], input[aria-label*="Name" i], #xNameIn, input[type="text"]');
              if (nameInput) break;
              await new Promise(r => setTimeout(r, 250));
            }

            if (!nameInput) {
              throw new Error('Name input not found on create calendar page');
            }

            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(nameInput, targetName);
            } else {
              nameInput.value = targetName;
            }
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            nameInput.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 400));

            const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
            const createBtn = buttons.find(b => {
              const txt = (b.textContent || '').trim().toLowerCase();
              const label = (b.getAttribute('aria-label') || '').toLowerCase();
              return txt.includes('crear calendario') || txt.includes('create calendar') || label.includes('crear calendario') || label.includes('create calendar');
            });

            if (createBtn) {
              createBtn.click();
              await new Promise(r => setTimeout(r, 2500));
            }
          })()`);
        } catch (err: any) {
          console.warn('[EnsureAcademicCalendars] Background creation note:', err.message);
        } finally {
          if (!bgWindow.isDestroyed()) {
            bgWindow.destroy();
          }
        }
      }

      return { success: true };
    });
  });
}

export function createMainWindow(): BrowserWindow {
  const customSession = setupSession();
  setupBackgroundEventCreation(customSession);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 600,
    title: 'AcademiCal Desktop — Google Calendar',
    icon: path.join(__dirname, '../../assets/icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      session: customSession,
      preload: path.join(__dirname, '../preload/bundle.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  // Log all console output from renderer/preload
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer L${level}] ${message} (${sourceId}:${line})`);
  });

  // Toggle DevTools with F12 or Ctrl+Shift+I
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  // Handle external links vs Google sign-in/calendar navigation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      const allowedHosts = [
        'calendar.google.com',
        'accounts.google.com',
        'myaccount.google.com',
        'workspace.google.com',
        'ogs.google.com',
        'content.googleapis.com'
      ];

      const isAllowed = allowedHosts.some(
        (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith('.' + host)
      );

      if (isAllowed) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            webPreferences: {
              session: customSession,
              contextIsolation: true,
              nodeIntegration: false
            }
          }
        };
      }

      // External links open in default OS browser
      shell.openExternal(url);
      return { action: 'deny' };
    } catch {
      return { action: 'deny' };
    }
  });

  mainWindow.webContents.on('will-redirect', (event, redirectUrl) => {
    try {
      const parsedUrl = new URL(redirectUrl);
      if (parsedUrl.hostname.includes('workspace.google.com')) {
        event.preventDefault();
        mainWindow?.loadURL(
          'https://accounts.google.com/ServiceLogin?service=cl&passive=1209600&continue=https://calendar.google.com/calendar/render'
        );
      }
    } catch {
      // Ignored
    }
  });

  const notifyCalendarLoaded = () => {
    const currentUrl = mainWindow?.webContents.getURL() || '';
    if (currentUrl.includes('workspace.google.com')) {
      mainWindow?.loadURL(
        'https://accounts.google.com/ServiceLogin?service=cl&passive=1209600&continue=https://calendar.google.com/calendar/render'
      );
    } else if (currentUrl.includes('calendar.google.com')) {
      mainWindow?.webContents.send('init-custom-layer');
    }
  };

  mainWindow.webContents.on('did-finish-load', notifyCalendarLoaded);
  mainWindow.webContents.on('did-navigate', notifyCalendarLoaded);
  mainWindow.webContents.on('did-navigate-in-page', notifyCalendarLoaded);

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      const isGoogle =
        parsedUrl.hostname.endsWith('google.com') ||
        parsedUrl.hostname.endsWith('googleusercontent.com');

      if (!isGoogle) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
    } catch {
      // Ignored
    }
  });

  mainWindow.loadURL(GOOGLE_CALENDAR_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

