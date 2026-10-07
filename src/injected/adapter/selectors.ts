/**
 * Resilient DOM Selector Strategies for Google Calendar
 * Uses cascade fallback: Semantic / ARIA attributes -> ID -> Minified Class -> Text heuristic
 */

export const RESILIENT_SELECTORS = {
  // Save button in event edit page
  saveButton: [
    '#xSaveBu',
    'button[data-action="save"]',
    'button[aria-label*="Guardar" i]',
    'button[aria-label*="Save" i]',
    '[role="button"][aria-label*="Guardar" i]',
    '[role="button"][aria-label*="Save" i]'
  ],

  // Delete button in event edit page
  deleteButton: [
    '#xDelBu',
    'button[data-action="delete"]',
    'button[aria-label*="Eliminar" i]',
    'button[aria-label*="Delete" i]',
    '[role="button"][aria-label*="Eliminar" i]',
    '[role="button"][aria-label*="Delete" i]'
  ],

  // Calendar select dropdown in event edit page
  calendarDropdownTrigger: [
    '.haAclf',
    '[role="combobox"][aria-label*="Calendario" i]',
    '[role="combobox"][aria-label*="Calendar" i]',
    '[role="listbox"][aria-label*="Calendario" i]'
  ],

  // Options inside calendar dropdown
  calendarOption: [
    '[role="option"]',
    '[role="menuitem"]',
    '[data-value]'
  ],

  // Calendar row in left sidebar
  calendarRow: [
    '.XXcuqd',
    'li:has([role="checkbox"])',
    'div:has(> [role="checkbox"])',
    '[role="treeitem"]:has([role="checkbox"])'
  ],

  // Native event chips in calendar grid
  eventChip: [
    '[data-eventchip]',
    '[role="button"][data-eventid]',
    'div[data-chip]'
  ],

  // Top header button to create event
  createButton: [
    '[jsname="FAC3ob"]',
    '[data-action="create"]',
    'button:has([aria-label*="Crear" i])',
    'div[role="button"]:has([aria-label*="Crear" i])'
  ],

  // Top header mount targets for academic tabs (cascade order)
  headerMountTargets: [
    '.gb_v',
    '.gb_ae',
    'header input[type="text"]',
    'header form',
    'header button[aria-label*="Configuración" i]',
    'header button[aria-label*="Settings" i]',
    'header',
    'div[role="banner"]'
  ]
};

/**
 * Searches an element or document using a list of selectors in priority order.
 * Returns the first match found, or null if none match.
 */
export function queryResilient<T extends Element = HTMLElement>(
  root: Document | Element,
  selectorList: string[]
): T | null {
  for (const selector of selectorList) {
    try {
      const match = root.querySelector<T>(selector);
      if (match) return match;
    } catch {
      // Ignore unsupported pseudo-selector errors and continue
    }
  }
  return null;
}

/**
 * Finds all elements matching any selector in the list, deduplicating the results.
 */
export function queryAllResilient<T extends Element = HTMLElement>(
  root: Document | Element,
  selectorList: string[]
): T[] {
  const results = new Set<T>();
  for (const selector of selectorList) {
    try {
      const elements = root.querySelectorAll<T>(selector);
      elements.forEach((el) => results.add(el));
    } catch {
      // Ignore unsupported pseudo-selector errors
    }
  }
  return Array.from(results);
}
