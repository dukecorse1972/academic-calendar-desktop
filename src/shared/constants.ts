export const CALENDAR_GROUPS = {
  CLASES: [
    'Clase 1',
    'Clase 2',
    'Clase 3',
    'Clase 4',
    'Clase 5',
    'Clase 6'
  ],
  ACADEMICOS: [
    'Exámenes',
    'Entregas'
  ],
  OTROS: [
    'Tareas',
    'Festivos'
  ],
  OCULTO: [
    'Cumpleaños'
  ]
} as const;

export const TARGET_CALENDARS = {
  EXAMEN: 'Exámenes',
  ENTREGA: 'Entregas'
} as const;

export const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/r';
export const PARTITION_NAME = 'persist:gcal_session';
