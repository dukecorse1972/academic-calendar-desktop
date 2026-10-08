# AcademiCal Desktop — Academic Companion for Google Calendar

[![Download Installer](https://img.shields.io/badge/Descargar-Instalador_.exe_(v1.0.0)-2563eb?logo=windows&logoColor=white)](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/AcademiCal.Desktop-Setup-1.0.0.exe)
[![Portable Zip](https://img.shields.io/badge/Descargar-Portable_.zip_(x64)-475569?logo=zip&logoColor=white)](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/AcademiCal-Desktop-v1.0.0-windows-x64.zip)
[![Release Notes](https://img.shields.io/badge/Release-v1.0.0-emerald?logo=github&logoColor=white)](https://github.com/dukecorse1972/academic-calendar-desktop/releases/latest)
[![CI Quality Gate](https://github.com/dukecorse1972/academic-calendar-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/dukecorse1972/academic-calendar-desktop/actions)
[![Electron](https://img.shields.io/badge/Electron-33.4.11-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Aplicación de escritorio de alto rendimiento para **Windows** que proporciona la experiencia completa de **Google Calendar** integrada con una capa personalizada de gestión y productividad académica (filtrado dinámico de asignaturas, control de entregas y exámenes, cálculo inteligente de contrastes de color y tematización reactiva).

---

> [!NOTE]
> ### ⚖️ Aviso Legal y de Marcas Registradas (Legal Disclaimer)
> Este proyecto es un desarrollo independiente de código abierto con fines educativos y de productividad personal. **No** está afiliado, respaldado, patrocinado ni certificado por Google LLC ni Alphabet Inc. *Google*, *Google Calendar* y sus respectivos logotipos son marcas registradas de Google LLC.

---

## 🚀 Descarga e Instalación

AcademiCal Desktop ofrece múltiples métodos de instalación adaptados tanto a estudiantes y usuarios finales como a desarrolladores:

### 🌟 Método 1: Instalador Oficial para Windows (Recomendado)

La forma más rápida, cómoda y visual de disfrutar de AcademiCal Desktop:

1. **Descarga directa con 1 clic**: Haz clic en el botón superior o descarga directamente [`AcademiCal Desktop-Setup-1.0.0.exe`](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/AcademiCal.Desktop-Setup-1.0.0.exe) (también disponible en la [pestaña oficial de Releases](https://github.com/dukecorse1972/academic-calendar-desktop/releases/latest)).
2. **Ejecuta el archivo**: Haz doble clic sobre el instalador descargado.
3. **Instalación sin complicaciones**:
   * **Cero requisitos**: No requiere tener instalado Node.js, npm ni Git.
   * **Sin permisos de Administrador**: Instalación segura por usuario en `%LOCALAPPDATA%\Programs\AcademiCal Desktop`, sin molestas ventanas de elevación UAC.
   * **Experiencia visual moderna**: Asistente con interfaz personalizada, temática visual académica y banner de bienvenida.
   * **Accesos directos automáticos**: Genera accesos directos automáticos en el **Escritorio** y en el **Menú de Inicio**.
   * **Lanzamiento inmediato**: Se inicia automáticamente al finalizar la instalación.
   * **Desinstalación limpia**: Integración total con *Configuración de Windows > Aplicaciones instaladas*.

---

### 📦 Método 2: Versión Portable (.zip)

Ideal si prefieres llevar la aplicación en una memoria USB o ejecutarla sin modificar el registro del sistema:

1. Descarga el paquete [`AcademiCal-Desktop-v1.0.0-windows-x64.zip`](https://github.com/dukecorse1972/academic-calendar-desktop/releases/download/v1.0.0/AcademiCal-Desktop-v1.0.0-windows-x64.zip).
2. Descomprime la carpeta en cualquier ubicación de tu equipo.
3. Ejecuta `AcademiCal Desktop.exe` para empezar a trabajar de inmediato.

---

### 💻 Método 3: Entorno de Desarrollo (Código Fuente)

Si eres desarrollador, estudiante de ingeniería o deseas auditar y compilar el código por ti mismo:

#### Requisitos Previos
* **Node.js**: v20.x o v22.x LTS (compatible con Node 24)
* **npm**: v10+
* **Sistema Operativo**: Windows 10 u 11 (64-bit)

#### Pasos de Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/dukecorse1972/academic-calendar-desktop.git
cd academic-calendar-desktop

# 2. Instalar dependencias de desarrollo
npm install

# 3. Ejecutar la suite de pruebas automatizadas (51 tests)
npm test

# 4. Iniciar la aplicación en modo desarrollo
npm start
```

#### Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Compila TypeScript y arranca la aplicación con recarga. |
| `npm test` | Ejecuta la suite completa de 51 pruebas unitarias e integradas con el runner nativo de Node.js. |
| `npm run build` | Compila TypeScript del proceso principal y empaqueta el preload bundle con esbuild. |
| `npm run dist` | Empaqueta la aplicación y compila el instalador oficial NSIS (`.exe`) en `release/`. |
| `npm run pack` | Genera la versión desempaquetada portable en `release/win-unpacked/`. |
| `npm run shortcut` | Crea accesos directos de Windows para el entorno local de desarrollo. |

---

## 🏛️ Arquitectura del Sistema

El proyecto opera bajo un modelo de desacoplamiento en 4 capas sobre Electron:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   WINDOWS DESKTOP APPLICATION                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    ELECTRON MAIN PROCESS                         │  │
│  │  - Partición persistente aislada ('persist:gcal_session')        │  │
│  │  - Gestión de ventanas seguras (contextIsolation + sandbox)      │  │
│  │  - Restricción estricta de permisos por origen                   │  │
│  │  - Single Instance Lock (instancia única)                        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ IPC Bridge                       │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                       PRELOAD CONTEXT                            │  │
│  │  - Exposición segura vía contextBridge ('window.gcalDesktopAPI') │  │
│  │  - Detección de ciclo de vida DOM (DOMContentLoaded / Load)      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ DOM Injection                    │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                   ACADEMIC WORKSTATION LAYER                     │  │
│  │  - AppState (Patrón Observador reactivo / Fuente Única de Verdad)│  │
│  │  - ThemeManager (Detección de temas claro/oscuro en tiempo real) │  │
│  │  - GoogleCalendarAdapter (Normalización de layout y estilos)     │  │
│  │  - Pestañas integradas: [CLASES] | [ENTREGAS Y EXÁMENES] | [TODO]│  │
│  │  - Modales nativos: Creador y Visor extendido de eventos         │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                   GOOGLE CALENDAR WEB CORE                       │  │
│  │  - Sincronización oficial de cuenta, eventos, notificaciones     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Características Principales

1. **Asistente de Configuración Inicial (Onboarding Wizard)**:
   * **Detección inteligente de primer inicio**: Si el estudiante no tiene Google Calendar configurado, se despliega un asistente visual que le guía en 30 segundos.
   * **Gestión dinámica de asignaturas**: Permite añadir, renombrar y eliminar las asignaturas reales que cursa este cuatrimestre, sin depender de nombres fijos ficticios.
   * **Configuración automática de Exámenes y Entregas**: Automatiza la creación en segundo plano y vinculación de los calendarios por defecto oficiales (*Exámenes* y *Entregas*).

2. **Paletas de Color Especializadas y Curadas**:
   * Selección en 1 clic entre 4 paletas estéticas oficiales extraídas de la teoría del color y papelería de estudio:
     * **Zebra Mildliner™ Pastel**: Tonos japoneses suaves para estudio universitario (*GoodNotes*, *Notion*).
     * **Catppuccin™ Pastel**: Paleta moderna de alto contraste para interfaces limpias.
     * **Nord™ Frost & Aurora**: Diseño ártico nórdico equilibrado.
     * **Morandi Editorial**: Tonos terrosos y apagados elegantes.

3. **Gestión Académica por Contexto**:
   * **Pestaña CLASES**: Muestra exclusivamente los calendarios de tus asignaturas lectivas.
   * **Pestaña ENTREGAS Y EXÁMENES**: Aísla tus hitos críticos (exámenes y fechas de entrega de proyectos) y te permite crear nuevos eventos con un solo clic.
   * **Pestaña TODO**: Vista global unificada de todas tus categorías académicas y tareas.
   * **Eliminación de Distracciones**: Oculta permanentemente elementos que saturan la interfaz como cumpleaños, accesos promocionales y botones no relevantes para el estudio.

4. **Diseño Visual "Badge Pro"**:
   * **Exámenes**: Chips destacados con fondo sólido e intenso en el color de la asignatura, tipografía de alto contraste y borde dorado distintivo.
   * **Entregas**: Chips en tonos pastel suaves derivados matemáticamente mediante HSL sobre el color oficial del calendario, con bordes reforzados.
   * **Gestión de Entregas Realizadas**: Permite atenuar entregas completadas con reducción de opacidad y escala de grises para despejar la vista semanal.

5. **Tematización Dinámica Reactiva**:
   * Sincronización inmediata con el modo Oscuro/Claro tanto de Google Calendar como de Windows mediante `MutationObserver` y `matchMedia`, sin requerir reinicio de la aplicación.

6. **Simulador y Demostración 1:1 Interactiva**:
   * Incluye [`walkthrough-1to1.html`](walkthrough-1to1.html) y [`walkthrough.html`](walkthrough.html), simuladores autocontenidos a escala real de la ventana de Windows y Google Calendar para visualizar e interactuar con el flujo sin alterar la configuración del sistema.

---

## 🔒 Modelo de Seguridad

* **Aislamiento de Contexto (`contextIsolation: true`)**: El código web nunca tiene acceso directo a Node.js ni a los recursos del sistema operativo.
* **Sandbox (`sandbox: true`)**: Los procesos de renderizado se ejecutan confinados dentro del sandbox nativo de Chromium.
* **Control de Permisos de Mínimo Privilegio**: El manejador de sesiones deniega por defecto todo acceso a dispositivos (cámara, micrófono, geolocalización) y concede exclusivamente notificaciones para el dominio oficial de Google Calendar.
* **Sesión Aislada en Disco**: La partición `persist:gcal_session` conserva el inicio de sesión del usuario en `%APPDATA%\google-calendar-win` sin contaminar perfiles del navegador principal ni exponer tokens al exterior.

---

## 📂 Estructura del Código

```text
├── src/
│   ├── main/                 # Proceso principal de Electron (Ventanas, sesiones, IPC)
│   ├── preload/              # Script de puente aislado con contextBridge
│   ├── injected/             # Capa académica inyectada en el DOM de Google Calendar
│   │   ├── adapter/          # Adaptador de estilos y normalización del DOM
│   │   ├── theme/            # Motor de tokens y detección de temas Light/Dark
│   │   ├── ui/               # Pestañas, modal de creación, visor de detalle y onboarding
│   │   └── utils/            # Utilidades de DOM seguras frente a CSP
│   ├── shared/               # Constantes, tipos TypeScript, formateadores y paletas
│   └── tests/                # 51 pruebas automatizadas con Node.js Test Runner
├── assets/                   # Iconos e identidad visual (ico, png y banners del instalador)
├── walkthrough-1to1.html     # Simulador visual 1:1 de Google Calendar y la capa académica
├── walkthrough.html          # Guía interactiva paso a paso del flujo de onboarding
├── package.json
└── tsconfig.json
```

---

## 🧪 Pruebas Automatizadas

El proyecto utiliza el **Node.js Test Runner nativo** (`node:test` y `node:assert/strict`), garantizando una ejecución ultrarrápida (menos de 250ms) sin dependencias externas:

```bash
# Ejecutar la suite completa de pruebas
npm test
```

---

## 📦 Empaquetado y Distribución Profesional

AcademiCal Desktop utiliza **electron-builder** con el motor **NSIS (Nullsoft Scriptable Install System)** configurado para una experiencia de usuario moderna, atractiva y sin fricción:

* **Instalación por usuario (`perMachine: false`)**: Se instala en `%LOCALAPPDATA%\Programs\AcademiCal Desktop`, permitiendo la instalación inmediata en cualquier equipo sin requerir contraseña de administrador ni ventanas de advertencia UAC.
* **Asistente Visual Personalizado**: Presenta una interfaz de bienvenida con temática académica, banner lateral ilustrado con el logotipo de la aplicación y accesos directos configurados.
* **Integración Completa con Windows**: Registra la aplicación en el Menú de Inicio y crea el acceso directo en el Escritorio.
* **Desinstalación Nativa y Limpia**: Integra la desinstalación en *Configuración de Windows > Aplicaciones instaladas*.

Para generar un nuevo instalador compilado:

```bash
npm run dist
```

Los artefactos resultantes se almacenan en `release/`:
* `AcademiCal Desktop-Setup-1.0.0.exe`: Instalador interactivo oficial (~80 MB).
* `AcademiCal-Desktop-v1.0.0-windows-x64.zip`: Distribución portable lista para usar (~115 MB).

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
