// Sesion contra la API v1 auth. El token JWT queda en localStorage, aceptable en desarrollo
// en produccion conviene una cookie httpOnly.
const Auth = {
  // En produccion defina la variable SERVICHILE API BASE antes de cargar este archivo, por ejemplo en un config.js.
  API_BASE: (typeof window !== 'undefined' && window.SERVICHILE_API_BASE) || 'http://localhost:8000',
  STORAGE_KEY: 'servichile.session',
  sesion: null,

  init() {
    Auth.restoreSession();
    return Auth;
  },

  isAuthenticated() {
    return Auth.sesion !== null;
  },

  getCurrentUser() {
    return Auth.sesion;
  },

  async request(path, { method = 'GET', body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(Auth.API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch {
      return { ok: false, status: 0, error: 'No se pudo conectar con el servidor. Intente de nuevo.' };
    }
    let data = null;
    try {
      data = await res.json();
    } catch {}
    if (res.ok) return { ok: true, status: res.status, data };
    return { ok: false, status: res.status, error: Auth.mensajeError(res.status, data) };
  },

  mensajeError(status, data) {
    if (status === 422) return 'Revise los datos ingresados. La contraseña debe tener al menos 8 caracteres.';
    if (status === 429) return 'Demasiados intentos. Espere un minuto e intente de nuevo.';
    if (data && typeof data.detail === 'string') return data.detail;
    return 'Ocurrió un error. Intente de nuevo.';
  },

  async login(email, password) {
    const res = await Auth.request('/v1/auth/login', {
      method: 'POST',
      body: { email: String(email || '').trim(), password: String(password || '') }
    });
    if (!res.ok) return { ok: false, error: res.error };
    return Auth.cargarSesion(res.data.access_token);
  },

  async register(data) {
    const payload = {
      email: String(data.email || '').trim(),
      nombre: String(data.nombre || '').trim(),
      password: String(data.password || '')
    };
    const perfil = Auth.limpiarPerfil(data.perfil);
    if (perfil) payload.perfil = perfil;
    const res = await Auth.request('/v1/auth/registro', { method: 'POST', body: payload });
    if (!res.ok) return { ok: false, error: res.error };
    return Auth.login(payload.email, payload.password);
  },

  // Usado por el onboarding crea la cuenta con su perfil en una sola peticion.
  async onboardApi(data) {
    return Auth.register({
      nombre: data.nombre,
      email: data.email,
      password: data.password,
      perfil: { edad: data.edad }
    });
  },

  // Quita campos vacios y convierte la edad a numero. Devuelve null si no queda nada.
  // preocupacion y proposito ya no se envian: fueron retirados del perfil.
  limpiarPerfil(perfil) {
    if (!perfil) return null;
    const limpio = {};
    if (perfil.edad !== undefined && perfil.edad !== null && perfil.edad !== '') limpio.edad = Number(perfil.edad);
    return Object.keys(limpio).length ? limpio : null;
  },

  // Borra la cuenta en el servidor (confirmada con la contraseña) y cierra la sesión local.
  async eliminarCuenta(password) {
    if (!Auth.sesion) return { ok: false, error: 'Inicie sesión para continuar.' };
    const res = await Auth.request('/v1/auth/yo', { method: 'DELETE', body: { password: String(password || '') }, token: Auth.sesion.token });
    if (res.status === 404 || res.status === 405) {
      return { ok: false, error: 'El servidor no tiene esta función. Reinicie el backend con la versión nueva.' };
    }
    if (!res.ok) return { ok: false, error: res.error };
    Auth.logout();
    return { ok: true };
  },

  // Sube el PDF de liquidaciones o Dicom para el Nivel 2. El archivo no se guarda en el dispositivo.
  async subirDocumentoArriendo(archivo) {
    if (!Auth.sesion) return { ok: false, error: 'Inicie sesión para continuar.' };
    if (!archivo || archivo.type !== 'application/pdf') return { ok: false, error: 'Seleccione un archivo PDF.' };
    if (archivo.size > 1024 * 1024) return { ok: false, error: 'El PDF supera 1 MB. Suba una versión más liviana.' };
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    let res;
    try {
      res = await fetch(Auth.API_BASE + '/v1/perfil/documentos', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + Auth.sesion.token },
        body: formulario
      });
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor. Intente de nuevo.' };
    }
    let data = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) return { ok: false, error: Auth.mensajeError(res.status, data) };
    // El estado de confianza cambió: se vuelve a leer desde el servidor.
    await Auth.verificarSesion();
    return { ok: true, scoring: data };
  },

  // Actualiza el perfil en el servidor. Envie solo los campos que cambian. Un valor null borra el campo.
  async actualizarPerfil(cambios) {
    if (!Auth.sesion) return { ok: false, error: 'Inicie sesión para continuar.' };
    const res = await Auth.request('/v1/perfil', { method: 'PATCH', body: cambios, token: Auth.sesion.token });
    if (!res.ok) return { ok: false, error: res.error };
    Auth.sesion.perfil = res.data;
    Auth.persistSession();
    return { ok: true, perfil: res.data };
  },

  // Pide al servidor los datos del usuario con el token y deja la sesion lista.
  async cargarSesion(token) {
    const me = await Auth.request('/v1/auth/yo', { token });
    if (!me.ok) return { ok: false, error: 'No se pudo iniciar sesión. Intente de nuevo.' };
    Auth.sesion = { email: me.data.email, nombre: me.data.nombre, perfil: me.data.perfil || {}, token: token };
    Auth.persistSession();
    return { ok: true, user: Auth.sesion };
  },

  // Revisa al arrancar que el token guardado siga vigente y refresca los datos del servidor.
  async verificarSesion() {
    if (!Auth.sesion) return false;
    const token = Auth.sesion.token;
    const me = await Auth.request('/v1/auth/yo', { token });
    // Si mientras esperaba cambio la sesion guardada logout o login en otra pestana, usa la guardada.
    if (Auth.tokenGuardado() !== token) {
      Auth.sesion = null;
      Auth.restoreSession();
      return Auth.isAuthenticated();
    }
    if (me.ok) {
      Auth.sesion.nombre = me.data.nombre;
      Auth.sesion.perfil = me.data.perfil || {};
      Auth.persistSession();
      return true;
    }
    if (me.status === 0) return true;  // sin conexion mantiene la sesion local PWA offline
    Auth.logout();
    return false;
  },

  tokenGuardado() {
    try {
      const raw = localStorage.getItem(Auth.STORAGE_KEY);
      return raw ? (JSON.parse(raw) || {}).token || null : null;
    } catch (e) {
      return null;
    }
  },

  logout() {
    Auth.sesion = null;
    try {
      localStorage.removeItem(Auth.STORAGE_KEY);
    } catch {}
  },

  persistSession() {
    try {
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(Auth.sesion));
    } catch {}
  },

  restoreSession() {
    try {
      const raw = localStorage.getItem(Auth.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        Auth.sesion = { email: parsed.email, nombre: parsed.nombre, perfil: parsed.perfil || {}, token: parsed.token };
      }
    } catch (e) {
      Auth.sesion = null;
    }
  }
};
