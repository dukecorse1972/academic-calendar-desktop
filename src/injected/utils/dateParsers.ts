/**
 * Resilient Multilingual Academic Date and Time Parsers
 * Supports Spanish, English, and ISO date parsing for Google Calendar chips and dialogs.
 */

export const MONTHS_MAP: Record<string, number> = {
  // Spanish
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
  // English
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  apr: 3,
  aug: 7,
  dec: 11
};

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAY_NAMES_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export interface ParsedDateResult {
  dateStr: string;
  isoDate: string;
  matchedDay: number;
  matchedMonth: number;
  matchedYear: number;
  eventDate: Date;
}

export function parseAcademicDateString(allText: string, sh: number = 9, sm: number = 0): ParsedDateResult {
  let matchedDay = 0;
  let matchedMonth = 0;
  let matchedYear = new Date().getFullYear();
  let hasMatch = false;

  // 1. Try Spanish date pattern: "15 de octubre de 2026"
  const dateMatch = allText.match(/(\d{1,2})\s+de\s+([a-zçáéíóúñ]+)(?:\s+de\s+(\d{4}))?/i);
  if (dateMatch) {
    matchedDay = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLowerCase();
    matchedMonth = MONTHS_MAP[monthName] ?? new Date().getMonth();
    matchedYear = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
    hasMatch = true;
  } else {
    // 2. Try English date patterns: "October 15, 2026" or "15 Oct 2026"
    const monthNamesPattern = Object.keys(MONTHS_MAP).filter((k) => k.length >= 3).join('|');
    const enMatch1 = allText.match(
      new RegExp(`\\b(${monthNamesPattern})\\b\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s*(\\d{4}))?`, 'i')
    );
    if (enMatch1 && MONTHS_MAP[enMatch1[1].toLowerCase()] !== undefined) {
      matchedMonth = MONTHS_MAP[enMatch1[1].toLowerCase()];
      matchedDay = parseInt(enMatch1[2], 10);
      matchedYear = enMatch1[3] ? parseInt(enMatch1[3], 10) : new Date().getFullYear();
      hasMatch = true;
    } else {
      const enMatch2 = allText.match(
        new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthNamesPattern})\\b(?:,?\\s*(\\d{4}))?`, 'i')
      );
      if (enMatch2 && MONTHS_MAP[enMatch2[2].toLowerCase()] !== undefined) {
        matchedDay = parseInt(enMatch2[1], 10);
        matchedMonth = MONTHS_MAP[enMatch2[2].toLowerCase()];
        matchedYear = enMatch2[3] ? parseInt(enMatch2[3], 10) : new Date().getFullYear();
        hasMatch = true;
      }
    }
  }

  let eventDate: Date;
  let dateStr = '';
  let isoDate = '';

  if (hasMatch) {
    eventDate = new Date(matchedYear, matchedMonth, matchedDay, sh, sm);
    const capMonth = MONTH_NAMES_ES[matchedMonth] || 'Mes';
    const weekDayName = eventDate.toLocaleDateString('es-ES', { weekday: 'long' });
    const capWeekDay = weekDayName.charAt(0).toUpperCase() + weekDayName.slice(1);
    dateStr = `${capWeekDay}, ${matchedDay} de ${capMonth} de ${matchedYear}`;
    isoDate = `${matchedYear}-${String(matchedMonth + 1).padStart(2, '0')}-${String(matchedDay).padStart(2, '0')}`;
  } else {
    const now = new Date();
    const capMonth = now.toLocaleDateString('es-ES', { month: 'long' });
    const capWeekDay = now.toLocaleDateString('es-ES', { weekday: 'long' });
    dateStr = `${capWeekDay.charAt(0).toUpperCase() + capWeekDay.slice(1)}, ${now.getDate()} de ${capMonth} de ${now.getFullYear()}`;
    eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
    isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  return {
    dateStr,
    isoDate,
    matchedDay,
    matchedMonth,
    matchedYear,
    eventDate
  };
}

export function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '0 min';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  let diffMins = eh * 60 + em - (sh * 60 + sm);
  if (diffMins <= 0) diffMins += 24 * 60; // Next day rollover

  const durH = Math.floor(diffMins / 60);
  const durM = diffMins % 60;

  if (durH > 0 && durM > 0) return `${durH} h ${durM} min`;
  if (durH > 0) return `${durH} hora${durH > 1 ? 's' : ''}`;
  return `${durM} min`;
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
