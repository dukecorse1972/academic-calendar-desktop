import { session, Session } from 'electron';
import { PARTITION_NAME } from '../shared/constants';

// Standard modern desktop User-Agent that Google Accounts accepts legitimately
// without triggering the embedded Chromium disallowed_useragent security rejection
export const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

export function setupSession(): Session {
  const ses = session.fromPartition(PARTITION_NAME);

  // Set desktop User-Agent
  ses.setUserAgent(DESKTOP_USER_AGENT);

  // Ensure request headers do not leak Electron or contradictory Client Hints
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };

    requestHeaders['User-Agent'] = DESKTOP_USER_AGENT;
    delete requestHeaders['sec-ch-ua'];
    delete requestHeaders['sec-ch-ua-mobile'];
    delete requestHeaders['sec-ch-ua-platform'];

    callback({ requestHeaders });
  });

  // Strip CSP Trusted Types requirements so injected UI components can mount cleanly
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    for (const key of Object.keys(responseHeaders)) {
      if (
        key.toLowerCase() === 'content-security-policy' ||
        key.toLowerCase() === 'content-security-policy-report-only'
      ) {
        responseHeaders[key] = (responseHeaders[key] || []).map((policy) =>
          policy
            .replace(/require-trusted-types-for\s+'script';?/gi, '')
            .replace(/trusted-types[^;]+;?/gi, '')
        );
      }
    }

    callback({ responseHeaders });
  });

  // Handle permission requests securely (grant notifications only for calendar.google.com, deny all else)
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (url.startsWith('https://calendar.google.com') && permission === 'notifications') {
      return callback(true);
    }
    return callback(false);
  });

  return ses;
}
