const ROL_ACTUAL = 'operador';

const CATEGORIAS = [
  {
    id: 'creditos',
    title: 'Créditos',
    short: 'Créditos preaprobados',
    description: 'Ofrecen dinero fácil por teléfono o WhatsApp. Puede ser una estafa o un crédito caro.',
    items: [
      {
        id: 'credito-preaprobado',
        title: 'Me ofrecieron un crédito preaprobado',
        content: [
          'No dé datos personales si no pidió el crédito.',
          'Pida el nombre de la empresa, su RUT y el número de inscripción en la CMF.',
          'Desconfíe si le piden pagar un seguro, comisión o gasto antes de recibir el dinero.',
          'Puede revisar en el sitio de la Comisión para el Mercado Financiero si la empresa está autorizada.'
        ]
      },
      {
        id: 'credito-cobro-anticipado',
        title: 'Me pidieron pagar antes de recibir el crédito',
        content: [
          'Exigir dinero por adelantado es una señal de alerta.',
          'No realice transferencias ni entregue claves.',
          'Corte la comunicación y guarde evidencia: mensajes, números y pantallas.',
          'Denuncie en SERNAC o en la Comisión para el Mercado Financiero.'
        ]
      }
    ]
  },
  {
    id: 'seguros',
    title: 'Seguros',
    short: 'Seguros atados o agregados',
    description: 'Le venden un seguro junto con otro producto o se lo agregan sin explicarle bien.',
    items: [
      {
        id: 'seguro-agregado',
        title: 'Me agregaron un seguro que no pedí',
        content: [
          'Revisa el contrato y los cargos en tu cuenta bancaria o tarjeta.',
          'Solicita la póliza y el detalle de la cobertura por escrito.',
          'Si no lo contrataste, exige la anulación y la devolución del dinero.',
          'Puedes reclamar ante la Comisión para el Mercado Financiero o SERNAC.'
        ]
      },
      {
        id: 'seguro-credito',
        title: 'Me dijeron que el seguro es obligatorio para el crédito',
        content: [
          'Pregunte si puede contratar el seguro con otra aseguradora.',
          'Pida que le expliquen el costo total del seguro durante toda la vida del crédito.',
          'Compare precios y coberturas con al menos dos aseguradoras.',
          'Si le presionan, no firme y pida revisar el contrato en su casa.'
        ]
      }
    ]
  },
  {
    id: 'cobranzas',
    title: 'Cobranzas',
    short: 'Cobros no reconocidos',
    description: 'Llegan cobros de deudas que no recuerda o que no reconoce.',
    items: [
      {
        id: 'cobro-no-reconocido',
        title: 'Me están cobrando una deuda que no reconozco',
        content: [
          'Exija por escrito el detalle de la deuda, el monto y quién es el acreedor.',
          'No se deje presionar con amenazas. Las llamadas deben ser en horario hábil.',
          'Pida la copia del contrato que origina la deuda.',
          'Si no le dan información clara, acuda a SERNAC o a un consultorio jurídico gratuito.'
        ]
      },
      {
        id: 'cobro-terceros',
        title: 'Una empresa externa me llama para cobrarme',
        content: [
          'Pida el nombre de la cobranza y el RUT de la empresa.',
          'No entregue datos de familiares ni vecinos.',
          'Exija que toda la comunicación sea por escrito.',
          'Guarde fecha, hora y número de cada llamada.'
        ]
      }
    ]
  },
  {
    id: 'servicios',
    title: 'Servicios',
    short: 'Portabilidad involuntaria',
    description: 'Le cambiaron de compañía de teléfono, internet o luz sin que usted haya pedido el cambio.',
    items: [
      {
        id: 'portabilidad-forzada',
        title: 'Me cambiaron de compañía sin mi permiso',
        content: [
          'Revise sus boletas y contratos recientes.',
          'Comuníquese con la empresa a la que nunca pidió cambiarse y exija la reversión.',
          'Solicite constancia escrita del cambio y quién lo autorizó.',
          'Denuncie ante la Subsecretaría de Telecomunicaciones o SERNAC.'
        ]
      },
      {
        id: 'cambio-proveedor',
        title: 'Un vendedor me visitó y ahora tengo otra empresa',
        content: [
          'Tiene derecho a retracto: puede anular el contrato dentro de los 10 días hábiles siguientes.',
          'La retractación debe ser gratuita y sin penalización.',
          'Hágalo por escrito y guarde copia.',
          'Si no respetan su retracto, reclame en SERNAC.'
        ]
      }
    ]
  }
];

const FRASES_EMERGENCIA = [
  'Deme el nombre de la empresa y su RUT, por favor.',
  'Necesito que me envíen esto por escrito para revisarlo con calma.',
  'No voy a dar datos ni firmar nada hasta conversar con mi familia.',
  'Por favor, dígame cuál es el número de reclamo o atención al cliente.',
  'Prefiero acudir personalmente a una oficina antes de continuar.'
];

const App = {
  state: {
    role: ROL_ACTUAL,
    currentCategory: null,
    currentItem: null,
    voices: []
  },

  elements: {},

  init: function () {
    App.cacheElements();
    App.bindEvents();
    App.setRoleFromHash();
    App.setGreeting();
    App.updateEmergencyButton();
    App.renderCategories(CATEGORIAS);
    App.loadVoices();
    App.setupInstall();
  },

  cacheElements: function () {
    App.elements.homeView = document.getElementById('homeView');
    App.elements.categoryView = document.getElementById('categoryView');
    App.elements.detailView = document.getElementById('detailView');
    App.elements.formView = document.getElementById('formView');
    App.elements.searchInput = document.getElementById('searchInput');
    App.elements.categoryList = document.getElementById('categoryList');
    App.elements.zeroResults = document.getElementById('zeroResults');
    App.elements.emergencyBtn = document.getElementById('emergencyBtn');
    App.elements.backFromCategory = document.getElementById('backFromCategory');
    App.elements.backFromDetail = document.getElementById('backFromDetail');
    App.elements.backFromForm = document.getElementById('backFromForm');
    App.elements.categoryTitle = document.getElementById('categoryTitle');
    App.elements.categoryDescription = document.getElementById('categoryDescription');
    App.elements.categoryContent = document.getElementById('categoryContent');
    App.elements.detailArticle = document.getElementById('detailArticle');
    App.elements.speakBtn = document.getElementById('speakBtn');
    App.elements.stopSpeakBtn = document.getElementById('stopSpeakBtn');
    App.elements.orientationForm = document.getElementById('orientationForm');
    App.elements.formRut = document.getElementById('formRut');
    App.elements.rutError = document.getElementById('rutError');
    App.elements.submitForm = document.getElementById('submitForm');
    App.elements.formStatus = document.getElementById('formStatus');
    App.elements.greeting = document.getElementById('greeting');
    App.elements.roleButtons = document.querySelectorAll('.role-btn');
    App.elements.installBtn = document.getElementById('installBtn');
    App.elements.chatForm = document.getElementById('chatForm');
    App.elements.chatInput = document.getElementById('chatInput');
    App.elements.chatSend = document.getElementById('chatSend');
    App.elements.chatMessages = document.getElementById('chatMessages');
    App.elements.chatStatus = document.getElementById('chatStatus');
    App.elements.mainChatForm = document.getElementById('mainChatForm');
    App.elements.mainChatInput = document.getElementById('mainChatInput');
    App.elements.mainChatSend = document.getElementById('mainChatSend');
    App.elements.mainChatMessages = document.getElementById('mainChatMessages');
    App.elements.mainChatStatus = document.getElementById('mainChatStatus');
  },

  bindEvents: function () {
    App.elements.searchInput.addEventListener('input', App.handleSearch);
    App.elements.emergencyBtn.addEventListener('click', App.handleEmergency);
    App.elements.backFromCategory.addEventListener('click', App.showHome);
    App.elements.backFromDetail.addEventListener('click', App.showCategory);
    App.elements.backFromForm.addEventListener('click', App.showHome);
    App.elements.speakBtn.addEventListener('click', App.speakCurrent);
    App.elements.stopSpeakBtn.addEventListener('click', App.stopSpeaking);
    App.elements.orientationForm.addEventListener('submit', App.handleFormSubmit);
    App.elements.formRut.addEventListener('blur', App.handleRutBlur);
    App.elements.roleButtons.forEach(function (button) {
      button.addEventListener('click', App.handleRoleClick);
    });
    App.elements.chatForm.addEventListener('submit', function (event) {
      App.handleChatSubmit(event, {
        input: App.elements.chatInput,
        send: App.elements.chatSend,
        messages: App.elements.chatMessages,
        status: App.elements.chatStatus
      });
    });
    App.elements.mainChatForm.addEventListener('submit', function (event) {
      App.handleChatSubmit(event, {
        input: App.elements.mainChatInput,
        send: App.elements.mainChatSend,
        messages: App.elements.mainChatMessages,
        status: App.elements.mainChatStatus
      });
    });

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = App.loadVoices;
    }
  },

  setRoleFromHash: function () {
    const roles = ['adulto_mayor', 'operador', 'admin'];
    const hash = window.location.hash.replace('#', '');
    if (roles.indexOf(hash) !== -1) {
      App.state.role = hash;
    } else {
      App.state.role = ROL_ACTUAL;
    }
    App.updateRoleButtons();
  },

  handleRoleClick: function (event) {
    const role = event.currentTarget.getAttribute('data-role');
    App.state.role = role;
    window.location.hash = role;
    App.updateRoleButtons();
    App.setGreeting();
    App.updateEmergencyButton();
    if (App.state.currentCategory) {
      App.openCategory(App.state.currentCategory.id);
    }
  },

  updateRoleButtons: function () {
    App.elements.roleButtons.forEach(function (button) {
      if (button.getAttribute('data-role') === App.state.role) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'true');
      } else {
        button.classList.remove('active');
        button.removeAttribute('aria-current');
      }
    });
  },

  setGreeting: function () {
    const hour = new Date().getHours();
    let text = 'Buenos días';
    if (hour >= 12 && hour < 20) {
      text = 'Buenas tardes';
    } else if (hour >= 20 || hour < 6) {
      text = 'Buenas noches';
    }

    if (App.state.role === 'adulto_mayor') {
      text += ', bienvenido a ServicIA';
    } else if (App.state.role === 'operador') {
      text += ', modo acompañante activo';
    } else {
      text += ', panel de administración';
    }

    App.elements.greeting.textContent = text;
  },

  updateEmergencyButton: function () {
    if (App.state.role === 'adulto_mayor') {
      App.elements.emergencyBtn.textContent = '¿Qué digo ahora?';
      App.elements.emergencyBtn.hidden = false;
    } else if (App.state.role === 'operador') {
      App.elements.emergencyBtn.textContent = 'Frase de ayuda';
      App.elements.emergencyBtn.hidden = false;
    } else {
      App.elements.emergencyBtn.hidden = true;
    }
  },

  clearChildren: function (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  renderCategories: function (categories) {
    App.clearChildren(App.elements.categoryList);

    if (categories.length === 0) {
      App.elements.zeroResults.hidden = false;
      return;
    }

    App.elements.zeroResults.hidden = true;

    categories.forEach(function (category) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'category-card';
      button.setAttribute('type', 'button');

      const title = document.createElement('span');
      title.textContent = category.title;
      button.appendChild(title);

      const desc = document.createElement('span');
      desc.className = 'category-desc';
      desc.textContent = category.short;
      button.appendChild(desc);

      button.addEventListener('click', function () {
        App.openCategory(category.id);
      });

      li.appendChild(button);
      App.elements.categoryList.appendChild(li);
    });
  },

  handleSearch: function () {
    const query = Security.sanitizeText(App.elements.searchInput.value).toLowerCase();

    if (query.length === 0) {
      App.renderCategories(CATEGORIAS);
      return;
    }

    const filtered = CATEGORIAS.filter(function (category) {
      return (
        category.title.toLowerCase().includes(query) ||
        category.short.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.items.some(function (item) {
          return item.title.toLowerCase().includes(query);
        })
      );
    });

    App.renderCategories(filtered);
  },

  handleEmergency: function () {
    const phrase = FRASES_EMERGENCIA[Math.floor(Math.random() * FRASES_EMERGENCIA.length)];

    if (window.speechSynthesis && App.state.role === 'adulto_mayor') {
      App.speakText(phrase);
    }

    const originalText = App.elements.emergencyBtn.textContent;
    App.elements.emergencyBtn.textContent = phrase;
    setTimeout(function () {
      if (App.state.role === 'adulto_mayor') {
        App.elements.emergencyBtn.textContent = '¿Qué digo ahora?';
      } else if (App.state.role === 'operador') {
        App.elements.emergencyBtn.textContent = 'Frase de ayuda';
      }
    }, 4000);
  },

  openCategory: function (categoryId) {
    const category = CATEGORIAS.find(function (c) {
      return c.id === categoryId;
    });

    if (!category) {
      return;
    }

    App.state.currentCategory = category;

    App.elements.categoryTitle.textContent = category.title;
    App.elements.categoryDescription.textContent = category.description;
    App.clearChildren(App.elements.categoryContent);

    if (App.state.role === 'admin') {
      const formButton = document.createElement('button');
      formButton.className = 'content-card';
      formButton.setAttribute('type', 'button');
      formButton.textContent = 'Ver solicitudes ingresadas';
      formButton.addEventListener('click', App.showForm);
      App.elements.categoryContent.appendChild(formButton);
    }

    category.items.forEach(function (item) {
      const button = document.createElement('button');
      button.className = 'content-card';
      button.setAttribute('type', 'button');
      button.textContent = item.title;
      button.addEventListener('click', function () {
        App.openDetail(item.id);
      });
      App.elements.categoryContent.appendChild(button);
    });

    const formButton = document.createElement('button');
    formButton.className = 'content-card';
    formButton.setAttribute('type', 'button');
    formButton.textContent = 'Solicitar orientación personalizada';
    formButton.addEventListener('click', App.showForm);
    App.elements.categoryContent.appendChild(formButton);

    App.showView('categoryView');
  },

  openDetail: function (itemId) {
    const item = App.state.currentCategory.items.find(function (i) {
      return i.id === itemId;
    });

    if (!item) {
      return;
    }

    App.state.currentItem = item;

    const article = document.createElement('article');
    const h2 = document.createElement('h2');
    h2.textContent = item.title;
    article.appendChild(h2);

    const ol = document.createElement('ol');
    item.content.forEach(function (step) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.appendChild(li);
    });
    article.appendChild(ol);

    App.clearChildren(App.elements.detailArticle);
    App.elements.detailArticle.appendChild(article);

    App.showView('detailView');
  },

  showHome: function () {
    App.state.currentCategory = null;
    App.state.currentItem = null;
    App.elements.searchInput.value = '';
    App.renderCategories(CATEGORIAS);
    App.showView('homeView');
  },

  showCategory: function () {
    App.state.currentItem = null;
    if (App.state.currentCategory) {
      App.openCategory(App.state.currentCategory.id);
    } else {
      App.showHome();
    }
  },

  showForm: function () {
    App.elements.orientationForm.reset();
    App.elements.rutError.textContent = '';
    App.elements.formStatus.textContent = '';
    App.elements.submitForm.disabled = false;
    App.showView('formView');
  },

  handleRutBlur: function () {
    const raw = App.elements.formRut.value;
    if (raw.trim().length === 0) {
      return;
    }
    const formatted = Security.formatRut(raw);
    App.elements.formRut.value = formatted;

    if (Security.validateRut(formatted)) {
      App.elements.rutError.textContent = '';
    } else {
      App.elements.rutError.textContent = 'El RUT ingresado no es válido. Revise el número y el dígito verificador.';
    }
  },

  handleFormSubmit: async function (event) {
    event.preventDefault();
    App.elements.formStatus.textContent = '';

    const formData = new FormData(App.elements.orientationForm);
    const payload = {
      nombre: Security.sanitizeText(formData.get('nombre')),
      rut: Security.sanitizeText(formData.get('rut')),
      tema: Security.sanitizeText(formData.get('tema')),
      mensaje: Security.sanitizeText(formData.get('mensaje'))
    };

    if (payload.nombre.length < 2 || payload.tema.length < 3 || payload.mensaje.length < 10) {
      App.elements.formStatus.textContent = 'Por favor complete todos los campos correctamente.';
      App.elements.formStatus.style.color = 'var(--color-error)';
      return;
    }

    if (Security.validateRut(payload.rut) === false) {
      App.elements.rutError.textContent = 'El RUT ingresado no es válido.';
      App.elements.formRut.focus();
      return;
    }

    App.elements.submitForm.disabled = true;
    App.elements.formStatus.style.color = 'var(--color-success)';
    App.elements.formStatus.textContent = 'Analizando...';

    try {
      const response = await Security.simulateApiCall('/api/orientacion', payload);
      App.elements.formStatus.textContent = response.message + ' Ticket: ' + response.ticket;
      App.elements.orientationForm.reset();
    } catch (error) {
      App.elements.formStatus.style.color = 'var(--color-error)';
      App.elements.formStatus.textContent = 'Ocurrió un error. Intente nuevamente.';
    } finally {
      App.elements.submitForm.disabled = false;
    }
  },

  showView: function (viewName) {
    ['homeView', 'categoryView', 'detailView', 'formView'].forEach(function (name) {
      App.elements[name].hidden = name !== viewName;
    });
    window.scrollTo(0, 0);
  },

  loadVoices: function () {
    if (!window.speechSynthesis) {
      return;
    }
    App.state.voices = window.speechSynthesis.getVoices();
  },

  speakCurrent: function () {
    if (!App.state.currentItem) {
      return;
    }
    const text = App.state.currentItem.title + '. ' + App.state.currentItem.content.join('. ');
    App.speakText(text);
  },

  speakText: function (text) {
    if (!window.speechSynthesis) {
      return;
    }
    App.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CL';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const spanishVoice = App.state.voices.find(function (voice) {
      return voice.lang.startsWith('es');
    });
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = function () {
      App.elements.stopSpeakBtn.hidden = false;
    };
    utterance.onend = function () {
      App.elements.stopSpeakBtn.hidden = true;
    };

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: function () {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    App.elements.stopSpeakBtn.hidden = true;
  },

  setupInstall: function () {
    let deferredPrompt = null;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      App.elements.installBtn.hidden = false;
    });

    App.elements.installBtn.addEventListener('click', function () {
      const modal = document.getElementById('installModal');
      const androidView = document.getElementById('installAndroidView');
      const iosView = document.getElementById('installIOSView');
      const webView = document.getElementById('installWebView');

      // Reset views
      androidView.hidden = true;
      iosView.hidden = true;
      webView.hidden = true;

      if (deferredPrompt && isAndroid) {
        // Show Android view
        androidView.hidden = false;
        const androidBtn = document.getElementById('installAndroidBtn');
        androidBtn.onclick = async function () {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            App.elements.installBtn.hidden = true;
            modal.close();
          }
          deferredPrompt = null;
        };
      } else if (isIOS) {
        // Show iOS view with manual instructions
        iosView.hidden = false;
        const iosBtn = iosView.querySelector('.modal-btn');
        iosBtn.onclick = function () {
          modal.close();
        };
      } else {
        // Show web fallback
        webView.hidden = false;
        const webBtn = webView.querySelector('.modal-btn');
        webBtn.onclick = function () {
          modal.close();
        };
      }

      modal.showModal();
    });

    // Close modal button
    const closeBtn = document.getElementById('closeInstallModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        document.getElementById('installModal').close();
      });
    }

    window.addEventListener('appinstalled', function () {
      App.elements.installBtn.hidden = true;
      deferredPrompt = null;
    });
  },

  addChatMessage: function (text, sender, elements) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + sender;
    bubble.textContent = text;
    elements.messages.appendChild(bubble);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  },

  streamTextToBubble: async function (text, elements) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot typing';
    bubble.textContent = '';
    elements.messages.appendChild(bubble);
    elements.messages.scrollTop = elements.messages.scrollHeight;

    for (let i = 0; i < text.length; i++) {
      bubble.textContent += text.charAt(i);
      elements.messages.scrollTop = elements.messages.scrollHeight;
      await App.delay(35);
    }

    bubble.classList.remove('typing');
  },

  delay: function (ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  },

  handleChatSubmit: async function (event, elements) {
    event.preventDefault();

    const message = Security.sanitizeText(elements.input.value);
    if (message.length === 0) {
      return;
    }

    App.addChatMessage(message, 'user', elements);
    elements.input.value = '';
    elements.send.disabled = true;

    await App.delay(400);
    await App.streamTextToBubble('Disponible proximamente', elements);

    elements.send.disabled = false;
    elements.input.focus();
  },

  Chat: {
    ws: null,
    isConnected: false,
    reconnectDelay: 3000,
    maxReconnectDelay: 30000,
    currentDelay: 3000,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    pendingQueue: [],
    activeStreams: new Map(),

    config: {
      url: null,
      autoConnect: false,
      categoryContext: false
    },

    init: function (options) {
      App.Chat.config.url = options.url || null;
      App.Chat.config.autoConnect = options.autoConnect || false;
      App.Chat.config.categoryContext = options.categoryContext || false;

      if (App.Chat.config.autoConnect && App.Chat.config.url) {
        App.Chat.connect();
      }
    },

    connect: function () {
      if (App.Chat.ws && (App.Chat.ws.readyState === WebSocket.CONNECTING || App.Chat.ws.readyState === WebSocket.OPEN)) {
        return;
      }

      if (!App.Chat.config.url) {
        console.warn('Chat: no URL configurada');
        return;
      }

      try {
        App.Chat.ws = new WebSocket(App.Chat.config.url);

        App.Chat.ws.onopen = function () {
          App.Chat.isConnected = true;
          App.Chat.reconnectAttempts = 0;
          App.Chat.currentDelay = App.Chat.reconnectDelay;
          App.Chat.flushPendingQueue();
          document.dispatchEvent(new CustomEvent('chat:connected'));
        };

        App.Chat.ws.onmessage = function (event) {
          App.Chat.handleMessage(event.data);
        };

        App.Chat.ws.onerror = function () {
          document.dispatchEvent(new CustomEvent('chat:error', { detail: { message: 'Error de conexión con el asistente' } }));
        };

        App.Chat.ws.onclose = function () {
          App.Chat.isConnected = false;
          document.dispatchEvent(new CustomEvent('chat:disconnected'));
          App.Chat.scheduleReconnect();
        };
      } catch (error) {
        console.error('Chat: error al crear WebSocket', error);
      }
    },

    disconnect: function () {
      if (App.Chat.ws) {
        App.Chat.ws.close();
        App.Chat.ws = null;
      }
      App.Chat.isConnected = false;
    },

    scheduleReconnect: function () {
      if (App.Chat.reconnectAttempts >= App.Chat.maxReconnectAttempts) {
        document.dispatchEvent(new CustomEvent('chat:error', { detail: { message: 'No se pudo reconectar con el asistente' } }));
        return;
      }

      App.Chat.reconnectAttempts += 1;
      setTimeout(function () {
        App.Chat.connect();
      }, App.Chat.currentDelay);

      App.Chat.currentDelay = Math.min(App.Chat.currentDelay * 1.5, App.Chat.maxReconnectDelay);
    },

    send: function (message, options) {
      const payload = {
        type: 'message',
        message: Security.sanitizeText(message),
        timestamp: new Date().toISOString()
      };

      if (options && options.categoryId) {
        payload.categoryId = options.categoryId;
      }

      if (App.Chat.config.categoryContext && App.state.currentCategory) {
        payload.categoryId = App.state.currentCategory.id;
      }

      if (App.Chat.isConnected && App.Chat.ws.readyState === WebSocket.OPEN) {
        App.Chat.ws.send(JSON.stringify(payload));
      } else {
        App.Chat.pendingQueue.push(payload);
        if (!App.Chat.isConnected) {
          App.Chat.connect();
        }
      }
    },

    flushPendingQueue: function () {
      while (App.Chat.pendingQueue.length > 0 && App.Chat.ws.readyState === WebSocket.OPEN) {
        const payload = App.Chat.pendingQueue.shift();
        App.Chat.ws.send(JSON.stringify(payload));
      }
    },

    handleMessage: function (raw) {
      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = { type: 'text', content: raw };
      }

      if (data.type === 'stream' || data.type === 'chunk') {
        App.Chat.handleStreamChunk(data);
      } else if (data.type === 'stream_start') {
        App.Chat.handleStreamStart(data);
      } else if (data.type === 'stream_end') {
        App.Chat.handleStreamEnd(data);
      } else if (data.type === 'error') {
        document.dispatchEvent(new CustomEvent('chat:error', { detail: data }));
      } else {
        document.dispatchEvent(new CustomEvent('chat:message', { detail: data }));
      }
    },

    handleStreamStart: function (data) {
      const streamId = data.streamId || 'default';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble bot typing';
      bubble.id = 'stream-' + streamId;
      bubble.textContent = '';

      const containerId = data.containerId || 'mainChatMessages';
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
      }

      App.Chat.activeStreams.set(streamId, {
        bubble: bubble,
        container: container
      });

      document.dispatchEvent(new CustomEvent('chat:streamStart', { detail: data }));
    },

    handleStreamChunk: function (data) {
      const streamId = data.streamId || 'default';
      const stream = App.Chat.activeStreams.get(streamId);

      if (stream && stream.bubble) {
        stream.bubble.textContent += data.content || '';
        stream.container.scrollTop = stream.container.scrollHeight;
      }

      document.dispatchEvent(new CustomEvent('chat:streamChunk', { detail: data }));
    },

    handleStreamEnd: function (data) {
      const streamId = data.streamId || 'default';
      const stream = App.Chat.activeStreams.get(streamId);

      if (stream && stream.bubble) {
        stream.bubble.classList.remove('typing');
        stream.bubble.id = '';
        App.Chat.activeStreams.delete(streamId);
      }

      document.dispatchEvent(new CustomEvent('chat:streamEnd', { detail: data }));
    }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  App.init();

  // Inicializar conexión WebSocket del chat cuando haya endpoint disponible
  // App.Chat.init({ url: 'wss://tu-api.com/chat', autoConnect: true, categoryContext: true });
});
