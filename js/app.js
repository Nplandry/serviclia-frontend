// App principal: estado, renderizado, eventos y router por visibilidad
const App = {
  state: { currentCategory: null, currentItem: null, voices: [] },
  elements: {},

  init() {
    Auth.init();
    App.cacheElements();
    App.bindEvents();
    App.bindAuthEvents();
    App.setGreeting();
    App.renderCategories(CATEGORIAS);
    App.loadVoices();
    App.setupInstall();
    App.applyAuthState();
  },

  cacheElements() {
    const ids = ['homeView','categoryView','detailView','formView','searchInput','categoryList','zeroResults','backFromCategory','backFromDetail','backFromForm','categoryTitle','categoryDescription','categoryContent','detailArticle','speakBtn','stopSpeakBtn','orientationForm','formRut','rutError','submitForm','formStatus','greeting','installBtn','logoutBtn','chatForm','chatInput','chatSend','chatMessages','chatStatus','mainChatForm','mainChatInput','mainChatSend','mainChatMessages','mainChatStatus','authGate','tabLogin','tabRegister','loginForm','registerForm','loginStatus','registerStatus','historyBtn','historyPanel','historyOverlay','historyClose','historyList','historyClear'];
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
    App.elements.historyBtn.hidden = !authed;

    if (authed) {
      const user = Auth.getCurrentUser();
      Historial.init(user.email);
      App.renderHistory();
      App.setGreeting();
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

  openCategory(id) {
    const c = CATEGORIAS.find(x => x.id === id);
    if (!c) return;
    App.state.currentCategory = c;
    App.elements.categoryTitle.textContent = c.title;
    App.elements.categoryDescription.textContent = c.description;

    const content = App.elements.categoryContent;
    App.clearChildren(content);
    content.className = 'wizard';

    const diagStep = App.buildDiagnosticoStep(c);
    const mainCol = document.createElement('div');
    mainCol.className = 'wizard__main';
    mainCol.appendChild(App.buildPreliminarStep(c));
    mainCol.appendChild(App.buildEntradaStep(c, diagStep));

    const diagCol = document.createElement('div');
    diagCol.className = 'wizard__diag';
    diagCol.appendChild(diagStep);
    diagCol.appendChild(App.buildOrientacionStep());

    content.appendChild(mainCol);
    content.appendChild(diagCol);
    App.showView('categoryView');
  },

  buildStepHeader(num, title) {
    const head = document.createElement('div');
    head.className = 'step__head';
    const badge = document.createElement('span');
    badge.className = 'step__badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = num;
    const h = document.createElement('h3');
    h.className = 'step__title';
    h.textContent = title;
    head.appendChild(badge);
    head.appendChild(h);
    return head;
  },

  buildPreliminarStep(c) {
    const step = document.createElement('section');
    step.className = 'step';
    step.setAttribute('aria-label', 'Paso 1: Información preliminar');
    step.appendChild(App.buildStepHeader(1, 'Información preliminar'));

    const resumen = document.createElement('p');
    resumen.className = 'step__lead';
    resumen.textContent = c.preliminar.resumen;
    step.appendChild(resumen);

    const sub = document.createElement('p');
    sub.className = 'step__subtitle';
    sub.textContent = 'Riesgos a considerar:';
    step.appendChild(sub);

    const ul = document.createElement('ul');
    ul.className = 'step__list';
    c.preliminar.riesgos.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      ul.appendChild(li);
    });
    step.appendChild(ul);
    return step;
  },

  buildEntradaStep(c, diagStep) {
    const step = document.createElement('section');
    step.className = 'step';
    step.setAttribute('aria-label', 'Paso 2: Entrada de datos');
    step.appendChild(App.buildStepHeader(2, 'Entrada de datos'));

    const intro = document.createElement('p');
    intro.className = 'step__lead';
    intro.textContent = 'Complete estos datos para encontrar la respuesta más adecuada a su caso.';
    step.appendChild(intro);

    const caseField = document.createElement('fieldset');
    caseField.className = 'step__cases';
    const legend = document.createElement('legend');
    legend.className = 'field__label';
    legend.textContent = '¿Qué situación se acerca más a su caso?';
    caseField.appendChild(legend);
    c.items.forEach(item => {
      const opt = document.createElement('label');
      opt.className = 'step__case';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'dcCase-' + c.id;
      radio.value = item.id;
      const txt = document.createElement('span');
      txt.textContent = item.title;
      opt.appendChild(radio);
      opt.appendChild(txt);
      caseField.appendChild(opt);
    });
    step.appendChild(caseField);

    const rutField = document.createElement('div');
    rutField.className = 'field';
    const rutLabel = document.createElement('label');
    rutLabel.className = 'field__label';
    const rutId = 'dcRut-' + c.id;
    rutLabel.setAttribute('for', rutId);
    rutLabel.textContent = 'Su RUT';
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
    step.appendChild(rutField);

    const relatoField = document.createElement('div');
    relatoField.className = 'field';
    const relatoLabel = document.createElement('label');
    relatoLabel.className = 'field__label';
    const relatoId = 'dcRelato-' + c.id;
    relatoLabel.setAttribute('for', relatoId);
    relatoLabel.textContent = 'Lo que usted sabe sobre el caso';
    const relatoInput = document.createElement('textarea');
    relatoInput.className = 'field__textarea';
    relatoInput.id = relatoId;
    relatoInput.rows = 3;
    relatoInput.maxLength = 500;
    relatoInput.placeholder = 'Ej: me llamaron ayer diciendo que debo una deuda de...';
    relatoField.appendChild(relatoLabel);
    relatoField.appendChild(relatoInput);
    step.appendChild(relatoField);

    const err = document.createElement('p');
    err.className = 'error-text';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    step.appendChild(err);

    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'datacheck__run';
    runBtn.textContent = 'Ejecutar Auditoría';
    step.appendChild(runBtn);

    runBtn.addEventListener('click', async () => {
      err.hidden = true;
      const rawRut = rutInput.value.trim();
      const selected = caseField.querySelector('input[type="radio"]:checked');
      if (!selected) {
        err.textContent = 'Seleccione la situación que más se acerca a su caso.';
        err.hidden = false;
        return;
      }
      if (!Security.validateRut(rawRut)) {
        err.textContent = 'Ingrese un RUT válido para analizar su caso.';
        err.hidden = false;
        rutInput.focus();
        return;
      }
      runBtn.disabled = true;
      runBtn.textContent = 'Ejecutando auditoría...';
      try {
        const item = c.items.find(i => i.id === selected.value);
        const r = await API.executeDataCheck(c.id, rawRut, relatoInput.value);
        const summary = App.renderDiagnostico(diagStep, c, item, r);
        Historial.add({
          caso: c.title,
          casoId: c.id,
          rut: r.sent.rut,
          resumen: summary.resumen,
          ok: summary.ok
        });
        App.renderHistory();
      } catch (e) {
        err.textContent = 'No se pudo completar el análisis. Intente nuevamente.';
        err.hidden = false;
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Ejecutar Auditoría';
      }
    });

    return step;
  },

  buildOrientacionStep() {
    const step = document.createElement('section');
    step.className = 'step step--orientacion step--pending';
    step.setAttribute('aria-label', 'Paso 4: Solicitar orientación personalizada');
    step.appendChild(App.buildStepHeader(4, 'Si es necesario: Solicitar orientación personalizada'));

    const lead = document.createElement('p');
    lead.className = 'step__lead';
    lead.textContent = 'Si su caso necesita atención de un orientador, complete el formulario y lo contactaremos.';
    step.appendChild(lead);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'datacheck__run';
    btn.textContent = 'Solicitar orientación personalizada';
    btn.disabled = true;
    btn.addEventListener('click', App.showForm);
    step.appendChild(btn);
    return step;
  },

  buildDiagnosticoStep(c) {
    const step = document.createElement('section');
    step.className = 'step step--diag step--pending';
    step.setAttribute('aria-label', 'Paso 3: Diagnóstico y respuesta');
    step.setAttribute('aria-live', 'polite');
    step.appendChild(App.buildStepHeader(3, 'Diagnóstico y respuesta'));

    const placeholder = document.createElement('div');
    placeholder.className = 'step__placeholder';
    const icon = document.createElement('span');
    icon.className = 'step__placeholder-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>';
    const msg = document.createElement('p');
    msg.className = 'step__placeholder-text';
    msg.textContent = 'Complete los datos a la izquierda y presione "Ejecutar Auditoría" para desplegar la respuesta en los 4 bloques oficiales.';
    placeholder.appendChild(icon);
    placeholder.appendChild(msg);
    step.appendChild(placeholder);
    return step;
  },

  buildDiagBlock(titleText, contentEl) {
    const block = document.createElement('div');
    block.className = 'step__block';
    const title = document.createElement('p');
    title.className = 'step__subtitle';
    title.textContent = titleText;
    block.appendChild(title);
    block.appendChild(contentEl);
    return block;
  },

  renderDiagnostico(step, c, item, r) {
    App.clearChildren(step);
    step.classList.remove('step--pending');
    step.appendChild(App.buildStepHeader(3, 'Diagnóstico y respuesta'));

    const caso = document.createElement('p');
    caso.className = 'step__case-title';
    caso.textContent = item.title;
    step.appendChild(caso);

    const diagBox = document.createElement('div');
    const summary = App.renderDataCheckResult(diagBox, c, r);
    step.appendChild(App.buildDiagBlock('Diagnóstico del cruce de datos:', diagBox));

    const quote = document.createElement('p');
    quote.className = 'step__quote';
    quote.textContent = '“' + item.queDecir + '”';
    step.appendChild(App.buildDiagBlock('Qué decir ante este caso:', quote));

    const ol = document.createElement('ol');
    ol.className = 'step__list';
    item.content.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      ol.appendChild(li);
    });
    step.appendChild(App.buildDiagBlock('Cómo abordarlo paso a paso:', ol));

    const ul = document.createElement('ul');
    ul.className = 'step__list step__escalation';
    c.escalamiento.forEach(e => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = e.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = e.nombre;
      li.appendChild(a);
      li.appendChild(document.createTextNode(' — ' + e.detalle));
      ul.appendChild(li);
    });
    step.appendChild(App.buildDiagBlock('Si la situación continúa, escale aquí:', ul));

    const orient = step.parentElement ? step.parentElement.querySelector('.step--orientacion') : null;
    if (orient) {
      orient.classList.remove('step--pending');
      const orientBtn = orient.querySelector('button');
      if (orientBtn) orientBtn.disabled = false;
    }

    step.hidden = false;
    step.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return summary;
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
        ? 'Alerta de inexistencia de garantía: no registra bienes embargables.'
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
