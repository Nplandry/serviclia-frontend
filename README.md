# ServicIA PWA

Aplicación web progresiva para orientación ante amenazas de embargo, seguros no consentidos y cambios de plan. Se conecta al backend `servicia-backend` (FastAPI) para la autenticación, el perfil del usuario y el asistente con normativa.

## Pantallas

| Ruta | Archivo | Función |
|---|---|---|
| `/` | `index.html` | Acceso (login y registro) y, al iniciar sesión, la app completa |
| `/onboarding/` | `onboarding/index.html` | Bienvenida y preguntas iniciales; crea la cuenta con su perfil |

Dentro de `index.html`, la app cambia entre vistas que se muestran u ocultan:

- **authGate**: acceso, con información del servicio y espacios de publicidad.
- **homeView**: asistente, búsqueda y categorías recomendadas.
- **categoryView**: entrada de datos de una categoría, con asistente propio.
- **formView**: formulario de orientación personalizada.
- **mapView**, **apiView**, **dashboardView**, **configView**, **verifyView**: secciones del menú lateral.

El menú lateral (Asistente, Pasaporte Digital, Mapa, Portal API, Dashboard y Configuración) se abre con el botón de la esquina superior izquierda.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de todas las vistas |
| `onboarding/index.html` | Flujo de bienvenida |
| `css/styles.css` | Estilos de toda la aplicación |
| `js/app.js` | Lógica principal: vistas, menú, asistente y categorías |
| `js/core/auth.js` | Sesión: login, registro, perfil y verificación del token |
| `js/core/security.js` | Validación de RUT y redacción de datos personales en el navegador |
| `js/compliance.js` | Consentimientos y banner de cookies |
| `js/services/api.js` | Llamadas a la API (asistente y orientación) |
| `js/modules/history.js` | Historial local de consultas |
| `js/data/categorias.js` | Categorías, preguntas recomendadas e iconos |
| `js/data/pasaporte.js` | Datos de demostración (mock) del Pasaporte Digital |
| `js/modules/pasaporte.js` | Render del Pasaporte Digital: selector de rubro y tarjeta |
| `js/onboarding.js` | Lógica del flujo de bienvenida |
| `sw.js` | Service Worker: caché de la app. No guarda respuestas de la API. |
| `manifest.json` | Configuración de la PWA |

## Scripts cargados en `index.html` (en orden)

1. `js/data/categorias.js`
2. `js/core/security.js`
3. `js/compliance.js`
4. `js/core/auth.js`
5. `js/services/api.js`
6. `js/modules/history.js`
7. `js/data/pasaporte.js`
8. `js/modules/pasaporte.js`
9. `js/app.js`

`sw.js` se registra al final de la página.

## Pasaporte Digital

La vista `verifyView` muestra la credencial de integridad patrimonial. Sus datos (titular, rubros, indicadores, token) están en `js/data/pasaporte.js` como mock. Para conectarla al backend, reemplace ese objeto por la respuesta de la API; el render no cambia. El botón de descarga está deshabilitado mientras la función no exista.

## Conexión con el backend

- La URL de la API está en `Auth.API_BASE` (`js/core/auth.js`). Por defecto apunta a `http://localhost:8000`. En producción, defina `window.SERVICIA_API_BASE` antes de cargar `auth.js`.
- El token de sesión queda en `localStorage`. Al iniciar la app se verifica con `/v1/auth/yo`; si el token expiró, se pide iniciar sesión de nuevo.
- Con el backend en local, la app debe abrirse desde `http://localhost:5500` o `http://127.0.0.1:5500`, o desde otro origen incluido en `CORS_ORIGINS` del backend. Abrir `index.html` como archivo (`file://`) no funciona.

## Desarrollo local

```bash
python3 -m http.server 5500
```

Luego abra `http://localhost:5500/index.html`. El backend debe estar corriendo en el puerto 8000.

## Pruebas

Las pruebas de navegador no están versionadas en este repositorio. Cubren acceso, onboarding, asistente, menú, bordes de columnas y botón Enviar, y se ejecutaron con Playwright contra el backend real.
