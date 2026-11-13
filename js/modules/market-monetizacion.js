// Demo: paywall de curiosidad, bifurcación de contacto y upsells (mock UI, sin cobro real).
const MarketMonetizacion = {
  STORAGE_INFORMES: 'servichile.demo.informes_mes',
  STORAGE_REBOTE: 'servichile.demo.rebote_vistas',
  PRECIO_INFORME: 19990,
  PRECIO_PACK: 24990,
  PRECIO_PLAN: 89990,
  PRECIO_SELLO: 29990,

  datosDemo(n) {
    const seed =
      typeof Market !== 'undefined' && Market.hashTexto
        ? Market.hashTexto(String(n.id || n.nombre || 'x'))
        : 42;
    const ciber = (38 + (seed % 12)) / 10;
    const legal = (22 + ((seed >> 3) % 18)) / 10;
    const contratos = (32 + ((seed >> 5) % 16)) / 10;
    const nota = Number(n.indice_transparencia != null ? n.indice_transparencia : 3.6).toFixed(1);
    const alertas = [
      {
        tipo: 'Legal',
        titulo:
          'Se detectó 1 demanda laboral y 1 deuda previsional en los últimos 12 meses.',
        detalle:
          'Deuda previsional estimada $2.480.000 · Tribunal Laboral de Santiago · Causa T-2025-' +
          String(1000 + (seed % 800)) +
          ' · Certificado descargable tras desbloqueo.'
      },
      {
        tipo: 'Técnica',
        titulo: 'Dominio con 14 credenciales filtradas y sin protección DMARC.',
        detalle:
          '14 correos @dominio en breach 2025 · DMARC ausente · SPF parcial · Ejemplo filtrado: operaciones@' +
          (String(n.nombre || 'empresa').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'pyme') +
          '.cl'
      }
    ];
    if ((seed % 3) === 0) {
      alertas.push({
        tipo: 'Contractual',
        titulo: 'Se identificó 1 multa administrativa vigente sin plan de remediación.',
        detalle:
          'Multa SII/DT mock $890.000 · Folio ADM-' +
          String(4000 + (seed % 500)) +
          ' · Documento PDF tras desbloqueo.'
      });
    }
    return {
      scores: {
        ciberseguridad: Math.min(5, Math.round(ciber * 10) / 10),
        legal: Math.min(5, Math.round(legal * 10) / 10),
        contratos: Math.min(5, Math.round(contratos * 10) / 10)
      },
      alertas,
      nota,
      alertasCount: alertas.length
    };
  },

  mesClave() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  },

  leerInformes() {
    try {
      const raw = JSON.parse(localStorage.getItem(MarketMonetizacion.STORAGE_INFORMES) || 'null');
      if (!raw || raw.mes !== MarketMonetizacion.mesClave()) {
        return { mes: MarketMonetizacion.mesClave(), count: 0, ids: [] };
      }
      return raw;
    } catch {
      return { mes: MarketMonetizacion.mesClave(), count: 0, ids: [] };
    }
  },

  registrarInforme(businessId) {
    const estado = MarketMonetizacion.leerInformes();
    if (estado.ids.indexOf(businessId) === -1) {
      estado.ids.push(businessId);
      estado.count += 1;
    }
    localStorage.setItem(MarketMonetizacion.STORAGE_INFORMES, JSON.stringify(estado));
    return estado;
  },

  registrarVistaRebote(n) {
    let mapa = {};
    try {
      mapa = JSON.parse(localStorage.getItem(MarketMonetizacion.STORAGE_REBOTE) || '{}') || {};
    } catch {
      mapa = {};
    }
    const id = String(n.id);
    const prev = mapa[id] || { vistas: 0, nombre: n.nombre };
    prev.vistas += 1;
    prev.nombre = n.nombre;
    prev.nota = Number(n.indice_transparencia != null ? n.indice_transparencia : 3.6).toFixed(1);
    prev.alertas = MarketMonetizacion.datosDemo(n).alertasCount;
    mapa[id] = prev;
    localStorage.setItem(MarketMonetizacion.STORAGE_REBOTE, JSON.stringify(mapa));
    return prev;
  },

  panel(n) {
    const demo = MarketMonetizacion.datosDemo(n);
    const wrap = document.createElement('aside');
    wrap.className = 'paywall';
    wrap.setAttribute('aria-label', 'Informe de riesgo (demo)');

    const titulo = document.createElement('h3');
    titulo.className = 'paywall__titulo';
    titulo.textContent = 'Radar de riesgo';

    const lead = document.createElement('p');
    lead.className = 'paywall__lead';
    lead.textContent =
      'Puntajes y alertas visibles. El detalle accionable se desbloquea con el informe.';

    const scores = document.createElement('div');
    scores.className = 'paywall__scores';
    [
      ['Ciberseguridad', demo.scores.ciberseguridad],
      ['Legal', demo.scores.legal],
      ['Contratos', demo.scores.contratos]
    ].forEach(([label, val]) => {
      const card = document.createElement('div');
      card.className = 'paywall__score';
      const k = document.createElement('span');
      k.textContent = label;
      const v = document.createElement('strong');
      v.textContent = Number(val).toFixed(1);
      card.append(k, v);
      scores.appendChild(card);
    });

    const alertas = document.createElement('ul');
    alertas.className = 'paywall__alertas';
    demo.alertas.forEach((a) => {
      const li = document.createElement('li');
      li.className = 'paywall__alerta';
      const t = document.createElement('strong');
      t.textContent = '⚠️ Alerta ' + a.tipo + ':';
      const p = document.createElement('span');
      p.textContent = ' ' + a.titulo;
      li.append(t, p);
      alertas.appendChild(li);
    });

    const unlock = document.createElement('button');
    unlock.type = 'button';
    unlock.className = 'paywall__unlock';
    unlock.textContent =
      '🔓 Desbloquear Informe Completo ($' +
      MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_INFORME) +
      ' CLP) — Entrega inmediata en PDF';
    unlock.addEventListener('click', () => MarketMonetizacion.comprarInforme(n, wrap, demo));

    const blur = document.createElement('div');
    blur.className = 'paywall__blur';
    blur.setAttribute('aria-hidden', 'true');
    const blurInner = document.createElement('div');
    blurInner.className = 'paywall__blur-inner';
    demo.alertas.forEach((a) => {
      const p = document.createElement('p');
      p.textContent = a.detalle;
      blurInner.appendChild(p);
    });
    const fake = document.createElement('p');
    fake.className = 'paywall__blur-extra';
    fake.textContent =
      'Anexo: montos, tribunales, causas, correos filtrados y certificados descargables.';
    blurInner.appendChild(fake);
    blur.appendChild(blurInner);

    const status = document.createElement('p');
    status.className = 'paywall__status status-text';
    status.setAttribute('role', 'status');

    wrap.append(titulo, lead, scores, alertas, unlock, blur, status);
    wrap._demo = demo;
    wrap._negocio = n;
    return wrap;
  },

  formatoClp(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  comprarInforme(n, panel, demo) {
    const estado = MarketMonetizacion.registrarInforme(n.id);
    const blur = panel.querySelector('.paywall__blur');
    const unlock = panel.querySelector('.paywall__unlock');
    const status = panel.querySelector('.paywall__status');
    if (blur) {
      blur.classList.add('paywall__blur--abierto');
      blur.removeAttribute('aria-hidden');
    }
    if (unlock) {
      unlock.disabled = true;
      unlock.textContent = 'Informe desbloqueado (demo)';
    }
    if (status) {
      status.textContent =
        'Demo: PDF de riesgo listo. En producción se cobraría $' +
        MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_INFORME) +
        ' CLP.';
    }
    MarketMonetizacion.mostrarRebote(n, demo);
    if (estado.count >= 2) {
      MarketMonetizacion.mostrarPlanRecurrente(estado);
    }
  },

  interceptarContacto(n, estadoEl) {
    MarketMonetizacion.abrirModalIntencion(n, estadoEl);
  },

  cerrarModal() {
    const el = document.getElementById('paywallModal');
    if (el) el.remove();
    document.body.classList.remove('paywall-modal-open');
  },

  abrirModalIntencion(n, estadoEl) {
    MarketMonetizacion.cerrarModal();
    const demo = MarketMonetizacion.datosDemo(n);
    const overlay = document.createElement('div');
    overlay.id = 'paywallModal';
    overlay.className = 'paywall-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'paywallModalTitulo');

    const dialog = document.createElement('div');
    dialog.className = 'paywall-modal__dialog';

    const head = document.createElement('div');
    head.className = 'paywall-modal__head';
    const h = document.createElement('h3');
    h.id = 'paywallModalTitulo';
    h.textContent = 'Antes de contactar a ' + n.nombre;
    const lead = document.createElement('p');
    lead.textContent = '3 preguntas rápidas (≈ 15 segundos). Demo sin cobro real.';
    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'paywall-modal__cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '×';
    cerrar.addEventListener('click', MarketMonetizacion.cerrarModal);
    head.append(h, lead, cerrar);

    const body = document.createElement('div');
    body.className = 'paywall-modal__body';
    body.id = 'paywallModalBody';

    const respuestas = { proposito: null, monto: null, plazo: null };

    function pintarPreguntas() {
      MarketMonetizacion.limpiar(body);
      body.appendChild(
        MarketMonetizacion.pregunta(
          '¿Para qué necesita contactar a esta empresa?',
          [
            { id: 'cotizar', label: 'Cotizar un proyecto / servicio' },
            { id: 'proveedor', label: 'Evaluarla como proveedor fijo' },
            { id: 'licitacion', label: 'Licitación formal' }
          ],
          (id) => {
            respuestas.proposito = id;
            pintarMonto();
          }
        )
      );
    }

    function pintarMonto() {
      MarketMonetizacion.limpiar(body);
      body.appendChild(
        MarketMonetizacion.pregunta(
          '¿Cuál es el monto aproximado de la operación?',
          [
            { id: 'bajo', label: 'Menos de $1.000.000' },
            { id: 'medio', label: 'Entre $1.000.000 y $5.000.000' },
            { id: 'alto', label: 'Más de $5.000.000' }
          ],
          (id) => {
            respuestas.monto = id;
            pintarPlazo();
          }
        )
      );
    }

    function pintarPlazo() {
      MarketMonetizacion.limpiar(body);
      body.appendChild(
        MarketMonetizacion.pregunta(
          '¿Cuándo planea cerrar este trato?',
          [
            { id: 'semana', label: 'Esta semana (Presupuesto aprobado)' },
            { id: 'mes', label: 'Este mes (En evaluación)' },
            { id: 'cotizando', label: 'Solo cotizando' }
          ],
          (id) => {
            respuestas.plazo = id;
            const caliente =
              (respuestas.monto === 'medio' || respuestas.monto === 'alto') &&
              respuestas.plazo === 'semana';
            if (caliente) {
              MarketMonetizacion.pintarEscenarioA(body, n, demo, estadoEl);
            } else {
              MarketMonetizacion.pintarEscenarioB(body, n, demo, estadoEl);
            }
          }
        )
      );
    }

    pintarPreguntas();
    dialog.append(head, body);
    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) MarketMonetizacion.cerrarModal();
    });
    document.body.classList.add('paywall-modal-open');
    document.body.appendChild(overlay);
  },

  pregunta(titulo, opciones, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'paywall-q';
    const h = document.createElement('p');
    h.className = 'paywall-q__titulo';
    h.textContent = titulo;
    const lista = document.createElement('div');
    lista.className = 'paywall-q__opciones';
    opciones.forEach((op) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'paywall-q__btn';
      btn.textContent = op.label;
      btn.addEventListener('click', () => onPick(op.id));
      lista.appendChild(btn);
    });
    wrap.append(h, lista);
    return wrap;
  },

  pintarEscenarioA(body, n, demo, estadoEl) {
    MarketMonetizacion.limpiar(body);
    const wrap = document.createElement('div');
    wrap.className = 'paywall-cierre paywall-cierre--caliente';

    const aviso = document.createElement('p');
    aviso.className = 'paywall-cierre__aviso';
    aviso.textContent =
      'Va a comprometer más de $1.000.000 con ' +
      n.nombre +
      '. Actualmente tiene ' +
      demo.alertasCount +
      ' alertas sin verificar. Asegure su operación antes de transferir:';

    const principal = document.createElement('button');
    principal.type = 'button';
    principal.className = 'paywall-cierre__principal';
    principal.textContent =
      'Descargar Informe de Riesgo + Contrato Tipo Protegido ($' +
      MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_PACK) +
      ' CLP)';
    principal.addEventListener('click', () => {
      const estado = MarketMonetizacion.registrarInforme(n.id);
      MarketMonetizacion.mostrarRebote(n, demo);
      MarketMonetizacion.toast(
        'Demo: pack riesgo + contrato listo. En producción $' +
          MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_PACK) +
          ' CLP.'
      );
      if (estadoEl) {
        estadoEl.textContent = 'Pack de riesgo comprado (demo).';
      }
      MarketMonetizacion.cerrarModal();
      if (estado.count >= 2) MarketMonetizacion.mostrarPlanRecurrente(estado);
      MarketMonetizacion.revelarPaywallSiVisible();
    });

    const secundario = document.createElement('button');
    secundario.type = 'button';
    secundario.className = 'paywall-cierre__secundario';
    secundario.textContent =
      'Que un especialista gestione y audite esta contratación por mí (Gratis para usted — comisión al proveedor)';
    secundario.addEventListener('click', () => {
      MarketMonetizacion.mostrarRebote(n, demo);
      MarketMonetizacion.toast(
        'Demo: un especialista sería asignado. El proveedor asume la comisión.'
      );
      if (estadoEl) estadoEl.textContent = 'Solicitud de auditoría enviada (demo).';
      MarketMonetizacion.cerrarModal();
    });

    const escape = document.createElement('button');
    escape.type = 'button';
    escape.className = 'paywall-cierre__escape';
    escape.textContent = 'Continuar a WhatsApp sin verificar (bajo su propio riesgo)';
    escape.addEventListener('click', () => {
      MarketMonetizacion.abrirWhatsApp(n, demo, estadoEl, true);
    });

    wrap.append(aviso, principal, secundario, escape);
    body.appendChild(wrap);
  },

  pintarEscenarioB(body, n, demo, estadoEl) {
    MarketMonetizacion.limpiar(body);
    const wrap = document.createElement('div');
    wrap.className = 'paywall-cierre paywall-cierre--frio';

    const aviso = document.createElement('p');
    aviso.className = 'paywall-cierre__aviso';
    aviso.textContent =
      'Ingrese su correo de empresa para enviarle una copia del resumen y abrir el chat directo por WhatsApp.';

    const field = document.createElement('div');
    field.className = 'field';
    const lab = document.createElement('label');
    lab.className = 'field__label';
    lab.htmlFor = 'paywallCorreo';
    lab.textContent = 'Correo corporativo';
    const input = document.createElement('input');
    input.id = 'paywallCorreo';
    input.className = 'field__input';
    input.type = 'email';
    input.placeholder = 'nombre@suempresa.cl';
    input.autocomplete = 'email';
    field.append(lab, input);

    const enviar = document.createElement('button');
    enviar.type = 'button';
    enviar.className = 'paywall-cierre__principal';
    enviar.textContent = 'Enviar resumen y abrir WhatsApp';
    enviar.addEventListener('click', () => {
      const correo = (input.value || '').trim();
      if (!correo || correo.indexOf('@') < 1) {
        MarketMonetizacion.toast('Ingrese un correo corporativo válido.');
        input.focus();
        return;
      }
      MarketMonetizacion.toast(
        'Demo: resumen enviado a ' + correo + '. Captura B2B para suscripción mensual.'
      );
      MarketMonetizacion.abrirWhatsApp(n, demo, estadoEl, false);
    });

    wrap.append(aviso, field, enviar);
    body.appendChild(wrap);
  },

  abrirWhatsApp(n, demo, estadoEl, riesgo) {
    MarketMonetizacion.mostrarRebote(n, demo);
    const nota = demo.nota;
    const msg =
      'Hola ' +
      n.nombre +
      ', te contacto desde ServiChile (Nota: ' +
      nota +
      ' ⭐). Quisiera cotizar / evaluar su servicio.';
    const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (estadoEl) {
      estadoEl.textContent = riesgo
        ? 'WhatsApp abierto sin verificar (demo).'
        : 'WhatsApp abierto con firma ServiChile (demo).';
    }
    MarketMonetizacion.cerrarModal();
  },

  revelarPaywallSiVisible() {
    const panel = document.querySelector('.paywall');
    if (!panel) return;
    const blur = panel.querySelector('.paywall__blur');
    const unlock = panel.querySelector('.paywall__unlock');
    if (blur) blur.classList.add('paywall__blur--abierto');
    if (unlock) {
      unlock.disabled = true;
      unlock.textContent = 'Informe desbloqueado (demo)';
    }
  },

  mostrarRebote(n, demo) {
    const vista = MarketMonetizacion.registrarVistaRebote(n);
    const total = Math.max(3, vista.vistas);
    MarketMonetizacion.toast(
      'Rebote (demo) al titular de ' +
        n.nombre +
        ': «' +
        total +
        ' empresas revisaron el perfil esta semana (Nota actual: ' +
        (vista.nota || demo.nota) +
        ' ⭐). Reclama gratis o activa Sello Verificado ($' +
        MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_SELLO) +
        '/mes).»'
    );
  },

  mostrarPlanRecurrente(estado) {
    const gastado = estado.count * MarketMonetizacion.PRECIO_INFORME;
    MarketMonetizacion.abrirBanner(
      'Ya lleva $' +
        MarketMonetizacion.formatoClp(gastado) +
        ' gastados en informes individuales este mes. Pásese al Plan Empresas ($' +
        MarketMonetizacion.formatoClp(MarketMonetizacion.PRECIO_PLAN) +
        '/mes) y obtenga informes ilimitados + alertas automáticas si un proveedor recibe demanda o multa.',
      'Activar Plan Empresas (demo)'
    );
  },

  abrirBanner(texto, ctaLabel) {
    let banner = document.getElementById('paywallBanner');
    if (banner) banner.remove();
    banner = document.createElement('div');
    banner.id = 'paywallBanner';
    banner.className = 'paywall-banner';
    banner.setAttribute('role', 'status');
    const p = document.createElement('p');
    p.textContent = texto;
    const acciones = document.createElement('div');
    acciones.className = 'paywall-banner__acciones';
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'paywall-banner__cta';
    cta.textContent = ctaLabel;
    cta.addEventListener('click', () => {
      MarketMonetizacion.toast('Demo: Plan Empresas activado. Sin cobro real.');
      banner.remove();
    });
    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'paywall-banner__cerrar';
    cerrar.textContent = 'Ahora no';
    cerrar.addEventListener('click', () => banner.remove());
    acciones.append(cta, cerrar);
    banner.append(p, acciones);
    document.body.appendChild(banner);
  },

  toast(msg) {
    let el = document.getElementById('paywallToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'paywallToast';
      el.className = 'paywall-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(MarketMonetizacion._toastTimer);
    MarketMonetizacion._toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 7000);
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
