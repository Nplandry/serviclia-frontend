const App = {
  ASSISTANT_MIN_CHARS: 5,
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
    const ids = ['homeView','categoryView','detailView','formView','searchInput','categoryList','zeroResults','backFromCategory','backFromDetail','backFromForm','categoryTitle','categoryDescription','categoryContent','detailArticle','speakBtn','stopSpeakBtn','orientationForm','formRut','rutError','submitForm','formStatus','greeting','logoutBtn','chatForm','chatInput','chatSend','chatMessages','chatStatus','mainChatForm','mainChatInput','mainChatSend','mainChatMessages','mainChatStatus','authGate','tabLogin','tabRegister','loginForm','registerForm','loginStatus','registerStatus','historyBtn','historyPanel','historyOverlay','historyClose','historyList','historyClear','carruselList','historyMenu','mapView','apiView','dashboardView','configView','mapContainer','mapStatus','apiInput','apiRun','apiOutput','dashKpis','dashBars','configUser','configClear','configLogout','verifyView'];
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
    document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', App.showHome));
    App.elements.apiRun.addEventListener('click', App.runApiAnonymize);
    App.elements.configClear.addEventListener('click', App.handleConfigClear);
    App.elements.configLogout.addEventListener('click', App.handleLogout);
  },

  handleMenuClick(e) {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    App.openSection(btn.dataset.view);
  },

  openSection(name) {
    App.closeHistory();
    if (name === 'asistente') return App.showHome();
    if (name === 'mapa') { App.showView('mapView'); return App.initMap(); }
    if (name === 'api') return App.showView('apiView');
    if (name === 'dashboard') { App.renderDashboard(); return App.showView('dashboardView'); }
    if (name === 'configuracion') { App.renderConfig(); return App.showView('configView'); }
    if (name === 'verificacion') return App.showView('verifyView');
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

  renderConfig() {
    const user = Auth.getCurrentUser() || {};
    const partes = [user.nombre, user.email].filter(Boolean);
    App.elements.configUser.textContent = partes.length ? 'Sesión: ' + partes.join(' ') : 'Sin sesión activa.';
  },

  handleConfigClear() {
    if (!window.confirm('¿Borrar todo el historial de consultas de este dispositivo?')) return;
    App.handleHistoryClear();
  },

  runApiAnonymize() {
    const texto = App.elements.apiInput.value;
    App.elements.apiOutput.textContent = texto.trim()
      ? Security.redactText(texto)
      : 'Ingrese un texto para anonimizar.';
    App.elements.apiOutput.hidden = false;
  },

  initMap() {
    const status = App.elements.mapStatus;
    if (App.state.map) {
      setTimeout(() => App.state.map.invalidateSize(), 0);
      return;
    }
    status.textContent = 'Cargando mapa...';
    App.loadMapAssets()
      .then(() => {
        App.state.map = L.map(App.elements.mapContainer).setView([-35.6, -71.5], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(App.state.map);
        status.textContent = '';
      })
      .catch(() => {
        status.style.color = 'var(--color-error)';
        status.textContent = 'No se pudo cargar el mapa. Revise su conexión a internet.';
      });
  },

  loadMapAssets() {
    if (window.L) return Promise.resolve();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    return new Promise((resolve, reject) => {
      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.onload = resolve;
      js.onerror = reject;
      document.head.appendChild(js);
    });
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
      App.renderRecomendados();
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
    App.elements.searchInput.addEventListener('input', App.handleSearch);
    App.elements.backFromCategory.addEventListener('click', App.showHome);
    App.elements.backFromDetail.addEventListener('click', App.showCategory);
    App.elements.backFromForm.addEventListener('click', App.showHome);
    App.elements.speakBtn.addEventListener('click', App.speakCurrent);
    App.elements.stopSpeakBtn.addEventListener('click', App.stopSpeaking);
    App.elements.orientationForm.addEventListener('submit', App.handleFormSubmit);
    App.elements.formRut.addEventListener('blur', App.handleRutBlur);
    App.bindAssistant('main', App.elements.mainChatForm, App.elements.mainChatInput, App.elements.mainChatSend, App.elements.mainChatMessages, App.elements.mainChatStatus);
    App.bindAssistant('categoria', App.elements.chatForm, App.elements.chatInput, App.elements.chatSend, App.elements.chatMessages, App.elements.chatStatus);
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = App.loadVoices;
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

  renderRecomendados() {
    const list = App.elements.carruselList;
    App.clearChildren(list);

    RECOMENDADOS.forEach(rec => {
      const card = document.createElement('button');
      card.className = 'recomendado';
      card.type = 'button';
      card.addEventListener('click', () => {
        const cat = CATEGORIAS.find(c => c.id === rec.categoria);
        if (cat) App.openCategory(cat.id);
      });

      const icono = document.createElement('div');
      icono.className = 'recomendado__icono';
      icono.setAttribute('aria-hidden', 'true');
      icono.innerHTML = ICONOS_SVG[rec.icono] || ICONOS_SVG['document'];
      card.appendChild(icono);

      const titulo = document.createElement('p');
      titulo.className = 'recomendado__titulo';
      titulo.textContent = rec.titulo;
      card.appendChild(titulo);

      const desc = document.createElement('p');
      desc.className = 'recomendado__desc';
      desc.textContent = rec.descripcion;
      card.appendChild(desc);

      list.appendChild(card);
    });
  },

  renderCategories(categories) {
    App.clearChildren(App.elements.categoryList);
    App.elements.zeroResults.hidden = categories.length > 0;

    categories.forEach(c => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'category-card';
      btn.type = 'button';
      const tema = c.short.split(/\s+-\s+/).pop();
      const iconoSvg = ICONOS_SVG[ICONO_CATEGORIA[c.id]] || ICONOS_SVG['document'];
      btn.innerHTML = `<span class="category-card__header"><span class="category-card__icono" aria-hidden="true">${iconoSvg}</span><span class="category-card__title">${c.title}</span></span>` +
        `<span class="category-card__topic">${tema}</span>`;
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

    const docsField = document.createElement('div');
    docsField.className = 'field';
    
    const docsLabel = document.createElement('label');
    docsLabel.className = 'field__label';
    docsLabel.textContent = 'Documentos adjuntos (opcional)';
    docsField.appendChild(docsLabel);

    const docsHelp = document.createElement('p');
    docsHelp.className = 'field__help';
    docsHelp.textContent = 'Adjunte documentos que respalden su caso (PDF, imágenes, etc.)';
    docsField.appendChild(docsHelp);

    const dropZone = document.createElement('div');
    dropZone.className = 'docs__drop-zone';
    dropZone.setAttribute('role', 'region');
    dropZone.setAttribute('aria-label', 'Zona para soltar documentos');

    const dropIcon = document.createElement('div');
    dropIcon.className = 'docs__drop-icon';
    dropIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';
    dropZone.appendChild(dropIcon);

    const dropText = document.createElement('p');
    dropText.className = 'docs__drop-text';
    dropText.textContent = 'Arrastra archivos aquí o ';
    const dropLink = document.createElement('span');
    dropLink.className = 'docs__drop-link';
    dropLink.textContent = 'selecciona';
    dropText.appendChild(dropLink);
    dropZone.appendChild(dropText);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.className = 'u-visually-hidden';
    fileInput.id = 'dcDocs-' + c.id;
    fileInput.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';
    dropZone.appendChild(fileInput);

    docsField.appendChild(dropZone);

    const docsList = document.createElement('ul');
    docsList.className = 'docs__list';
    docsList.setAttribute('aria-label', 'Archivos adjuntos');
    docsField.appendChild(docsList);

    const docsStatus = document.createElement('p');
    docsStatus.className = 'docs__status';
    docsStatus.hidden = true;
    docsField.appendChild(docsStatus);

    step.appendChild(docsField);

    const attachedFiles = [];

    const renderDocsList = () => {
      App.clearChildren(docsList);
      if (attachedFiles.length === 0) {
        docsList.hidden = true;
        return;
      }
      docsList.hidden = false;
      attachedFiles.forEach((file, idx) => {
        const li = document.createElement('li');
        li.className = 'docs__item';
        li.innerHTML = `<span class="docs__item-name">${file.name}</span><span class="docs__item-size">${(file.size / 1024).toFixed(1)} KB</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'docs__item-remove';
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        removeBtn.addEventListener('click', () => {
          attachedFiles.splice(idx, 1);
          renderDocsList();
        });
        li.appendChild(removeBtn);
        docsList.appendChild(li);
      });
    };

    const handleFiles = (files) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          docsStatus.textContent = `Tipo de archivo no permitido: ${file.type}. Use PDF, imágenes, TXT o DOC.`;
          docsStatus.hidden = false;
          setTimeout(() => docsStatus.hidden = true, 5000);
          return;
        }
        if (file.size > maxSize) {
          docsStatus.textContent = `Archivo "${file.name}" es muy grande (máximo 10MB).`;
          docsStatus.hidden = false;
          setTimeout(() => docsStatus.hidden = true, 5000);
          return;
        }
        if (!attachedFiles.find(f => f.name === file.name)) {
          attachedFiles.push(file);
        }
      });
      renderDocsList();
      fileInput.value = '';
    };

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('docs__drop-zone--active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('docs__drop-zone--active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('docs__drop-zone--active');
      handleFiles(e.dataTransfer.files);
    });

    dropLink.addEventListener('click', () => fileInput.click());

    let consentBlock = null;
    if (c.id === 'embargo-falso' && typeof Compliance !== 'undefined') {
      consentBlock = Compliance.buildConsentBlock(c);
      step.appendChild(consentBlock.node);
    }

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

      let consentResult = null;
      if (consentBlock) {
        consentResult = consentBlock.validate();
        if (!consentResult.ok) {
          err.textContent = consentResult.error;
          err.hidden = false;
          return;
        }
      }

      runBtn.disabled = true;
      runBtn.textContent = 'Ejecutando auditoría...';
      try {
        const item = c.items.find(i => i.id === selected.value);

        if (consentResult && typeof Compliance !== 'undefined') {
          const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
          Compliance.grantConsent({
            owner: user ? user.email : 'anon',
            casoId: c.id,
            finalidades: consentResult.finalidades,
            titularidad: consentResult.titularidad,
            tercero: consentResult.tercero
          });
        }

        const auditData = {
          casoId: c.id,
          rut: rawRut,
          relato: relatoInput.value,
          archivos: attachedFiles.map(f => ({ nombre: f.name, tamaño: f.size, tipo: f.type }))
        };

        const r = await API.executeDataCheck(c.id, rawRut, relatoInput.value, auditData);
        const summary = App.renderDiagnostico(diagStep, c, item, r);
        Historial.add({
          caso: c.title,
          casoId: c.id,
          rut: r.sent.rut,
          resumen: summary.resumen,
          ok: summary.ok,
          archivos: attachedFiles.length
        });
        App.renderHistory();
      } catch (e) {
        if (typeof Compliance !== 'undefined') {
          Compliance.logSecurityIncident({
            tipo: 'error_auditoria',
            descripcion: 'Fallo durante el cruce de datos del caso ' + c.id,
            severidad: 'media'
          });
        }
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
      li.appendChild(document.createTextNode(' ' + e.detalle));
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

    const iconMap = {
      'default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      'money': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><path d="M4 12h16M12 4c-4.418 0-8 1.79-8 4v4c0 2.21 3.582 4 8 4s8-1.79 8-4v-4c0-2.21-3.582-4-8-4z"></path></svg>',
      'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      'car': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-.99M5 17H3c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h.99M6 5h12l1 6H5l1-6z"></path><circle cx="9" cy="17" r="2"></circle><circle cx="15" cy="17" r="2"></circle></svg>',
      'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>',
      'alert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      'credit': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      'document': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="13" x2="8" y2="13"></line><line x1="12" y1="17" x2="8" y2="17"></line></svg>',
      'idcard': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
    };

    const getIcon = (key) => {
      const svg = document.createElement('div');
      svg.className = 'datacheck__info-icon';
      svg.innerHTML = iconMap[key] || iconMap['default'];
      return svg;
    };

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
      alertText = 'Cruce completado. Información registrada y validada.';
    }
    alert.className = 'datacheck__alert ' + (alertOk ? 'datacheck__alert--ok' : 'datacheck__alert--warn');
    alert.textContent = alertText;
    container.appendChild(alert);

    const list = document.createElement('ul');
    list.className = 'datacheck__findings';
    const rows = [
      ['Bienes raíces (SII)', h.bienesRaices, 'home'],
      ['Vehículos (Registro Civil)', h.vehiculos, 'car'],
      ['Estado laboral activo (AFC y AFP)', h.laboralActivo ? 'Sí' : 'No', 'briefcase'],
      ['Cédula vigente (Registro Civil)', h.vigente ? 'Sí' : 'No', 'idcard'],
      ['Persona Políticamente Expuesta', h.pep ? 'Sí' : 'No', 'alert'],
      ['Alerta Interpol', h.interpol ? 'Sí' : 'No', 'alert']
    ];
    rows.forEach(([k, v, icon]) => {
      const li = document.createElement('li');
      li.className = 'datacheck__finding';
      li.innerHTML = '<span class="datacheck__finding-icon">' + (iconMap[icon] || iconMap['default']) + '</span><div class="datacheck__finding-content"><span class="datacheck__finding-label">' + k + '</span><strong class="datacheck__finding-value">' + v + '</strong></div>';
      list.appendChild(li);
    });
    container.appendChild(list);

    const helper = (title, detail, variant = '', icon = 'default') => {
      const card = document.createElement('div');
      const classes = 'datacheck__info-block' + (variant ? ' datacheck__info-block--' + variant : '');
      card.className = classes;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'datacheck__info-icon';
      iconDiv.innerHTML = iconMap[icon] || iconMap['default'];
      card.appendChild(iconDiv);

      const content = document.createElement('div');
      content.className = 'datacheck__info-block-content';

      const lbl = document.createElement('p');
      lbl.className = 'datacheck__info-label';
      lbl.textContent = title;
      content.appendChild(lbl);

      const det = document.createElement('p');
      det.className = 'datacheck__info-detail';
      det.textContent = detail;
      content.appendChild(det);

      card.appendChild(content);
      container.appendChild(card);
    };

    if (h.afiliacionAFP) {
      helper('Afiliación a AFP', 'AFP: ' + h.afpNombre + ' - Fondo: ' + h.fondoAFP + ' - Estado: ' + h.estadoPrevisional + ' (desde ' + h.ultimoIngreso + '). Antigüedad laboral: ' + h.antiguedadLaboral, '', 'briefcase');
    }

    if (h.deudaTributaria > 0) {
      helper('Deuda tributaria registrada', 'Monto pendiente: $' + h.deudaTributaria.toLocaleString() + '. Se recomienda contactar al SII para plan de pago.', 'alert', 'alert');
    }

    if (h.multas > 0 || h.deudaCoactiva > 0) {
      const detalles = [];
      if (h.multas > 0) detalles.push('Multas: $' + h.multas.toLocaleString());
      if (h.deudaCoactiva > 0) detalles.push('Deuda coactiva: $' + h.deudaCoactiva.toLocaleString());
      helper('Multas y deuda coactiva', detalles.join(' | ') + '. Consulte con SII sobre opciones de pago.', 'alert', 'alert');
    }

    if (h.carteraVencida) {
      helper('Cartera vencida detectada', 'Hay cuentas vencidas en registro crediticio. Verifique con DICOM y considere regularizar deudas.', 'alert', 'alert');
    }

    if (h.protestosCheques > 0) {
      helper('Cheques protestados', h.protestosCheques + ' cheque(s) en protesto. Esto afecta su historial bancario. Contacte a los acreedores para regularizar.', 'alert', 'document');
    }

    if (!h.creafAntecedentes) {
      helper('Antecedentes CREAF', 'Sin registro negativo. Su historial crediticio es limpio ante instituciones financieras.', 'good', 'check');
    }

    if (h.institucionesFinancieras > 0) {
      helper('Relaciones con instituciones financieras', h.institucionesFinancieras + ' institución(es) registrada(s). Verifique que todos los créditos o tarjetas sean autorizados.', '', 'credit');
    }

    if (h.bienesRaices > 0) {
      helper('Propiedad(es) registrada(s)', h.bienesRaices + ' bien(es) inmueble(s) en SII. Verifique hipotecas, cargas y situación legal de cada propiedad.', '', 'home');
    }

    if (h.vehiculos > 0) {
      helper('Vehículo(s) registrado(s)', h.vehiculos + ' vehículo(s) en Registro Civil. Permiso de circulación ' + (h.boletaVigencia ? 'vigente' : 'vencido') + '. Verifique multas y revisión técnica.', '', 'car');
    }

    if (h.vigente && h.derechoChileAtiende) {
      helper('Identidad validada', 'Cédula vigente y validada. Tiene acceso a servicios digitales (ChileAtiende, Pago de Impuestos, etc.).', 'good', 'check');
    }

    return { resumen: alertText, ok: alertOk };
  },

  showHome() {
    App.state.currentCategory = null;
    App.state.currentItem = null;
    App.elements.searchInput.value = '';
    App.renderRecomendados();
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
    const sectionByView = { mapView: 'mapa', apiView: 'api', dashboardView: 'dashboard', configView: 'configuracion', verifyView: 'verificacion' };
    ['homeView','categoryView','detailView','formView','mapView','apiView','dashboardView','configView','verifyView'].forEach(n => App.elements[n].hidden = n !== name);
    App.setMenuActive(sectionByView[name] || 'asistente');
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

  addChatMessage(text, sender, messages) {
    const b = document.createElement('div');
    b.className = `chat__bubble chat__bubble--${sender}`;
    b.textContent = text;
    messages.classList.add('chat__messages--has-messages');
    messages.appendChild(b);
    messages.scrollTop = messages.scrollHeight;
  },

  // Asistente ServicIA: envía la pregunta al backend RAG y muestra la respuesta con sus fuentes.
  // El chat de inicio consulta toda la normativa; el de una categoría filtra por esa categoría.
  bindAssistant(tipo, form, input, send, messages, status) {
    // El botón Enviar queda deshabilitado hasta que la pregunta tenga el mínimo de caracteres.
    const refrescar = () => { send.disabled = input.value.trim().length < App.ASSISTANT_MIN_CHARS; };
    input.addEventListener('input', refrescar);
    refrescar();
    form.addEventListener('submit', e => App.handleAssistantSubmit(e, { tipo, input, send, messages, status, refrescar }));
  },

  async handleAssistantSubmit(e, { tipo, input, send, messages, status, refrescar }) {
    e.preventDefault();
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

    const categoria = tipo === 'categoria' && App.state.currentCategory ? App.state.currentCategory.id : null;
    const res = await API.consultarAsistente(msg, categoria);
    espera.remove();
    input.disabled = false;
    refrescar();  // el botón vuelve según el contenido del campo (vacío queda deshabilitado)

    if (!res.ok) {
      App.addChatMessage(res.error || 'No se pudo obtener respuesta. Intente de nuevo.', 'bot', messages);
      if (res.status === 401) {
        Auth.logout();
        App.applyAuthState();
      }
      return;
    }
    const burbuja = App.renderAssistantAnswer(res.data, messages);
    // Muestra el inicio de la respuesta, no el final: así se lee de arriba hacia abajo
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
        // Solo enlaces https: la URL viene de la base de documentos
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
