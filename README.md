# ServiChile PWA

Aplicación web progresiva con marketplace de comercios, arriendos y eventos, Subir Confianza y Mi QR. Se conecta al backend `servichile-backend` (FastAPI) para autenticación, perfil y negocios.

## Pantallas

| Ruta | Archivo | Función |
|---|---|---|
| `/` | `index.html` | Acceso (login y registro) y, al iniciar sesión, la app completa |
| `/onboarding/` | `onboarding/index.html` | Bienvenida y preguntas iniciales; crea la cuenta con su perfil |

Dentro de `index.html`, la app cambia entre vistas que se muestran u ocultan:

- **authGate**: acceso, con información del servicio.
- **mapView**: Marketplace (comercios, arriendos y eventos por cercanía) y widget de progreso.
- **verifyView**: Mi QR (carnet mock para validación en el comercio).
- **subirConfianzaView**: requisitos por nivel, documentos mock y biometría mock.
- **perfilView**: datos de cuenta, edición de edad/teléfono/RUT y acciones de cuenta.

El menú lateral (Marketplace, Mi QR, Subir Confianza y Perfil) se abre con el botón de la esquina superior izquierda.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de todas las vistas |
| `onboarding/index.html` | Flujo de bienvenida |
| `css/styles.css` | Estilos de toda la aplicación |
| `js/app.js` | Lógica principal: vistas, menú y perfil |
| `js/core/auth.js` | Sesión: login, registro, perfil y verificación del token |
| `js/core/security.js` | Validación de RUT y redacción de datos personales en el navegador |
| `js/compliance.js` | Aviso de cookies y registro local de incidentes de seguridad |
| `js/data/categorias.js` | Iconos del marketplace |
| `js/modules/market.js` | Marketplace: grilla, filtros y cercanía |
| `js/modules/pasaporte.js` | Mi QR (carnet mock de validación) |
| `js/modules/subir-confianza.js` | Subir Confianza (requisitos, documentos y biometría mock) |
| `js/onboarding.js` | Lógica del flujo de bienvenida |
| `sw.js` | Service Worker: caché de la app. No guarda respuestas de la API. |
| `manifest.json` | Configuración de la PWA |

## Scripts cargados en `index.html` (en orden)

1. `js/data/categorias.js`
2. `js/core/security.js`
3. `js/compliance.js`
4. `js/core/auth.js`
5. `js/modules/pasaporte.js`
6. `js/modules/subir-confianza.js`
7. `js/modules/market.js`
8. `js/app.js`

`sw.js` se registra al final de la página.

## Conexión con el backend

- La URL de la API está en `Auth.API_BASE` (`js/core/auth.js`). Por defecto apunta a `http://localhost:8000`. En producción, defina `window.SERVICHILE_API_BASE` antes de cargar `auth.js`.
- El token de sesión queda en `localStorage`. Al iniciar la app se verifica con `/v1/auth/yo`; si el token expiró, se pide iniciar sesión de nuevo.
- Con el backend en local, la app debe abrirse desde `http://localhost:5500` o `http://127.0.0.1:5500`, o desde otro origen incluido en `CORS_ORIGINS` del backend. Abrir `index.html` como archivo (`file://`) no funciona.

## Desarrollo local

```bash
python3 -m http.server 5500
```

Luego abra `http://localhost:5500/index.html`. El backend debe estar corriendo en el puerto 8000.
