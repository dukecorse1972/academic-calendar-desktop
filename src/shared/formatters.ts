import { AcademicEventPayload } from './types';
import { TARGET_CALENDARS } from './constants';

export interface FormattedAcademicEvent {
  fullTitle: string;
  targetCalendar: string;
  startDateTime: string;
  endDateTime: string;
  description: string;
  targetUrl: string;
}

/**
 * Formats an academic event payload into standard Google Calendar event edit parameters and URL.
 */
export function formatAcademicEvent(payload: AcademicEventPayload): FormattedAcademicEvent {
  const tag = payload.type === 'EXAMEN' ? '[EXAMEN]' : '[ENTREGA]';
  const fullTitle = `${tag} ${payload.subject.trim()} - ${payload.title.trim()}`;
  const targetCalendar = payload.type === 'EXAMEN' ? TARGET_CALENDARS.EXAMEN : TARGET_CALENDARS.ENTREGA;

  const startTime = payload.startTime || payload.time || '09:00';
  const cleanDate = payload.date.replace(/-/g, '');
  const cleanStartTime = startTime.replace(/:/g, '') + '00';
  const startDateTime = `${cleanDate}T${cleanStartTime}`;

  let endDateTime: string;
  const [sh, sm] = startTime.split(':').map(Number);

  if (payload.endTime) {
    const cleanEndTime = payload.endTime.replace(/:/g, '') + '00';
    const [eh, em] = payload.endTime.split(':').map(Number);
    if (eh < sh || (eh === sh && em < sm)) {
      const [year, month, day] = payload.date.split('-').map(Number);
      const nextDate = new Date(year, month - 1, day + 1);
      const nextDateStr = `${nextDate.getFullYear()}${String(nextDate.getMonth() + 1).padStart(2, '0')}${String(nextDate.getDate()).padStart(2, '0')}`;
      endDateTime = `${nextDateStr}T${cleanEndTime}`;
    } else {
      endDateTime = `${cleanDate}T${cleanEndTime}`;
    }
  } else {
    const endHour = (sh + 1) % 24;
    const endHourStr = endHour.toString().padStart(2, '0');
    if (endHour < sh) {
      const [year, month, day] = payload.date.split('-').map(Number);
      const nextDate = new Date(year, month - 1, day + 1);
      const nextDateStr = `${nextDate.getFullYear()}${String(nextDate.getMonth() + 1).padStart(2, '0')}${String(nextDate.getDate()).padStart(2, '0')}`;
      endDateTime = `${nextDateStr}T${endHourStr}${sm.toString().padStart(2, '0')}00`;
    } else {
      endDateTime = `${cleanDate}T${endHourStr}${sm.toString().padStart(2, '0')}00`;
    }
  }

  const description = [
    `Tipo: ${payload.type}`,
    `Asignatura: ${payload.subject}`,
    `Calendario Destino: ${targetCalendar}`,
    `Horario: ${startTime} - ${payload.endTime || ''}`,
    payload.description ? `\nDescripción:\n${payload.description.trim()}` : ''
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    text: fullTitle,
    dates: `${startDateTime}/${endDateTime}`,
    location: '',
    details: description
  });

  const targetUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`;

  return {
    fullTitle,
    targetCalendar,
    startDateTime,
    endDateTime,
    description,
    targetUrl
  };
}

/**
 * Convenience helper returning the target event creation URL for Google Calendar.
 */
export function formatAcademicEventUrl(payload: AcademicEventPayload): string {
  return formatAcademicEvent(payload).targetUrl;
}
