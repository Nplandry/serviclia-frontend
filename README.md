# ServicIA PWA 

## Estructura de Rutas

### Rutas Principales

| Ruta | Archivo | Función |
|------|---------|----------|
| `/` | `index.html` | Página principal o HomePage |
| `/onboarding/` | `onboarding/index.html` | Pantalla de bienvenida e introducción|

### Carpetas y Módulos

| Carpeta | Función |
|---------|----------|
| `js/` | Código JavaScript principal |
| `js/core/` | Funciones centrales |
| `js/data/` | Datos de categorías y contenido |
| `js/services/` | Llamadas a APIs externas |
| `js/modules/` | Módulos de funcionalidad (historial) |
| `css/` | Estilos CSS de la aplicación |

### Archivos Principales

| Archivo | Propósito |
|---------|-----------|
| `index.html` | HTML principal con toda la estructura |
| `manifest.json` | Configuración de la PWA (nombre, iconos, display) |
| `sw.js` | Service Worker para funcionalidad offline |
| `css/styles.css` | Estilos de toda la aplicación |
| `js/app.js` | Lógica principal de la aplicación |

### Vistas en index.html

La aplicación tiene múltiples vistas que se muestran/ocultan:

- **authGate** - Pantalla de login y registro
- **homeView** - Inicio con búsqueda y categorías
- **categoryView** - Detalle de una categoría
- **detailView** - Artículo completo con opción de lectura en voz alta
- **formView** - Formulario para solicitar orientación personalizada

### Scripts Cargados (en orden)

1. `js/data/categorias.js` - Datos de contenido
2. `js/core/security.js` - Funciones de seguridad
3. `js/compliance.js` - Cumplimiento normativo
4. `js/core/auth.js` - Autenticación
5. `js/services/api.js` - Llamadas a APIs
6. `js/modules/history.js` - Historial de consultas
7. `js/app.js` - Inicialización de la app
8. `sw.js` - Service Worker (offline)

## Descripción de Módulos

- **auth** - Gestión de login/registro de usuarios
- **security** - Validaciones y seguridad
- **compliance** - Normativas y reglas de negocio
- **api** - Comunicación con backend
- **history** - Historial de consultas guardadas
