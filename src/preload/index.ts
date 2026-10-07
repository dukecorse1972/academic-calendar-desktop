import { contextBridge, ipcRenderer } from 'electron';
import { initCustomLayer } from '../injected/index';

const desktopApi = {
  createAcademicEventBackground: (payload: any) =>
    ipcRenderer.invoke('create-academic-event-background', payload),
  deleteAcademicEventBackground: (eventId: string) =>
    ipcRenderer.invoke('delete-academic-event-background', eventId),
  moveAcademicEventBackground: (data: { eventId?: string; payload: any }) =>
    ipcRenderer.invoke('move-academic-event-background', data)
};

try {
  contextBridge.exposeInMainWorld('gcalDesktopAPI', desktopApi);
} catch (_) {}

(window as any).gcalDesktopAPI = desktopApi;

function runIfCalendar(): void {
  try {
    if (window.location.hostname.includes('calendar.google.com')) {
      initCustomLayer();
    }
  } catch (err) {
    console.error('[Preload] Error initializing custom layer:', err);
  }
}

// 1. Check immediately at document-start
runIfCalendar();

// 2. Check at DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runIfCalendar, { once: true });
}

// 3. Check at window load
window.addEventListener('load', runIfCalendar, { once: true });

// 4. Listen for main process signal
ipcRenderer.on('init-custom-layer', () => {
  runIfCalendar();
});
