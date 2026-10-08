import { AppTab } from '../../shared/types';
import { AppState, AppStateData } from '../state';
import { GoogleCalendarAdapter } from '../adapter/GoogleCalendarAdapter';
import { CreatorModal } from './creatorModal';
import { AcademicDetailModal } from './detailModal';
import { OnboardingModal } from './onboardingModal';
import { safeSetInnerHTML } from '../utils/dom';

export class AcademicPanel {
  private static instance: AcademicPanel | null = null;
  private headerTabsContainer: HTMLElement | null = null;
  private unsubscribeState: (() => void) | null = null;
  private observer: MutationObserver | null = null;
  private removeEventListeners: (() => void) | null = null;
  private lastNavTime = 0;

  public static getInstance(): AcademicPanel {
    if (!AcademicPanel.instance) {
      AcademicPanel.instance = new AcademicPanel();
    }
    return AcademicPanel.instance;
  }

  private constructor() {}

  public init(): void {
    // 1. Inject fluid tab styles
    this.injectFluidTabStyles();

    // 2. Mount tabs in top header
    const mounted = this.mountInTopHeader();

    // If header is not in DOM yet (initial SPA hydration), retry periodically until mounted
    if (!mounted) {
      let retryCount = 0;
      const retryInterval = setInterval(() => {
        retryCount++;
        const ok = this.mountInTopHeader();
        if (ok || retryCount >= 40) {
          clearInterval(retryInterval);
        }
      }, 250);

      const prevRemover = this.removeEventListeners;
      this.removeEventListeners = () => {
        if (prevRemover) prevRemover();
        clearInterval(retryInterval);
      };
    }

    // 3. Setup observation to keep tabs mounted through Google Calendar SPA updates
    this.setupObservation();

    // 4. Setup interception on Google Calendar's native "+ Crear" button
    this.setupCreateButtonInterception();

    // 5. Setup keyboard navigation between weeks with < and > / ArrowLeft and ArrowRight
    this.setupKeyboardNavigation();

    // 6. Setup interception on academic event chips to open custom extended view
    this.setupEventChipClickInterception();

    // 7. Subscribe to state updates
    const appState = AppState.getInstance();
    this.unsubscribeState = appState.subscribe((state) => {
      this.updateActiveTabStyles(state.activeTab);
      GoogleCalendarAdapter.getInstance().applyTabFilter(state.activeTab, true);
    });

    // 8. Initial render and filter
    const initialState = appState.getState();
    this.updateActiveTabStyles(initialState.activeTab);
    GoogleCalendarAdapter.getInstance().applyTabFilter(initialState.activeTab, true);

    // 9. Trigger first-time onboarding wizard if not completed yet
    if (typeof localStorage !== 'undefined' && localStorage.getItem('gcal_academic_onboarding_completed') !== 'true') {
      setTimeout(() => {
        OnboardingModal.getInstance().open();
      }, 700);
    }
  }

  private injectFluidTabStyles(): void {
    const styleId = 'gcal-custom-fluid-tab-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .gcal-tabs-pill-box {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin: 0 12px;
          padding: 3px 6px;
          background: var(--gcal-surface, rgba(255, 255, 255, 0.08));
          border: 1px solid var(--gcal-border, rgba(255, 255, 255, 0.15));
          border-radius: 20px;
          font-family: 'Google Sans', Roboto, Arial, sans-serif;
          box-sizing: border-box;
          vertical-align: middle;
          flex-shrink: 0;
          z-index: 1000;
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        .gcal-tab-icon {
          font-size: 13px;
          margin: 0 4px 0 2px;
          user-select: none;
        }

        .gcal-hdr-tab-btn {
          padding: 5px 12px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--gcal-secondary-text, #9aa0a6);
          font-weight: 600;
          font-size: 12px;
          border-radius: 14px;
          cursor: pointer;
          user-select: none;
          outline: none;
          transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.15s ease,
                      box-shadow 0.2s ease;
        }

        .gcal-hdr-tab-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--gcal-primary-text, #e8eaed);
          transform: translateY(-1px);
        }

        .gcal-hdr-tab-btn:active {
          transform: scale(0.96);
        }

        .gcal-hdr-tab-btn.active {
          border-color: var(--gcal-accent, #8ab4f8) !important;
          background: var(--gcal-selected, #004a77) !important;
          color: var(--gcal-accent, #8ab4f8) !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Discovers the optimal insertion point in Google Calendar's top bar
   * using a prioritized cascade of modern and legacy selectors.
   */
  private findHeaderMountTarget(): { container: HTMLElement; referenceNode: HTMLElement | null } | null {
    // Strategy 1: Google Bar middle container via .gb_v (modern Google Calendar)
    const gbV = document.querySelector<HTMLElement>('.gb_v');
    if (gbV && gbV.parentElement) {
      return { container: gbV.parentElement, referenceNode: gbV };
    }

    // Strategy 2: Legacy OneGoogleBar container .gb_ae
    const gbAe = document.querySelector<HTMLElement>('.gb_ae');
    if (gbAe) {
      const ref = gbV && gbV.parentElement === gbAe ? gbV : null;
      return { container: gbAe, referenceNode: ref };
    }

    // Strategy 3: Header search bar wrapper
    const searchInput = document.querySelector<HTMLElement>('header input[type="text"], header form');
    if (searchInput) {
      const searchWrapper =
        searchInput.closest<HTMLElement>('header > div > div') ||
        searchInput.closest<HTMLElement>('header > div');
      if (searchWrapper && searchWrapper.parentElement) {
        return { container: searchWrapper.parentElement, referenceNode: searchWrapper };
      }
    }

    // Strategy 4: Settings or Help button container
    const settingsBtn = document.querySelector<HTMLElement>(
      'header button[aria-label*="Configuración" i], header button[aria-label*="Settings" i], header button[aria-label*="Ayuda" i], header button[aria-label*="Help" i]'
    );
    if (settingsBtn) {
      const btnWrapper = settingsBtn.closest<HTMLElement>('header > div');
      if (btnWrapper && btnWrapper.parentElement) {
        return { container: btnWrapper.parentElement, referenceNode: btnWrapper };
      }
    }

    // Strategy 5: Semantic header / banner fallback
    const header =
      document.querySelector<HTMLElement>('header') ||
      document.querySelector<HTMLElement>('div[role="banner"]');
    if (header) {
      const middleOrFirst =
        (header.children[1] as HTMLElement) ||
        (header.children[0] as HTMLElement) ||
        header;
      return { container: middleOrFirst, referenceNode: null };
    }

    return null;
  }

  public mountInTopHeader(): boolean {
    const target = this.findHeaderMountTarget();
    if (!target || !target.container) return false;

    if (!this.headerTabsContainer) {
      this.headerTabsContainer = document.createElement('div');
      this.headerTabsContainer.id = 'gcal-header-academic-tabs';
      this.headerTabsContainer.className = 'gcal-tabs-pill-box';

      safeSetInnerHTML(
        this.headerTabsContainer,
        `
        <span class="gcal-tab-icon">🎓</span>
        <button id="gcal-hdr-tab-clases" type="button" class="gcal-hdr-tab-btn" data-tab="CLASES">CLASES</button>
        <button id="gcal-hdr-tab-entregas" type="button" class="gcal-hdr-tab-btn" data-tab="ENTREGAS_EXAMENES">EXÁMENES Y ENTREGAS</button>
        <button id="gcal-hdr-tab-todo" type="button" class="gcal-hdr-tab-btn" data-tab="TODO">TODO</button>
        <button id="gcal-hdr-settings-btn" type="button" class="gcal-hdr-tab-btn" style="padding: 5px 8px;" title="Configurar asignaturas y paleta de color">⚙️</button>
        `
      );

      const appState = AppState.getInstance();
      const tabClases = this.headerTabsContainer.querySelector('#gcal-hdr-tab-clases');
      const tabEntregas = this.headerTabsContainer.querySelector('#gcal-hdr-tab-entregas');
      const tabTodo = this.headerTabsContainer.querySelector('#gcal-hdr-tab-todo');
      const settingsBtn = this.headerTabsContainer.querySelector('#gcal-hdr-settings-btn');

      tabClases?.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.setActiveTab('CLASES');
      });
      tabEntregas?.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.setActiveTab('ENTREGAS_EXAMENES');
      });
      tabTodo?.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.setActiveTab('TODO');
      });
      settingsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        OnboardingModal.getInstance().open();
      });
    }

    if (!target.container.contains(this.headerTabsContainer)) {
      if (target.referenceNode && target.referenceNode.parentElement === target.container) {
        target.container.insertBefore(this.headerTabsContainer, target.referenceNode);
      } else {
        target.container.appendChild(this.headerTabsContainer);
      }
      this.updateActiveTabStyles(AppState.getInstance().getState().activeTab);
    }

    return true;
  }

  private updateActiveTabStyles(activeTab: AppTab): void {
    if (!this.headerTabsContainer) return;

    const tabClases = this.headerTabsContainer.querySelector('#gcal-hdr-tab-clases');
    const tabEntregas = this.headerTabsContainer.querySelector('#gcal-hdr-tab-entregas');
    const tabTodo = this.headerTabsContainer.querySelector('#gcal-hdr-tab-todo');

    const updateBtn = (btn: Element | null, tab: AppTab) => {
      if (!btn) return;
      if (activeTab === tab) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    };

    updateBtn(tabClases, 'CLASES');
    updateBtn(tabEntregas, 'ENTREGAS_EXAMENES');
    updateBtn(tabTodo, 'TODO');
  }

  /**
   * Intercepts Google Calendar's native "+ Crear" button:
   * - In EXÁMENES Y ENTREGAS: opens the custom academic creator modal.
   * - In CLASES and TODO: allows Google Calendar's standard native creation menu to open normally.
   */
  private setupCreateButtonInterception(): void {
    const handleCreateEvent = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if event occurred inside the "+ Crear" button or dropdown "Evento" item
      const createBtn = target.closest('button[jsname="todz4c"], .nUt0vb, .dwlvNd button');
      const menuItem = target.closest('[role="menuitem"]');
      const isEventMenuItem = Boolean(
        menuItem && menuItem.textContent?.toLowerCase().includes('evento')
      );

      if (createBtn || isEventMenuItem) {
        const activeTab = AppState.getInstance().getState().activeTab;
        if (activeTab === 'ENTREGAS_EXAMENES') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (e.type === 'click') {
            // Dismiss native dropdown menu if any was open
            document.body.click();
            CreatorModal.getInstance().open();
          }
        }
        // When activeTab is CLASES or TODO, do nothing -> native Google Calendar menu opens normally
      }
    };

    // Capture on window level so we evaluate before Google Calendar's jsaction delegated handlers
    const eventTypes = ['pointerdown', 'mousedown', 'click'];
    eventTypes.forEach((type) => {
      window.addEventListener(type, handleCreateEvent, true);
    });

    const prevRemover = this.removeEventListeners;
    this.removeEventListeners = () => {
      if (prevRemover) prevRemover();
      eventTypes.forEach((type) => {
        window.removeEventListener(type, handleCreateEvent, true);
      });
    };
  }

  /**
   * Intercepts clicks on event chips in the EXÁMENES Y ENTREGAS tab:
   * - Suppresses Google Calendar's native extended popover/dialog.
   * - Opens our custom academic extended view with full organization, bento metrics,
   *   notes editing and fast deletion.
   */
  private setupEventChipClickInterception(): void {
    const handleChipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Don't intercept if clicking inside our custom modals or tab bar
      if (
        target.closest('#gcal-academic-detail-modal') ||
        target.closest('#gcal-academic-creator-modal') ||
        target.closest('#gcal-tab-selector') ||
        target.closest('.gcal-tabs-pill-box')
      ) {
        return;
      }

      // Find if an event chip or its inner card was clicked
      const chip = target.closest<HTMLElement>('[data-eventchip]');
      if (!chip) return;

      const activeTab = AppState.getInstance().getState().activeTab;
      const hasCustomAcademic = Boolean(chip.querySelector('.custom-academic-container'));
      const isAcademicText = /examen|entrega|entegra/i.test(chip.textContent || '');

      if (activeTab === 'ENTREGAS_EXAMENES' || hasCustomAcademic || isAcademicText) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (e.type === 'click') {
          AcademicDetailModal.getInstance().open(chip);
        }
      }
    };

    // Capture on window level so we evaluate before Google Calendar's internal handlers
    const eventTypes = ['pointerdown', 'mousedown', 'click'];
    eventTypes.forEach((type) => {
      window.addEventListener(type, handleChipClick as any, true);
    });
  }

  /**
   * Sets up bulletproof navigation between weeks:
   * - Allows Google Calendar's native header arrow buttons (< and >) to handle mouse clicks cleanly without interference.
   * - Intercepts keyboard navigation (< and >, ArrowLeft and ArrowRight, , and .) debounced to 350ms.
   * - Ensures navigation strictly advances/retreats 1 week at a time (never skips 2 weeks).
   */
  private setupKeyboardNavigation(): void {
    const handleKeyNavigation = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('role') === 'textbox' ||
          activeEl.getAttribute('contenteditable') === 'true' ||
          Boolean(activeEl.closest('#gcal-academic-creator-modal')) ||
          Boolean(activeEl.closest('#gcal-academic-detail-modal')));

      if (isInput) return;

      const isPrev = e.key === 'ArrowLeft' || e.key === '<' || e.key === ',';
      const isNext = e.key === 'ArrowRight' || e.key === '>' || e.key === '.';

      if (!isPrev && !isNext) return;

      const now = Date.now();
      if (now - this.lastNavTime < 350) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.lastNavTime = now;

      if (isPrev) {
        const prevBtn = document.querySelector<HTMLButtonElement>(
          'header button[jsname="VfNHU"], header button[aria-label*="anterior" i]'
        );
        prevBtn?.click();
      } else if (isNext) {
        const nextBtn = document.querySelector<HTMLButtonElement>(
          'header button[jsname="OCpkoe"], header button[aria-label*="siguiente" i]'
        );
        nextBtn?.click();
      }
    };

    window.addEventListener('keydown', handleKeyNavigation, true);

    const prevRemover = this.removeEventListeners;
    this.removeEventListeners = () => {
      if (prevRemover) prevRemover();
      window.removeEventListener('keydown', handleKeyNavigation, true);
    };
  }

  private setupObservation(): void {
    if (this.observer) return;

    const startObserving = () => {
      if (!document.body || this.observer) return;
      let debounceTimer: any = null;
      this.observer = new MutationObserver(() => {
        if (debounceTimer) return;
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          this.mountInTopHeader();
        }, 120);
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.body) {
      startObserving();
    } else {
      document.addEventListener('DOMContentLoaded', startObserving, { once: true });
    }
  }

  public destroy(): void {
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.removeEventListeners) {
      this.removeEventListeners();
      this.removeEventListeners = null;
    }
    if (this.headerTabsContainer && this.headerTabsContainer.parentNode) {
      this.headerTabsContainer.parentNode.removeChild(this.headerTabsContainer);
      this.headerTabsContainer = null;
    }
    AcademicPanel.instance = null;
  }
}
