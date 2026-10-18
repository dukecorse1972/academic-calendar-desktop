# 🎓 Cursa — v1.0.0 Official Release

> **The High-Performance Academic Companion and Productivity Workstation for Google Calendar on Windows.**

We are thrilled to announce the official **v1.0.0** release of **Cursa**! Designed by a Computer Engineering student initially for personal university course organization, Cursa has evolved into a production-grade, privacy-first, generalist productivity workstation for university students, educators, and lifelong learners.

---

## 📥 Downloads & Assets

| Asset | Platform | Description | Size |
|---|---|---|---|
| 🚀 [**Cursa-Setup-1.0.0.exe**](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/Cursa-Setup-1.0.0.exe) | Windows 10/11 x64 | **Official NSIS Installer (Recommended)**: Per-user install, zero UAC elevation, desktop & start menu shortcuts. | ~80 MB |
| 📦 [**Cursa-v1.0.0-windows-x64.zip**](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/Cursa-v1.0.0-windows-x64.zip) | Windows 10/11 x64 | **Portable Distribution**: Unzip anywhere, run on USB drives without touching registry. | ~115 MB |
| 📝 [**Source Code (zip)**](https://github.com/dukecorse1972/academic-calendar-desktop/archive/refs/tags/v1.0.0.zip) | Multi-platform | Full TypeScript codebase, automated test suite, and build scripts. | — |

---

## 🌟 What's New in v1.0.0

### 1. ⚙️ Seamless Native Settings Integration (`🎓 Ajustes de Curso`)
- **Native Gear Integration**: Rather than cluttering or distorting the Google Calendar top navigation bar, the Course Settings launcher is cleanly integrated directly inside Google's native gear menu (⚙️).
- **Zero Layout Distortion**: Google Calendar's search bar, view switcher, and avatar remain perfectly aligned.
- **Event Capture Guard**: Uses capture-phase event suppression (`useCapture: true`) and recursive attribute stripping (`jsaction`, `data-action`, `href`) to prevent Google Calendar from hijacking clicks and redirecting to the standard Google settings page.
- **Universal Shortcut**: Press `Ctrl+,` anywhere in the app to instantly open Course Settings, matching Windows desktop conventions.

### 2. 📚 Dynamic Subject Scaling (M3 P3)
- **Unlimited & Dynamic Course Management**: Support for any number of concurrent subjects (1, 6, 8, 10+ courses).
- **Sequential Index Numbering**: Clean visual numbering (`1.`, `2.`, `3.`...) for every subject row in the onboarding and course settings wizard.
- **Continuous Palette Cycling**: Adding new courses automatically cycles through the chosen aesthetic palette with fallback to a deterministic 10-shade hash algorithm.
- **Hot-Reloading**: Changes to subjects or colors immediately refresh sidebar tags and calendar chips without restarting.

### 3. 🎨 Curated Aesthetic Color Palettes
Transform plain calendars into modern, study-stationery inspired interfaces:
- **Zebra Mildliner™ Pastel**: Inspired by authentic Japanese study highlighters (GoodNotes, Notion).
- **Catppuccin™ Pastel**: Minimalist pastel palette optimized for light and dark environments.
- **Nord™ Frost & Aurora**: Cool arctic tones built for deep focus.
- **Morandi Editorial**: Sophisticated, muted earthy tones for a distraction-free aesthetic.

### 4. 🏷️ "Badge Pro" Academic Event Chips & HSL Contrast
- **Visual Distinction**:
  - **Exámenes**: Solid, high-contrast badges with golden accent borders and bold typography.
  - **Entregas**: Soft pastel chips calculated dynamically via HSL color transformation from the base calendar hue.
- **Completed Entregas ("Hecha")**: Toggle completed assignments with a single click, applying muted grayscale and opacity reduction to keep the weekly schedule clear.
- **Bilingual Date & Time Parsing**: Supports Spanish and English date formats in the detail modal (`AcademicDetailModal`) without falling back to today.

### 5. ⚡ Contextual Focus Modes & Keyboard Navigation
- **`[1]` CLASES**: Shows only active lecture and class calendars, hiding tasks and deadlines.
- **`[2]` ENTREGAS Y EXÁMENES**: Isolates milestone deadlines, projects, and exams.
- **`[3]` TODO**: Comprehensive view of all academic calendars and tasks.
- **Distraction-Free Environment**: Permanently filters clutter (promotional banners, "Cumpleaños", reservations, footer links).

### 6. 🔒 Zero-Trust Privacy & Security Architecture
- **Sandboxed Execution**: Chromium sandbox (`sandbox: true`) and strict context isolation (`contextIsolation: true`).
- **Direct Google Authentication**: No credentials or tokens pass through intermediate servers; authentication occurs directly against `accounts.google.com`.
- **Isolated Storage**: Partitioned session in `%APPDATA%\google-calendar-win\Partitions\persist_gcal_session`.
- **Zero Telemetry**: 100% offline-first application logic with zero remote logging or analytics.

---

## 🧪 Automated Quality Gate

All releases are verified against an extensive automated test suite run via Node.js native test runner:

```text
✔ 4. Academic Event Formatting and Google Calendar URL Construction (5/5)
✔ 5. Subject Colors & Option 1 HSL Adaptation (3/3)
✔ 6. Academic Event Extended View (Detail Modal) (9/9)
✔ 1. Shared Constants & Categories (5/5)
✔ 2. Design System and Theme Tokens (2/2)
✔ 3. Application State (Single Source of Truth) (4/4)
✔ 12. Academic Tab Keyboard Navigation & Shortcuts Contract (2/2)
✔ 13. Window Quitting State Control (System Tray) (1/1)
✔ 9. Structured Application Logger (2/2)
✔ 10. Specialized Color Palettes & Aesthetic Theme Systems (7/7)
✔ 11. Dynamic Academic Subjects & Resilient Calendar Integration (4/4)
✔ 8. Resilient DOM Selectors & Strategy Dictionaries (4/4)
✔ 7. Runtime Contract & Payload Validators (10/10)
─────────────────────────────────────────────────────────────────
Total: 58 tests | 13 suites | 58 passed | 0 failed (100% PASS)
Execution time: ~2.6 seconds
```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Context | Action |
|---|---|---|
| `1` | Global (when not typing) | Switch to **CLASES** view |
| `2` | Global (when not typing) | Switch to **ENTREGAS Y EXÁMENES** view |
| `3` | Global (when not typing) | Switch to **TODO** view |
| `Ctrl+,` | Global | Open **🎓 Ajustes de Curso** (Subject & Palette Config) |
| `Esc` | Modal open | Dismiss active modal (Detail / Creator / Onboarding) |
| `t` | Calendar Grid | Jump to today (native Google Calendar) |
| `j` / `k` | Calendar Grid | Previous / Next week or month (native Google Calendar) |

---

## 👥 Acknowledgments & Authorship

Developed with ❤️ by **Dario** ([@dukecorse1972](https://github.com/dukecorse1972)), Computer Engineering student.

*Licensed under the [MIT License](LICENSE).*
