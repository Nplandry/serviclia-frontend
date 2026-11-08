const App = {
  ASSISTANT_MIN_CHARS: 5,
  ADJUNTOS: {
    max: 5,
    maxBytes: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png',
    extensiones: ['pdf', 'jpg', 'jpeg', 'png']
  },
  state: { currentCategory: null, rutVerificado: false, perfilGuardado: null },
  elements: {},

  init() {
    Auth.init();
    App.cacheElements();
    App.bindEvents();
    App.bindAuthEvents();
    App.renderCategoryTabs();
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
    const ids = ['asistenteView','formView','categoryList','backFromForm','orientationForm','formRut','rutError','submitForm','formStatus','logoutBtn','chatForm','chatInput','chatSend','chatMessages','chatStatus','authGate','tabLogin','tabRegister','loginForm','registerForm','loginStatus','registerStatus','historyBtn','historyPanel','historyOverlay','historyClose','historyList','historyClear','historyMenu','mapView','dashboardView','perfilView','dashKpis','dashBars','perfilStatus','perfilPasaporte','perfilForm','perfilNombre','perfilCorreo','perfilEdad','perfilTelefono','perfilRut','perfilGuardar','perfilFormStatus','perfilDocForm','perfilDoc','perfilDocSubir','perfilDocStatus','perfilClear','perfilLogout','perfilEliminar','perfilEliminarForm','perfilEliminarPass','perfilEliminarCancelar','perfilEliminarStatus','verifyView','auditoria','asistenteFab','asistentePanel','asistenteClose','asistenteTema'];
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
    App.elements.historyClear.addEventListener('click', App.handleHistoryClear);
    App.elements.historyMenu.addEventListener('click', App.handleMenuClick);
    App.elements.perfilForm.addEventListener('submit', App.handlePerfilGuardar);
    ['perfilEdad', 'perfilTelefono', 'perfilRut'].forEach(id =>
      App.elements[id].addEventListener('input', App.actualizarBotonGuardarPerfil));
    App.elements.perfilDocForm.addEventListener('submit', App.handlePerfilDocumento);
    App.elements.perfilClear.addEventListener('click', App.handleConfigClear);
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
    if (name === 'asistente') return App.showAsistente();
    if (name === 'mapa') { App.showView('mapView'); return Market.init(); }
    if (name === 'dashboard') { App.renderDashboard(); return App.showView('dashboardView'); }
    if (name === 'perfil') { App.renderPerfil(); return App.showView('perfilView'); }
    if (name === 'verificacion') { Pasaporte.init(); return App.showView('verifyView'); }
  },

  setMenuActive(name) {
    App.elements.historyMenu.querySelectorAll('[data-view]').forEach(btn => {
      const active = btn.dataset.view === name;
      btn.classList.toggle('history-menu__item--active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  },

  renderDashboard() {
    const items = Historial.getAll();
    const total = items.length;
    const ok = items.filter(it => it.ok).length;
    const ultima = total ? new Date(items[0].fecha).toLocaleString('es-CL') : '—';

    const kpis = App.elements.dashKpis;
    App.clearChildren(kpis);
    [
      ['Consultas guardadas', total],
      ['Sin alerta', ok],
      ['Con alerta', total - ok],
      ['Última consulta', ultima]
    ].forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'dash-kpi';
      const l = document.createElement('p');
      l.className = 'dash-kpi__label';
      l.textContent = label;
      const v = document.createElement('p');
      v.className = 'dash-kpi__value';
      v.textContent = String(value);
      card.appendChild(l);
      card.appendChild(v);
      kpis.appendChild(card);
    });

    const bars = App.elements.dashBars;
    App.clearChildren(bars);
    if (total === 0) {
      const empty = document.createElement('p');
      empty.className = 'history__empty';
      empty.textContent = 'Aún no hay consultas para mostrar.';
      bars.appendChild(empty);
      return;
    }
    const conteo = {};
    items.forEach(it => {
      const tema = it.caso || 'Sin tema';
      conteo[tema] = (conteo[tema] || 0) + 1;
    });
    const max = Math.max(...Object.values(conteo));
    Object.entries(conteo).sort((a, b) => b[1] - a[1]).forEach(([tema, n]) => {
      const row = document.createElement('div');
      const label = document.createElement('p');
      label.className = 'dash-bar__label';
      const nombre = document.createElement('span');
      nombre.textContent = tema;
      const cantidad = document.createElement('span');
      cantidad.textContent = String(n);
      label.appendChild(nombre);
      label.appendChild(cantidad);
      const track = document.createElement('div');
      track.className = 'dash-bar__track';
      const fill = document.createElement('div');
      fill.className = 'dash-bar__fill';
      fill.style.width = Math.round((n / max) * 100) + '%';
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      bars.appendChild(row);
    });
  },

  // Rellena la vista de perfil con los datos de la sesión. Los campos quedan editables y el botón
  // "Guardar cambios" aparece solo cuando algún valor difiere de lo guardado.
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
    // Un RUT verificado no se puede cambiar: el campo queda bloqueado y muestra su estado.
    App.state.rutVerificado = !!perfil.rut_verificado;
    App.elements.perfilRut.value = App.state.rutVerificado ? 'Verificado' : '';
    App.elements.perfilRut.placeholder = App.state.rutVerificado ? 'Verificado' : '12.345.678-5';
    App.elements.perfilRut.disabled = App.state.rutVerificado;
    // Valores guardados, para comparar con lo que escribe el usuario.
    App.state.perfilGuardado = { edad: App.elements.perfilEdad.value, telefono: App.elements.perfilTelefono.value };

    const scoring = perfil.inmobiliaria_scoring;
    App.renderDefinitionList(App.elements.perfilPasaporte, [
      ['Nivel', 'Nivel ' + (perfil.nivel_pasaporte || 1)],
      ['Estado', App.etiquetaEstadoPasaporte(perfil.estado_pasaporte)],
      ['Confiabilidad', perfil.score_confiabilidad == null ? 'Sin reservas cerradas' : perfil.score_confiabilidad + ' / 100'],
      ['Score de arriendo', scoring && scoring.score_financiero != null ? scoring.score_financiero + ' / 1000' : 'Sin verificar']
    ]);

    App.actualizarBotonGuardarPerfil();
    App.elements.perfilDocStatus.textContent = '';
    // El formulario de arriendo solo tiene sentido si aún no se verificó.
    App.elements.perfilDocForm.hidden = perfil.estado_pasaporte === 'verificado';
  },

  // Guardar siempre está visible; se habilita solo si edad, teléfono o RUT difieren de lo guardado.
  actualizarBotonGuardarPerfil() {
    const cambios = App.cambiosPerfil();
    App.elements.perfilGuardar.disabled = Object.keys(cambios).length === 0;
  },

  // Devuelve solo los campos que cambiaron respecto a lo guardado.
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

  // Guarda solo los campos que cambiaron. Si no hay cambios, no hace nada.
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
    App.renderPerfil();  // oculta Guardar de nuevo y toma los valores nuevos como guardados
    App.elements.perfilFormStatus.textContent = 'Perfil actualizado.';
  },

  // Sube el PDF de arriendo (Nivel 2) y refresca la vista con el nuevo score.
  async handlePerfilDocumento(e) {
    e.preventDefault();
    App.elements.perfilDocSubir.disabled = true;
    const res = await Auth.subirDocumentoArriendo(App.elements.perfilDoc.files[0]);
    App.elements.perfilDocSubir.disabled = false;
    if (!res.ok) {
      App.elements.perfilDocStatus.textContent = res.error;
      return;
    }
    App.renderPerfil();
    App.elements.perfilDocStatus.textContent = 'Documento verificado. Score de arriendo: ' + res.scoring.score_financiero + ' / 1000.';
  },

  handleConfigClear() {
    if (!window.confirm('¿Borrar todo el historial de consultas de este dispositivo?')) return;
    App.handleHistoryClear();
  },

  mostrarEliminarCuenta() {
    App.elements.perfilEliminarForm.hidden = false;
    App.elements.perfilEliminarPass.value = '';
    App.elements.perfilEliminarStatus.textContent = '';
    // La vista de perfil es larga: el formulario debe quedar a la vista al abrirse.
    App.elements.perfilEliminarForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    App.elements.perfilEliminarPass.focus({ preventScroll: true });
  },

  ocultarEliminarCuenta() {
    App.elements.perfilEliminarForm.hidden = true;
    App.elements.perfilEliminarPass.value = '';
    App.elements.perfilEliminarStatus.textContent = '';
  },

  // Borra la cuenta en el servidor y, si sale bien, limpia el historial local del dispositivo.
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
    try {
      localStorage.removeItem(Historial.storageKey());
    } catch {}
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
    App.elements.asistenteFab.hidden = !authed;

    if (authed) {
      const user = Auth.getCurrentUser();
      Historial.init(user.email);
      App.renderHistory();
      App.showAsistente();
    } else {
      App.closeHistory();
      App.cerrarAsistente();
      App.state.currentCategory = null;
      App.resetChat();
    }
  },

  openHistory() {
    App.renderHistory();
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

  handleHistoryClear() {
    Historial.clear();
    App.renderHistory();
  },

  renderHistory() {
    const list = App.elements.historyList;
    App.clearChildren(list);
    const items = Historial.getAll();
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'history__empty';
      empty.textContent = 'Aún no hay consultas registradas.';
      list.appendChild(empty);
      App.elements.historyClear.disabled = true;
      return;
    }
    App.elements.historyClear.disabled = false;
    items.forEach(it => {
      const card = document.createElement('article');
      card.className = 'history__item history__item--' + (it.ok ? 'ok' : 'warn');

      const head = document.createElement('p');
      head.className = 'history__item-caso';
      head.textContent = it.caso;
      card.appendChild(head);

      if (it.rut) {
        const rut = document.createElement('p');
        rut.className = 'history__item-rut';
        rut.textContent = it.rut;
        card.appendChild(rut);
      }

      const resumen = document.createElement('p');
      resumen.className = 'history__item-resumen';
      resumen.textContent = it.resumen;
      card.appendChild(resumen);

      const fecha = document.createElement('p');
      fecha.className = 'history__item-fecha';
      fecha.textContent = App.formatHistoryDate(it.fecha);
      card.appendChild(fecha);

      list.appendChild(card);
    });
  },

  formatHistoryDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
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

  bindEvents() {
    App.elements.backFromForm.addEventListener('click', App.showAsistente);
    App.elements.orientationForm.addEventListener('submit', App.handleFormSubmit);
    App.elements.formRut.addEventListener('blur', App.handleRutBlur);
    App.bindAssistant();
  },

  clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); },

  // Selector de temas el tema elegido define la auditoria y el filtro de normativa del asistente.
  renderCategoryTabs() {
    const list = App.elements.categoryList;
    App.clearChildren(list);
    CATEGORIAS.forEach(c => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-card';
      btn.dataset.categoria = c.id;
      btn.setAttribute('aria-pressed', 'false');

      const header = document.createElement('span');
      header.className = 'category-card__header';
      const icono = document.createElement('span');
      icono.className = 'category-card__icono';
      icono.setAttribute('aria-hidden', 'true');
      icono.innerHTML = ICONOS_SVG[ICONO_CATEGORIA[c.id]];
      const titulo = document.createElement('span');
      titulo.className = 'category-card__title';
      titulo.textContent = c.title;
      header.append(icono, titulo);

      const tema = document.createElement('span');
      tema.className = 'category-card__topic';
      tema.textContent = c.short;

      btn.append(header, tema);
      btn.addEventListener('click', () => App.openCategory(c.id));
      li.appendChild(btn);
      list.appendChild(li);
    });
  },

  showAsistente() {
    App.openCategory((App.state.currentCategory || CATEGORIAS[0]).id);
  },

  openCategory(id) {
    const c = CATEGORIAS.find(x => x.id === id);
    if (!c) return;
    if (App.state.currentCategory !== c) {
      App.resetChat();
      App.renderAuditoria(c);
    }
    App.state.currentCategory = c;
    App.elements.asistenteTema.textContent = 'Tema: ' + c.title;
    App.elements.categoryList.querySelectorAll('[data-categoria]').forEach(btn => {
      const activo = btn.dataset.categoria === id;
      btn.classList.toggle('category-card--activo', activo);
      btn.setAttribute('aria-pressed', String(activo));
    });
    App.showView('asistenteView');
  },

  // Auditoria del tema en dos pasos datos del caso y diagnostico.
  renderAuditoria(c) {
    const raiz = App.elements.auditoria;
    App.clearChildren(raiz);
    const resultado = document.createElement('section');
    resultado.className = 'auditoria__card';
    resultado.setAttribute('aria-live', 'polite');
    resultado.hidden = true;
    raiz.append(App.buildPasoCaso(c, resultado), resultado);
  },

  buildPasoHead(paso, titulo, lead) {
    const head = document.createElement('div');
    head.className = 'auditoria__head';
    const badge = document.createElement('span');
    badge.className = 'auditoria__paso';
    badge.textContent = 'Paso ' + paso + ' de 2';
    const h = document.createElement('h2');
    h.className = 'auditoria__titulo';
    h.textContent = titulo;
    head.append(badge, h);
    if (lead) {
      const p = document.createElement('p');
      p.className = 'auditoria__lead';
      p.textContent = lead;
      head.appendChild(p);
    }
    return head;
  },

  buildPasoCaso(c, resultado) {
    const card = document.createElement('section');
    card.className = 'auditoria__card';
    card.appendChild(App.buildPasoHead(1, 'Auditoría express: ' + c.title, c.description));

    const tipos = document.createElement('fieldset');
    tipos.className = 'auditoria__grupo';
    const legend = document.createElement('legend');
    legend.className = 'field__label';
    legend.textContent = c.preguntaCaso;
    const opciones = document.createElement('div');
    opciones.className = 'auditoria__tipos';
    let seleccionado = c.items[0];
    c.items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'auditoria__tipo';
      btn.textContent = item.title;
      btn.setAttribute('aria-pressed', String(item === seleccionado));
      btn.addEventListener('click', () => {
        seleccionado = item;
        opciones.querySelectorAll('.auditoria__tipo').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      });
      opciones.appendChild(btn);
    });
    tipos.append(legend, opciones);

    const campo = document.createElement('div');
    campo.className = 'field';
    const label = document.createElement('label');
    label.className = 'field__label';
    label.htmlFor = 'relato-' + c.id;
    label.textContent = 'Cuéntenos qué pasó';
    const relato = document.createElement('textarea');
    relato.className = 'field__textarea';
    relato.id = 'relato-' + c.id;
    relato.rows = 3;
    relato.maxLength = 300;
    relato.placeholder = c.placeholder;
    campo.append(label, relato);

    const adjuntos = App.buildAdjuntos(c);

    const rutCampo = document.createElement('div');
    rutCampo.className = 'field';
    const rutLabel = document.createElement('label');
    rutLabel.className = 'field__label';
    rutLabel.htmlFor = 'rut-' + c.id;
    rutLabel.textContent = 'Su RUT (opcional)';
    const rut = document.createElement('input');
    rut.type = 'text';
    rut.id = 'rut-' + c.id;
    rut.className = 'field__input';
    rut.placeholder = '12.345.678-9';
    rut.maxLength = 12;
    rut.autocomplete = 'off';
    rut.addEventListener('blur', () => { if (rut.value.trim()) rut.value = Security.formatRut(rut.value); });
    const rutError = document.createElement('p');
    rutError.className = 'error-text';
    rutError.setAttribute('role', 'alert');
    rutError.hidden = true;
    rutCampo.append(rutLabel, rut, rutError);

    const auditar = document.createElement('button');
    auditar.type = 'button';
    auditar.className = 'submit-btn';
    auditar.textContent = 'Auditar ahora';
    auditar.addEventListener('click', () => {
      rutError.hidden = true;
      if (rut.value.trim() && !Security.validateRut(rut.value.trim())) {
        rutError.textContent = 'El RUT ingresado no es válido. Revise el dígito verificador o déjelo vacío.';
        rutError.hidden = false;
        rut.focus();
        return;
      }
      App.renderDiagnostico(resultado, c, seleccionado, relato.value.trim(), adjuntos.archivos());
      Historial.add({ caso: c.title, casoId: c.id, resumen: seleccionado.diagnostico.etiqueta, ok: seleccionado.diagnostico.nivel !== 'alto' });
      App.renderHistory();
    });

    card.append(tipos, campo, rutCampo, adjuntos.nodo, auditar);
    return card;
  },

  // Documentos del caso PDF o fotos. Se validan y listan en el navegador. No se suben al servidor.
  buildAdjuntos(c) {
    const cfg = App.ADJUNTOS;
    const archivos = [];
    const campo = document.createElement('div');
    campo.className = 'field';

    const titulo = document.createElement('p');
    titulo.className = 'field__label';
    titulo.textContent = 'Documentos del caso';

    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'adjuntos-' + c.id;
    input.className = 'u-visually-hidden';
    input.multiple = true;
    input.accept = cfg.accept;

    const zona = document.createElement('label');
    zona.className = 'adjuntos__zona';
    zona.htmlFor = input.id;
    const zonaTexto = document.createElement('span');
    zonaTexto.className = 'adjuntos__zona-texto';
    zonaTexto.textContent = 'Adjunte la carta, el SMS o su cartola';
    const zonaAyuda = document.createElement('span');
    zonaAyuda.className = 'adjuntos__zona-ayuda';
    zonaAyuda.textContent = 'Arrastre o toque para elegir. PDF, JPG o PNG, hasta ' + cfg.max + ' archivos de 10 MB.';
    zona.append(zonaTexto, zonaAyuda);

    const lista = document.createElement('ul');
    lista.className = 'adjuntos__lista';
    lista.hidden = true;

    const error = document.createElement('p');
    error.className = 'error-text';
    error.setAttribute('role', 'alert');
    error.hidden = true;

    const renderLista = () => {
      App.clearChildren(lista);
      lista.hidden = archivos.length === 0;
      archivos.forEach((archivo, i) => {
        const li = document.createElement('li');
        li.className = 'adjuntos__item';
        const nombre = document.createElement('span');
        nombre.className = 'adjuntos__nombre';
        nombre.textContent = archivo.name;
        const peso = document.createElement('span');
        peso.className = 'adjuntos__peso';
        peso.textContent = App.formatBytes(archivo.size);
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'adjuntos__quitar';
        quitar.textContent = 'Quitar';
        quitar.setAttribute('aria-label', 'Quitar ' + archivo.name);
        quitar.addEventListener('click', () => {
          archivos.splice(i, 1);
          renderLista();
        });
        li.append(nombre, peso, quitar);
        lista.appendChild(li);
      });
    };

    const agregar = files => {
      const rechazos = [];
      Array.from(files).forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (!cfg.extensiones.includes(ext)) rechazos.push(f.name + ': formato no permitido');
        else if (f.size > cfg.maxBytes) rechazos.push(f.name + ': supera 10 MB');
        else if (archivos.some(a => a.name === f.name && a.size === f.size)) rechazos.push(f.name + ': ya está adjunto');
        else if (archivos.length >= cfg.max) rechazos.push(f.name + ': máximo ' + cfg.max + ' archivos');
        else archivos.push(f);
      });
      error.textContent = rechazos.join('. ');
      error.hidden = rechazos.length === 0;
      renderLista();
      input.value = '';
    };

    input.addEventListener('change', () => agregar(input.files));
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('adjuntos__zona--activa'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('adjuntos__zona--activa'));
    zona.addEventListener('drop', e => {
      e.preventDefault();
      zona.classList.remove('adjuntos__zona--activa');
      agregar(e.dataTransfer.files);
    });

    campo.append(titulo, input, zona, lista, error);
    return { nodo: campo, archivos: () => archivos.slice() };
  },

  formatBytes(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  renderDiagnostico(card, c, item, relato, archivos) {
    const d = item.diagnostico;
    App.clearChildren(card);
    card.appendChild(App.buildPasoHead(2, 'Diagnóstico: ' + item.title));

    const semaforo = document.createElement('div');
    semaforo.className = 'diag__semaforo diag__semaforo--' + d.nivel;
    const etiqueta = document.createElement('span');
    etiqueta.className = 'diag__etiqueta';
    etiqueta.textContent = d.etiqueta;
    const titulo = document.createElement('p');
    titulo.className = 'diag__resumen';
    titulo.textContent = d.titulo;
    const nivel = document.createElement('span');
    nivel.className = 'diag__nivel';
    nivel.textContent = d.nivel === 'alto' ? 'Riesgo alto' : 'Riesgo medio';
    semaforo.append(etiqueta, titulo, nivel);

    const fundamento = App.buildDiagBloque('Fundamento');
    const texto = document.createElement('p');
    texto.className = 'diag__texto';
    texto.textContent = c.fundamento;
    fundamento.append(texto);

    const acciones = App.buildDiagBloque('Acciones recomendadas');
    acciones.appendChild(App.buildLista('ul', item.content));
    const cita = document.createElement('p');
    cita.className = 'diag__cita';
    cita.textContent = '“' + item.queDecir + '”';
    acciones.append(App.buildSubtitulo('Qué decir si vuelven a contactarle:'), cita, App.buildSubtitulo('Dónde acudir:'), App.buildEscalamiento(c.escalamiento));

    const bloques = [semaforo, fundamento, acciones];
    if (archivos.length) {
      const docs = App.buildDiagBloque('Documentos del caso');
      docs.append(
        App.buildLista('ul', archivos.map(a => a.name + ' (' + App.formatBytes(a.size) + ')')),
        App.buildSubtitulo('Guárdelos: le servirán como evidencia si presenta un reclamo.')
      );
      bloques.push(docs);
    }

    const siguientes = document.createElement('div');
    siguientes.className = 'diag__siguientes';
    siguientes.append(
      App.buildBotonSecundario('Ver Pasaporte de Confianza', () => App.openSection('verificacion')),
      App.buildBotonSecundario('Solicitar orientador personalizado', App.showForm)
    );

    const ia = document.createElement('button');
    ia.type = 'button';
    ia.className = 'diag__ia';
    ia.textContent = 'Resolver mis dudas con IA';
    ia.addEventListener('click', () => App.abrirAsistente(relato));

    card.append(...bloques, siguientes, ia);
    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  buildDiagBloque(titulo) {
    const bloque = document.createElement('div');
    bloque.className = 'diag__bloque';
    const h = document.createElement('h3');
    h.className = 'diag__bloque-titulo';
    h.textContent = titulo;
    bloque.appendChild(h);
    return bloque;
  },

  buildSubtitulo(texto) {
    const p = document.createElement('p');
    p.className = 'diag__subtitulo';
    p.textContent = texto;
    return p;
  },

  buildLista(tag, items, titulo) {
    const lista = document.createElement(tag);
    lista.className = 'diag__lista';
    items.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      lista.appendChild(li);
    });
    if (!titulo) return lista;
    const grupo = document.createDocumentFragment();
    grupo.append(App.buildSubtitulo(titulo), lista);
    return grupo;
  },

  buildEscalamiento(destinos) {
    const ul = document.createElement('ul');
    ul.className = 'diag__lista diag__escalamiento';
    destinos.forEach(e => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = e.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = e.nombre;
      li.append(a, document.createTextNode(': ' + e.detalle));
      ul.appendChild(li);
    });
    return ul;
  },

  buildBotonSecundario(texto, accion) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'diag__secundario';
    btn.textContent = texto;
    btn.addEventListener('click', accion);
    return btn;
  },

  showForm() {
    App.elements.orientationForm.reset();
    App.elements.rutError.textContent = '';
    App.elements.formStatus.textContent = '';
    App.elements.submitForm.disabled = false;
    App.showView('formView');
  },

  handleRutBlur() {
    const raw = App.elements.formRut.value.trim();
    if (!raw) return;
    const fmt = Security.formatRut(raw);
    App.elements.formRut.value = fmt;
    App.elements.rutError.textContent = Security.validateRut(fmt) ? '' : 'El RUT ingresado no es válido. Revise el número y el dígito verificador.';
  },

  async handleFormSubmit(e) {
    e.preventDefault();
    const fd = new FormData(App.elements.orientationForm);
    const p = { nombre: Security.sanitizeText(fd.get('nombre')), rut: Security.sanitizeText(fd.get('rut')), tema: Security.sanitizeText(fd.get('tema')), mensaje: Security.sanitizeText(fd.get('mensaje')) };
    if (p.nombre.length < 2 || p.tema.length < 3 || p.mensaje.length < 10) {
      App.elements.formStatus.textContent = 'Por favor complete todos los campos correctamente.';
      App.elements.formStatus.style.color = 'var(--color-error)';
      return;
    }
    if (!Security.validateRut(p.rut)) { App.elements.rutError.textContent = 'El RUT ingresado no es válido.'; App.elements.formRut.focus(); return; }
    App.elements.submitForm.disabled = true;
    App.elements.formStatus.style.color = 'var(--color-success)';
    App.elements.formStatus.textContent = 'Analizando...';
    try {
      const r = await API.submitOrientation('/api/orientacion', p);
      App.elements.formStatus.textContent = `${r.message} Ticket: ${r.ticket}`;
      App.elements.orientationForm.reset();
    } catch {
      App.elements.formStatus.style.color = 'var(--color-error)';
      App.elements.formStatus.textContent = 'Ocurrió un error. Intente nuevamente.';
    } finally {
      App.elements.submitForm.disabled = false;
    }
  },

  showView(name) {
    const sectionByView = { mapView: 'mapa', dashboardView: 'dashboard', perfilView: 'perfil', verifyView: 'verificacion' };
    ['asistenteView','formView','mapView','dashboardView','perfilView','verifyView'].forEach(n => App.elements[n].hidden = n !== name);
    App.setMenuActive(sectionByView[name] || 'asistente');
    window.scrollTo(0, 0);
  },

  addChatMessage(text, sender, messages) {
    const b = document.createElement('div');
    b.className = `chat__bubble chat__bubble--${sender}`;
    b.textContent = text;
    messages.classList.add('chat__messages--has-messages');
    messages.appendChild(b);
    messages.scrollTop = messages.scrollHeight;
  },

  // Asistente ServicIA flotante. Consulta el backend RAG filtrando por el tema elegido.
  bindAssistant() {
    App.elements.chatInput.addEventListener('input', App.refreshChatSend);
    App.elements.chatForm.addEventListener('submit', App.handleAssistantSubmit);
    App.elements.asistenteFab.addEventListener('click', () => App.abrirAsistente());
    App.elements.asistenteClose.addEventListener('click', App.cerrarAsistente);
    App.elements.asistentePanel.addEventListener('keydown', e => { if (e.key === 'Escape') App.cerrarAsistente(); });
    App.refreshChatSend();
  },

  // Abre el panel. Si llega un texto, como el relato del caso, lo deja escrito para que el usuario decida enviarlo.
  abrirAsistente(texto) {
    const { asistentePanel: panel, asistenteFab: fab, chatInput: input, chatMessages: messages } = App.elements;
    if (!messages.children.length) {
      App.addChatMessage('¡Hola! Soy tu asistente para ' + App.state.currentCategory.title + '. ¿En qué te puedo ayudar hoy?', 'bot', messages);
    }
    if (texto && !input.value) input.value = texto;
    App.refreshChatSend();
    panel.hidden = false;
    fab.hidden = true;
    fab.setAttribute('aria-expanded', 'true');
    input.focus();
  },

  cerrarAsistente() {
    const { asistentePanel: panel, asistenteFab: fab } = App.elements;
    if (panel.hidden) return;
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    if (Auth.isAuthenticated()) {
      fab.hidden = false;
      fab.focus();
    }
  },

  // El boton Enviar queda deshabilitado hasta que la pregunta tenga el minimo de caracteres.
  refreshChatSend() {
    App.elements.chatSend.disabled = App.elements.chatInput.value.trim().length < App.ASSISTANT_MIN_CHARS;
  },

  resetChat() {
    const messages = App.elements.chatMessages;
    App.clearChildren(messages);
    messages.classList.remove('chat__messages--has-messages');
    App.elements.chatStatus.textContent = '';
    App.elements.chatInput.value = '';
    App.refreshChatSend();
  },

  async handleAssistantSubmit(e) {
    e.preventDefault();
    const { chatInput: input, chatSend: send, chatMessages: messages, chatStatus: status } = App.elements;
    const msg = Security.sanitizeText(input.value);
    if (msg.length < App.ASSISTANT_MIN_CHARS) return;
    status.textContent = '';
    App.addChatMessage(msg, 'user', messages);
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    const espera = document.createElement('div');
    espera.className = 'chat__bubble chat__bubble--bot chat__bubble--waiting';
    espera.setAttribute('aria-label', 'El asistente está buscando la respuesta');
    espera.innerHTML = '<span class="chat__dot"></span><span class="chat__dot"></span><span class="chat__dot"></span>';
    messages.appendChild(espera);
    messages.scrollTop = messages.scrollHeight;

    const res = await API.consultarAsistente(msg, App.state.currentCategory.id);
    espera.remove();
    input.disabled = false;
    App.refreshChatSend();

    if (!res.ok) {
      App.addChatMessage(res.error || 'No se pudo obtener respuesta. Intente de nuevo.', 'bot', messages);
      if (res.status === 401) {
        Auth.logout();
        App.applyAuthState();
      }
      return;
    }
    const burbuja = App.renderAssistantAnswer(res.data, messages);
    // Muestra el inicio de la respuesta, no el final, para leer de arriba hacia abajo.
    messages.scrollTop = Math.max(0, burbuja.offsetTop - messages.offsetTop - 8);
    input.focus();
  },

  renderAssistantAnswer(data, messages) {
    const b = document.createElement('div');
    b.className = 'chat__bubble chat__bubble--bot';
    const texto = document.createElement('p');
    texto.className = 'chat__answer';
    texto.textContent = data.respuesta;
    b.appendChild(texto);

    if (data.fuentes && data.fuentes.length) {
      const titulo = document.createElement('p');
      titulo.className = 'chat__sources-title';
      titulo.textContent = 'Fuentes:';
      b.appendChild(titulo);
      const lista = document.createElement('ol');
      lista.className = 'chat__sources';
      data.fuentes.forEach(f => {
        const li = document.createElement('li');
        const etiqueta = f.titulo + (f.pagina ? ', página ' + f.pagina : '');
        // Solo se aceptan enlaces https. La URL viene de la base de documentos.
        if (f.url && /^https:\/\//i.test(f.url)) {
          const a = document.createElement('a');
          a.href = f.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = etiqueta;
          li.appendChild(a);
        } else {
          li.textContent = etiqueta;
        }
        lista.appendChild(li);
      });
      b.appendChild(lista);
    }

    messages.classList.add('chat__messages--has-messages');
    messages.appendChild(b);
    return b;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
