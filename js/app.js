const ROL_ACTUAL = 'operador';

const CATEGORIAS = [
  { id: 'creditos', title: 'Créditos', short: 'Créditos preaprobados', description: 'Ofrecen dinero fácil por teléfono o WhatsApp. Puede ser una estafa o un crédito caro.', items: [
    { id: 'credito-preaprobado', title: 'Me ofrecieron un crédito preaprobado', content: ['No dé datos personales si no pidió el crédito.', 'Pida el nombre de la empresa, su RUT y el número de inscripción en la CMF.', 'Desconfíe si le piden pagar un seguro, comisión o gasto antes de recibir el dinero.', 'Puede revisar en el sitio de la Comisión para el Mercado Financiero si la empresa está autorizada.'] },
    { id: 'credito-cobro-anticipado', title: 'Me pidieron pagar antes de recibir el crédito', content: ['Exigir dinero por adelantado es una señal de alerta.', 'No realice transferencias ni entregue claves.', 'Corte la comunicación y guarde evidencia: mensajes, números y pantallas.', 'Denuncie en SERNAC o en la Comisión para el Mercado Financiero.'] }
  ]},
  { id: 'seguros', title: 'Seguros', short: 'Seguros atados o agregados', description: 'Le venden un seguro junto con otro producto o se lo agregan sin explicarle bien.', items: [
    { id: 'seguro-agregado', title: 'Me agregaron un seguro que no pedí', content: ['Revisa el contrato y los cargos en tu cuenta bancaria o tarjeta.', 'Solicita la póliza y el detalle de la cobertura por escrito.', 'Si no lo contrataste, exige la anulación y la devolución del dinero.', 'Puedes reclamar ante la Comisión para el Mercado Financiero o SERNAC.'] },
    { id: 'seguro-credito', title: 'Me dijeron que el seguro es obligatorio para el crédito', content: ['Pregunte si puede contratar el seguro con otra aseguradora.', 'Pida que le expliquen el costo total del seguro durante toda la vida del crédito.', 'Compare precios y coberturas con al menos dos aseguradoras.', 'Si le presionan, no firme y pida revisar el contrato en su casa.'] }
  ]},
  { id: 'cobranzas', title: 'Cobranzas', short: 'Cobros no reconocidos', description: 'Llegan cobros de deudas que no recuerda o que no reconoce.', items: [
    { id: 'cobro-no-reconocido', title: 'Me están cobrando una deuda que no reconozco', content: ['Exija por escrito el detalle de la deuda, el monto y quién es el acreedor.', 'No se deje presionar con amenazas. Las llamadas deben ser en horario hábil.', 'Pida la copia del contrato que origina la deuda.', 'Si no le dan información clara, acuda a SERNAC o a un consultorio jurídico gratuito.'] },
    { id: 'cobro-terceros', title: 'Una empresa externa me llama para cobrarme', content: ['Pida el nombre de la cobranza y el RUT de la empresa.', 'No entregue datos de familiares ni vecinos.', 'Exija que toda la comunicación sea por escrito.', 'Guarde fecha, hora y número de cada llamada.'] }
  ]},
  { id: 'servicios', title: 'Servicios', short: 'Portabilidad involuntaria', description: 'Le cambiaron de compañía de teléfono, internet o luz sin que usted haya pedido el cambio.', items: [
    { id: 'portabilidad-forzada', title: 'Me cambiaron de compañía sin mi permiso', content: ['Revise sus boletas y contratos recientes.', 'Comuníquese con la empresa a la que nunca pidió cambiarse y exija la reversión.', 'Solicite constancia escrita del cambio y quién lo autorizó.', 'Denuncie ante la Subsecretaría de Telecomunicaciones o SERNAC.'] },
    { id: 'cambio-proveedor', title: 'Un vendedor me visitó y ahora tengo otra empresa', content: ['Tiene derecho a retracto: puede anular el contrato dentro de los 10 días hábiles siguientes.', 'La retractación debe ser gratuita y sin penalización.', 'Hágalo por escrito y guarde copia.', 'Si no respetan su retracto, reclame en SERNAC.'] }
  ]}
];

const FRASES_EMERGENCIA = [
  'Deme el nombre de la empresa y su RUT, por favor.',
  'Necesito que me envíen esto por escrito para revisarlo con calma.',
  'No voy a dar datos ni firmar nada hasta conversar con mi familia.',
  'Por favor, dígame cuál es el número de reclamo o atención al cliente.',
  'Prefiero acudir personalmente a una oficina antes de continuar.'
];

const App = {
  state: { role: ROL_ACTUAL, currentCategory: null, currentItem: null, voices: [] },
  elements: {},

  init() {
    App.cacheElements();
    App.bindEvents();
    App.setRoleFromHash();
    App.setGreeting();
    App.updateEmergencyButton();
    App.renderCategories(CATEGORIAS);
    App.loadVoices();
    App.setupInstall();
  },

  cacheElements() {
    const ids = ['homeView','categoryView','detailView','formView','searchInput','categoryList','zeroResults','emergencyBtn','backFromCategory','backFromDetail','backFromForm','categoryTitle','categoryDescription','categoryContent','detailArticle','speakBtn','stopSpeakBtn','orientationForm','formRut','rutError','submitForm','formStatus','greeting','installBtn','chatForm','chatInput','chatSend','chatMessages','chatStatus','mainChatForm','mainChatInput','mainChatSend','mainChatMessages','mainChatStatus'];
    ids.forEach(id => App.elements[id] = document.getElementById(id));
    App.elements.roleButtons = document.querySelectorAll('.role-btn');
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
    App.elements.roleButtons.forEach(b => b.addEventListener('click', App.handleRoleClick));
    App.bindChat(App.elements.chatForm, App.elements.chatInput, App.elements.chatSend, App.elements.chatMessages);
    App.bindChat(App.elements.mainChatForm, App.elements.mainChatInput, App.elements.mainChatSend, App.elements.mainChatMessages);
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = App.loadVoices;
  },

  bindChat(form, input, send, messages) {
    form.addEventListener('submit', e => App.handleChatSubmit(e, { input, send, messages }));
  },

  setRoleFromHash() {
    const hash = window.location.hash.replace('#', '');
    App.state.role = ['adulto_mayor','operador','admin'].includes(hash) ? hash : ROL_ACTUAL;
    App.updateRoleButtons();
  },

  handleRoleClick(e) {
    App.state.role = e.currentTarget.dataset.role;
    window.location.hash = App.state.role;
    App.updateRoleButtons();
    App.setGreeting();
    App.updateEmergencyButton();
    if (App.state.currentCategory) App.openCategory(App.state.currentCategory.id);
  },

  updateRoleButtons() {
    App.elements.roleButtons.forEach(b => {
      const active = b.dataset.role === App.state.role;
      b.classList.toggle('active', active);
      active ? b.setAttribute('aria-current','true') : b.removeAttribute('aria-current');
    });
  },

  setGreeting() {
    const h = new Date().getHours();
    let t = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    t += App.state.role === 'adulto_mayor' ? ', bienvenido a ServicIA' : App.state.role === 'operador' ? ', modo acompañante activo' : ', panel de administración';
    App.elements.greeting.textContent = t;
  },

  updateEmergencyButton() {
    App.elements.emergencyBtn.hidden = App.state.role === 'admin';
    if (!App.elements.emergencyBtn.hidden) App.elements.emergencyBtn.textContent = App.state.role === 'adulto_mayor' ? '¿Qué digo ahora?' : 'Frase de ayuda';
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
      btn.innerHTML = `<span>${c.title}</span><span class="category-desc">${c.short}</span>`;
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
    if (window.speechSynthesis && App.state.role === 'adulto_mayor') App.speakText(phrase);
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
    if (App.state.role === 'admin') App.addContentCard('Ver solicitudes ingresadas', App.showForm);
    c.items.forEach(i => App.addContentCard(i.title, () => App.openDetail(i.id)));
    App.addContentCard('Solicitar orientación personalizada', App.showForm);
    App.showView('categoryView');
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
    article.innerHTML = `<h2>${item.title}</h2><ol>${item.content.map(s => `<li>${s}</li>`).join('')}</ol>`;
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
    b.className = `chat-bubble ${sender}`;
    b.textContent = text;
    messages.classList.add('has-messages');
    messages.appendChild(b);
    messages.scrollTop = messages.scrollHeight;
  },

  async streamTextToBubble(text, messages) {
    const b = document.createElement('div');
    b.className = 'chat-bubble bot typing';
    messages.classList.add('has-messages');
    messages.appendChild(b);
    for (const ch of text) { b.textContent += ch; messages.scrollTop = messages.scrollHeight; await App.delay(35); }
    b.classList.remove('typing');
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
      const b = document.createElement('div'); b.className = 'chat-bubble bot typing'; b.id = `stream-${id}`; b.textContent = '';
      const c = document.getElementById(d.containerId || 'mainChatMessages');
      if (c) { c.classList.add('has-messages'); c.appendChild(b); c.scrollTop = c.scrollHeight; }
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
      if (s?.bubble) { s.bubble.classList.remove('typing'); s.bubble.id = ''; App.Chat.activeStreams.delete(d.streamId || 'default'); }
      document.dispatchEvent(new CustomEvent('chat:streamEnd', { detail: d }));
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  // App.Chat.init({ url: 'wss://tu-api.com/chat', autoConnect: true, categoryContext: true });
});
