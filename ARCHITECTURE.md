# Arquitectura de ServicIA PWA

Estructura de directorios optimizada para mantenibilidad y escalabilidad, sin build tools ni frameworks.

## Estructura

```
servicia-pwa/
├── index.html                    # SPA principal (app autenticada)
├── manifest.json                 # PWA: metadatos de instalación
├── sw.js                         # Service Worker: caché offline
├── ARCHITECTURE.md               # Este archivo
│
├── css/
│   ├── base.css                  # Tokens, reset, tipografía, utilidades
│   ├── layout.css                # Header, footer, main, vistas
│   ├── components.css            # Botones, campos, cards, chat, historial
│   ├── views/
│   │   ├── category.css          # Wizard: pasos 1-4, bloques diagnóstico
│   │   └── onboarding.css        # (Compartido en styles.css por ahora)
│   └── styles.css                # TODO: dividir en archivos arriba
│
├── js/
│   ├── data/
│   │   └── categorias.js         # CATEGORIAS, FRASES_EMERGENCIA (contenido puro)
│   │
│   ├── core/
│   │   ├── security.js           # Validación RUT, sanitización, anonimización
│   │   └── auth.js               # Login, registro, gestión de sesión
│   │
│   ├── services/
│   │   └── api.js                # Punto único: submitOrientation, executeDataCheck
│   │
│   ├── modules/
│   │   └── history.js            # Historial de consultas (localStorage)
│   │
│   ├── app.js                    # Bootstrap principal: init(), router, state, eventos
│   ├── onboarding.js             # Flow: preguntas → crear cuenta
│   │
│   └── [archivos antiguos - deprecados]
│       ├── auth.js.bak           # Original (respaldo)
│       ├── security.js           # Original (respaldo)
│       └── history.js            # Original (respaldo)
│
├── onboarding/
│   └── index.html                # SPA de bienvenida (previo login)
│
└── [ignorados]
    ├── .git/
    └── node_modules/ (no aplicable)
```

## Diseño de módulos

### `data/categorias.js`
**Responsabilidad:** Contenido de dominio (Embargo, Seguros, Portabilidad).
- `CATEGORIAS`: Arreglo con toda la info: preliminar, riesgos, items (subcasos), escalamiento.
- `FRASES_EMERGENCIA`: Frases de protección para botón emergente.
- **Cambio:** Cuando edites textos, contenido, links o agregues categorías, aquí es.
- **Ventaja:** App.js no toca contenido; datos centralizados y accesibles a otros módulos si es necesario.

### `core/security.js`
**Responsabilidad:** Validación, sanitización, privacidad.
- `validateRut()`: Validación según módulo 11 de SII.
- `formatRut()`: Formato 12.345.678-9.
- `sanitizeText()`: Remueve `<>` (defensa XSS).
- `anonymizeRut()`: RUT_****-K (registrar en historial sin PII).
- `pseudonymize()`: Hash reproducible para tokens.
- `redactText()`: Enmascara RUT, email, teléfono en texto libre.
- **Cambio:** Lógica de seguridad, validaciones, privacidad.

### `core/auth.js`
**Responsabilidad:** Autenticación, registro, persistencia de sesión.
- `login()`, `register()`: Flujo de acceso.
- `onboardApi()`: Crear usuario desde onboarding.
- `persistSession()`, `restoreSession()`: localStorage.
- `isAuthenticated()`, `getCurrentUser()`: Consultas de estado.
- **Cambio:** Lógica de acceso, gestión de usuarios, sesión.

### `services/api.js`
**Responsabilidad:** Punto único de entrada para backend (simulado ahora, real después).
- `submitOrientation()`: POST /api/orientacion (formulario personalizado).
- `executeDataCheck()`: POST /v1/patrimonio|polizas|subtel (cruce de datos).
- **Cambio:** Para conectar a backend real, actualiza aquí y el resto de la app no se entera.

### `modules/history.js`
**Responsabilidad:** Historial de consultas (per-user, localStorage).
- `init(ownerEmail)`: Cargar historial del usuario.
- `add()`: Guardar consulta (caso, RUT anon, resumen, timestamp).
- `getAll()`, `clear()`: Consultar y limpiar.
- **Cambio:** Lógica de persistencia de consultas.

### `app.js` (Bootstrap + View Layer)
**Responsabilidad:** Estado global, events, router visual, generación de UI.
- `App.state`: { currentCategory, currentItem, voices }
- `App.init()`: Punto de entrada al boot.
- `App.bindEvents()`: Listeners sobre DOM estático.
- `App.applyAuthState()`: Mostrar/ocultar vistas según autenticación.
- `App.renderCategories()`, `App.openCategory()`: Flujo paso a paso.
- `App.buildPreliminarStep()`, `App.buildEntradaStep()`, etc.: Factory para UI dinámica.
- `App.handleLogin()`, `App.handleFormSubmit()`: Handlers de eventos.
- `App.showView()`: Router por `hidden` attribute.
- `App.speakText()`: Web Speech API.
- **Cambio:** Lógica de presentación, renderizado, eventos.

### `onboarding.js`
**Responsabilidad:** Flow de bienvenida (preguntas → crear cuenta).
- `Onboarding.pasos`: Array de steps (welcome, nombre, edad, email, password, preocupación, resumen).
- `Onboarding.renderCard()`: Renderiza step actual.
- `Onboarding.enableSwipe()`: Arrastre táctil (desktop simulado).
- `Onboarding.finish()`: Call a `Auth.onboardApi()` y redirect a app.
- **Cambio:** Flow de onboarding, validaciones de pasos.

## Flujo de datos

```
[Usuario] 
   ↓ 
[HTML: botones, formularios]
   ↓ (Listeners en App.bindEvents)
[App handlers: handleLogin, handleFormSubmit, etc]
   ↓
[Core: Auth.login(), Security.validateRut()]
   ↓
[Services: API.submitOrientation(), API.executeDataCheck()]
   ↓
[Modules: Historial.add()]
   ↓
[App render: renderCategories(), buildPreliminarStep(), etc]
   ↓
[HTML: actualizado con createElement + appendChild]
   ↓
[Usuario ve cambio]
```

## localStorage Keys

| Clave | Propietario | Contenido |
|-------|------------|-----------|
| `servicia.session` | Auth | Sesión actual: { email, nombre } |
| `servicia.users` | Auth | Array de usuarios registrados |
| `servicia.history.<email>` | Historial | Array de consultas del usuario |
| `servicia.onboarding` | Onboarding | Datos in-progress del flow |

## Cómo agregar una nueva categoría

1. Edita `js/data/categorias.js`:
   - Agrega un objeto a `CATEGORIAS` con estructura igual a "embargo-falso" (id, title, items, preliminar, escalamiento, cruce).

2. Los campos que necesitas:
   - `id`: Identificador único.
   - `title`: Nombre largo.
   - `short`: Subtítulo corto.
   - `description`: Explicación de qué es el caso.
   - `preliminar.resumen`: Qué es, en 1-2 oraciones.
   - `preliminar.riesgos`: Array de 3-4 riesgos.
   - `items`: Array de subcasos (cada uno con `id`, `title`, `queDecir`, `content`).
   - `escalamiento`: Array de links de escalamiento (CMF, SERNAC, etc).
   - `cruce`: Endpoint y fuentes de datos a validar.

3. La app lo detecta automáticamente en `App.renderCategories(CATEGORIAS)`.

## Cómo conectar a backend real

1. En `js/services/api.js`:
   - Reemplaza `submitOrientation()` con un `fetch()` a tu endpoint real.
   - Reemplaza `executeDataCheck()` con un `fetch()` a tu cruce de datos.

Ej:
```javascript
submitOrientation: async function (endpoint, payload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
```

2. El resto de la app usa `API.submitOrientation()` sin cambiar nada.

## Orden de carga de scripts (HTML)

```html
<script src="js/data/categorias.js"></script>       <!-- Datos (sin deps) -->
<script src="js/core/security.js"></script>         <!-- Core (sin deps) -->
<script src="js/core/auth.js"></script>             <!-- Core (dep: sin reqs especiales) -->
<script src="js/services/api.js"></script>          <!-- Services (dep: Security) -->
<script src="js/modules/history.js"></script>       <!-- Modules (dep: sin reqs especiales) -->
<script src="js/app.js"></script>                   <!-- App (dep: todas las anteriores) -->
```

**Invariante:** Cada archivo puede usar lo que está arriba de él en este orden.

## Próximas refactorizaciones (opcionales)

1. **Dividir CSS en archivos:**
   - `css/base.css`, `css/layout.css`, `css/components.css`, `css/views/category.css`, etc.
   - Carga en orden en el HTML con múltiples `<link>`.

2. **Agregar Speech.js:**
   - `js/modules/speech.js`: Aislar `speakText()`, `loadVoices()`, `stopSpeaking()`.

3. **Agregar Install.js:**
   - `js/modules/install.js`: PWA install prompt.

4. **ES Modules (sin build step):**
   - Cambiar `<script>` a `<script type="module" src="js/app.js">`.
   - Dentro de los archivos: `import CATEGORIAS from './data/categorias.js'`.
   - Elimina globales; cada módulo es su namespace.

## Testing

Dado que es vanilla JS sin framework, no hay tests automáticos aún. Para verificar:
- `node --check js/*.js` y `node --check js/**/*.js`: Sintaxis.
- Probar en navegador (F12 Console) manualmente.
- Ver `sw.js` para activación offline.

## Notas de desarrollo

- **Estado global:** Todo en `App.state`, `Auth.sesion`, `Historial.items`.
- **Sin virtual DOM:** DOM se manipula directamente con `createElement` + `appendChild`.
- **Listeners dinámicos:** Cuando renderizas UI nueva, los listeners viejos se descartan con los nodos.
- **localStorage como BD:** Suficiente para MVP; si crece, migrá a IndexedDB.
- **Sin dependencias externas:** PWA vanilla, funciona offline desde el primer momento (sw.js).
