const Onboarding = {
  VERSION: 54,
  STORAGE_KEY: 'servichile.onboarding.v54',

  pasos: [
    {
      id: 'tipo_cuenta',
      type: 'choice',
      campo: 'tipo_cuenta',
      titulo: '¿Eres persona o empresa?',
      texto: 'Primero elige el tipo de cuenta. Así adaptamos el Pasaporte de Confianza.',
      opciones: [
        { value: 'persona', label: 'Persona' },
        { value: 'empresa', label: 'Empresa' }
      ]
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
      texto: 'Mínimo 8 caracteres.',
      placeholder: 'Contraseña',
      inputType: 'password'
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
      localStorage.removeItem('servichile.onboarding');
    } catch {}
    try {
      const raw = localStorage.getItem(Onboarding.STORAGE_KEY);
      if (raw) {
        Onboarding.datos = JSON.parse(raw) || {};
        if ('password' in Onboarding.datos) {
          delete Onboarding.datos.password;
          Onboarding.save();
        }
      }
    } catch (e) {
      Onboarding.datos = {};
    }
    // Sin tipo elegido: siempre empieza en persona/empresa.
    if (!Onboarding.datos.tipo_cuenta) {
      Onboarding.index = 0;
    }
  },

  save() {
    // La contrasena nunca se guarda en el dispositivo. Solo vive en memoria hasta crear la cuenta.
    const borrador = Object.assign({}, Onboarding.datos);
    delete borrador.password;
    try {
      localStorage.setItem(Onboarding.STORAGE_KEY, JSON.stringify(borrador));
    } catch {}
  },

  renderProgress() {
    Onboarding.clear(Onboarding.elements.progress);
    Onboarding.pasosVisibles().forEach((p, i) => {
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

  esEmpresa() {
    return Onboarding.datos.tipo_cuenta === 'empresa';
  },

  // Oculta edad para empresa: no aplica a la razón social.
  pasosVisibles() {
    return Onboarding.pasos.filter((p) => {
      if (p.id === 'edad' && Onboarding.esEmpresa()) return false;
      return true;
    });
  },

  pasoActual() {
    return Onboarding.pasosVisibles()[Onboarding.index];
  },

  copyPaso(paso) {
    if (!paso) return { titulo: '', texto: '' };
    if (paso.id === 'nombre' && Onboarding.esEmpresa()) {
      return {
        titulo: '¿Cuál es el nombre de la empresa?',
        texto: 'Usaremos la razón social o el nombre comercial en tu cuenta.'
      };
    }
    if (paso.id === 'edad' && !Onboarding.esEmpresa()) {
      return { titulo: paso.titulo, texto: paso.texto };
    }
    return { titulo: paso.titulo, texto: paso.texto };
  },

  renderCard() {
    const visibles = Onboarding.pasosVisibles();
    if (Onboarding.index >= visibles.length) {
      Onboarding.index = Math.max(0, visibles.length - 1);
    }
    const paso = Onboarding.pasoActual();
    Onboarding.clear(Onboarding.elements.deck);
    Onboarding.elements.prevBtn.hidden = Onboarding.index === 0;
    Onboarding.elements.stepStatus.textContent = '';
    Onboarding.renderProgress();

    const card = document.createElement('article');
    card.className = 'onboarding__card';
    const copy = Onboarding.copyPaso(paso);

    const title = document.createElement('h1');
    title.className = 'onboarding__card-title';
    title.textContent = copy.titulo;
    card.appendChild(title);

    const text = document.createElement('p');
    text.className = 'onboarding__card-text';
    text.textContent = copy.texto;
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
    input.placeholder =
      paso.id === 'nombre' && Onboarding.esEmpresa()
        ? 'Nombre de la empresa'
        : paso.placeholder || '';
    input.value = Onboarding.datos[paso.campo] || '';
    input.maxLength = paso.inputType === 'password' ? 40 : 120;
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
    if (paso.campo === 'email') {
      // Exige dominio con TLD de letras (evita typos tipo .cl2).
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) {
        return 'Ingrese un correo válido, por ejemplo nombre@dominio.cl';
      }
    }
    if (paso.campo === 'edad') {
      const edad = Number(value);
      if (!Number.isInteger(edad) || edad < 14 || edad > 120) {
        return 'Ingrese una edad entre 14 y 120 años.';
      }
    }
    if (paso.campo === 'password' && value.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
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

  etiquetaTipoCuenta(valor) {
    if (valor === 'empresa') return 'Empresa';
    if (valor === 'persona') return 'Persona';
    return valor || 'Sin responder';
  },

  renderSummaryStep(card, paso) {
    const list = document.createElement('dl');
    list.className = 'onboarding__summary';
    const campos = [
      ['Tipo', Onboarding.etiquetaTipoCuenta(Onboarding.datos.tipo_cuenta)],
      [Onboarding.esEmpresa() ? 'Empresa' : 'Nombre', Onboarding.datos.nombre],
      Onboarding.esEmpresa() ? null : ['Edad', Onboarding.datos.edad],
      ['Correo', Onboarding.datos.email]
    ].filter(Boolean);
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

  makeButton(text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'submit-btn onboarding__cta';
    btn.textContent = text;
    return btn;
  },

  goNext() {
    if (Onboarding.index < Onboarding.pasosVisibles().length - 1) {
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
    if (!Onboarding.datos.tipo_cuenta) {
      Onboarding.index = Onboarding.pasosVisibles().findIndex((p) => p.campo === 'tipo_cuenta');
      Onboarding.renderCard();
      Onboarding.elements.stepStatus.textContent = 'Elija si es persona o empresa.';
      return;
    }
    // Si recargo la pagina, la contrasena ya no esta en memoria. No se guarda en el dispositivo.
    if (!Onboarding.datos.password) {
      Onboarding.index = Onboarding.pasosVisibles().findIndex((p) => p.campo === 'password');
      Onboarding.renderCard();
      Onboarding.elements.stepStatus.textContent = 'Por seguridad, vuelva a escribir su contraseña.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Creando tu cuenta...';
    Onboarding.elements.stepStatus.textContent = '';

    const res = await Auth.onboardApi({
      nombre: Onboarding.datos.nombre,
      email: Onboarding.datos.email,
      password: Onboarding.datos.password,
      edad: Onboarding.esEmpresa() ? undefined : Onboarding.datos.edad,
      tipo_cuenta: Onboarding.datos.tipo_cuenta
    });

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = 'Crear cuenta y entrar';
      Onboarding.elements.stepStatus.textContent = res.error;
      return;
    }

    try {
      localStorage.removeItem(Onboarding.STORAGE_KEY);
    } catch {}

    Onboarding.clear(Onboarding.elements.deck);
    const done = document.createElement('article');
    done.className = 'onboarding__card onboarding__card--done';
    const title = document.createElement('h1');
    title.className = 'onboarding__card-title';
    title.textContent = '¡Bienvenido, ' + (res.user.nombre || '') + '!';
    const text = document.createElement('p');
    text.className = 'onboarding__card-text';
    text.textContent = 'Tu cuenta quedó registrada. Entrando a ServiChile...';
    done.appendChild(title);
    done.appendChild(text);
    Onboarding.elements.deck.appendChild(done);
    Onboarding.elements.prevBtn.hidden = true;

    setTimeout(() => {
      window.location.href = '../index.html';
    }, 900);
  },

  enableSwipe(card) {
    const paso = Onboarding.pasoActual();
    if (!paso || paso.type === 'choice' || paso.type === 'text' || paso.type === 'summary') {
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
