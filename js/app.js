const CATEGORIAS = [
  {
    id: 'embargo-falso',
    title: 'Amenaza de embargo',
    short: 'Caso 1 - Defensa patrimonial',
    description: 'Llamada o carta que amenaza con embargar su casa o auto por una deuda antigua.',
    cruce: { endpoint: '/v1/patrimonio', fuentes: ['SII (Propiedades)', 'Registro Civil (Vehículos)'] },
    frases: ['Sé que no registro bienes embargables a mi nombre. Exijo notificación judicial formal antes de responder.'],
    items: [
      { id: 'embargo-amenaza', title: 'Me amenazan con embargar mis bienes', content: ['No entregue datos ni acepte pagar nada por teléfono.', 'Pida el nombre del tribunal, el número de causa y una notificación formal.', 'Un embargo real siempre llega por vía judicial, no por una llamada.', 'El acompañante puede verificar si usted registra bienes a su nombre con el cruce de datos.'] },
      { id: 'embargo-carta', title: 'Me llegó una carta de "cobranza judicial"', content: ['Revise si la carta tiene número de rol y nombre de tribunal verificables.', 'Las cobranzas extrajudiciales no pueden simular documentos judiciales.', 'Guarde la carta como evidencia.', 'Denuncie la amenaza falsa en SERNAC.'] }
    ]
  },
  {
    id: 'seguros',
    title: 'Seguros no consentidos',
    short: 'Caso 2 - Auditoría financiera',
    description: 'Descuento extraño en la pensión o cartola bajo concepto de seguros o asistencias.',
    cruce: { endpoint: '/v1/polizas', fuentes: ['CMF'] },
    frases: ['No autoricé ni firmé este seguro. Exijo la prueba de aceptación y la restitución retroactiva de lo cobrado.'],
    items: [
      { id: 'seguro-agregado', title: 'Me agregaron un seguro que no pedí', content: ['Revise los cargos en su cartola bancaria o liquidación de pensión.', 'Solicite la póliza y la prueba de aceptación por escrito.', 'Si no la contrató, exija anulación y devolución con intereses.', 'El acompañante genera un folio de reclamo CMF/SERNAC.'] },
      { id: 'seguro-credito', title: 'Me dijeron que el seguro es obligatorio', content: ['Pregunte si puede contratarlo con otra aseguradora.', 'Pida el costo total del seguro durante toda la vida del crédito.', 'Compare precios con al menos dos aseguradoras.', 'Si le presionan, no firme y revise el contrato en su casa.'] }
    ]
  },
  {
    id: 'portabilidad',
    title: 'Cambio de plan engañoso',
    short: 'Caso 3 - Telecomunicaciones',
    description: 'Llamada para "actualizar su plan" que exige un código SMS de verificación.',
    cruce: { endpoint: '/v1/subtel', fuentes: ['SUBTEL (Traspaso de operador)'] },
    frases: ['No autorizo el cambio de compañía ni entregaré códigos SMS.'],
    items: [
      { id: 'portabilidad-sms', title: 'Me piden un código SMS para "mejorar mi plan"', content: ['Nunca entregue un código SMS que llega a su teléfono.', 'Ese código autoriza el traspaso de su número a otra compañía.', 'Corte la llamada y verifique directamente con su operador.', 'El acompañante revisa si hay una señal de traspaso en SUBTEL.'] },
      { id: 'portabilidad-forzada', title: 'Me cambiaron de compañía sin mi permiso', content: ['Revise sus boletas y contratos recientes.', 'Exija a la nueva empresa la reversión del cambio.', 'Pida constancia escrita de quién autorizó el cambio.', 'Denuncie ante SUBTEL o SERNAC.'] }
    ]
  }
];

const FRASES_EMERGENCIA = [
  'Sé que no registro bienes embargables a mi nombre. Exijo notificación judicial formal antes de responder.',
  'No autoricé ni firmé este seguro. Exijo la prueba de aceptación y la restitución de lo cobrado.',
  'No autorizo el cambio de compañía ni entregaré códigos SMS.',
  'Necesito que me envíen esto por escrito para revisarlo con calma.',
  'No voy a dar datos ni firmar nada hasta conversar con mi familia.'
];

const App = {
  state: { currentCategory: null, currentItem: null, voices: [] },
  elements: {},

  init() {
    Auth.init();
    App.cacheElements();
    App.bindEvents();
    App.bindAuthEvents();
    App.setGreeting();
    App.updateEmergencyButton();
    App.renderCategories(CATEGORIAS);
    App.loadVoices();
    App.setupInstall();
    App.applyAuthState();
  },

  cacheElements() {
    const ids = ['homeView','categoryView','detailView','formView','searchInput','categoryList','zeroResults','emergencyBtn','backFromCategory','backFromDetail','backFromForm','categoryTitle','categoryDescription','categoryContent','detailArticle','speakBtn','stopSpeakBtn','orientationForm','formRut','rutError','submitForm','formStatus','greeting','installBtn','logoutBtn','chatForm','chatInput','chatSend','chatMessages','chatStatus','mainChatForm','mainChatInput','mainChatSend','mainChatMessages','mainChatStatus','authGate','tabLogin','tabRegister','loginForm','registerForm','loginStatus','registerStatus','historyBtn','historyPanel','historyOverlay','historyClose','historyList','historyClear'];
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
  },

  applyAuthState() {
    const authed = Auth.isAuthenticated();
    App.elements.authGate.hidden = authed;
    App.elements.appHeader.hidden = !authed;
    App.elements.appMain.hidden = !authed;
    if (App.elements.appFooter) App.elements.appFooter.hidden = !authed;
    App.elements.logoutBtn.hidden = !authed;
    App.elements.emergencyBtn.hidden = !authed;
    App.elements.historyBtn.hidden = !authed;

    if (authed) {
      const user = Auth.getCurrentUser();
      Historial.init(user.email);
      App.renderHistory();
      App.setGreeting();
      App.updateEmergencyButton();
      App.renderCategories(CATEGORIAS);
      App.showHome();
    } else {
      App.closeHistory();
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

      const rut = document.createElement('p');
      rut.className = 'history__item-rut';
      rut.textContent = it.rut;
      card.appendChild(rut);

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

  handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(App.elements.loginForm);
    const res = Auth.login(fd.get('email'), fd.get('password'));
    if (!res.ok) {
      App.elements.loginStatus.textContent = res.error;
      return;
    }
    App.elements.loginForm.reset();
    App.elements.loginStatus.textContent = '';
    App.applyAuthState();
  },

  handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(App.elements.registerForm);
    const res = Auth.register({ nombre: fd.get('nombre'), email: fd.get('email'), password: fd.get('password') });
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
    App.elements.searchInput.addEventListener('input', App.handleSearch);
    App.elements.emergencyBtn.addEventListener('click', App.handleEmergency);
    App.elements.backFromCategory.addEventListener('click', App.showHome);
    App.elements.backFromDetail.addEventListener('click', App.showCategory);
    App.elements.backFromForm.addEventListener('click', App.showHome);
    App.elements.speakBtn.addEventListener('click', App.speakCurrent);
    App.elements.stopSpeakBtn.addEventListener('click', App.stopSpeaking);
    App.elements.orientationForm.addEventListener('submit', App.handleFormSubmit);
    App.elements.formRut.addEventListener('blur', App.handleRutBlur);
    App.bindChat(App.elements.chatForm, App.elements.chatInput, App.elements.chatSend, App.elements.chatMessages);
    App.bindChat(App.elements.mainChatForm, App.elements.mainChatInput, App.elements.mainChatSend, App.elements.mainChatMessages);
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = App.loadVoices;
  },

  bindChat(form, input, send, messages) {
    form.addEventListener('submit', e => App.handleChatSubmit(e, { input, send, messages }));
  },

  setGreeting() {
    const h = new Date().getHours();
    let t = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    t += ', bienvenido a ServicIA';
    App.elements.greeting.textContent = t;
    const heroText = document.querySelector('.hero__text');
    if (heroText) heroText.textContent = 'Seleccione un tema para recibir orientación paso a paso.';
  },

  updateEmergencyButton() {
    App.elements.emergencyBtn.hidden = false;
    App.elements.emergencyBtn.textContent = '¿Qué digo ahora?';
  },

  clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); },

  renderCategories(categories) {
    App.clearChildren(App.elements.categoryList);
    App.elements.zeroResults.hidden = categories.length > 0;

    categories.forEach(c => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'category-card';
      btn.type = 'button';
      btn.innerHTML = `<span>${c.title}</span><span class="category-card__desc">${c.short}</span>`;
      btn.addEventListener('click', () => App.openCategory(c.id));
      li.appendChild(btn);
      App.elements.categoryList.appendChild(li);
    });
  },

  handleSearch() {
    const q = Security.sanitizeText(App.elements.searchInput.value).toLowerCase();
    App.renderCategories(q ? CATEGORIAS.filter(c => c.title.toLowerCase().includes(q) || c.short.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.items.some(i => i.title.toLowerCase().includes(q))) : CATEGORIAS);
  },

  handleEmergency() {
    const phrase = FRASES_EMERGENCIA[Math.floor(Math.random() * FRASES_EMERGENCIA.length)];
    if (window.speechSynthesis) App.speakText(phrase);
    App.elements.emergencyBtn.textContent = phrase;
    setTimeout(() => App.updateEmergencyButton(), 4000);
  },

  openCategory(id) {
    const c = CATEGORIAS.find(x => x.id === id);
    if (!c) return;
    App.state.currentCategory = c;
    App.elements.categoryTitle.textContent = c.title;
    App.elements.categoryDescription.textContent = c.description;
    App.clearChildren(App.elements.categoryContent);

    (c.frases || []).forEach(f => App.addRejectionBlock(f));

    if (c.cruce) {
      App.addDataCheckStation(c);
    }

    c.items.forEach(i => App.addContentCard(i.title, () => App.openDetail(i.id)));
    App.addContentCard('Solicitar orientación personalizada', App.showForm);
    App.showView('categoryView');
  },

  addRejectionBlock(frase) {
    const block = document.createElement('div');
    block.className = 'rejection';
    const label = document.createElement('p');
    label.className = 'rejection__label';
    label.textContent = 'Lea esta frase en voz alta:';
    const quote = document.createElement('p');
    quote.className = 'rejection__quote';
    quote.textContent = frase;
    const speak = document.createElement('button');
    speak.type = 'button';
    speak.className = 'rejection__speak';
    speak.textContent = 'Escuchar frase';
    speak.addEventListener('click', () => App.speakText(frase));
    block.appendChild(label);
    block.appendChild(quote);
    block.appendChild(speak);
    App.elements.categoryContent.appendChild(block);
  },

  addDataCheckStation(categoria) {
    const station = document.createElement('div');
    station.className = 'datacheck';

    const heading = document.createElement('h3');
    heading.className = 'datacheck__title';
    heading.textContent = 'Cruce de datos';
    station.appendChild(heading);

    const sources = document.createElement('p');
    sources.className = 'datacheck__sources';
    sources.textContent = 'Fuentes: ' + categoria.cruce.fuentes.join(', ');
    station.appendChild(sources);

    const rutField = document.createElement('div');
    rutField.className = 'field';
    const rutLabel = document.createElement('label');
    rutLabel.className = 'field__label';
    const rutId = 'dcRut-' + categoria.id;
    rutLabel.setAttribute('for', rutId);
    rutLabel.textContent = 'RUT a verificar';
    const rutInput = document.createElement('input');
    rutInput.className = 'field__input';
    rutInput.id = rutId;
    rutInput.type = 'text';
    rutInput.placeholder = '12.345.678-9';
    rutInput.maxLength = 12;
    rutInput.addEventListener('blur', () => {
      if (rutInput.value.trim()) rutInput.value = Security.formatRut(rutInput.value);
    });
    rutField.appendChild(rutLabel);
    rutField.appendChild(rutInput);
    station.appendChild(rutField);

    const relatoField = document.createElement('div');
    relatoField.className = 'field';
    const relatoLabel = document.createElement('label');
    relatoLabel.className = 'field__label';
    const relatoId = 'dcRelato-' + categoria.id;
    relatoLabel.setAttribute('for', relatoId);
    relatoLabel.textContent = 'Relato';
    const relatoInput = document.createElement('textarea');
    relatoInput.className = 'field__textarea';
    relatoInput.id = relatoId;
    relatoInput.rows = 2;
    relatoInput.maxLength = 500;
    relatoInput.placeholder = 'Escriba lo que ocurrió...';
    relatoField.appendChild(relatoLabel);
    relatoField.appendChild(relatoInput);
    station.appendChild(relatoField);

    const privacy = document.createElement('p');
    station.appendChild(privacy);

    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'datacheck__run';
    runBtn.textContent = 'Ejecutar cruce de datos';
    station.appendChild(runBtn);

    const result = document.createElement('div');
    result.className = 'datacheck__result';
    result.setAttribute('aria-live', 'polite');
    result.hidden = true;
    station.appendChild(result);

    runBtn.addEventListener('click', async () => {
      const rawRut = rutInput.value.trim();
      if (!Security.validateRut(rawRut)) {
        result.hidden = false;
        result.className = 'datacheck__result datacheck__result--error';
        App.clearChildren(result);
        const p = document.createElement('p');
        p.textContent = 'Ingrese un RUT válido para ejecutar el cruce.';
        result.appendChild(p);
        rutInput.focus();
        return;
      }
      runBtn.disabled = true;
      runBtn.textContent = 'Consultando fuentes...';
      try {
        const r = await Security.simulateDataCheck(categoria.id, rawRut, relatoInput.value);
        const summary = App.renderDataCheckResult(result, categoria, r);
        Historial.add({
          caso: categoria.title,
          casoId: categoria.id,
          rut: r.sent.rut,
          resumen: summary.resumen,
          ok: summary.ok
        });
        App.renderHistory();
      } catch (err) {
        result.hidden = false;
        result.className = 'datacheck__result datacheck__result--error';
        App.clearChildren(result);
        const p = document.createElement('p');
        p.textContent = 'No se pudo completar el cruce. Intente nuevamente.';
        result.appendChild(p);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Ejecutar cruce de datos';
      }
    });

    App.elements.categoryContent.appendChild(station);
  },

  renderDataCheckResult(container, categoria, r) {
    App.clearChildren(container);
    container.className = 'datacheck__result';
    container.hidden = false;
    const h = r.hallazgos;

    const alert = document.createElement('div');
    let alertText = '';
    let alertOk = true;
    if (categoria.id === 'embargo-falso') {
      const sinBienes = h.bienesRaices === 0 && h.vehiculos === 0;
      alertOk = sinBienes;
      alertText = sinBienes
        ? 'Alerta de inexistencia de garantía: no registra bienes embargables. Use la frase de rechazo.'
        : 'Registra bienes a su nombre. Verifique la legitimidad de la deuda antes de responder.';
    } else if (categoria.id === 'solvencia') {
      const score = (h.bienesRaices * 30) + (h.vehiculos * 15) + (h.laboralActivo ? 40 : 0);
      alertOk = score >= 50;
      alertText = 'Score de Garantía Real: ' + Math.min(score, 100) + '/100 - Estado laboral ' + (h.laboralActivo ? 'activo' : 'sin registro');
    } else if (categoria.id === 'compliance') {
      alertOk = !h.pep && !h.interpol && h.vigente;
      alertText = alertOk
        ? 'Debida diligencia aprobada: sin alertas PEP ni Interpol, cédula vigente.'
        : 'Requiere revisión: ' + [h.pep ? 'PEP' : '', h.interpol ? 'Interpol' : '', !h.vigente ? 'cédula no vigente' : ''].filter(Boolean).join(', ') + '.';
    } else {
      alertText = 'Cruce completado. Revise los hallazgos y genere el folio de reclamo.';
    }
    alert.className = 'datacheck__alert ' + (alertOk ? 'datacheck__alert--ok' : 'datacheck__alert--warn');
    alert.textContent = alertText;
    container.appendChild(alert);

    const list = document.createElement('ul');
    list.className = 'datacheck__findings';
    const rows = [
      ['Bienes raíces (SII)', h.bienesRaices],
      ['Vehículos (Registro Civil)', h.vehiculos],
      ['Estado laboral activo (AFC y AFP)', h.laboralActivo ? 'Sí' : 'No'],
      ['Cédula vigente (Registro Civil)', h.vigente ? 'Sí' : 'No'],
      ['Persona Políticamente Expuesta', h.pep ? 'Sí' : 'No'],
      ['Alerta Interpol', h.interpol ? 'Sí' : 'No']
    ];
    rows.forEach(([k, v]) => {
      const li = document.createElement('li');
      li.className = 'datacheck__finding';
      li.textContent = k + ': ' + v;
      list.appendChild(li);
    });
    container.appendChild(list);

    const meta = document.createElement('p');
    meta.className = 'datacheck__meta';
    meta.textContent = 'Enviado (anonimizado): ' + r.sent.rut + ' - token ' + r.sent.token + ' - ' + r.latenciaMs + ' ms';
    container.appendChild(meta);

    const folio = document.createElement('p');
    folio.className = 'datacheck__folio';
    folio.textContent = 'Folio de reclamo generado: ' + r.folio;
    container.appendChild(folio);

    return { resumen: alertText, ok: alertOk };
  },

  addContentCard(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'content-card';
    btn.type = 'button';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    App.elements.categoryContent.appendChild(btn);
  },

  openDetail(id) {
    const item = App.state.currentCategory.items.find(i => i.id === id);
    if (!item) return;
    App.state.currentItem = item;
    const article = document.createElement('article');
    article.innerHTML = `<h2 class="detail-article__title">${item.title}</h2><ol class="detail-article__list">${item.content.map(s => `<li class="detail-article__item">${s}</li>`).join('')}</ol>`;
    App.clearChildren(App.elements.detailArticle);
    App.elements.detailArticle.appendChild(article);
    App.showView('detailView');
  },

  showHome() {
    App.state.currentCategory = null;
    App.state.currentItem = null;
    App.elements.searchInput.value = '';
    App.renderCategories(CATEGORIAS);
    App.showView('homeView');
  },

  showCategory() {
    App.state.currentItem = null;
    App.state.currentCategory ? App.openCategory(App.state.currentCategory.id) : App.showHome();
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
      const r = await Security.simulateApiCall('/api/orientacion', p);
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
    ['homeView','categoryView','detailView','formView'].forEach(n => App.elements[n].hidden = n !== name);
    window.scrollTo(0, 0);
  },

  loadVoices() {
    if (window.speechSynthesis) App.state.voices = window.speechSynthesis.getVoices();
  },

  speakCurrent() {
    if (!App.state.currentItem) return;
    App.speakText(`${App.state.currentItem.title}. ${App.state.currentItem.content.join('. ')}`);
  },

  speakText(text) {
    if (!window.speechSynthesis) return;
    App.stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.9; u.pitch = 1;
    const v = App.state.voices.find(x => x.lang.startsWith('es'));
    if (v) u.voice = v;
    u.onstart = () => App.elements.stopSpeakBtn.hidden = false;
    u.onend = () => App.elements.stopSpeakBtn.hidden = true;
    window.speechSynthesis.speak(u);
  },

  stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    App.elements.stopSpeakBtn.hidden = true;
  },

  setupInstall() {
    let deferredPrompt = null;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
    App.elements.installBtn.addEventListener('click', () => {
      const modal = document.getElementById('installModal');
      const views = ['installAndroidView','installIOSView','installWebView'].map(id => document.getElementById(id));
      views.forEach(v => v.hidden = true);
      if (deferredPrompt && isAndroid) {
        views[0].hidden = false;
        document.getElementById('installAndroidBtn').onclick = async () => {
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') { App.elements.installBtn.hidden = true; modal.close(); }
          deferredPrompt = null;
        };
      } else if (isIOS) { views[1].hidden = false; views[1].querySelector('.modal-btn').onclick = () => modal.close(); }
      else { views[2].hidden = false; views[2].querySelector('.modal-btn').onclick = () => modal.close(); }
      modal.showModal();
    });
    document.getElementById('closeInstallModal')?.addEventListener('click', () => document.getElementById('installModal').close());
    window.addEventListener('appinstalled', () => { App.elements.installBtn.hidden = true; deferredPrompt = null; });
  },

  addChatMessage(text, sender, messages) {
    const b = document.createElement('div');
    b.className = `chat__bubble chat__bubble--${sender}`;
    b.textContent = text;
    messages.classList.add('chat__messages--has-messages');
    messages.appendChild(b);
    messages.scrollTop = messages.scrollHeight;
  },

  async streamTextToBubble(text, messages) {
    const b = document.createElement('div');
    b.className = 'chat__bubble chat__bubble--bot chat__bubble--typing';
    messages.classList.add('chat__messages--has-messages');
    messages.appendChild(b);
    for (const ch of text) { b.textContent += ch; messages.scrollTop = messages.scrollHeight; await App.delay(35); }
    b.classList.remove('chat__bubble--typing');
  },

  delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  async handleChatSubmit(e, { input, send, messages }) {
    e.preventDefault();
    const msg = Security.sanitizeText(input.value);
    if (!msg) return;
    App.addChatMessage(msg, 'user', messages);
    input.value = '';
    send.disabled = true;
    await App.delay(400);
    await App.streamTextToBubble('Disponible proximamente', messages);
    send.disabled = false;
    input.focus();
  },

  Chat: {
    ws: null, isConnected: false, reconnectDelay: 3000, maxReconnectDelay: 30000, currentDelay: 3000, reconnectAttempts: 0, maxReconnectAttempts: 10, pendingQueue: [], activeStreams: new Map(),
    config: { url: null, autoConnect: false, categoryContext: false },
    init(o = {}) { Object.assign(App.Chat.config, o); if (App.Chat.config.autoConnect && App.Chat.config.url) App.Chat.connect(); },
    connect() {
      if (App.Chat.ws?.readyState === WebSocket.CONNECTING || App.Chat.ws?.readyState === WebSocket.OPEN) return;
      if (!App.Chat.config.url) return;
      App.Chat.ws = new WebSocket(App.Chat.config.url);
      App.Chat.ws.onopen = () => { App.Chat.isConnected = true; App.Chat.reconnectAttempts = 0; App.Chat.currentDelay = App.Chat.reconnectDelay; App.Chat.flushPendingQueue(); document.dispatchEvent(new CustomEvent('chat:connected')); };
      App.Chat.ws.onmessage = e => App.Chat.handleMessage(e.data);
      App.Chat.ws.onerror = () => document.dispatchEvent(new CustomEvent('chat:error', { detail: { message: 'Error de conexión con el asistente' } }));
      App.Chat.ws.onclose = () => { App.Chat.isConnected = false; document.dispatchEvent(new CustomEvent('chat:disconnected')); App.Chat.scheduleReconnect(); };
    },
    disconnect() { App.Chat.ws?.close(); App.Chat.ws = null; App.Chat.isConnected = false; },
    scheduleReconnect() {
      if (App.Chat.reconnectAttempts >= App.Chat.maxReconnectAttempts) { document.dispatchEvent(new CustomEvent('chat:error', { detail: { message: 'No se pudo reconectar con el asistente' } })); return; }
      App.Chat.reconnectAttempts++;
      setTimeout(() => App.Chat.connect(), App.Chat.currentDelay);
      App.Chat.currentDelay = Math.min(App.Chat.currentDelay * 1.5, App.Chat.maxReconnectDelay);
    },
    send(msg, opts = {}) {
      const p = { type: 'message', message: Security.sanitizeText(msg), timestamp: new Date().toISOString(), ...opts };
      if (App.Chat.config.categoryContext && App.state.currentCategory) p.categoryId = App.state.currentCategory.id;
      if (App.Chat.isConnected && App.Chat.ws.readyState === WebSocket.OPEN) App.Chat.ws.send(JSON.stringify(p));
      else { App.Chat.pendingQueue.push(p); if (!App.Chat.isConnected) App.Chat.connect(); }
    },
    flushPendingQueue() { while (App.Chat.pendingQueue.length && App.Chat.ws.readyState === WebSocket.OPEN) App.Chat.ws.send(JSON.stringify(App.Chat.pendingQueue.shift())); },
    handleMessage(raw) {
      let d; try { d = JSON.parse(raw); } catch { d = { type: 'text', content: raw }; }
      if (d.type === 'stream' || d.type === 'chunk') App.Chat.handleStreamChunk(d);
      else if (d.type === 'stream_start') App.Chat.handleStreamStart(d);
      else if (d.type === 'stream_end') App.Chat.handleStreamEnd(d);
      else if (d.type === 'error') document.dispatchEvent(new CustomEvent('chat:error', { detail: d }));
      else document.dispatchEvent(new CustomEvent('chat:message', { detail: d }));
    },
    handleStreamStart(d) {
      const id = d.streamId || 'default';
      const b = document.createElement('div'); b.className = 'chat__bubble chat__bubble--bot chat__bubble--typing'; b.id = `stream-${id}`; b.textContent = '';
      const c = document.getElementById(d.containerId || 'mainChatMessages');
      if (c) { c.classList.add('chat__messages--has-messages'); c.appendChild(b); c.scrollTop = c.scrollHeight; }
      App.Chat.activeStreams.set(id, { bubble: b, container: c });
      document.dispatchEvent(new CustomEvent('chat:streamStart', { detail: d }));
    },
    handleStreamChunk(d) {
      const s = App.Chat.activeStreams.get(d.streamId || 'default');
      if (s?.bubble) { s.bubble.textContent += d.content || ''; s.container.scrollTop = s.container.scrollHeight; }
      document.dispatchEvent(new CustomEvent('chat:streamChunk', { detail: d }));
    },
    handleStreamEnd(d) {
      const s = App.Chat.activeStreams.get(d.streamId || 'default');
      if (s?.bubble) { s.bubble.classList.remove('chat__bubble--typing'); s.bubble.id = ''; App.Chat.activeStreams.delete(d.streamId || 'default'); }
      document.dispatchEvent(new CustomEvent('chat:streamEnd', { detail: d }));
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
