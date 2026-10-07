# AcademiCal Desktop — Academic Companion for Google Calendar

[![CI Quality Gate](https://github.com/dario/academic-calendar-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/dario/academic-calendar-desktop/actions)
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

## 🚀 Inicio Rápido

### Requisitos Previos
* **Node.js**: v20.x o v22.x LTS
* **npm**: v10+
* **Sistema Operativo**: Windows 10 u 11 (64-bit)

### Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/dario/academic-calendar-desktop.git
cd academic-calendar-desktop

# 2. Instalar dependencias de desarrollo
npm install

# 3. Ejecutar suite de pruebas unitarias automatizadas
npm test

# 4. Compilar TypeScript y paquetes Preload
npm run build

# 5. Iniciar la aplicación
npm start
```

### Crear Accesos Directos Nativos en Windows

Para anclar la aplicación al **Menú de Inicio** y al **Escritorio** de Windows sin necesidad de abrir la consola:

```bash
npm run shortcut
```

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

1. **Gestión Académica por Contexto**:
   * **Pestaña CLASES**: Muestra exclusivamente los calendarios de tus asignaturas lectivas.
   * **Pestaña ENTREGAS Y EXÁMENES**: Aísla tus hitos críticos (exámenes y fechas de entrega de proyectos) y te permite crear nuevos eventos con un solo clic.
   * **Pestaña TODO**: Vista global unificada de todas tus categorías académicas y tareas.
   * **Eliminación de Distracciones**: Oculta permanentemente elementos que saturan la interfaz como cumpleaños, accesos promocionales y botones no relevantes para el estudio.

2. **Diseño Visual "Badge Pro"**:
   * **Exámenes**: Chips destacados con fondo sólido e intenso en el color de la asignatura, tipografía de alto contraste y borde dorado distintivo.
   * **Entregas**: Chips en tonos pastel suaves derivados matemáticamente mediante HSL sobre el color oficial del calendario, con bordes reforzados.
   * **Gestión de Entregas Realizadas**: Permite atenuar entregas completadas con reducción de opacidad y escala de grises para despejar la vista semanal.

3. **Tematización Dinámica Reactiva**:
   * Sincronización inmediata con el modo Oscuro/Claro tanto de Google Calendar como de Windows mediante `MutationObserver` y `matchMedia`, sin requerir reinicio de la aplicación.

4. **Navegación Fluida por Teclado**:
   * Navegación rápida entre semanas usando las teclas `<` y `>` o las flechas de dirección.

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
│   │   ├── ui/               # Pestañas superiores, modal de creación y modal de detalle
│   │   └── utils/            # Utilidades de DOM seguras frente a CSP
│   ├── shared/               # Constantes, tipos TypeScript y formateadores compartidos
│   └── tests/                # Pruebas automatizadas con Node.js Test Runner
├── assets/                   # Iconos y recursos de la aplicación
├── tools/
│   └── debug-scripts/        # Herramientas de ingeniería inversa y benchmarking de desarrollo
├── scripts/
│   └── create-shortcut.js    # Utilidad nativa para accesos directos en Windows
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

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
