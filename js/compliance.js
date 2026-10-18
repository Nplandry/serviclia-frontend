const Compliance = {
  VERSION: '1.0',
  LEY: 'Ley 21.719 Protección de Datos Personales',
  CONSENT_KEY: 'servicia.consent.',
  COOKIE_KEY: 'servicia.cookies.consent',
  INCIDENT_KEY: 'servicia.security.incidents',

  FINALIDADES: [
    {
      id: 'consulta_identidad',
      label: 'Consultar y verificar mi identidad y RUT',
      detalle: 'Validar el RUT ingresado y confirmar titularidad para la auditoría.',
      obligatoria: true
    },
    {
      id: 'cruce_patrimonial',
      label: 'Buscar y cruzar mis datos patrimoniales y de antecedentes',
      detalle: 'Consultar fuentes como SII, Registro Civil, CMF, AFP y registros de deuda para diagnosticar la amenaza de embargo.',
      obligatoria: true
    },
    {
      id: 'terminos_proveedor',
      label: 'Acepto operar bajo los términos de uso del proveedor de datos',
      detalle: 'El cruce se realiza a través de un proveedor de datos externo, sujeto a sus términos y a la Ley 21.719.',
      obligatoria: true
    }
  ],

  storageKeyFor(owner) {
    return Compliance.CONSENT_KEY + (owner || 'anon');
  },

  _loadAll(owner) {
    try {
      const raw = localStorage.getItem(Compliance.storageKeyFor(owner));
      return raw ? JSON.parse(raw) || [] : [];
    } catch (e) {
      return [];
    }
  },

  _persistAll(owner, list) {
    try {
      localStorage.setItem(Compliance.storageKeyFor(owner), JSON.stringify(list));
    } catch (e) {
      void e;
    }
  },

  grantConsent(params) {
    const now = new Date().toISOString();
    const record = {
      id: 'consent-' + Date.now() + ' ' + Math.floor(Math.random() * 1000),
      version: Compliance.VERSION,
      ley: Compliance.LEY,
      casoId: params.casoId || '',
      base_licitud: params.titularidad === 'tercero'
        ? 'Consentimiento del titular acreditado por un tercero autorizado (art. 12)'
        : 'Consentimiento del titular de los datos (art. 12)',
      finalidades: Array.isArray(params.finalidades) ? params.finalidades.slice() : [],
      titularidad: params.titularidad === 'tercero' ? 'tercero' : 'titular',
      tercero: params.tercero || null,
      otorgado_en: now,
      revocado_en: null,
      estado: 'vigente'
    };
    const list = Compliance._loadAll(params.owner);
    list.unshift(record);
    Compliance._persistAll(params.owner, list);
    return record;
  },

  revokeConsent(owner, consentId) {
    const list = Compliance._loadAll(owner);
    const rec = list.find(function (r) { return r.id === consentId; });
    if (rec) {
      rec.revocado_en = new Date().toISOString();
      rec.estado = 'revocado';
      Compliance._persistAll(owner, list);
    }
    return rec || null;
  },

  revokeAll(owner) {
    const list = Compliance._loadAll(owner);
    const now = new Date().toISOString();
    list.forEach(function (r) {
      if (r.estado === 'vigente') { r.estado = 'revocado'; r.revocado_en = now; }
    });
    Compliance._persistAll(owner, list);
    return list;
  },

  getConsents(owner) {
    return Compliance._loadAll(owner);
  },

  logSecurityIncident(detail) {
    try {
      const raw = localStorage.getItem(Compliance.INCIDENT_KEY);
      const list = raw ? JSON.parse(raw) || [] : [];
      list.unshift({
        id: 'inc-' + Date.now(),
        fecha: new Date().toISOString(),
        tipo: detail && detail.tipo ? detail.tipo : 'desconocido',
        descripcion: detail && detail.descripcion ? detail.descripcion : '',
        severidad: detail && detail.severidad ? detail.severidad : 'media'
      });
      localStorage.setItem(Compliance.INCIDENT_KEY, JSON.stringify(list.slice(0, 100)));
    } catch (e) {
      void e;
    }
  },

  getCookieConsent() {
    try {
      return localStorage.getItem(Compliance.COOKIE_KEY) || null;
    } catch (e) {
      return null;
    }
  },

  setCookieConsent(value) {
    try {
      localStorage.setItem(Compliance.COOKIE_KEY, value);
    } catch (e) {
      void e;
    }
  },

  initCookieBanner() {
    if (Compliance.getCookieConsent()) return;
    if (document.getElementById('cookieBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Aviso de cookies y protección de datos');

    const text = document.createElement('p');
    text.className = 'cookie-banner__text';
    text.innerHTML = 'Usamos almacenamiento local necesario para el funcionamiento de la app y, con su permiso, '
      + 'para recordar sus consultas.';
    banner.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'cookie-banner__actions';

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'cookie-banner__btn cookie-banner__btn--ghost';
    rejectBtn.textContent = 'Solo lo necesario';
    rejectBtn.addEventListener('click', function () {
      Compliance.setCookieConsent('necesario');
      banner.remove();
    });

    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'cookie-banner__btn cookie-banner__btn--primary';
    acceptBtn.textContent = 'Aceptar todo';
    acceptBtn.addEventListener('click', function () {
      Compliance.setCookieConsent('todo');
      banner.remove();
    });

    actions.appendChild(rejectBtn);
    actions.appendChild(acceptBtn);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  },

  buildConsentBlock(categoria) {
    const wrap = document.createElement('div');
    wrap.className = 'consent';
    wrap.setAttribute('aria-label', 'Consentimiento informado para el tratamiento de datos');

    const notice = document.createElement('div');
    notice.className = 'consent__notice';
    notice.innerHTML =
      '<p class="consent__notice-title">Protección de sus datos ' + Compliance.LEY + '</p>'
      + '<p class="consent__notice-text">Para auditar su caso necesitamos tratar datos personales (RUT, patrimonio y antecedentes). '
      + 'La base legal es su <strong>consentimiento</strong>, que es libre, informado, específico y <strong>revocable</strong>.</p>';
    wrap.appendChild(notice);

    const titFieldset = document.createElement('div');
    titFieldset.className = 'consent__titularidad';
    titFieldset.setAttribute('role', 'radiogroup');
    const titLegendId = 'consentTitLegend-' + categoria.id;
    titFieldset.setAttribute('aria-labelledby', titLegendId);
    const titLegend = document.createElement('h4');
    titLegend.className = 'consent__group-title';
    titLegend.id = titLegendId;
    titLegend.textContent = '¿De quién son los datos que vamos a consultar?';
    titFieldset.appendChild(titLegend);

    const opciones = [
      { v: 'titular', t: 'Son mis propios datos (soy el titular)' },
      { v: 'tercero', t: 'Son datos de otra persona (un tercero)' }
    ];
    opciones.forEach(function (o, idx) {
      const lbl = document.createElement('label');
      lbl.className = 'consent__radio';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'consentTitularidad-' + categoria.id;
      radio.value = o.v;
      if (idx === 0) radio.checked = true;
      const span = document.createElement('span');
      span.textContent = o.t;
      lbl.appendChild(radio);
      lbl.appendChild(span);
      titFieldset.appendChild(lbl);
    });
    wrap.appendChild(titFieldset);

    const terceroBox = document.createElement('div');
    terceroBox.className = 'consent__tercero';
    terceroBox.hidden = true;
    terceroBox.innerHTML =
      '<p class="consent__tercero-text">No podemos tratar datos de un tercero sin su autorización. '
      + 'Declare y acredite que esa persona lo autorizó expresamente.</p>';

    const terceroRut = document.createElement('div');
    terceroRut.className = 'field';
    const terceroRutLabel = document.createElement('label');
    terceroRutLabel.className = 'field__label';
    const terceroRutId = 'consentTerceroRut-' + categoria.id;
    terceroRutLabel.setAttribute('for', terceroRutId);
    terceroRutLabel.textContent = 'RUT de la persona que lo autorizó (titular de los datos)';
    const terceroRutInput = document.createElement('input');
    terceroRutInput.className = 'field__input';
    terceroRutInput.id = terceroRutId;
    terceroRutInput.type = 'text';
    terceroRutInput.placeholder = '12.345.678-9';
    terceroRutInput.maxLength = 12;
    terceroRut.appendChild(terceroRutLabel);
    terceroRut.appendChild(terceroRutInput);
    terceroBox.appendChild(terceroRut);

    const terceroCheckLabel = document.createElement('label');
    terceroCheckLabel.className = 'consent__check';
    const terceroCheck = document.createElement('input');
    terceroCheck.type = 'checkbox';
    terceroCheck.id = 'consentTerceroAuth-' + categoria.id;
    const terceroCheckSpan = document.createElement('span');
    terceroCheckSpan.innerHTML = 'Declaro, bajo mi responsabilidad, que cuento con la <strong>autorización expresa</strong> '
      + 'del titular de estos datos para consultarlos (art. 12, Ley 21.719).';
    terceroCheckLabel.appendChild(terceroCheck);
    terceroCheckLabel.appendChild(terceroCheckSpan);
    terceroBox.appendChild(terceroCheckLabel);
    wrap.appendChild(terceroBox);

    titFieldset.addEventListener('change', function () {
      const sel = titFieldset.querySelector('input[type="radio"]:checked');
      terceroBox.hidden = !(sel && sel.value === 'tercero');
    });

    const finWrap = document.createElement('div');
    finWrap.className = 'consent__finalidades';
    finWrap.setAttribute('role', 'group');
    const finLegendId = 'consentFinLegend-' + categoria.id;
    finWrap.setAttribute('aria-labelledby', finLegendId);
    const finLegend = document.createElement('h4');
    finLegend.className = 'consent__group-title';
    finLegend.id = finLegendId;
    finLegend.textContent = 'Autorizo el tratamiento de mis datos para:';
    finWrap.appendChild(finLegend);

    const checks = {};
    Compliance.FINALIDADES.forEach(function (f) {
      const lbl = document.createElement('label');
      lbl.className = 'consent__check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'consentFin-' + categoria.id + '-' + f.id;
      cb.dataset.finalidad = f.id;
      checks[f.id] = cb;
      const span = document.createElement('span');
      span.innerHTML = '<strong>' + f.label + '.</strong> <span class="consent__detalle">' + f.detalle + '</span>';
      lbl.appendChild(cb);
      lbl.appendChild(span);
      finWrap.appendChild(lbl);
    });
    wrap.appendChild(finWrap);

    function validate() {
      const selTit = titFieldset.querySelector('input[type="radio"]:checked');
      const titularidad = selTit ? selTit.value : 'titular';

      const finalidades = [];
      let faltaObligatoria = false;
      Compliance.FINALIDADES.forEach(function (f) {
        if (checks[f.id] && checks[f.id].checked) {
          finalidades.push(f.id);
        } else if (f.obligatoria) {
          faltaObligatoria = true;
        }
      });

      if (faltaObligatoria) {
        return { ok: false, error: 'Debe aceptar el consentimiento de uso, la búsqueda de datos y los términos del proveedor para continuar.' };
      }

      let tercero = null;
      if (titularidad === 'tercero') {
        const rutVal = terceroRutInput.value.trim();
        if (!terceroCheck.checked) {
          return { ok: false, error: 'Para consultar datos de un tercero debe declarar que cuenta con su autorización expresa.' };
        }
        if (!Security.validateRut(rutVal)) {
          return { ok: false, error: 'Ingrese un RUT válido del titular que lo autorizó.' };
        }
        tercero = {
          rut: Security.anonymizeRut(rutVal),
          token: Security.pseudonymize(rutVal),
          autorizacion_declarada: true
        };
      }

      return { ok: true, finalidades: finalidades, titularidad: titularidad, tercero: tercero };
    }

    return { node: wrap, validate: validate };
  }
};
