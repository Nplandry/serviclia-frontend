const Auth = {
  STORAGE_KEY: 'servicia.session',
  USERS_KEY: 'servicia.users',
  MAX_USERS: 200,

  usuariosPrueba: [
    { email: 'adulto@servicia.cl', password: 'adulto123', nombre: 'María González' }
  ],

  usuarios: [],
  sesion: null,

  init() {
    Auth.loadUsers();
    Auth.restoreSession();
    return Auth;
  },

  loadUsers() {
    Auth.usuarios = Auth.usuariosPrueba.map(u => Object.assign({}, u));
    try {
      const raw = localStorage.getItem(Auth.USERS_KEY);
      if (raw) {
        const extra = JSON.parse(raw) || [];
        extra.forEach(u => {
          if (u && u.email && !Auth.isRegistered(u.email)) {
            Auth.usuarios.push(u);
          }
        });
      }
    } catch (e) {
      void e;
    }
  },

  persistUsers() {
    try {
      const registrados = Auth.usuarios.filter(u => !Auth.usuariosPrueba.some(p => p.email === u.email));
      localStorage.setItem(Auth.USERS_KEY, JSON.stringify(registrados));
    } catch (e) {
      void e;
    }
  },

  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  },

  findUser(email) {
    const target = Auth.normalizeEmail(email);
    return Auth.usuarios.find(u => Auth.normalizeEmail(u.email) === target) || null;
  },

  isRegistered(email) {
    return Auth.findUser(email) !== null;
  },

  isAuthenticated() {
    return Auth.sesion !== null;
  },

  getCurrentUser() {
    return Auth.sesion;
  },

  login(email, password) {
    const user = Auth.findUser(email);
    if (!user) {
      return { ok: false, error: 'Este correo no está registrado.' };
    }
    if (user.password !== String(password)) {
      return { ok: false, error: 'La contraseña no es correcta.' };
    }
    Auth.persistSession(user);
    return { ok: true, user: Auth.sesion };
  },

  register(data) {
    const email = Auth.normalizeEmail(data.email);
    const nombre = String(data.nombre || '').trim();
    const password = String(data.password || '');

    if (nombre.length < 2) {
      return { ok: false, error: 'Ingrese su nombre completo.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Ingrese un correo electrónico válido.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (Auth.isRegistered(email)) {
      return { ok: false, error: 'Este correo ya está registrado. Inicie sesión.' };
    }
    if (Auth.usuarios.length >= Auth.MAX_USERS) {
      return { ok: false, error: 'Se alcanzó el máximo de usuarios permitidos.' };
    }

    const nuevo = { email: email, password: password, nombre: nombre };
    Auth.usuarios.push(nuevo);
    Auth.persistUsers();
    Auth.persistSession(nuevo);
    return { ok: true, user: Auth.sesion };
  },

  validateOnboarding(data) {
    const email = Auth.normalizeEmail(data.email);
    const nombre = String(data.nombre || '').trim();
    const password = String(data.password || '');

    if (nombre.length < 2) {
      return { ok: false, error: 'Ingrese su nombre completo.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Ingrese un correo electrónico válido.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (Auth.isRegistered(email)) {
      return { ok: false, error: 'Este correo ya está registrado. Inicie sesión en la app.' };
    }
    if (Auth.usuarios.length >= Auth.MAX_USERS) {
      return { ok: false, error: 'Se alcanzó el máximo de usuarios permitidos.' };
    }
    return { ok: true };
  },

  onboardApi(data) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        const check = Auth.validateOnboarding(data);
        if (!check.ok) {
          resolve(check);
          return;
        }
        const nuevo = {
          email: Auth.normalizeEmail(data.email),
          password: String(data.password),
          nombre: String(data.nombre).trim(),
          edad: data.edad || null,
          preocupacion: data.preocupacion || null,
          proposito: data.proposito || null,
          onboardedAt: new Date().toISOString()
        };
        Auth.usuarios.push(nuevo);
        Auth.persistUsers();
        Auth.persistSession(nuevo);
        resolve({ ok: true, user: Auth.sesion });
      }, 700);
    });
  },

  logout() {
    Auth.sesion = null;
    try {
      localStorage.removeItem(Auth.STORAGE_KEY);
    } catch (e) {
      void e;
    }
  },

  persistSession(user) {
    Auth.sesion = { email: user.email, nombre: user.nombre };
    try {
      localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(Auth.sesion));
    } catch (e) {
      void e;
    }
  },

  restoreSession() {
    try {
      const raw = localStorage.getItem(Auth.STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && Auth.isRegistered(parsed.email)) {
        Auth.sesion = { email: parsed.email, nombre: parsed.nombre };
      }
    } catch (e) {
      Auth.sesion = null;
    }
  }
};
