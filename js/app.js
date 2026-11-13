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
      'logoutBtn', 'authGate', 'loginForm', 'loginStatus',
      'historyBtn', 'historyPanel', 'historyOverlay',
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
    App.elements.loginForm.addEventListener('submit', App.handleLogin);
    App.elements.logoutBtn.addEventListener('click', App.handleLogout);
    App.elements.historyBtn.addEventListener('click', App.openHistory);
    App.elements.historyClose.addEventListener('click', App.closeHistory);
    App.elements.historyOverlay.addEventListener('click', App.closeHistory);
    App.elements.historyMenu.addEventListener('click', App.handleMenuClick);
    App.elements.perfilForm.addEventListener('submit', App.handlePerfilGuardar);
    App.elements.perfilEdad.addEventListener('input', App.actualizarBotonGuardarPerfil);
    App.elements.perfilTelefono.addEventListener('input', App.formatearTelefonoPerfil);
    App.elements.perfilTelefono.addEventListener('blur', App.corregirTelefonoPerfil);
    App.elements.perfilRut.addEventListener('input', App.formatearRutPerfil);
    App.elements.perfilRut.addEventListener('blur', App.corregirRutPerfil);
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
    if (name === 'perfil') {
      App.renderPerfil();
      if (typeof PerfilEmpresa !== 'undefined') PerfilEmpresa.init();
      return App.showView('perfilView');
    }
    if (name === 'verificacion') { Pasaporte.init(); return App.showView('verifyView'); }
    if (name === 'subir-confianza') {
      App.actualizarEtiquetasConfianza();
      SubirConfianza.init();
      return App.showView('subirConfianzaView');
    }
  },

  esEmpresa() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.actual().es('empresa')
      : false;
  },

  actualizarEtiquetasConfianza() {
    const prog =
      typeof ProgresoCuenta !== 'undefined' ? ProgresoCuenta.actual() : null;
    const menuBtn = App.elements.historyMenu
      ? App.elements.historyMenu.querySelector('[data-view="subir-confianza"] span')
      : null;
    if (menuBtn) {
      menuBtn.textContent = prog ? prog.etiquetaMenu() : 'Subir Confianza';
    }
    const tituloVista = document.querySelector('#subirConfianzaView > .section-heading');
    if (tituloVista) {
      tituloVista.textContent = prog ? prog.etiquetaVista() : 'Subir Confianza';
    }
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
    const telRaw = perfil.telefono || '';
    App.elements.perfilTelefono.value =
      telRaw && typeof Security !== 'undefined' ? Security.formatTelefono(telRaw) : telRaw;
    const prog =
      typeof ProgresoCuenta !== 'undefined' ? ProgresoCuenta.para(perfil) : null;
    const campoEdad = App.elements.perfilEdad.closest('.field');
    if (campoEdad) campoEdad.hidden = prog ? !prog.soporta('edad') : false;
    App.state.rutVerificado = !!perfil.rut_verificado;
    App.elements.perfilRut.value = App.state.rutVerificado ? 'Verificado' : '';
    App.elements.perfilRut.placeholder = App.state.rutVerificado ? 'Verificado' : '12.345.678-5';
    App.elements.perfilRut.disabled = App.state.rutVerificado;
    App.state.perfilGuardado = {
      edad: App.elements.perfilEdad.value,
      telefono: App.elements.perfilTelefono.value
    };

    const filas = prog
      ? prog.filasEstado({ origen: 'perfil', perfil })
      : [['Tipo de cuenta', perfil.tipo_cuenta || 'Sin indicar']];
    App.renderDefinitionList(App.elements.perfilPasaporte, filas);
    App.actualizarEtiquetasConfianza();
    App.actualizarBotonGuardarPerfil();
  },

  actualizarBotonGuardarPerfil() {
    const cambios = App.cambiosPerfil();
    App.elements.perfilGuardar.disabled = Object.keys(cambios).length === 0;
  },

  _aplicarFormatoInput(input, formateado, caretAntes, largoAntes) {
    if (formateado === input.value) return;
    input.value = formateado;
    const delta = formateado.length - largoAntes;
    const next = Math.max(0, (caretAntes || 0) + delta);
    try {
      input.setSelectionRange(next, next);
    } catch (_) {}
  },

  formatearTelefonoPerfil() {
    const input = App.elements.perfilTelefono;
    if (!input || input.disabled) return;
    if (typeof Security === 'undefined') return;
    const valor = input.value;
    if (!valor.trim()) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
      App.actualizarBotonGuardarPerfil();
      return;
    }
    const caret = input.selectionStart;
    const formateado = Security.formatTelefono(valor);
    App._aplicarFormatoInput(input, formateado, caret, valor.length);
    if (Security.validateTelefono(formateado)) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
    } else {
      input.removeAttribute('aria-invalid');
      input.setCustomValidity('');
    }
    App.actualizarBotonGuardarPerfil();
  },

  corregirTelefonoPerfil() {
    App.formatearTelefonoPerfil();
    const input = App.elements.perfilTelefono;
    if (!input || input.disabled) return;
    const valor = input.value.trim();
    if (!valor) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
      return;
    }
    if (typeof Security !== 'undefined' && !Security.validateTelefono(valor)) {
      input.setCustomValidity('Use un móvil chileno, p. ej. +56 9 1234 5678');
      input.setAttribute('aria-invalid', 'true');
    }
  },

  formatearRutPerfil() {
    const input = App.elements.perfilRut;
    if (!input || input.disabled || App.state.rutVerificado) return;
    if (typeof Security === 'undefined') return;
    const valor = input.value;
    if (!valor.trim()) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
      App.actualizarBotonGuardarPerfil();
      return;
    }
    const caret = input.selectionStart;
    const formateado = Security.formatRut(valor);
    App._aplicarFormatoInput(input, formateado, caret, valor.length);
    if (Security.validateRut(formateado)) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
    } else {
      input.removeAttribute('aria-invalid');
      input.setCustomValidity('');
    }
    App.actualizarBotonGuardarPerfil();
  },

  corregirRutPerfil() {
    const input = App.elements.perfilRut;
    if (!input || input.disabled || App.state.rutVerificado) return;
    const valor = input.value.trim();
    if (!valor) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
      App.actualizarBotonGuardarPerfil();
      return;
    }
    if (typeof Security === 'undefined') return;
    const formateado = Security.formatRut(valor);
    if (formateado !== input.value) input.value = formateado;
    if (Security.validateRut(formateado)) {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
    } else {
      input.setCustomValidity('RUT inválido. Revise el dígito verificador.');
      input.setAttribute('aria-invalid', 'true');
    }
    App.actualizarBotonGuardarPerfil();
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
    App.corregirTelefonoPerfil();
    App.corregirRutPerfil();

    const telefono = App.elements.perfilTelefono.value.trim();
    const rut = App.elements.perfilRut.value.trim();
    if (telefono && typeof Security !== 'undefined' && !Security.validateTelefono(telefono)) {
      App.elements.perfilFormStatus.textContent =
        'Teléfono inválido. Se espera un móvil chileno, p. ej. +56 9 1234 5678.';
      App.elements.perfilTelefono.focus();
      return;
    }
    if (!App.state.rutVerificado && rut && typeof Security !== 'undefined' && !Security.validateRut(rut)) {
      App.elements.perfilFormStatus.textContent =
        'RUT inválido. Se corrigió el formato; revise el dígito verificador.';
      App.elements.perfilRut.focus();
      return;
    }

    const cambios = App.cambiosPerfil();
    if (Object.keys(cambios).length === 0) {
      App.actualizarBotonGuardarPerfil();
      return;
    }
    App.elements.perfilGuardar.disabled = true;
    App.elements.perfilFormStatus.textContent = '';
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
      App.actualizarEtiquetasConfianza();
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

  handleLogout() {
    Auth.logout();
    App.applyAuthState();
  },

  showView(name) {
    const sectionByView = {
      mapView: 'mapa',
      perfilView: 'perfil',
      verifyView: 'verificacion',
      subirConfianzaView: 'subir-confianza'
    };
    if (name !== 'verifyView' && typeof Pasaporte !== 'undefined' && Pasaporte.detener) {
      Pasaporte.detener();
    }
    ['mapView', 'perfilView', 'verifyView', 'subirConfianzaView'].forEach(n => {
      if (App.elements[n]) App.elements[n].hidden = n !== name;
    });
    App.setMenuActive(sectionByView[name] || 'mapa');
    window.scrollTo(0, 0);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
