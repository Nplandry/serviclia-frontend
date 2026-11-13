// Página mock "Subir Confianza": la lista no se marca a mano; se desbloquea al hacer la acción.
const SubirConfianza = {
  STORAGE_KEY: 'servichile.subirConfianza.mock',
  carruselIdx: 0,
  tablaAbierta: false,

  NIVELES: [
    {
      id: 1,
      titulo: 'Nivel 1 · Identidad',
      evalua: 'Que la persona sea real, accesible y localizable',
      requisito: 'Cuenta activa, identidad verificada y datos de contacto con mayoría de edad.',
      usos: 'Primeros contactos, QR de reporte y encuentros iniciales con baja fricción.',
      discriminatorio: false,
      discriminatorioNota: 'NO — base para cualquier trato',
      tareas: [
        {
          id: 'n1-registro',
          label: 'Crear cuenta e iniciar sesión',
          como: 'Se completa al registrarse y mantener una sesión activa en la plataforma.'
        },
        {
          id: 'n1-cedula',
          label: 'Verificar su identidad',
          como: 'Se completa al verificar el RUT en el perfil o al cargar la cédula de identidad.'
        },
        {
          id: 'n1-perfil',
          label: 'Completar teléfono y edad',
          como: 'Se completa al guardar un teléfono móvil y declarar edad de 18 años o más.'
        }
      ]
    },
    {
      id: 2,
      titulo: 'Nivel 2 · Cumplimiento',
      evalua: 'Que cumpla lo que agenda y mantenga buen historial',
      requisito: 'Al menos un encuentro cerrado, reputación alta y pocas inasistencias.',
      usos: 'Visitas, entregas y tratos recurrentes con respaldo de comportamiento.',
      discriminatorio: false,
      discriminatorioNota: 'NO — se gana cumpliendo encuentros',
      tareas: [
        {
          id: 'n2-asistencias',
          label: 'Completar al menos un encuentro',
          como: 'Se completa cuando existe al menos una visita, turno o entrega cerrada con éxito.'
        },
        {
          id: 'n2-puntualidad',
          label: 'Mantener buena reputación',
          como: 'Se completa cuando el puntaje de confiabilidad alcanza 85% o más.'
        },
        {
          id: 'n2-noshow',
          label: 'Mantener pocas inasistencias',
          como: 'Se completa cuando la tasa de cancelaciones o inasistencias se mantiene bajo 15%.'
        }
      ]
    },
    {
      id: 3,
      titulo: 'Nivel 3 · Identidad reforzada',
      evalua: 'Mayor certeza para tratos de alto valor',
      requisito: 'Antecedentes, verificación facial y un aval o garantía.',
      usos: 'Contratos sensibles, entregas de alto valor y menor riesgo para ambas partes.',
      discriminatorio: false,
      discriminatorioNota: 'NO — refuerza identidad, no mide plata',
      tareas: [
        {
          id: 'n3-antecedentes',
          label: 'Presentar certificado de antecedentes',
          como: 'Se completa al cargar el certificado de antecedentes o un certificado comercial equivalente.'
        },
        {
          id: 'n3-biometria',
          label: 'Confirmar identidad con foto',
          como: 'Se completa al aprobar la verificación facial en vivo; la foto no se almacena.'
        },
        {
          id: 'n3-aval',
          label: 'Registrar un aval o garantía',
          como: 'Se completa al cargar un aval, garantía o documento de respaldo.'
        }
      ]
    }
  ],

  state: {
    docs: [],
    biometriaOk: false
  },

  init() {
    SubirConfianza.cargar();
    const raiz = document.getElementById('subirConfianzaRaiz');
    if (!raiz) return;
    SubirConfianza.render(raiz);
  },

  // Clave por usuario: evita que biometría/docs de otra cuenta queden “hechos”.
  storageKey() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const quien = user && user.email ? String(user.email).toLowerCase() : 'anon';
    return SubirConfianza.STORAGE_KEY + ':' + quien;
  },

  cargar() {
    // Limpia el mock global antiguo (sin email) que marcaba biometría a todos.
    try {
      localStorage.removeItem(SubirConfianza.STORAGE_KEY);
    } catch {}
    try {
      const raw = localStorage.getItem(SubirConfianza.storageKey());
      if (!raw) {
        SubirConfianza.state = { docs: [], biometriaOk: false };
      } else {
        const parsed = JSON.parse(raw);
        SubirConfianza.state.docs = Array.isArray(parsed.docs) ? parsed.docs : [];
        SubirConfianza.state.biometriaOk = false;
      }
    } catch {
      SubirConfianza.state = { docs: [], biometriaOk: false };
    }
    SubirConfianza.sincronizarBiometria();
  },

  // La API es la fuente de verdad: biometria_verificada en usuarios.
  sincronizarBiometria() {
    const serverOk = !!SubirConfianza.perfil().biometria_verificada;
    SubirConfianza.state.biometriaOk = serverOk;
    SubirConfianza.guardar();
  },

  guardar() {
    try {
      localStorage.setItem(
        SubirConfianza.storageKey(),
        JSON.stringify({
          docs: SubirConfianza.state.docs
          // biometriaOk no se persiste: siempre se lee del servidor.
        })
      );
    } catch {}
  },

  perfil() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    return (user && user.perfil) || {};
  },

  esEmpresa() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.actual().es('empresa')
      : SubirConfianza.perfil().tipo_cuenta === 'empresa';
  },

  biometriaHecha() {
    return !!SubirConfianza.perfil().biometria_verificada;
  },

  // Documentos tipados: la estrategia persona/empresa es la fuente.
  tiposDocumento() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.actual().tiposDocumento()
      : [];
  },

  // Ficha índice: delega a la estrategia empresa.
  fichaEmpresaMock() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.de('empresa').calcularFicha()
      : { indice_transparencia: 4.2, _docsCargados: 0, _verificado: false, nombre: 'Mi empresa' };
  },

  tieneDoc(tipo) {
    return SubirConfianza.state.docs.some(d => d.tipo === tipo);
  },

  scoreConfiabilidad() {
    const score = SubirConfianza.perfil().score_confiabilidad;
    if (score == null || score === '') return null;
    const n = Number(score);
    return Number.isFinite(n) ? n : null;
  },

  // Derivada del score: tasa_no_shows ≈ 100 − score_confiabilidad.
  tasaNoShows() {
    const score = SubirConfianza.scoreConfiabilidad();
    if (score == null) return null;
    return Math.round((100 - score) * 10) / 10;
  },

  edadNumerica() {
    const n = Number(SubirConfianza.perfil().edad);
    return Number.isFinite(n) ? n : null;
  },

  telefonoOk() {
    const tel = SubirConfianza.perfil().telefono;
    return !!(tel && String(tel).trim());
  },

  // Solo acciones reales (o mock de esas acciones) desbloquean. Sin toggle manual.
  estaHecha(tareaId) {
    return SubirConfianza.estadoPunto(tareaId) === 'ok';
  },

  // Verde = listo, naranjo = en progreso, gris = pendiente.
  estadoPunto(tareaId) {
    const perfil = SubirConfianza.perfil();
    const score = SubirConfianza.scoreConfiabilidad();
    const tasa = SubirConfianza.tasaNoShows();

    switch (tareaId) {
      case 'n1-registro':
        return typeof Auth !== 'undefined' && Auth.isAuthenticated() ? 'ok' : 'pendiente';
      case 'n1-cedula':
        if (perfil.rut_verificado || SubirConfianza.tieneDoc('cedula')) return 'ok';
        return 'pendiente';
      case 'n1-perfil': {
        const edad = SubirConfianza.edadNumerica();
        const edadOk = edad != null && edad >= 18;
        const telOk = SubirConfianza.telefonoOk();
        if (edadOk && telOk) return 'ok';
        if (edad != null || telOk) return 'progreso';
        return 'pendiente';
      }
      case 'n2-asistencias':
        // interactions_count >= 1: hay score solo si hay reservas cerradas.
        return score != null ? 'ok' : 'pendiente';
      case 'n2-puntualidad':
        if (score != null && score >= 85) return 'ok';
        if (score != null) return 'progreso';
        return 'pendiente';
      case 'n2-noshow':
        if (tasa != null && tasa < 15) return 'ok';
        if (tasa != null) return 'progreso';
        return 'pendiente';
      case 'n3-antecedentes':
        return SubirConfianza.tieneDoc('antecedentes') ? 'ok' : 'pendiente';
      case 'n3-biometria':
        return SubirConfianza.biometriaHecha() ? 'ok' : 'pendiente';
      case 'n3-aval':
        return SubirConfianza.tieneDoc('aval') ? 'ok' : 'pendiente';
      default:
        return 'pendiente';
    }
  },

  etiquetaPunto(estado) {
    if (estado === 'ok') return 'Cumplido';
    if (estado === 'progreso') return 'En progreso';
    return 'Pendiente';
  },

  // Texto corto con el porqué del color (métrica o acción faltante).
  detallePunto(tareaId) {
    const perfil = SubirConfianza.perfil();
    const score = SubirConfianza.scoreConfiabilidad();
    const tasa = SubirConfianza.tasaNoShows();
    const estado = SubirConfianza.estadoPunto(tareaId);

    switch (tareaId) {
      case 'n1-registro':
        return estado === 'ok'
          ? 'Cuenta activa e inició sesión correctamente.'
          : 'Debe crear una cuenta e iniciar sesión.';
      case 'n1-cedula':
        if (perfil.rut_verificado) return 'Identidad verificada con RUT.';
        if (SubirConfianza.tieneDoc('cedula')) return 'Cédula cargada correctamente.';
        return 'Falta verificar el RUT o cargar la cédula.';
      case 'n1-perfil': {
        const edad = SubirConfianza.edadNumerica();
        const telOk = SubirConfianza.telefonoOk();
        const edadOk = edad != null && edad >= 18;
        if (edadOk && telOk) return 'Teléfono y mayoría de edad completados.';
        if (edad != null && edad < 18) return 'Debe declarar 18 años o más.';
        if (edadOk) return 'Edad completa. Falta el teléfono móvil.';
        if (telOk) return 'Teléfono completo. Falta declarar la edad.';
        return 'Complete el teléfono móvil y la edad (18 o más).';
      }
      case 'n2-asistencias':
        return estado === 'ok'
          ? 'Ya registra al menos un encuentro cerrado.'
          : 'Aún no hay visitas, turnos o entregas cerradas.';
      case 'n2-puntualidad':
        if (score == null) return 'Sin puntaje aún: se calcula con su historial.';
        if (score >= 85) return 'Puntaje de confiabilidad ' + score + '% (meta 85% alcanzada).';
        return 'Puntaje actual ' + score + '%. Debe llegar a 85% o más.';
      case 'n2-noshow':
        if (tasa == null) return 'Sin historial aún para medir inasistencias.';
        if (tasa < 15) return 'Tasa de inasistencias ' + tasa + '% (bajo el 15% exigido).';
        return 'Tasa de inasistencias ' + tasa + '%. Debe bajar del 15%.';
      case 'n3-antecedentes':
        return estado === 'ok'
          ? 'Certificado de antecedentes cargado.'
          : 'Debe cargar el certificado de antecedentes.';
      case 'n3-biometria':
        return estado === 'ok'
          ? 'Verificación facial completada.'
          : 'Complete la verificación facial más abajo.';
      case 'n3-aval':
        return estado === 'ok'
          ? 'Aval o garantía registrado.'
          : 'Debe cargar un aval, garantía o respaldo.';
      default:
        return SubirConfianza.etiquetaPunto(estado);
    }
  },

  totalTareas() {
    return SubirConfianza.NIVELES.reduce((n, nivel) => n + nivel.tareas.length, 0);
  },

  tareasHechas() {
    return SubirConfianza.NIVELES.reduce(
      (n, nivel) => n + nivel.tareas.filter(t => SubirConfianza.estaHecha(t.id)).length,
      0
    );
  },

  progresoPct() {
    const total = SubirConfianza.totalTareas();
    if (!total) return 0;
    return Math.round((SubirConfianza.tareasHechas() / total) * 100);
  },

  nivelSugerido() {
    let nivel = 0;
    for (const n of SubirConfianza.NIVELES) {
      if (n.tareas.every(t => SubirConfianza.estaHecha(t.id))) nivel = n.id;
      else break;
    }
    return Math.max(1, nivel || (SubirConfianza.estaHecha('n1-registro') ? 1 : 0));
  },

  xpActual() {
    const perfil = SubirConfianza.perfil();
    const n = Number(perfil && perfil.xp);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  },

  nivelXp() {
    const perfil = SubirConfianza.perfil();
    const n = Number(perfil && perfil.nivel_xp);
    if (Number.isFinite(n) && n >= 1) return Math.min(3, Math.floor(n));
    return SubirConfianza.nivelSugerido();
  },

  // Datos de progreso: delega al motor tipado (persona/empresa).
  resumenProgreso() {
    const snap = ProgresoCuenta.actual().snapshot();
    const x = snap.extras || {};
    return {
      tipo: snap.tipo,
      hechas: x.hechas != null ? x.hechas : 0,
      total: x.total != null ? x.total : 0,
      pct: snap.pct,
      nivel: x.nivel != null ? x.nivel : 1,
      xp: x.xp != null ? x.xp : 0,
      meta: snap.meta,
      valor: snap.valor,
      titulo: snap.titulo
    };
  },

  // Monta el widget en un contenedor ajeno (Marketplace, etc.).
  montarIndicador(contenedor, opts) {
    return ProgresoCuenta.actual().montarIndicador(contenedor, opts || {});
  },

  render(raiz) {
    SubirConfianza.limpiar(raiz);
    ProgresoCuenta.actual().montarContenido(raiz);
  },

  bloqueDesgloseEmpresa() {
    const ficha = SubirConfianza.fichaEmpresaMock();
    if (typeof Market === 'undefined' || !Market.bloqueDesgloseIndice) {
      const fallback = document.createElement('p');
      fallback.className = 'section-lead';
      fallback.textContent = 'El desglose del índice no está disponible.';
      return fallback;
    }
    return Market.bloqueDesgloseIndice(ficha, null, ficha.indice_transparencia, ficha._verificado);
  },

  bloqueIndicador(opts) {
    return ProgresoCuenta.actual().crearIndicador(opts || {});
  },

  bloqueChecklist() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-todo';
    wrap.setAttribute('aria-label', 'Lista para subir de nivel');

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = 'Qué desbloquea cada verificación';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'Cumpla solo lo necesario según el tipo de trato. Cada nivel refuerza identidad y cumplimiento.';

    const normales = SubirConfianza.NIVELES.filter(n => !n.especial);
    const especiales = SubirConfianza.NIVELES.filter(n => n.especial);

    wrap.append(
      titulo,
      lead,
      SubirConfianza.carruselNiveles(normales),
      ...especiales.map(n => SubirConfianza.renderGrupo(n))
    );
    return wrap;
  },

  carruselNiveles(niveles) {
    const max = Math.max(0, niveles.length - 1);
    if (SubirConfianza.carruselIdx > max) SubirConfianza.carruselIdx = max;
    if (SubirConfianza.carruselIdx < 0) SubirConfianza.carruselIdx = 0;

    const root = document.createElement('div');
    root.className = 'confianza-carrusel';
    root.setAttribute('aria-roledescription', 'carrusel');
    root.setAttribute('aria-label', 'Niveles 1 a 3');

    const cabecera = document.createElement('header');
    cabecera.className = 'confianza-carrusel__cabecera';

    const nav = document.createElement('div');
    nav.className = 'confianza-carrusel__nav';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'confianza-carrusel__btn';
    prev.setAttribute('aria-label', 'Nivel anterior');
    const prevIcon = document.createElement('span');
    prevIcon.setAttribute('aria-hidden', 'true');
    prevIcon.textContent = '‹';
    prev.appendChild(prevIcon);

    const tituloWrap = document.createElement('div');
    tituloWrap.className = 'confianza-carrusel__titulo-wrap';

    const badge = document.createElement('span');
    badge.className = 'confianza-carrusel__badge';
    badge.setAttribute('aria-hidden', 'true');

    const meta = document.createElement('h4');
    meta.className = 'confianza-carrusel__titulo';
    meta.setAttribute('aria-live', 'polite');

    const resumen = document.createElement('span');
    resumen.className = 'confianza-carrusel__resumen';

    tituloWrap.append(badge, meta, resumen);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'confianza-carrusel__btn';
    next.setAttribute('aria-label', 'Nivel siguiente');
    const nextIcon = document.createElement('span');
    nextIcon.setAttribute('aria-hidden', 'true');
    nextIcon.textContent = '›';
    next.appendChild(nextIcon);

    nav.append(prev, tituloWrap, next);

    const regla = document.createElement('hr');
    regla.className = 'confianza-carrusel__hr';

    cabecera.append(nav, regla);

    const viewport = document.createElement('div');
    viewport.className = 'confianza-carrusel__viewport';

    const track = document.createElement('div');
    track.className = 'confianza-carrusel__track';

    const slides = niveles.map((nivel, i) => {
      const slide = document.createElement('div');
      slide.className = 'confianza-carrusel__slide';
      slide.setAttribute('aria-hidden', i === SubirConfianza.carruselIdx ? 'false' : 'true');
      slide.appendChild(SubirConfianza.renderGrupo(nivel, { sinCabecera: true }));
      track.appendChild(slide);
      return slide;
    });

    viewport.appendChild(track);

    const dots = document.createElement('div');
    dots.className = 'confianza-carrusel__dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Elegir nivel');

    const dotBtns = niveles.map((nivel, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'confianza-carrusel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', nivel.titulo);
      dot.addEventListener('click', () => irA(i));
      dots.appendChild(dot);
      return dot;
    });

    function pintar() {
      const idx = SubirConfianza.carruselIdx;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      slides.forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      dotBtns.forEach((dot, i) => {
        const activo = i === idx;
        dot.classList.toggle('confianza-carrusel__dot--activo', activo);
        dot.setAttribute('aria-selected', activo ? 'true' : 'false');
      });
      prev.disabled = idx <= 0;
      next.disabled = idx >= max;
      const n = niveles[idx];
      if (n) {
        badge.textContent = String(n.id);
        meta.textContent = n.titulo + ' · ' + n.evalua;
        const done = n.tareas.filter(t => SubirConfianza.estaHecha(t.id)).length;
        resumen.textContent = done + '/' + n.tareas.length + ' Tareas Completadas';
      } else {
        badge.textContent = '';
        meta.textContent = '';
        resumen.textContent = '';
      }
    }

    function irA(i) {
      SubirConfianza.carruselIdx = Math.max(0, Math.min(max, i));
      pintar();
    }

    prev.addEventListener('click', () => irA(SubirConfianza.carruselIdx - 1));
    next.addEventListener('click', () => irA(SubirConfianza.carruselIdx + 1));

    root.append(cabecera, viewport, dots);
    pintar();
    return root;
  },

  renderGrupo(nivel, opts) {
    const sinCabecera = !!(opts && opts.sinCabecera);
    const grupo = document.createElement('div');
    grupo.className =
      'confianza-todo__grupo' +
      (nivel.especial ? ' confianza-todo__grupo--especial' : '') +
      (sinCabecera ? ' confianza-todo__grupo--en-carrusel' : '');

    if (!sinCabecera) {
      const head = document.createElement('header');
      head.className = 'confianza-todo__grupo-head';

      const badge = document.createElement('span');
      badge.className = 'confianza-todo__badge';
      badge.textContent = String(nivel.id);

      const nombre = document.createElement('h4');
      nombre.className = 'confianza-todo__grupo-titulo';
      nombre.textContent = nivel.titulo + ' · ' + nivel.evalua;

      const doneCount = nivel.tareas.filter(t => SubirConfianza.estaHecha(t.id)).length;
      const resumen = document.createElement('span');
      resumen.className = 'confianza-todo__resumen';
      resumen.textContent = doneCount + '/' + nivel.tareas.length + ' Tareas Completadas';

      head.append(badge, nombre, resumen);
      grupo.appendChild(head);
    }

    const ul = document.createElement('ul');
    ul.className = 'confianza-todo__items';

    nivel.tareas.forEach(tarea => {
      const punto = SubirConfianza.estadoPunto(tarea.id);
      const detalle = SubirConfianza.detallePunto(tarea.id);
      const li = document.createElement('li');
      li.className = 'confianza-todo__item confianza-todo__item--' + punto;

      const estadoWrap = document.createElement('div');
      estadoWrap.className = 'confianza-todo__estado';

      const estado = document.createElement('span');
      estado.className = 'confianza-todo__punto confianza-todo__punto--' + punto;
      estado.setAttribute('aria-hidden', 'true');

      const estadoTxt = document.createElement('span');
      estadoTxt.className = 'confianza-todo__estado-txt confianza-todo__estado-txt--' + punto;
      estadoTxt.textContent = SubirConfianza.etiquetaPunto(punto);

      estadoWrap.append(estado, estadoTxt);

      const cuerpo = document.createElement('div');
      cuerpo.className = 'confianza-todo__cuerpo';

      const label = document.createElement('p');
      label.className = 'confianza-todo__label';
      label.textContent = tarea.label;

      const detalleEl = document.createElement('p');
      detalleEl.className = 'confianza-todo__detalle';
      detalleEl.textContent = detalle;

      const como = document.createElement('p');
      como.className = 'confianza-todo__como';
      como.textContent = tarea.como;

      cuerpo.append(label, detalleEl, como);
      li.append(estadoWrap, cuerpo);
      li.setAttribute(
        'aria-label',
        SubirConfianza.etiquetaPunto(punto) + ': ' + tarea.label + '. ' + detalle
      );
      ul.appendChild(li);
    });

    grupo.appendChild(ul);
    return grupo;
  },

  bloqueDocumentos() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-docs config-card';
    wrap.setAttribute('aria-label', 'Subir documentos');

    const head = document.createElement('div');
    head.className = 'confianza-docs__head';

    const prog = typeof ProgresoCuenta !== 'undefined' ? ProgresoCuenta.actual() : null;
    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = prog ? prog.tituloDocumentos() : 'Subir documentos';

    const nota = document.createElement('p');
    nota.className = 'confianza-docs__nota';
    nota.textContent = prog
      ? prog.notaDocumentos()
      : 'Zero-Retention (mock): el archivo no se guarda; solo desbloquea el requisito.';

    head.append(titulo, nota);

    const form = document.createElement('form');
    form.className = 'confianza-docs__form';
    form.noValidate = true;

    const fieldTipo = document.createElement('div');
    fieldTipo.className = 'field';
    const labelTipo = document.createElement('label');
    labelTipo.className = 'field__label';
    labelTipo.htmlFor = 'confianzaDocTipo';
    labelTipo.textContent = 'Tipo de documento';
    const select = document.createElement('select');
    select.id = 'confianzaDocTipo';
    select.className = 'field__input confianza-docs__select';
    SubirConfianza.tiposDocumento().forEach(([value, text]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      select.appendChild(opt);
    });
    fieldTipo.append(labelTipo, select);

    const drop = document.createElement('div');
    drop.className = 'confianza-docs__drop';

    const input = document.createElement('input');
    input.id = 'confianzaDocArchivo';
    input.className = 'confianza-docs__file';
    input.type = 'file';
    input.accept = '.pdf,image/jpeg,image/png,application/pdf';

    const dropLabel = document.createElement('label');
    dropLabel.className = 'confianza-docs__drop-label';
    dropLabel.htmlFor = 'confianzaDocArchivo';

    const dropTitulo = document.createElement('span');
    dropTitulo.className = 'confianza-docs__drop-titulo';
    dropTitulo.textContent = 'Elegir archivo';

    const dropHint = document.createElement('span');
    dropHint.className = 'confianza-docs__drop-hint';
    dropHint.textContent = 'PDF, JPG o PNG';

    const dropNombre = document.createElement('span');
    dropNombre.className = 'confianza-docs__drop-nombre';
    dropNombre.textContent = 'Ningún archivo seleccionado';

    dropLabel.append(dropTitulo, dropHint, dropNombre);
    drop.append(input, dropLabel);

    const actualizarArchivo = () => {
      const archivo = input.files && input.files[0];
      drop.classList.toggle('confianza-docs__drop--lleno', !!archivo);
      dropNombre.textContent = archivo
        ? archivo.name + ' · ' + SubirConfianza.formatoTamano(archivo.size)
        : 'Ningún archivo seleccionado';
    };
    input.addEventListener('change', actualizarArchivo);

    ['dragenter', 'dragover'].forEach(ev => {
      drop.addEventListener(ev, e => {
        e.preventDefault();
        drop.classList.add('confianza-docs__drop--activo');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      drop.addEventListener(ev, e => {
        e.preventDefault();
        drop.classList.remove('confianza-docs__drop--activo');
      });
    });
    drop.addEventListener('drop', e => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      try {
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        input.files = dt.files;
      } catch {
        return;
      }
      actualizarArchivo();
    });

    const acciones = document.createElement('div');
    acciones.className = 'confianza-docs__acciones';

    const btn = document.createElement('button');
    btn.className = 'submit-btn confianza-docs__submit';
    btn.type = 'submit';
    btn.textContent = 'Registrar documento';

    const status = document.createElement('p');
    status.className = 'status-text confianza-docs__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    acciones.append(btn, status);
    form.append(fieldTipo, drop, acciones);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const archivo = input.files && input.files[0];
      if (!archivo) {
        status.textContent = 'Seleccione un archivo.';
        return;
      }
      const tipo = select.value;
      if (SubirConfianza.tieneDoc(tipo)) {
        status.textContent = 'Ese tipo de documento ya está registrado.';
        return;
      }
      SubirConfianza.state.docs.unshift({
        id: String(Date.now()),
        tipo,
        nombre: archivo.name,
        tamano: archivo.size,
        fecha: new Date().toISOString()
      });
      SubirConfianza.guardar();
      SubirConfianza.init();
    });

    const listaWrap = document.createElement('div');
    listaWrap.className = 'confianza-docs__registrados';

    const listaTitulo = document.createElement('h4');
    listaTitulo.className = 'confianza-docs__lista-titulo';
    listaTitulo.textContent = 'Documentos registrados';

    const lista = document.createElement('ul');
    lista.className = 'confianza-docs__lista';
    if (!SubirConfianza.state.docs.length) {
      const vacio = document.createElement('li');
      vacio.className = 'confianza-docs__vacio';
      vacio.textContent = 'Aún no hay documentos. Sube uno para desbloquear su requisito.';
      lista.appendChild(vacio);
    } else {
      SubirConfianza.state.docs.forEach(doc => {
        const li = document.createElement('li');
        li.className = 'confianza-docs__item';

        const icono = document.createElement('span');
        icono.className = 'confianza-docs__item-icono';
        icono.setAttribute('aria-hidden', 'true');
        icono.textContent = 'PDF';

        const cuerpo = document.createElement('div');
        cuerpo.className = 'confianza-docs__item-cuerpo';

        const nombre = document.createElement('strong');
        nombre.textContent = doc.nombre;

        const meta = document.createElement('span');
        meta.textContent =
          SubirConfianza.etiquetaTipo(doc.tipo) +
          ' · ' +
          SubirConfianza.formatoFecha(doc.fecha) +
          (doc.tamano != null ? ' · ' + SubirConfianza.formatoTamano(doc.tamano) : '');

        cuerpo.append(nombre, meta);
        li.append(icono, cuerpo);
        lista.appendChild(li);
      });
    }

    listaWrap.append(listaTitulo, lista);
    wrap.append(head, form, listaWrap);
    return wrap;
  },

  bloqueBiometria() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-bio config-card';
    wrap.setAttribute('aria-label', 'Verificación biométrica');

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = 'Verificación biométrica';

    const lead = document.createElement('p');
    lead.className = 'section-lead';

    const status = document.createElement('p');
    status.className = 'status-text confianza-bio__status';
    status.setAttribute('role', 'status');

    const hecha = SubirConfianza.biometriaHecha();

    if (hecha) {
      const perfil = SubirConfianza.perfil();
      lead.textContent =
        'Identidad verificada. La foto se usó solo para el chequeo y no se almacenó.';
      status.textContent = perfil.biometria_verificada_en
        ? 'Completada el ' + SubirConfianza.formatoFecha(perfil.biometria_verificada_en) + '.'
        : 'Biometría completada.';
      wrap.append(titulo, lead, status);
      return wrap;
    }

    lead.textContent =
      'Abra la cámara frontal, encuadre su rostro y capture la selfie. La imagen no se guarda.';

    const visor = document.createElement('div');
    visor.className = 'confianza-bio__preview';
    visor.hidden = true;

    // Video oculto: solo alimenta el canvas (evita preview negra al capturar).
    const video = document.createElement('video');
    video.className = 'confianza-bio__video-src';
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    canvas.className = 'confianza-bio__canvas';
    canvas.setAttribute('aria-label', 'Vista de la selfie');

    visor.append(video, canvas);

    let stream = null;
    let archivoElegido = null;
    let rafId = 0;
    let congelado = false;
    const ctx = canvas.getContext('2d', { alpha: false });

    function detenerLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function detenerCamara() {
      detenerLoop();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      video.srcObject = null;
    }

    function pintarFrame() {
      if (!stream || congelado || !ctx) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        // Espejo selfie en el canvas en vivo.
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
      }
      rafId = requestAnimationFrame(pintarFrame);
    }

    const acciones = document.createElement('div');
    acciones.className = 'confianza-bio__acciones';

    const btnAbrir = document.createElement('button');
    btnAbrir.type = 'button';
    btnAbrir.className = 'confianza-bio__btn confianza-bio__btn--cam';
    btnAbrir.textContent = 'Abrir cámara';

    const btnCapturar = document.createElement('button');
    btnCapturar.type = 'button';
    btnCapturar.className = 'confianza-bio__btn';
    btnCapturar.textContent = 'Capturar selfie';
    btnCapturar.hidden = true;

    const btnOtra = document.createElement('button');
    btnOtra.type = 'button';
    btnOtra.className = 'confianza-bio__btn';
    btnOtra.textContent = 'Volver a capturar';
    btnOtra.hidden = true;

    const btn = document.createElement('button');
    btn.className = 'submit-btn confianza-bio__enviar';
    btn.type = 'button';
    btn.textContent = 'Verificar identidad';
    btn.disabled = true;

    function uiInicial() {
      btnAbrir.hidden = false;
      btnAbrir.disabled = false;
      btnAbrir.textContent = 'Abrir cámara';
      btnCapturar.hidden = true;
      btnOtra.hidden = true;
      btn.disabled = !archivoElegido;
    }

    function uiCamaraLista() {
      btnAbrir.hidden = true;
      btnCapturar.hidden = false;
      btnOtra.hidden = true;
    }

    function uiTrasCaptura() {
      btnAbrir.hidden = true;
      btnCapturar.hidden = true;
      btnOtra.hidden = false;
      btn.disabled = false;
    }

    uiInicial();

    btnAbrir.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = 'Este dispositivo no permite usar la cámara desde el navegador.';
        return;
      }
      btnAbrir.disabled = true;
      btnCapturar.hidden = true;
      status.textContent = 'Pidiendo acceso a la cámara…';
      try {
        detenerCamara();
        archivoElegido = null;
        congelado = false;
        btn.disabled = true;
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        video.srcObject = stream;
        await video.play();
        await new Promise((resolve) => {
          if (video.videoWidth > 0) {
            resolve();
            return;
          }
          const listo = () => {
            video.removeEventListener('loadeddata', listo);
            resolve();
          };
          video.addEventListener('loadeddata', listo);
          setTimeout(resolve, 1500);
        });
        visor.hidden = false;
        detenerLoop();
        pintarFrame();
        uiCamaraLista();
        status.textContent = 'Centre su rostro y pulse Capturar selfie.';
      } catch {
        detenerCamara();
        status.textContent = 'No se pudo abrir la cámara. Permita el acceso e intente de nuevo.';
        uiInicial();
      }
    });

    btnCapturar.addEventListener('click', async () => {
      if (!stream || !ctx || canvas.width < 2 || canvas.height < 2) {
        status.textContent = 'La cámara aún no está lista.';
        return;
      }
      // Congela el último frame ya pintado en el canvas (no vuelve a drawImage).
      congelado = true;
      detenerLoop();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob || blob.size < 500) {
        congelado = false;
        pintarFrame();
        status.textContent = 'No se pudo capturar la foto. Intente de nuevo.';
        return;
      }

      archivoElegido = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      // Apaga la cámara; el canvas sigue mostrando el frame congelado.
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      video.srcObject = null;
      uiTrasCaptura();
      status.textContent = 'Selfie lista. Pulse Verificar identidad.';
    });

    btnOtra.addEventListener('click', () => {
      archivoElegido = null;
      congelado = false;
      btn.disabled = true;
      uiInicial();
      btnAbrir.click();
    });

    btn.addEventListener('click', async () => {
      if (!archivoElegido) {
        status.textContent = 'Primero capture una selfie.';
        return;
      }
      btn.disabled = true;
      status.textContent = 'Verificando… la foto no se almacenará.';
      const res = await Auth.verificarBiometria(archivoElegido);
      if (!res.ok) {
        status.textContent = res.error || 'No se pudo verificar.';
        btn.disabled = false;
        return;
      }
      detenerCamara();
      SubirConfianza.sincronizarBiometria();
      SubirConfianza.init();
    });

    acciones.append(btnAbrir, btnCapturar, btnOtra);

    const nota = document.createElement('p');
    nota.className = 'confianza-bio__nota';
    nota.textContent = 'Zero-Retention: solo se registra que la verificación ocurrió.';

    wrap.append(titulo, lead, visor, acciones, btn, status, nota);
    return wrap;
  },

  bloqueTablaNiveles() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-tabla';
    wrap.setAttribute('aria-label', 'Referencia de niveles');

    const details = document.createElement('details');
    details.className = 'confianza-tabla__details';
    details.open = !!SubirConfianza.tablaAbierta;
    details.addEventListener('toggle', () => {
      SubirConfianza.tablaAbierta = details.open;
    });

    const summary = document.createElement('summary');
    summary.className = 'confianza-tabla__summary';

    const summaryTitulo = document.createElement('span');
    summaryTitulo.className = 'confianza-tabla__summary-titulo';
    summaryTitulo.textContent = 'Referencia de niveles';

    const summaryLead = document.createElement('span');
    summaryLead.className = 'confianza-tabla__summary-lead';
    summaryLead.textContent = 'Qué evalúa cada nivel, qué pide y para qué sirve.';

    const chevron = document.createElement('span');
    chevron.className = 'confianza-tabla__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';

    summary.append(summaryTitulo, summaryLead, chevron);

    const panel = document.createElement('div');
    panel.className = 'confianza-tabla__panel';

    const scroll = document.createElement('div');
    scroll.className = 'confianza-tabla__scroll';

    const table = document.createElement('table');
    table.className = 'confianza-tabla__grid';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    ['Nivel', 'Qué evalúa', 'Requisito o métrica', 'Casos de uso', '¿Discriminatorio por dinero?'].forEach(
      t => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = t;
        trHead.appendChild(th);
      }
    );
    thead.appendChild(trHead);

    const tbody = document.createElement('tbody');
    SubirConfianza.NIVELES.forEach(n => {
      const tr = document.createElement('tr');
      if (n.especial) tr.className = 'confianza-tabla__row--especial';
      [n.titulo, n.evalua, n.requisito, n.usos, n.discriminatorioNota].forEach((texto, i) => {
        const td = document.createElement('td');
        td.textContent = texto;
        if (i === 0) td.className = 'confianza-tabla__nivel';
        if (i === 4) {
          td.className = n.discriminatorio
            ? 'confianza-tabla__flag confianza-tabla__flag--si'
            : 'confianza-tabla__flag confianza-tabla__flag--no';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    scroll.appendChild(table);
    panel.appendChild(scroll);
    details.append(summary, panel);
    wrap.appendChild(details);
    return wrap;
  },

  etiquetaTipo(tipo) {
    const mapa = {
      cedula: 'Identidad',
      antecedentes: 'Antecedentes',
      aval: 'Aval / garantía',
      constitucion: 'Constitución',
      patente: 'Patente municipal',
      inicio_actividades: 'Inicio de actividades',
      poder_representante: 'Poder representante'
    };
    return mapa[tipo] || tipo;
  },

  formatoFecha(iso) {
    try {
      return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  },

  formatoTamano(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n < 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
