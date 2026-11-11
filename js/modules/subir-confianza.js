// Página mock "Subir Confianza": la lista no se marca a mano; se desbloquea al hacer la acción.
const SubirConfianza = {
  STORAGE_KEY: 'servicia.subirConfianza.mock',

  NIVELES: [
    {
      id: 1,
      titulo: 'Nivel 1',
      evalua: 'Actividad básica',
      requisito: 'Cédula de identidad y registro inicial en la plataforma.',
      usos: 'Eventos masivos, reservas simples, comercios locales y primer contacto.',
      discriminatorio: false,
      discriminatorioNota: 'NO (Es para todos los usuarios)',
      tareas: [
        {
          id: 'n1-registro',
          label: 'Completar registro inicial en la plataforma',
          como: 'Se desbloquea al crear tu cuenta e iniciar sesión.'
        },
        {
          id: 'n1-cedula',
          label: 'Verificar cédula de identidad',
          como: 'Se desbloquea al subir tu cédula o verificar el RUT en Perfil.'
        }
      ]
    },
    {
      id: 2,
      titulo: 'Nivel 2',
      evalua: 'Disciplina operativa',
      requisito: 'Historial de asistencia y puntualidad (behavior_score ≥ 85%, baja tasa de no-shows).',
      usos: 'Descuentos, accesos preferenciales y prioridad en gimnasios o reservas.',
      discriminatorio: false,
      discriminatorioNota: 'NO (Se gana exclusivamente portándose bien y cumpliendo)',
      tareas: [
        {
          id: 'n2-asistencias',
          label: 'Acumular historial de asistencia en reservas',
          como: 'Se desbloquea con reservas cerradas (asistencias registradas).'
        },
        {
          id: 'n2-puntualidad',
          label: 'Mantener behavior_score ≥ 85%',
          como: 'Se desbloquea cuando tu score de confiabilidad llega a 85% o más.'
        },
        {
          id: 'n2-noshow',
          label: 'Mantener baja tasa de no-shows',
          como: 'Se desbloquea manteniendo un score de confiabilidad ≥ 85%.'
        }
      ]
    },
    {
      id: 3,
      titulo: 'Nivel 3',
      evalua: 'Idoneidad cívica y social',
      requisito: 'Certificado de antecedentes limpios + Biometría (Verificación de identidad avanzada).',
      usos: 'Galas exclusivas, preventas, máxima confianza y estatus dentro de la comunidad.',
      discriminatorio: false,
      discriminatorioNota: 'NO (Basado en conducta y cívica, totalmente ajeno al nivel socioeconómico)',
      tareas: [
        {
          id: 'n3-antecedentes',
          label: 'Subir certificado de antecedentes limpios',
          como: 'Se desbloquea al subir el certificado de antecedentes.'
        },
        {
          id: 'n3-biometria',
          label: 'Completar verificación biométrica de identidad',
          como: 'Se desbloquea al completar el flujo de biometría.'
        }
      ]
    },
    {
      id: 4,
      titulo: 'Nivel 4 (Carril Financiero)',
      evalua: 'Solvencia patrimonial',
      requisito: 'Liquidaciones de sueldo / Certificado AFP procesados con Zero-Retention.',
      usos: 'Única y exclusivamente para arriendos de departamentos y contratos inmobiliarios.',
      discriminatorio: true,
      discriminatorioNota: 'SÍ, pero es estrictamente legal y necesario solo para el rubro inmobiliario bajo la Ley 19.628.',
      especial: true,
      tareas: [
        {
          id: 'n4-liquidacion',
          label: 'Subir liquidaciones de sueldo (PDF, Zero-Retention)',
          como: 'Se desbloquea al subir una liquidación de sueldo.'
        },
        {
          id: 'n4-afp',
          label: 'Subir certificado AFP (PDF, Zero-Retention)',
          como: 'Se desbloquea al subir el certificado AFP.'
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

  cargar() {
    try {
      const raw = localStorage.getItem(SubirConfianza.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      SubirConfianza.state.docs = Array.isArray(parsed.docs) ? parsed.docs : [];
      SubirConfianza.state.biometriaOk = !!parsed.biometriaOk;
    } catch {
      SubirConfianza.state = { docs: [], biometriaOk: false };
    }
  },

  guardar() {
    try {
      localStorage.setItem(SubirConfianza.STORAGE_KEY, JSON.stringify({
        docs: SubirConfianza.state.docs,
        biometriaOk: SubirConfianza.state.biometriaOk
      }));
    } catch {}
  },

  perfil() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    return (user && user.perfil) || {};
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

  // Solo acciones reales (o mock de esas acciones) desbloquean. Sin toggle manual.
  estaHecha(tareaId) {
    return SubirConfianza.estadoPunto(tareaId) === 'ok';
  },

  // Verde = listo, naranjo = en progreso, gris = pendiente.
  estadoPunto(tareaId) {
    const perfil = SubirConfianza.perfil();
    const score = SubirConfianza.scoreConfiabilidad();

    switch (tareaId) {
      case 'n1-registro':
        return typeof Auth !== 'undefined' && Auth.isAuthenticated() ? 'ok' : 'pendiente';
      case 'n1-cedula':
        if (perfil.rut_verificado || SubirConfianza.tieneDoc('cedula')) return 'ok';
        return 'pendiente';
      case 'n2-asistencias':
        return score != null ? 'ok' : 'pendiente';
      case 'n2-puntualidad':
      case 'n2-noshow':
        if (score != null && score >= 85) return 'ok';
        if (score != null) return 'progreso';
        return 'pendiente';
      case 'n3-antecedentes':
        return SubirConfianza.tieneDoc('antecedentes') ? 'ok' : 'pendiente';
      case 'n3-biometria':
        return SubirConfianza.state.biometriaOk ? 'ok' : 'pendiente';
      case 'n4-liquidacion':
        return SubirConfianza.tieneDoc('liquidacion') ? 'ok' : 'pendiente';
      case 'n4-afp':
        return SubirConfianza.tieneDoc('afp') ? 'ok' : 'pendiente';
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
    const estado = SubirConfianza.estadoPunto(tareaId);

    switch (tareaId) {
      case 'n1-registro':
        return estado === 'ok'
          ? 'Cuenta activa e iniciaste sesión.'
          : 'Debes crear una cuenta e iniciar sesión.';
      case 'n1-cedula':
        if (perfil.rut_verificado) return 'RUT verificado en tu perfil.';
        if (SubirConfianza.tieneDoc('cedula')) return 'Cédula cargada (mock Zero-Retention).';
        return 'Falta verificar RUT en Perfil o subir la cédula.';
      case 'n2-asistencias':
        return estado === 'ok'
          ? 'Ya tienes historial de reservas cerradas.'
          : 'Aún no hay asistencias registradas en tus reservas.';
      case 'n2-puntualidad':
        if (score == null) return 'Sin score aún. Se calcula con tus asistencias.';
        if (score >= 85) return 'behavior_score ' + score + '% · meta ≥ 85% alcanzada.';
        return 'behavior_score ' + score + '% · faltan ' + (85 - score).toFixed(1) + ' puntos para la meta.';
      case 'n2-noshow':
        if (score == null) return 'Sin historial: la tasa de no-shows aún no se mide.';
        if (score >= 85) return 'Tasa de no-shows controlada (score ' + score + '%).';
        return 'Score ' + score + '%: baja la tasa de no-shows para llegar a 85%.';
      case 'n3-antecedentes':
        return estado === 'ok'
          ? 'Certificado de antecedentes cargado.'
          : 'Sube el certificado de antecedentes en Documentos.';
      case 'n3-biometria':
        return estado === 'ok'
          ? 'Verificación biométrica completada.'
          : 'Completa el flujo de biometría más abajo.';
      case 'n4-liquidacion':
        return estado === 'ok'
          ? 'Liquidación procesada (Zero-Retention).'
          : 'Solo para arriendos: sube liquidación de sueldo en PDF.';
      case 'n4-afp':
        return estado === 'ok'
          ? 'Certificado AFP procesado (Zero-Retention).'
          : 'Solo para arriendos: sube certificado AFP en PDF.';
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

  render(raiz) {
    SubirConfianza.limpiar(raiz);
    raiz.append(
      SubirConfianza.bloqueIndicador(),
      SubirConfianza.bloqueChecklist(),
      SubirConfianza.bloqueDocumentos(),
      SubirConfianza.bloqueBiometria(),
      SubirConfianza.bloqueTablaNiveles()
    );
  },

  bloqueIndicador() {
    const card = document.createElement('section');
    card.className = 'confianza-indicador';
    card.setAttribute('aria-label', 'Progreso de confianza');

    const hechas = SubirConfianza.tareasHechas();
    const total = SubirConfianza.totalTareas();
    const pct = SubirConfianza.progresoPct();
    const nivel = SubirConfianza.nivelSugerido();

    const titulo = document.createElement('h3');
    titulo.className = 'confianza-indicador__titulo';
    titulo.textContent = 'Tu progreso';

    const meta = document.createElement('p');
    meta.className = 'confianza-indicador__meta';
    meta.textContent = hechas + ' de ' + total + ' requisitos · Nivel estimado: ' + nivel;

    const track = document.createElement('div');
    track.className = 'confianza-indicador__track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(pct));
    track.setAttribute('aria-label', 'Progreso de Subir Confianza');

    const fill = document.createElement('div');
    fill.className = 'confianza-indicador__fill';
    fill.style.width = pct + '%';

    const pctLabel = document.createElement('span');
    pctLabel.className = 'confianza-indicador__pct';
    pctLabel.textContent = pct + '%';

    track.appendChild(fill);
    card.append(titulo, meta, track, pctLabel);
    return card;
  },

  bloqueChecklist() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-todo';
    wrap.setAttribute('aria-label', 'Lista para subir de nivel');

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = 'Lista para subir de nivel';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'No se marca a mano: cada ítem se desbloquea solo cuando completas la acción real.';

    const leyenda = document.createElement('ul');
    leyenda.className = 'confianza-leyenda';
    leyenda.setAttribute('aria-label', 'Leyenda de estados');
    [
      ['ok', 'Verde', 'Cumplido: el requisito ya está desbloqueado.'],
      ['progreso', 'Naranjo', 'En progreso: hay avance, pero aún no llega a la meta.'],
      ['pendiente', 'Gris', 'Pendiente: todavía no hay acción ni métrica.']
    ].forEach(([estado, color, texto]) => {
      const li = document.createElement('li');
      li.className = 'confianza-leyenda__item';
      const dot = document.createElement('span');
      dot.className = 'confianza-todo__punto confianza-todo__punto--' + estado;
      dot.setAttribute('aria-hidden', 'true');
      const strong = document.createElement('strong');
      strong.textContent = color;
      const span = document.createElement('span');
      span.textContent = ' — ' + texto;
      li.append(dot, strong, span);
      leyenda.appendChild(li);
    });

    const lista = document.createElement('div');
    lista.className = 'confianza-todo__lista';

    SubirConfianza.NIVELES.forEach(nivel => {
      const grupo = document.createElement('div');
      grupo.className = 'confianza-todo__grupo' + (nivel.especial ? ' confianza-todo__grupo--especial' : '');

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
      resumen.textContent = doneCount + '/' + nivel.tareas.length;

      head.append(badge, nombre, resumen);

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
        li.setAttribute('aria-label', SubirConfianza.etiquetaPunto(punto) + ': ' + tarea.label + '. ' + detalle);
        ul.appendChild(li);
      });

      grupo.append(head, ul);
      lista.appendChild(grupo);
    });

    wrap.append(titulo, lead, leyenda, lista);
    return wrap;
  },

  bloqueDocumentos() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-docs config-card';
    wrap.setAttribute('aria-label', 'Subir documentos');

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = 'Subir documentos';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'Mock Zero-Retention: al subir el documento correcto se desbloquea el requisito. El archivo no se guarda.';

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
    select.className = 'field__input';
    [
      ['cedula', 'Cédula de identidad (Nivel 1)'],
      ['antecedentes', 'Certificado de antecedentes (Nivel 3)'],
      ['liquidacion', 'Liquidación de sueldo (Nivel 4)'],
      ['afp', 'Certificado AFP (Nivel 4)']
    ].forEach(([value, text]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      select.appendChild(opt);
    });
    fieldTipo.append(labelTipo, select);

    const fieldArchivo = document.createElement('div');
    fieldArchivo.className = 'field';
    const labelArchivo = document.createElement('label');
    labelArchivo.className = 'field__label';
    labelArchivo.htmlFor = 'confianzaDocArchivo';
    labelArchivo.textContent = 'Archivo (PDF o imagen)';
    const input = document.createElement('input');
    input.id = 'confianzaDocArchivo';
    input.className = 'field__input';
    input.type = 'file';
    input.accept = '.pdf,image/jpeg,image/png,application/pdf';
    fieldArchivo.append(labelArchivo, input);

    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.type = 'submit';
    btn.textContent = 'Subir documento (mock)';

    const status = document.createElement('p');
    status.className = 'status-text';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    form.append(fieldTipo, fieldArchivo, btn, status);
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

    const listaTitulo = document.createElement('h4');
    listaTitulo.className = 'confianza-docs__lista-titulo';
    listaTitulo.textContent = 'Documentos registrados (mock)';

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
        const nombre = document.createElement('strong');
        nombre.textContent = doc.nombre;
        const meta = document.createElement('span');
        meta.textContent =
          SubirConfianza.etiquetaTipo(doc.tipo) + ' · ' + SubirConfianza.formatoFecha(doc.fecha);
        li.append(nombre, meta);
        lista.appendChild(li);
      });
    }

    wrap.append(titulo, lead, form, listaTitulo, lista);
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
    status.className = 'status-text';
    status.setAttribute('role', 'status');

    if (SubirConfianza.state.biometriaOk) {
      lead.textContent =
        'Identidad avanzada verificada (mock). El requisito de Nivel 3 ya está desbloqueado.';
      status.textContent = 'Biometría completada.';
      wrap.append(titulo, lead, status);
      return wrap;
    }

    lead.textContent =
      'Flujo mock: al completar la verificación biométrica se desbloquea el requisito de Nivel 3.';

    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.type = 'button';
    btn.textContent = 'Iniciar verificación biométrica (mock)';
    btn.addEventListener('click', () => {
      btn.disabled = true;
      status.textContent = 'Procesando verificación...';
      window.setTimeout(() => {
        SubirConfianza.state.biometriaOk = true;
        SubirConfianza.guardar();
        SubirConfianza.init();
      }, 700);
    });

    wrap.append(titulo, lead, btn, status);
    return wrap;
  },

  bloqueTablaNiveles() {
    const wrap = document.createElement('section');
    wrap.className = 'confianza-tabla';
    wrap.setAttribute('aria-label', 'Referencia de niveles');

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = 'Referencia de niveles';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent = 'Qué evalúa cada nivel, qué pide y para qué sirve.';

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
    wrap.append(titulo, lead, scroll);
    return wrap;
  },

  etiquetaTipo(tipo) {
    const mapa = {
      cedula: 'Cédula',
      antecedentes: 'Antecedentes',
      liquidacion: 'Liquidación',
      afp: 'AFP'
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

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
