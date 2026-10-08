import { PREDEFINED_PALETTES, ColorPalette, getPaletteById } from '../../shared/palettes';
import { GoogleCalendarAdapter } from '../adapter/GoogleCalendarAdapter';
import { safeSetInnerHTML, escapeHtml } from '../utils/dom';

export interface SubjectConfig {
  name: string;
  color: string;
}

export class OnboardingModal {
  private static instance: OnboardingModal | null = null;
  private modalOverlay: HTMLElement | null = null;
  private selectedPaletteId: string = 'mildliner';
  private subjects: SubjectConfig[] = [
    { name: 'Matemáticas', color: '#98D5E8' },
    { name: 'Física', color: '#A1D0CA' },
    { name: 'Programación', color: '#FFB6D9' },
    { name: 'Economía', color: '#F0F4A3' }
  ];

  public static getInstance(): OnboardingModal {
    if (!OnboardingModal.instance) {
      OnboardingModal.instance = new OnboardingModal();
    }
    return OnboardingModal.instance;
  }

  private constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const storedPalette = localStorage.getItem('gcal_active_palette');
      if (storedPalette) {
        this.selectedPaletteId = storedPalette;
      }
      const storedSubjects = localStorage.getItem('gcal_academic_subjects');
      if (storedSubjects) {
        const parsed = JSON.parse(storedSubjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.subjects = parsed;
        }
      } else {
        this.applyPaletteColorsToSubjects();
      }
    } catch (_) {}
  }

  private applyPaletteColorsToSubjects(): void {
    const palette = getPaletteById(this.selectedPaletteId);
    this.subjects.forEach((sub, idx) => {
      const colorItem = palette.colors[idx % palette.colors.length];
      sub.color = colorItem.hex;
    });
  }

  public open(): void {
    this.loadFromStorage();
    if (this.modalOverlay) {
      this.modalOverlay.remove();
      this.modalOverlay = null;
    }
    this.render();
  }

  public close(): void {
    if (this.modalOverlay) {
      this.modalOverlay.remove();
      this.modalOverlay = null;
    }
  }

  private render(): void {
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'gcal-onboarding-modal-overlay';
    this.modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;
    `;

    const activePalette = getPaletteById(this.selectedPaletteId);

    safeSetInnerHTML(
      this.modalOverlay,
      `
      <div id="gcal-onboarding-card" style="
        background: var(--gcal-surface, #ffffff);
        color: var(--gcal-text, #1f1f1f);
        border: 1px solid var(--gcal-border, #dadce0);
        border-radius: 20px;
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.28);
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 20px;
              background: var(--gcal-surface-hover, #f1f3f4);
              color: var(--gcal-accent, #1a73e8);
              font-size: 11.5px;
              font-weight: 700;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            ">
              <span>🎓</span> <span>BIENVENIDO A ACADEMICAL</span>
            </div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: var(--gcal-text, #1f1f1f);">
              Configuración Inicial de tu Curso
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 13.5px; color: var(--gcal-secondary-text, #5f6368); line-height: 1.45;">
              Personaliza tus asignaturas con paletas de color estéticas y exclusivas para organizar tus exámenes y entregas automáticamente.
            </p>
          </div>
          <button id="gcal-onboarding-close" type="button" style="
            background: transparent;
            border: none;
            color: var(--gcal-secondary-text, #5f6368);
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
          " title="Cerrar">✕</button>
        </div>

        <!-- Section 1: Predefined Curated Palettes -->
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: var(--gcal-secondary-text, #5f6368); margin-bottom: 10px;">
            1. PALETA DE COLOR ESPECIALIZADA
          </label>
          <div id="gcal-palettes-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${PREDEFINED_PALETTES.map((pal) => {
              const isSelected = pal.id === this.selectedPaletteId;
              return `
                <div class="gcal-palette-card" data-palette-id="${pal.id}" style="
                  padding: 12px 14px;
                  border-radius: 12px;
                  border: 2px solid ${isSelected ? 'var(--gcal-accent, #1a73e8)' : 'var(--gcal-border, #dadce0)'};
                  background: ${isSelected ? 'var(--gcal-selected, #e8f0fe)' : 'var(--gcal-surface, #ffffff)'};
                  cursor: pointer;
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  transition: all 0.18s ease;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--gcal-text, #1f1f1f);">${escapeHtml(pal.name)}</span>
                    ${isSelected ? '<span style="color: var(--gcal-accent, #1a73e8); font-size: 13px; font-weight: 800;">✓</span>' : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--gcal-secondary-text, #5f6368); line-height: 1.25;">
                    ${escapeHtml(pal.subtitle)}
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                    ${pal.colors.slice(0, 6).map((c) => `
                      <span style="
                        width: 17px;
                        height: 17px;
                        border-radius: 50%;
                        background-color: ${c.hex};
                        display: inline-block;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                        border: 1px solid rgba(0,0,0,0.08);
                      " title="${escapeHtml(c.name)} (${c.hex})"></span>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 2: Subjects Management -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: var(--gcal-secondary-text, #5f6368);">
              2. TUS ASIGNATURAS DE ESTE CURSO
            </label>
            <span style="font-size: 11.5px; color: var(--gcal-secondary-text, #5f6368);">
              ${this.subjects.length} asignatura(s)
            </span>
          </div>

          <div id="gcal-subjects-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${this.renderSubjectRows(activePalette)}
          </div>

          <button id="gcal-add-subject-btn" type="button" style="
            margin-top: 10px;
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px dashed var(--gcal-border, #dadce0);
            background: var(--gcal-surface-hover, #f1f3f4);
            color: var(--gcal-accent, #1a73e8);
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background 0.15s ease;
          ">+ Añadir otra asignatura</button>
        </div>

        <!-- Section 3: Default Academic Calendars Info -->
        <div style="
          background: var(--gcal-surface-hover, #f8fafd);
          border: 1px solid var(--gcal-border, #dadce0);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        ">
          <div style="font-size: 12px; font-weight: 700; color: var(--gcal-text, #1f1f1f); display: flex; align-items: center; gap: 6px;">
            <span>⚡</span> <span>3. Calendarios Académicos Predeterminados</span>
          </div>
          <div style="font-size: 12px; color: var(--gcal-secondary-text, #5f6368); line-height: 1.45;">
            Se configurarán automáticamente los destinos oficiales:
            <span style="font-weight: 600; color: var(--gcal-text, #1f1f1f);">📋 Exámenes</span> (para parciales y finales) y
            <span style="font-weight: 600; color: var(--gcal-text, #1f1f1f);">🗓️ Entregas</span> (para proyectos y prácticas).
          </div>
        </div>

        <!-- Error Message -->
        <div id="gcal-onboarding-error" style="
          display: none;
          font-size: 12px;
          color: #d93025;
          font-weight: 600;
          background: #fce8e6;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #fad2cf;
        "></div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
          <button id="gcal-onboarding-cancel" type="button" style="
            padding: 10px 18px;
            border-radius: 10px;
            border: 1px solid var(--gcal-border, #dadce0);
            background: transparent;
            color: var(--gcal-text, #1f1f1f);
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
          ">Omitir por ahora</button>

          <button id="gcal-onboarding-submit" type="button" style="
            padding: 10px 24px;
            border-radius: 10px;
            border: none;
            background: var(--gcal-accent, #1a73e8);
            color: #ffffff;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 3px 8px rgba(26, 115, 232, 0.35);
          ">
            <span>Comenzar con AcademiCal ➔</span>
          </button>
        </div>
      </div>
      `
    );

    document.body.appendChild(this.modalOverlay);
    this.setupListeners();
  }

  private renderSubjectRows(palette: ColorPalette): string {
    return this.subjects.map((sub, index) => {
      return `
        <div class="gcal-subject-row" data-index="${index}" style="
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--gcal-surface, #ffffff);
          border: 1px solid var(--gcal-border, #dadce0);
          border-radius: 10px;
          padding: 6px 10px;
        ">
          <!-- Color picker / circle -->
          <div style="position: relative;">
            <button type="button" class="gcal-subj-color-dot" data-index="${index}" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background-color: ${sub.color};
              border: 2px solid #ffffff;
              box-shadow: 0 0 0 1px var(--gcal-border, #dadce0);
              cursor: pointer;
              display: block;
              padding: 0;
            " title="Cambiar tono"></button>
            
            <!-- Quick palette swatch picker dropdown -->
            <div class="gcal-swatch-popover" data-index="${index}" style="
              display: none;
              position: absolute;
              top: 30px;
              left: 0;
              background: var(--gcal-surface, #ffffff);
              border: 1px solid var(--gcal-border, #dadce0);
              border-radius: 8px;
              padding: 6px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 10000;
              display: none;
              gap: 4px;
            ">
              ${palette.colors.map((c) => `
                <span class="gcal-swatch-opt" data-index="${index}" data-color="${c.hex}" style="
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  background: ${c.hex};
                  cursor: pointer;
                  display: inline-block;
                "></span>
              `).join('')}
            </div>
          </div>

          <!-- Subject Name Input -->
          <input type="text" class="gcal-subj-name-input" data-index="${index}" value="${escapeHtml(sub.name)}" placeholder="Nombre de la asignatura (ej. Álgebra, Física...)" style="
            flex: 1;
            border: none;
            background: transparent;
            color: var(--gcal-text, #1f1f1f);
            font-size: 13.5px;
            font-weight: 500;
            outline: none;
            padding: 4px 2px;
          " />

          <!-- Delete row button -->
          ${this.subjects.length > 1 ? `
            <button type="button" class="gcal-subj-remove-btn" data-index="${index}" style="
              background: transparent;
              border: none;
              color: var(--gcal-disabled, #9aa0a6);
              cursor: pointer;
              font-size: 14px;
              padding: 4px 8px;
              border-radius: 6px;
              transition: color 0.15s ease;
            " title="Eliminar asignatura" onmouseover="this.style.color='#d93025'" onmouseout="this.style.color='var(--gcal-disabled, #9aa0a6)'">✕</button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  private setupListeners(): void {
    if (!this.modalOverlay) return;

    const closeBtn = this.modalOverlay.querySelector('#gcal-onboarding-close');
    const cancelBtn = this.modalOverlay.querySelector('#gcal-onboarding-cancel');
    const submitBtn = this.modalOverlay.querySelector('#gcal-onboarding-submit');
    const addBtn = this.modalOverlay.querySelector('#gcal-add-subject-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // 1. Palette card selection
    const paletteCards = this.modalOverlay.querySelectorAll('.gcal-palette-card');
    paletteCards.forEach((card) => {
      card.addEventListener('click', () => {
        const palId = card.getAttribute('data-palette-id');
        if (!palId) return;
        this.selectedPaletteId = palId;
        this.syncInputsToState();
        this.applyPaletteColorsToSubjects();
        this.render();
      });
    });

    // 2. Add subject button
    addBtn?.addEventListener('click', () => {
      this.syncInputsToState();
      const palette = getPaletteById(this.selectedPaletteId);
      const nextColor = palette.colors[this.subjects.length % palette.colors.length].hex;
      this.subjects.push({ name: '', color: nextColor });
      this.render();
      // Focus on the new input
      setTimeout(() => {
        const inputs = this.modalOverlay?.querySelectorAll<HTMLInputElement>('.gcal-subj-name-input');
        if (inputs && inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }, 50);
    });

    // 3. Remove subject button
    const removeBtns = this.modalOverlay.querySelectorAll('.gcal-subj-remove-btn');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
        this.syncInputsToState();
        this.subjects.splice(idx, 1);
        this.render();
      });
    });

    // 4. Color popover toggling
    const colorDots = this.modalOverlay.querySelectorAll('.gcal-subj-color-dot');
    colorDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = dot.getAttribute('data-index');
        const popover = this.modalOverlay?.querySelector<HTMLElement>(`.gcal-swatch-popover[data-index="${idx}"]`);
        if (popover) {
          const isOpen = popover.style.display === 'flex';
          // Close all popovers
          this.modalOverlay?.querySelectorAll<HTMLElement>('.gcal-swatch-popover').forEach((p) => p.style.display = 'none');
          popover.style.display = isOpen ? 'none' : 'flex';
        }
      });
    });

    // Color swatch option selection
    const swatchOpts = this.modalOverlay.querySelectorAll('.gcal-swatch-opt');
    swatchOpts.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(opt.getAttribute('data-index') || '0', 10);
        const color = opt.getAttribute('data-color');
        if (color && this.subjects[idx]) {
          this.subjects[idx].color = color;
          this.syncInputsToState();
          this.render();
        }
      });
    });

    // Close swatch popover on outside click
    this.modalOverlay.addEventListener('click', () => {
      this.modalOverlay?.querySelectorAll<HTMLElement>('.gcal-swatch-popover').forEach((p) => p.style.display = 'none');
    });

    // 5. Submit handler
    submitBtn?.addEventListener('click', () => this.handleSubmit());
  }

  private syncInputsToState(): void {
    if (!this.modalOverlay) return;
    const inputs = this.modalOverlay.querySelectorAll<HTMLInputElement>('.gcal-subj-name-input');
    inputs.forEach((input) => {
      const idx = parseInt(input.getAttribute('data-index') || '0', 10);
      if (this.subjects[idx]) {
        this.subjects[idx].name = input.value.trim();
      }
    });
  }

  private async handleSubmit(): Promise<void> {
    this.syncInputsToState();

    const validSubjects = this.subjects.filter((s) => s.name.length > 0);
    const errorEl = this.modalOverlay?.querySelector('#gcal-onboarding-error') as HTMLElement;

    if (validSubjects.length === 0) {
      if (errorEl) {
        errorEl.textContent = 'Por favor, escribe el nombre de al menos una asignatura.';
        errorEl.style.display = 'block';
      }
      return;
    }

    this.subjects = validSubjects;

    // 1. Save to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gcal_academic_onboarding_completed', 'true');
        localStorage.setItem('gcal_active_palette', this.selectedPaletteId);
        localStorage.setItem('gcal_academic_subjects', JSON.stringify(this.subjects));

        // Save color mapping
        const colorMap: Record<string, string> = {};
        this.subjects.forEach((s) => {
          colorMap[s.name.toLowerCase().trim()] = s.color;
        });
        localStorage.setItem('gcal_subject_colors', JSON.stringify(colorMap));
      } catch (_) {}
    }

    // 2. Request background creation of secondary calendars in Google Calendar
    const desktopApi = (typeof window !== 'undefined' ? (window as any).gcalDesktopAPI : null);
    if (desktopApi && typeof desktopApi.ensureAcademicCalendarsBackground === 'function') {
      try {
        desktopApi.ensureAcademicCalendarsBackground(['Exámenes', 'Entregas']);
      } catch (_) {}
    }

    // 3. Update Adapter state immediately
    const adapter = GoogleCalendarAdapter.getInstance();
    adapter.tagCalendarRows();
    adapter.enhanceAcademicChips();

    // 4. Show success toast
    this.showToast('✓ ¡Asignaturas y paleta configuradas correctamente!');

    // 5. Close modal
    this.close();
  }

  private showToast(msg: string): void {
    if (typeof document === 'undefined') return;
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      z-index: 1000000;
      opacity: 1;
      transition: opacity 0.3s ease;
      font-family: inherit;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}
