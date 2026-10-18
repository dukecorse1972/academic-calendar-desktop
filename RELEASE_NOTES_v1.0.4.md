# 🎓 Cursa — v1.0.4 Official Release

> **The High-Performance Academic Companion and Productivity Workstation for Google Calendar on Windows.**

We are pleased to announce the release of **Cursa v1.0.4**! This milestone release represents the complete transition from an internal personal tool into a fully generalized, production-ready desktop workstation for students, researchers, and educators anywhere.

---

## 📥 Downloads & Assets

| Asset | Platform | Description | Size |
|---|---|---|---|
| 🚀 [**Cursa-Setup-1.0.4.exe**](https://github.com/dukecorse1972/cursa/releases/download/v1.0.4/Cursa-Setup-1.0.4.exe) | Windows 10/11 x64 | **Official NSIS Installer (Recommended)**: Per-user install, zero UAC elevation, desktop & start menu shortcuts. | ~80 MB |
| 📦 [**Cursa-v1.0.4-windows-x64.zip**](https://github.com/dukecorse1972/cursa/releases/download/v1.0.4/Cursa-v1.0.4-windows-x64.zip) | Windows 10/11 x64 | **Portable Distribution**: Unzip anywhere, run on USB drives without touching registry. | ~115 MB |
| 📝 [**Source Code (zip)**](https://github.com/dukecorse1972/cursa/archive/refs/tags/v1.0.4.zip) | Multi-platform | Full TypeScript codebase, 84 automated tests, and build scripts. | — |

---

## 🌟 What's New in v1.0.4

### 1. 🌐 Full Creator Independence & Generalization
- **Dynamic Google Account Indexing**: Supports multi-account setups seamlessly (`/u/0/`, `/u/1/`, `/u/2/`...). URLs are dynamically constructed based on the active logged-in Google profile.
- **Account-Isolated Local Storage**: User preferences, course configurations, and custom subjects are isolated per Google Account hash, preventing configuration bleed when switching accounts.
- **External University Feeds Preserved**: External calendar subscriptions (campus schedules, department announcements) are preserved and categorizable rather than aggressively hidden.

### 2. 🌍 Resilient Multilingual Support & Semantic Cascade
- **Semantic Selector Fallbacks**: DOM interaction engine expanded with multilingual ARIA and label selectors across Spanish, English, Catalan, Galician, French, and German for calendar actions (save, delete, view menus).
- **Resilient Date & Duration Parsers**: Robust date parsing supporting both Spanish (`"20 de noviembre de 2026"`) and English (`"November 20, 2026"` / `"20 November 2026"`) formats, with deterministic midnight rollover handling.
- **Deterministic i18n Engine**: Language resolution updated to support modern Node.js v21+ runtime standards while honoring user-selected UI locales.

### 3. 🎨 Aesthetic Customization & Onboarding Wizard
- **Interactive First-Run Wizard**: Beautiful guided onboarding modal for configuring subjects, picking author color palettes (Zebra Mildliner™, Catppuccin™, Nord™, Morandi), and setting academic preferences.
- **Dynamic Reconfiguration**: Press `Ctrl+,` or click `🎓 Ajustes de Curso` in Google Calendar's gear menu to edit your courses at any point during the term.
- **Badge Pro Academic Chips**: Distinctive visual hierarchy distinguishing exams (bold, golden accent borders) from assignment deliverables (soft dynamic HSL pastel tones) and completed items.

### 4. 🛡️ Rock-Solid Automated Quality Gate
- **84 Automated Unit & Integration Tests**: Expanded test coverage across 21 suites covering runtime contracts, payload validators, DOM strategies, color palettes, and privacy isolation.
- **Multi-OS GitHub Actions CI Matrix**: Automated quality gates verifying every build across Windows and Ubuntu on Node 20.x and Node 22.x with zero flaky tests.

---

## 💻 System Requirements
- **OS**: Windows 10 or Windows 11 (64-bit)
- **Account**: Google Account with Google Calendar
- **Installation**: No administrative privileges required (`%LOCALAPPDATA%\Programs\Cursa`)
