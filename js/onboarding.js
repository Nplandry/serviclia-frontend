const Onboarding = {
  STORAGE_KEY: 'servicia.onboarding',

  pasos: [
    {
      id: 'intro',
      type: 'welcome',
      titulo: 'Bienvenido a ServicIA',
      texto: 'Te haremos unas preguntas rápidas para conocerte. Desliza o toca para avanzar.',
      cta: 'Comenzar'
    },
    {
      id: 'nombre',
      type: 'text',
      campo: 'nombre',
      titulo: '¿Cómo te llamas?',
      texto: 'Usaremos tu nombre para acompañarte mejor.',
      placeholder: 'Tu nombre',
      inputType: 'text'
    },
    {
      id: 'edad',
      type: 'text',
      campo: 'edad',
      titulo: '¿Qué edad tienes?',
      texto: 'Nos ayuda a adaptar la orientación.',
      placeholder: 'Ej: 68',
      inputType: 'number'
    },
    {
      id: 'email',
      type: 'text',
      campo: 'email',
      titulo: '¿Cuál es tu correo?',
      texto: 'Lo usarás para iniciar sesión.',
      placeholder: 'correo@ejemplo.cl',
      inputType: 'email'
    },
    {
      id: 'password',
      type: 'text',
      campo: 'password',
      titulo: 'Crea una contraseña',
      texto: 'Mínimo 6 caracteres.',
      placeholder: 'Contraseña',
      inputType: 'password'
    },
    {
      id: 'preocupacion',
      type: 'choice',
      campo: 'preocupacion',
      titulo: '¿Qué te preocupa hoy?',
      texto: 'Puedes cambiarlo después.',
      opciones: [
        { value: 'embargo', label: 'Amenazas de embargo' },
        { value: 'seguros', label: 'Cobros o seguros extraños' },
        { value: 'telecom', label: 'Cambios de plan o portabilidad' },
        { value: 'otro', label: 'Otra cosa' }
      ]
    },
    {
      id: 'proposito',
      type: 'choice',
      campo: 'proposito',
      titulo: '¿Para qué vas a usar ServicIA?',
      texto: 'Nos ayuda a adaptar la orientación a tus necesidades.',
      opciones: [
        { value: 'autoinformarse', label: 'Para auto-informarme sobre mis derechos' },
        { value: 'asesorar', label: 'Para asesorar a familiares o amigos' },
        { value: 'investigar', label: 'Para investigar información sobre finanzas, créditos o bienes raíces' },
        { value: 'trabajo', label: 'Para capacitarme y ayudar en mi trabajo' }
      ]
    },
    {
      id: 'fin',
      type: 'summary',
      titulo: 'Todo listo',
      texto: 'Crearemos tu cuenta y entrarás directo a la app.',
      cta: 'Crear cuenta y entrar'
    }
  ],

  index: 0,
  datos: {},
  elements: {},

  init() {
    Auth.init();
    Onboarding.elements.deck = document.getElementById('deck');
    Onboarding.elements.progress = document.getElementById('progress');
    Onboarding.elements.prevBtn = document.getElementById('prevBtn');
    Onboarding.elements.stepStatus = document.getElementById('stepStatus');
    Onboarding.restore();
    Onboarding.renderProgress();
    Onboarding.elements.prevBtn.addEventListener('click', Onboarding.goBack);
    Onboarding.renderCard();
  },

  restore() {
    try {
      const raw = localStorage.getItem(Onboarding.STORAGE_KEY);
      if (raw) {
        Onboarding.datos = JSON.parse(raw) || {};
      }
    } catch (e) {
      Onboarding.datos = {};
    }
  },

  save() {
    try {
      localStorage.setItem(Onboarding.STORAGE_KEY, JSON.stringify(Onboarding.datos));
    } catch (e) {
      void e;
    }
  },

  renderProgress() {
    Onboarding.clear(Onboarding.elements.progress);
    Onboarding.pasos.forEach((p, i) => {
      const dot = document.createElement('span');
      dot.className = 'onboarding__dot' + (i <= Onboarding.index ? ' onboarding__dot--done' : '');
      Onboarding.elements.progress.appendChild(dot);
    });
  },

  clear(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  },

  renderCard() {
    const paso = Onboarding.pasos[Onboarding.index];
    Onboarding.clear(Onboarding.elements.deck);
    Onboarding.elements.prevBtn.hidden = Onboarding.index === 0;
    Onboarding.elements.stepStatus.textContent = '';
    Onboarding.renderProgress();

    const card = document.createElement('article');
    card.className = 'onboarding__card';

    const title = document.createElement('h1');
    title.className = 'onboarding__card-title';
    title.textContent = paso.titulo;
    card.appendChild(title);

    const text = document.createElement('p');
    text.className = 'onboarding__card-text';
    text.textContent = paso.texto;
    card.appendChild(text);

    if (paso.type === 'text') {
      Onboarding.renderTextStep(card, paso);
    } else if (paso.type === 'choice') {
      Onboarding.renderChoiceStep(card, paso);
    } else if (paso.type === 'summary') {
      Onboarding.renderSummaryStep(card, paso);
    } else {
      Onboarding.renderWelcomeStep(card, paso);
    }

    Onboarding.elements.deck.appendChild(card);
    Onboarding.enableSwipe(card);
  },

  renderWelcomeStep(card, paso) {
    const btn = Onboarding.makeButton(paso.cta || 'Siguiente');
    btn.addEventListener('click', Onboarding.goNext);
    card.appendChild(btn);
  },

  renderTextStep(card, paso) {
    const field = document.createElement('div');
    field.className = 'field';
    const input = document.createElement('input');
    input.className = 'field__input';
    input.type = paso.inputType || 'text';
    input.placeholder = paso.placeholder || '';
    input.value = Onboarding.datos[paso.campo] || '';
    input.maxLength = paso.inputType === 'password' ? 40 : 60;
    if (paso.inputType === 'number') {
      input.min = '0';
      input.max = '120';
    }
    if (paso.inputType === 'email') {
      input.autocomplete = 'username';
    }
    if (paso.inputType === 'password') {
      input.autocomplete = 'new-password';
    }
    field.appendChild(input);
    card.appendChild(field);

    const btn = Onboarding.makeButton('Siguiente');
    btn.addEventListener('click', () => {
      const value = input.value.trim();
      const error = Onboarding.validateField(paso, value);
      if (error) {
        Onboarding.elements.stepStatus.textContent = error;
        input.focus();
        return;
      }
      Onboarding.datos[paso.campo] = value;
      Onboarding.save();
      Onboarding.goNext();
    });
    card.appendChild(btn);
    setTimeout(() => input.focus(), 50);
  },

  validateField(paso, value) {
    if (!value) {
      return 'Por favor, completa este campo.';
    }
    if (paso.campo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Ingrese un correo electrónico válido.';
    }
    if (paso.campo === 'email' && Auth.isRegistered(value)) {
      return 'Este correo ya está registrado. Inicie sesión en la app.';
    }
    if (paso.campo === 'password' && value.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return '';
  },

  renderChoiceStep(card, paso) {
    const list = document.createElement('div');
    list.className = 'onboarding__choices';
    paso.opciones.forEach(op => {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'onboarding__choice';
      if (Onboarding.datos[paso.campo] === op.value) {
        choice.classList.add('onboarding__choice--selected');
      }
      choice.textContent = op.label;
      choice.addEventListener('click', () => {
        Onboarding.datos[paso.campo] = op.value;
        Onboarding.save();
        Onboarding.goNext();
      });
      list.appendChild(choice);
    });
    card.appendChild(list);
  },

  renderSummaryStep(card, paso) {
    const list = document.createElement('dl');
    list.className = 'onboarding__summary';
    const campos = [
      ['Nombre', Onboarding.datos.nombre],
      ['Edad', Onboarding.datos.edad],
      ['Correo', Onboarding.datos.email],
      ['Preocupación principal', Onboarding.labelFor('preocupacion', Onboarding.datos.preocupacion)],
      ['Propósito de uso', Onboarding.labelFor('proposito', Onboarding.datos.proposito)]
    ];
    campos.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v || 'Sin responder';
      list.appendChild(dt);
      list.appendChild(dd);
    });
    card.appendChild(list);

    const btn = Onboarding.makeButton(paso.cta || 'Finalizar');
    btn.addEventListener('click', () => Onboarding.finish(btn));
    card.appendChild(btn);
  },

  labelFor(campo, value) {
    const paso = Onboarding.pasos.find(p => p.campo === campo);
    if (!paso || !paso.opciones) {
      return value;
    }
    const op = paso.opciones.find(o => o.value === value);
    return op ? op.label : value;
  },

  makeButton(text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'submit-btn onboarding__cta';
    btn.textContent = text;
    return btn;
  },

  goNext() {
    if (Onboarding.index < Onboarding.pasos.length - 1) {
      Onboarding.index += 1;
      Onboarding.renderCard();
    }
  },

  goBack() {
    if (Onboarding.index > 0) {
      Onboarding.index -= 1;
      Onboarding.renderCard();
    }
  },

  async finish(btn) {
    btn.disabled = true;
    btn.textContent = 'Creando tu cuenta...';
    Onboarding.elements.stepStatus.textContent = '';

    const res = await Auth.onboardApi({
      nombre: Onboarding.datos.nombre,
      email: Onboarding.datos.email,
      password: Onboarding.datos.password,
      edad: Onboarding.datos.edad,
      preocupacion: Onboarding.datos.preocupacion
    });

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = 'Crear cuenta y entrar';
      Onboarding.elements.stepStatus.textContent = res.error;
      return;
    }

    try {
      localStorage.removeItem(Onboarding.STORAGE_KEY);
    } catch (e) {
      void e;
    }

    Onboarding.clear(Onboarding.elements.deck);
    const done = document.createElement('article');
    done.className = 'onboarding__card onboarding__card--done';
    const title = document.createElement('h1');
    title.className = 'onboarding__card-title';
    title.textContent = '¡Bienvenido, ' + (res.user.nombre || '') + '!';
    const text = document.createElement('p');
    text.className = 'onboarding__card-text';
    text.textContent = 'Tu cuenta quedó registrada. Entrando a ServicIA...';
    done.appendChild(title);
    done.appendChild(text);
    Onboarding.elements.deck.appendChild(done);
    Onboarding.elements.prevBtn.hidden = true;

    setTimeout(() => {
      window.location.href = '../index.html';
    }, 900);
  },

  enableSwipe(card) {
    const paso = Onboarding.pasos[Onboarding.index];
    if (paso.type === 'choice' || paso.type === 'text' || paso.type === 'summary') {
      return;
    }
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const start = x => {
      dragging = true;
      startX = x;
      currentX = x;
      card.style.transition = 'none';
    };
    const move = x => {
      if (!dragging) {
        return;
      }
      currentX = x;
      const delta = currentX - startX;
      card.style.transform = 'translateX(' + delta + 'px) rotate(' + (delta / 25) + 'deg)';
    };
    const end = () => {
      if (!dragging) {
        return;
      }
      dragging = false;
      const delta = currentX - startX;
      card.style.transition = 'transform 0.25s ease';
      if (delta > 90) {
        card.style.transform = 'translateX(120%) rotate(12deg)';
        setTimeout(Onboarding.goNext, 180);
      } else if (delta < -90 && Onboarding.index > 0) {
        card.style.transform = 'translateX(-120%) rotate(-12deg)';
        setTimeout(Onboarding.goBack, 180);
      } else {
        card.style.transform = '';
      }
    };

    card.addEventListener('touchstart', e => start(e.touches[0].clientX), { passive: true });
    card.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });
    card.addEventListener('touchend', end);
    card.addEventListener('mousedown', e => start(e.clientX));
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', end);
  }
};

document.addEventListener('DOMContentLoaded', Onboarding.init);
