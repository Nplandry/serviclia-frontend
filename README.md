# ServiChile PWA

Aplicación web progresiva de **due diligence B2B** e índice de transparencia de proveedores, con capa de confianza (Reportes / QR + verificación).

## Pantallas

| Ruta | Archivo | Función |
|---|---|---|
| `/` | `index.html` | Acceso y app completa |
| `/onboarding/` | `onboarding/index.html` | Alta persona/empresa |

Vistas internas:

- **Explorar**: proveedores B2B con índice de transparencia.
- **Reportes**: informe imprimible (persona: niveles; empresa: 30 observables) + QR y validador.
- **Verificación**: niveles 1–3 (persona) o documentación / índice (empresa).
- **Perfil**: datos de cuenta y estado de verificación.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Estructura de vistas |
| `onboarding/index.html` | Bienvenida |
| `css/styles.css` | Estilos |
| `js/app.js` | Vistas, menú y perfil |
| `js/core/auth.js` | Sesión API |
| `js/core/security.js` | RUT / PII en cliente |
| `js/compliance.js` | Cookies e incidentes locales |
| `js/modules/market.js` | Explorar proveedores |
| `js/modules/reporte-qr.js` | Emisión/validación del QR del reporte (`/v1/reporte`) |
| `js/modules/subir-confianza.js` | Verificación |
| `js/modules/reporte-persona.js` | Informe persona |
| `js/modules/reporte-empresa.js` | Informe empresa |
| `js/modules/progreso-cuenta.js` | Estrategia persona/empresa |
| `js/onboarding.js` | Alta de cuenta |
| `sw.js` | Service Worker |
| `manifest.json` | PWA |

## Desarrollo local

```bash
# API
cd servichile-backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Frontend
cd servichile-frontend && python3 -m http.server 5500
```

- App: http://localhost:5500/index.html  
- API: http://localhost:8000/docs  
