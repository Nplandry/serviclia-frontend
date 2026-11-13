// Motor polimórfico de tipo de cuenta.
// Una Base (plantilla) + estrategias registradas. UI y onboarding solo preguntan a la estrategia.
const ProgresoCuenta = {
  REGISTRO: Object.create(null),

  ESTADOS_PASAPORTE: Object.freeze({
    basico: 'Básico',
    pendiente: 'En revisión',
    verificado: 'Verificado',
    rechazado: 'Rechazado'
  }),

  registrar(tipo, mezcla) {
    const proto = Object.create(ProgresoCuenta.Base);
    const features = Object.assign(
      Object.create(null),
      ProgresoCuenta.Base.FEATURES,
      mezcla.FEATURES || {}
    );
    const inst = Object.assign(proto, mezcla, {
      tipo,
      FEATURES: Object.freeze(features)
    });
    if (Array.isArray(inst.DOCS)) inst.DOCS = Object.freeze(inst.DOCS.slice());
    ProgresoCuenta.REGISTRO[tipo] = inst;
    return inst;
  },

  normalizar(tipo) {
    return tipo === 'empresa' ? 'empresa' : 'persona';
  },

  tipoDe(src) {
    if (!src || typeof src !== 'object') return 'persona';
    const raw = src.tipo_cuenta || (src.perfil && src.perfil.tipo_cuenta) || null;
    return ProgresoCuenta.normalizar(raw);
  },

  de(tipo) {
    const clave = ProgresoCuenta.normalizar(tipo);
    return ProgresoCuenta.REGISTRO[clave] || ProgresoCuenta.REGISTRO.persona;
  },

  para(src) {
    return ProgresoCuenta.de(ProgresoCuenta.tipoDe(src));
  },

  actual() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    return ProgresoCuenta.para(user);
  },

  esEmpresa(src) {
    if (src == null) return ProgresoCuenta.actual().es('empresa');
    if (src && typeof src.es === 'function' && src.tipo) return src.es('empresa');
    return ProgresoCuenta.para(src).es('empresa');
  },

  etiquetaTipo(tipoOSrc) {
    if (typeof tipoOSrc === 'string') return ProgresoCuenta.de(tipoOSrc).etiquetaCorta();
    return ProgresoCuenta.para(tipoOSrc).etiquetaCorta();
  },

  // ---------- Base: contrato + DOM compartido + plantilla de filas ----------
  Base: {
    tipo: 'persona',
    FEATURES: Object.freeze({}),
    DOCS: Object.freeze([]),

    es(tipo) {
      return this.tipo === tipo;
    },

    soporta(feature) {
      return !!this.FEATURES[feature];
    },

    etiquetaCorta() {
      return 'Cuenta';
    },

    etiquetaMenu() {
      return this.etiquetaVista();
    },

    etiquetaVista() {
      return 'Progreso';
    },

    labelNombre() {
      return 'Nombre';
    },

    placeholderNombre() {
      return 'Tu nombre';
    },

    tituloNombreOnboarding() {
      return '¿Cómo te llamas?';
    },

    textoNombreOnboarding() {
      return 'Usaremos tu nombre para acompañarte mejor.';
    },

    textoLeadQr() {
      return '';
    },

    tituloDocumentos() {
      return 'Subir documentos';
    },

    notaDocumentos() {
      return 'Zero-Retention (mock): el archivo no se guarda; solo desbloquea la verificación.';
    },

    tiposDocumento() {
      return this.DOCS;
    },

    idsDocumento() {
      const docs = this.tiposDocumento();
      const out = [];
      for (let i = 0; i < docs.length; i++) out.push(docs[i][0]);
      return out;
    },

    snapshot() {
      return {
        tipo: this.tipo,
        titulo: 'Progreso',
        aria: 'Progreso de la cuenta',
        detalleIzq: '',
        detalleDer: '',
        meta: '',
        valor: '0%',
        pct: 0,
        cta: 'Ver detalle →',
        extras: {}
      };
    },

    etiquetaNivel(nivel) {
      const n = Number(nivel) || 1;
      const nombres = {
        1: 'Identidad',
        2: 'Cumplimiento',
        3: 'Identidad reforzada'
      };
      return nombres[n] || 'Identidad';
    },

    // Plantilla: cabecera + cuerpo tipado (perfil | qr).
    filasEstado(ctx) {
      const c = this._ctx(ctx);
      const filas = this.filasCabecera(c);
      const cuerpo = c.origen === 'qr' ? this.filasQr(c) : this.filasPerfil(c);
      this._push(filas, cuerpo);
      return filas;
    },

    filasCabecera() {
      return [['Tipo de cuenta', this.etiquetaCorta()]];
    },

    filasPerfil() {
      return [];
    },

    filasQr() {
      return [];
    },

    seccionesVista() {
      return [];
    },

    montarContenido(raiz) {
      if (!raiz) return;
      const frag = document.createDocumentFragment();
      const secs = this.seccionesVista();
      for (let i = 0; i < secs.length; i++) {
        const factory = secs[i];
        if (typeof factory !== 'function') continue;
        const nodo = factory();
        if (nodo) frag.appendChild(nodo);
      }
      raiz.appendChild(frag);
    },

    montarIndicador(contenedor, opts) {
      if (!contenedor) return null;
      this.limpiar(contenedor);
      contenedor.appendChild(this.crearIndicador(opts || {}));
      return contenedor.firstChild;
    },

    crearIndicador(opts) {
      const opciones = opts || {};
      const snap = this.snapshot();
      const card = this.el(
        'section',
        'confianza-indicador' + (opciones.onAbrir ? ' confianza-indicador--accion' : '')
      );
      card.setAttribute('aria-label', snap.aria);

      // Arriba: métricas · centro: barra · abajo: título + CTA.
      const arriba = this.el('div', 'confianza-indicador__fila confianza-indicador__fila--arriba');
      arriba.appendChild(
        this.el('p', 'confianza-indicador__izq', snap.detalleIzq || snap.meta || '')
      );
      arriba.appendChild(
        this.el('p', 'confianza-indicador__der', snap.detalleDer || snap.valor || '')
      );
      card.appendChild(arriba);

      const track = this.el('div', 'confianza-indicador__track');
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(snap.pct));
      track.setAttribute('aria-label', snap.aria);
      const fill = this.el('div', 'confianza-indicador__fill');
      fill.style.width = snap.pct + '%';
      track.appendChild(fill);
      card.appendChild(track);

      const abajo = this.el('div', 'confianza-indicador__fila confianza-indicador__fila--abajo');
      abajo.appendChild(this.el('h3', 'confianza-indicador__titulo', snap.titulo));

      const cta = this.el(
        opciones.onAbrir && opciones.ctaAsButton ? 'button' : 'span',
        'confianza-indicador__cta',
        snap.cta
      );
      if (opciones.onAbrir && opciones.ctaAsButton) {
        cta.type = 'button';
        cta.addEventListener('click', opciones.onAbrir);
      }
      abajo.appendChild(cta);
      card.appendChild(abajo);

      if (typeof opciones.onAbrir === 'function') {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        const abrir = (e) => {
          if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
          if (opciones.ctaAsButton && e.target === cta) return;
          e.preventDefault();
          opciones.onAbrir();
        };
        card.addEventListener('click', abrir);
        card.addEventListener('keydown', abrir);
      }

      return card;
    },

    // --- helpers de filas ---
    filaTitular(c) {
      return ['Titular', (c.datos && c.datos.nombre) || '—'];
    },

    filaCorreo(c) {
      if (!(c.propio && c.datos && c.datos.email)) return null;
      return ['Correo', c.datos.email];
    },

    filaEstado(src) {
      return ['Estado', this.etiquetaEstadoPasaporte(src && src.estado_pasaporte)];
    },

    filaRut(src) {
      return ['RUT', src && src.rut_verificado ? 'Verificado' : 'Sin verificar'];
    },

    filaXp(src) {
      const xp = src && src.xp != null ? src.xp : 0;
      const nivel = (src && src.nivel_xp) || 1;
      return ['XP', xp + ' · Nivel ' + nivel];
    },

    filaNivelPasaporte(src) {
      return ['Nivel pasaporte', 'Nivel ' + ((src && src.nivel_pasaporte) || 1)];
    },

    filaConfiabilidad(src) {
      const score = src && src.score_confiabilidad;
      return [
        'Confiabilidad',
        score == null ? 'Sin reservas cerradas' : score + ' / 100'
      ];
    },

    // --- util ---
    _ctx(ctx) {
      const c = ctx || {};
      const perfil = c.perfil || {};
      return {
        origen: c.origen || 'perfil',
        perfil,
        datos: c.datos || perfil,
        propio: !!c.propio
      };
    },

    _push(destino, filas) {
      if (!filas || !filas.length) return destino;
      for (let i = 0; i < filas.length; i++) {
        if (filas[i]) destino.push(filas[i]);
      }
      return destino;
    },

    el(tag, className, text) {
      const n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null) n.textContent = text;
      return n;
    },

    limpiar(el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    },

    formatoIndice(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return '—';
      return v.toFixed(1) + ' / 10';
    },

    etiquetaEstadoPasaporte(estado) {
      return ProgresoCuenta.ESTADOS_PASAPORTE[estado] || 'Básico';
    },

    _sc() {
      return typeof SubirConfianza !== 'undefined' ? SubirConfianza : null;
    }
  }
};

// --- Persona: XP, niveles, requisitos, edad ---
ProgresoCuenta.registrar('persona', {
  FEATURES: Object.freeze({
    edad: true,
    xp: true,
    niveles: true,
    biometria: true,
    pasaporte: true
  }),

  DOCS: [
    ['cedula', 'Cédula de identidad (Nivel 1)'],
    ['antecedentes', 'Certificado de antecedentes (Nivel 3)'],
    ['aval', 'Aval o garantía de respaldo (Nivel 3)']
  ],

  etiquetaCorta() {
    return 'Persona';
  },

  etiquetaMenu() {
    return 'Verificación';
  },

  etiquetaVista() {
    return 'Verificación';
  },

  textoLeadQr() {
    return '';
  },

  textoNombreOnboarding() {
    return 'Aparecerá en su carnet QR al validar visitas o entregas.';
  },

  snapshot() {
    const sc = this._sc();
    if (sc) sc.cargar();
    const hechas = sc ? sc.tareasHechas() : 0;
    const total = sc ? sc.totalTareas() : 0;
    const pct = sc ? sc.progresoPct() : 0;
    const xp = sc ? sc.xpActual() : 0;
    const nivel = sc ? sc.nivelXp() : 1;
    const nombreNivel = this.etiquetaNivel(nivel);
    const detalleIzq = hechas + ' de ' + total + ' requisitos';
    const detalleDer = 'Nivel ' + nivel + ' · ' + nombreNivel;
    return {
      tipo: this.tipo,
      titulo: 'Su verificación',
      aria: 'Progreso de verificación',
      detalleIzq,
      detalleDer,
      meta: detalleIzq + ' · ' + detalleDer,
      valor: pct + '%',
      pct,
      cta: 'Ver qué desbloquea →',
      extras: { hechas, total, xp, nivel, nombreNivel }
    };
  },

  filasPerfil(c) {
    return [
      this.filaNivelPasaporte(c.perfil),
      this.filaXp(c.perfil),
      this.filaEstado(c.perfil),
      this.filaConfiabilidad(c.perfil)
    ];
  },

  filasQr(c) {
    return [
      this.filaTitular(c),
      this.filaCorreo(c),
      this.filaNivelPasaporte(c.datos),
      this.filaXp(c.datos),
      this.filaEstado(c.datos),
      this.filaConfiabilidad(c.datos),
      this.filaRut(c.datos)
    ];
  },

  seccionesVista() {
    const sc = this._sc();
    if (!sc) return [];
    return [
      () => sc.bloqueIndicador(),
      () => sc.bloqueChecklist(),
      () => sc.bloqueDocumentos(),
      () => sc.bloqueBiometria(),
      () => sc.bloqueTablaNiveles()
    ];
  }
});

// --- Empresa: índice y docs legales (sin niveles XP) ---
ProgresoCuenta.registrar('empresa', {
  FEATURES: Object.freeze({
    indice: true,
    docsLegales: true
  }),

  DOCS: [
    ['constitucion', 'Constitución de la sociedad'],
    ['patente', 'Patente municipal'],
    ['inicio_actividades', 'Inicio de actividades (SII)'],
    ['poder_representante', 'Poder del representante legal']
  ],

  etiquetaCorta() {
    return 'Empresa';
  },

  etiquetaMenu() {
    return 'Verificación empresa';
  },

  etiquetaVista() {
    return 'Verificación empresa';
  },

  labelNombre() {
    return 'Empresa';
  },

  placeholderNombre() {
    return 'Nombre de la empresa';
  },

  tituloNombreOnboarding() {
    return '¿Cuál es el nombre de la empresa?';
  },

  textoNombreOnboarding() {
    return 'Razón social o nombre comercial. Aparecerá en su ficha y reportes.';
  },

  textoLeadQr() {
    return '';
  },

  tituloDocumentos() {
    return 'Documentos para publicar con transparencia';
  },

  notaDocumentos() {
    return 'Zero-Retention (mock): constitución, patente e inicio de actividades alimentan el índice. El archivo no se guarda.';
  },

  // Cálculo del índice local (mock) vive en la estrategia, no en callers.
  calcularFicha() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const sc = this._sc();
    const perfil = (user && user.perfil) || (sc && sc.perfil()) || {};
    const ids = this.idsDocumento();
    let cargados = 0;
    if (sc) {
      for (let i = 0; i < ids.length; i++) {
        if (sc.tieneDoc(ids[i])) cargados += 1;
      }
    }
    const verificado = cargados >= 2 || !!perfil.rut_verificado;
    const base = 4.2 + cargados * 1.1 + (perfil.rut_verificado ? 0.8 : 0);
    const indice = Math.max(1, Math.min(9.8, Math.round(base * 10) / 10));
    return {
      id: 'empresa:' + ((user && user.email) || 'local'),
      nombre: (user && user.nombre) || 'Mi empresa',
      indice_transparencia: indice,
      is_verified_profile: verificado,
      _docsCargados: cargados,
      _verificado: verificado
    };
  },

  snapshot() {
    const sc = this._sc();
    if (sc) sc.cargar();
    const ficha = this.calcularFicha();
    const indice = Number(ficha.indice_transparencia) || 0;
    const docs = ficha._docsCargados || 0;
    const totalDocs = this.idsDocumento().length || 4;
    const pct = Math.round((indice / 10) * 100);
    const titularidad = ficha._verificado ? 'Titularidad en progreso' : 'Sin reclamo completo';
    const detalleIzq = docs + ' de ' + totalDocs + ' documentos legales';
    const detalleDer = 'Índice: ' + this.formatoIndice(indice);
    return {
      tipo: this.tipo,
      titulo: 'Transparencia para publicar',
      aria: 'Índice de transparencia de la empresa',
      detalleIzq,
      detalleDer,
      meta: detalleIzq + ' · ' + titularidad,
      valor: this.formatoIndice(indice),
      pct,
      cta: 'Ver transparencia →',
      extras: { indice, docs, totalDocs, verificado: !!ficha._verificado, ficha }
    };
  },

  filasPerfil(c) {
    const indiceTxt = this.formatoIndice(this.calcularFicha().indice_transparencia);
    return [
      ['Pasaporte', 'No aplica (empresa)'],
      ['Índice', indiceTxt],
      this.filaEstado(c.perfil),
      this.filaRut(c.perfil)
    ];
  },

  filasQr(c) {
    const indiceTxt = this.formatoIndice(this.calcularFicha().indice_transparencia);
    return [
      this.filaTitular(c),
      this.filaCorreo(c),
      ['Índice', indiceTxt],
      this.filaEstado(c.datos),
      this.filaRut(c.datos)
    ];
  },

  seccionesVista() {
    const sc = this._sc();
    if (!sc) return [];
    return [
      () => sc.bloqueIndicador(),
      () => sc.bloqueDesgloseEmpresa(),
      () => sc.bloqueDocumentos()
    ];
  }
});
