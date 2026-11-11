const App = {
  state: { rutVerificado: false, perfilGuardado: null },
  elements: {},

  init() {
    Auth.init();
    App.cacheElements();
    App.bindAuthEvents();
    Pasaporte.init();
    App.applyAuthState();
    if (typeof Compliance !== 'undefined') Compliance.initCookieBanner();
    App.verifySession();
  },

  async verifySession() {
    const vigente = await Auth.verificarSesion();
    if (!vigente) App.applyAuthState();
  },

  cacheElements() {
    const ids = [
      'logoutBtn', 'authGate', 'tabLogin', 'tabRegister', 'loginForm', 'registerForm',
      'loginStatus', 'registerStatus', 'historyBtn', 'historyPanel', 'historyOverlay',
      'historyClose', 'historyMenu', 'mapView', 'perfilView', 'perfilStatus',
      'perfilPasaporte', 'perfilForm', 'perfilNombre', 'perfilCorreo', 'perfilEdad',
      'perfilTelefono', 'perfilRut', 'perfilGuardar', 'perfilFormStatus',
      'perfilLogout', 'perfilEliminar',
      'perfilEliminarForm', 'perfilEliminarPass', 'perfilEliminarCancelar',
      'perfilEliminarStatus', 'verifyView', 'subirConfianzaView'
    ];
    ids.forEach(id => App.elements[id] = document.getElementById(id));
    App.elements.appHeader = document.querySelector('.app-header');
    App.elements.appMain = document.getElementById('main');
    App.elements.appFooter = document.querySelector('.app-footer');
  },

  bindAuthEvents() {
    App.elements.tabLogin.addEventListener('click', () => App.switchAuthTab('login'));
    App.elements.tabRegister.addEventListener('click', () => App.switchAuthTab('register'));
    App.elements.loginForm.addEventListener('submit', App.handleLogin);
    App.elements.registerForm.addEventListener('submit', App.handleRegister);
    App.elements.logoutBtn.addEventListener('click', App.handleLogout);
    App.elements.historyBtn.addEventListener('click', App.openHistory);
    App.elements.historyClose.addEventListener('click', App.closeHistory);
    App.elements.historyOverlay.addEventListener('click', App.closeHistory);
    App.elements.historyMenu.addEventListener('click', App.handleMenuClick);
    App.elements.perfilForm.addEventListener('submit', App.handlePerfilGuardar);
    ['perfilEdad', 'perfilTelefono', 'perfilRut'].forEach(id =>
      App.elements[id].addEventListener('input', App.actualizarBotonGuardarPerfil));
    App.elements.perfilLogout.addEventListener('click', App.handleLogout);
    App.elements.perfilEliminar.addEventListener('click', App.mostrarEliminarCuenta);
    App.elements.perfilEliminarCancelar.addEventListener('click', App.ocultarEliminarCuenta);
    App.elements.perfilEliminarForm.addEventListener('submit', App.handleEliminarCuenta);
  },

  handleMenuClick(e) {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    App.openSection(btn.dataset.view);
  },

  openSection(name) {
    App.closeHistory();
    if (name === 'mapa') { App.showView('mapView'); return Market.init(); }
    if (name === 'perfil') { App.renderPerfil(); return App.showView('perfilView'); }
    if (name === 'verificacion') { Pasaporte.init(); return App.showView('verifyView'); }
    if (name === 'subir-confianza') { SubirConfianza.init(); return App.showView('subirConfianzaView'); }
  },

  setMenuActive(name) {
    App.elements.historyMenu.querySelectorAll('[data-view]').forEach(btn => {
      const active = btn.dataset.view === name;
      btn.classList.toggle('history-menu__item--active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  },

  renderPerfil() {
    const user = Auth.getCurrentUser();
    if (!user) {
      App.elements.perfilStatus.textContent = 'Inicie sesión para ver su perfil.';
      return;
    }
    App.elements.perfilStatus.textContent = '';
    const perfil = user.perfil || {};

    App.elements.perfilNombre.value = user.nombre || '';
    App.elements.perfilCorreo.value = user.email || '';
    App.elements.perfilEdad.value = perfil.edad != null ? perfil.edad : '';
    App.elements.perfilTelefono.value = perfil.telefono || '';
    App.state.rutVerificado = !!perfil.rut_verificado;
    App.elements.perfilRut.value = App.state.rutVerificado ? 'Verificado' : '';
    App.elements.perfilRut.placeholder = App.state.rutVerificado ? 'Verificado' : '12.345.678-5';
    App.elements.perfilRut.disabled = App.state.rutVerificado;
    App.state.perfilGuardado = { edad: App.elements.perfilEdad.value, telefono: App.elements.perfilTelefono.value };

    const scoring = perfil.inmobiliaria_scoring;
    App.renderDefinitionList(App.elements.perfilPasaporte, [
      ['Nivel', 'Nivel ' + (perfil.nivel_pasaporte || 1)],
      ['Estado', App.etiquetaEstadoPasaporte(perfil.estado_pasaporte)],
      ['Confiabilidad', perfil.score_confiabilidad == null ? 'Sin reservas cerradas' : perfil.score_confiabilidad + ' / 100'],
      ['Score de arriendo', scoring && scoring.score_financiero != null ? scoring.score_financiero + ' / 1000' : 'Sin verificar']
    ]);

    App.actualizarBotonGuardarPerfil();
  },

  actualizarBotonGuardarPerfil() {
    const cambios = App.cambiosPerfil();
    App.elements.perfilGuardar.disabled = Object.keys(cambios).length === 0;
  },

  cambiosPerfil() {
    const guardado = App.state.perfilGuardado || {};
    const cambios = {};
    const edad = App.elements.perfilEdad.value.trim();
    const telefono = App.elements.perfilTelefono.value.trim();
    const rut = App.elements.perfilRut.value.trim();
    if (edad !== '' && edad !== guardado.edad) cambios.edad = Number(edad);
    if (edad === '' && guardado.edad !== '') cambios.edad = null;
    if (telefono !== guardado.telefono) cambios.telefono = telefono === '' ? null : telefono;
    if (!App.state.rutVerificado && rut !== '') cambios.rut = rut;
    return cambios;
  },

  etiquetaEstadoPasaporte(estado) {
    const mapa = { basico: 'Básico', pendiente: 'En revisión', verificado: 'Verificado', rechazado: 'Rechazado' };
    return mapa[estado] || 'Básico';
  },

  renderDefinitionList(dl, filas) {
    while (dl.firstChild) dl.removeChild(dl.firstChild);
    filas.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dl.append(dt, dd);
    });
  },

  async handlePerfilGuardar(e) {
    e.preventDefault();
    const cambios = App.cambiosPerfil();
    if (Object.keys(cambios).length === 0) {
      App.actualizarBotonGuardarPerfil();
      return;
    }
    App.elements.perfilGuardar.disabled = true;
    const res = await Auth.actualizarPerfil(cambios);
    App.elements.perfilGuardar.disabled = false;
    if (!res.ok) {
      App.elements.perfilFormStatus.textContent = res.error;
      return;
    }
    App.renderPerfil();
    App.elements.perfilFormStatus.textContent = 'Perfil actualizado.';
  },

  mostrarEliminarCuenta() {
    App.elements.perfilEliminarForm.hidden = false;
    App.elements.perfilEliminarPass.value = '';
    App.elements.perfilEliminarStatus.textContent = '';
    App.elements.perfilEliminarForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    App.elements.perfilEliminarPass.focus({ preventScroll: true });
  },

  ocultarEliminarCuenta() {
    App.elements.perfilEliminarForm.hidden = true;
    App.elements.perfilEliminarPass.value = '';
    App.elements.perfilEliminarStatus.textContent = '';
  },

  async handleEliminarCuenta(e) {
    e.preventDefault();
    const boton = App.elements.perfilEliminarForm.querySelector('button[type="submit"]');
    boton.disabled = true;
    const res = await Auth.eliminarCuenta(App.elements.perfilEliminarPass.value);
    boton.disabled = false;
    if (!res.ok) {
      App.elements.perfilEliminarStatus.textContent = res.error;
      return;
    }
    App.ocultarEliminarCuenta();
    App.handleLogout();
  },

  applyAuthState() {
    const authed = Auth.isAuthenticated();
    App.elements.authGate.hidden = authed;
    App.elements.appHeader.hidden = !authed;
    App.elements.appMain.hidden = !authed;
    if (App.elements.appFooter) App.elements.appFooter.hidden = !authed;
    App.elements.logoutBtn.hidden = !authed;
    App.elements.historyBtn.hidden = !authed;

    if (authed) {
      App.openSection('mapa');
    } else {
      App.closeHistory();
    }
  },

  openHistory() {
    App.elements.historyPanel.classList.add('history--open');
    App.elements.historyPanel.setAttribute('aria-hidden', 'false');
    App.elements.historyOverlay.hidden = false;
    App.elements.historyBtn.setAttribute('aria-expanded', 'true');
  },

  closeHistory() {
    App.elements.historyPanel.classList.remove('history--open');
    App.elements.historyPanel.setAttribute('aria-hidden', 'true');
    App.elements.historyOverlay.hidden = true;
    App.elements.historyBtn.setAttribute('aria-expanded', 'false');
  },

  switchAuthTab(tab) {
    const login = tab === 'login';
    App.elements.tabLogin.classList.toggle('auth__tab--active', login);
    App.elements.tabRegister.classList.toggle('auth__tab--active', !login);
    App.elements.tabLogin.setAttribute('aria-selected', String(login));
    App.elements.tabRegister.setAttribute('aria-selected', String(!login));
    App.elements.loginForm.hidden = !login;
    App.elements.registerForm.hidden = login;
    App.elements.loginStatus.textContent = '';
    App.elements.registerStatus.textContent = '';
  },

  async handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(App.elements.loginForm);
    const submit = App.elements.loginForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const res = await Auth.login(fd.get('email'), fd.get('password'));
    if (submit) submit.disabled = false;
    if (!res.ok) {
      App.elements.loginStatus.textContent = res.error;
      return;
    }
    App.elements.loginForm.reset();
    App.elements.loginStatus.textContent = '';
    App.applyAuthState();
  },

  async handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(App.elements.registerForm);
    const submit = App.elements.registerForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const res = await Auth.register({ nombre: fd.get('nombre'), email: fd.get('email'), password: fd.get('password') });
    if (submit) submit.disabled = false;
    if (!res.ok) {
      App.elements.registerStatus.textContent = res.error;
      return;
    }
    App.elements.registerForm.reset();
    App.elements.registerStatus.textContent = '';
    App.applyAuthState();
  },

  handleLogout() {
    Auth.logout();
    App.switchAuthTab('login');
    App.applyAuthState();
  },

  showView(name) {
    const sectionByView = {
      mapView: 'mapa',
      perfilView: 'perfil',
      verifyView: 'verificacion',
      subirConfianzaView: 'subir-confianza'
    };
    ['mapView', 'perfilView', 'verifyView', 'subirConfianzaView'].forEach(n => {
      App.elements[n].hidden = n !== name;
    });
    App.setMenuActive(sectionByView[name] || 'mapa');
    window.scrollTo(0, 0);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
