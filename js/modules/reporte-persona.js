// Reporte de confianza para cuenta persona: niveles aprobados + datos, imprimible a PDF.
const ReportePersona = {
  init() {
    const raiz = document.getElementById('reporteRaiz');
    if (!raiz) return;
    if (typeof ReporteQr !== 'undefined') {
      if (ReporteQr.cerrarModalValidador) ReporteQr.cerrarModalValidador();
      if (ReporteQr.detenerCamara) ReporteQr.detenerCamara();
    }
    if (typeof SubirConfianza !== 'undefined' && SubirConfianza.cargar) {
      SubirConfianza.cargar();
    }
    while (raiz.firstChild) raiz.removeChild(raiz.firstChild);
    raiz.appendChild(ReportePersona.render());
  },

  usuario() {
    return typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
  },

  perfil() {
    const u = ReportePersona.usuario();
    return (u && u.perfil) || {};
  },

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'reporte';

    const lead = document.createElement('p');
    lead.className = 'section-lead reporte__lead no-print';
    lead.textContent =
      'Consulte su reporte de verificación, muestre su QR y valide el de otra persona. Puede imprimir o guardar el informe en PDF.';

    const acciones = document.createElement('div');
    acciones.className = 'reporte__acciones no-print';

    const btnPdf = document.createElement('button');
    btnPdf.type = 'button';
    btnPdf.className = 'submit-btn';
    btnPdf.textContent = 'Imprimir o guardar PDF';
    btnPdf.addEventListener('click', () => ReportePersona.imprimir());

    const btnQr = document.createElement('button');
    btnQr.type = 'button';
    btnQr.className = 'submit-btn submit-btn--secondary';
    btnQr.textContent = 'Validar QR';
    btnQr.addEventListener('click', () => {
      if (typeof ReporteQr !== 'undefined') ReporteQr.abrirModalValidador();
    });

    acciones.append(btnPdf, btnQr);

    const doc = ReportePersona.renderDocumento();

    const pieAcciones = document.createElement('div');
    pieAcciones.className = 'reporte__acciones reporte__acciones--pie no-print';
    const btnAct = document.createElement('button');
    btnAct.type = 'button';
    btnAct.className = 'history__clear';
    btnAct.textContent = 'Actualizar datos';
    btnAct.addEventListener('click', () => ReportePersona.init());
    pieAcciones.appendChild(btnAct);

    const modal =
      typeof ReporteQr !== 'undefined'
        ? ReporteQr.renderModalValidador()
        : document.createComment('sin-modal-qr');

    wrap.append(lead, acciones, doc, pieAcciones, modal);

    setTimeout(() => ReportePersona.cargarQrInforme(), 0);

    return wrap;
  },

  renderDocumento() {
    const user = ReportePersona.usuario() || {};
    const perfil = ReportePersona.perfil();
    const prog =
      typeof ProgresoCuenta !== 'undefined' ? ProgresoCuenta.de('persona') : null;
    const sc = typeof SubirConfianza !== 'undefined' ? SubirConfianza : null;

    const doc = document.createElement('article');
    doc.className = 'reporte-doc';
    doc.id = 'reporteDocumento';
    doc.setAttribute('aria-label', 'Reporte de confianza ServiChile');

    const cabezal = document.createElement('header');
    cabezal.className = 'reporte-doc__cabezal';

    const marca = document.createElement('div');
    marca.className = 'reporte-doc__marca';
    const logo = document.createElement('span');
    logo.className = 'reporte-doc__logo';
    logo.textContent = 'S';
    const marcaTxt = document.createElement('div');
    const marcaNombre = document.createElement('p');
    marcaNombre.className = 'reporte-doc__brand';
    marcaNombre.textContent = 'ServiChile';
    const marcaSub = document.createElement('p');
    marcaSub.className = 'reporte-doc__brand-sub';
    marcaSub.textContent = 'Reporte de confianza personal';
    marcaTxt.append(marcaNombre, marcaSub);
    marca.append(logo, marcaTxt);

    const meta = document.createElement('div');
    meta.className = 'reporte-doc__meta';
    const emitido = document.createElement('p');
    emitido.textContent = 'Emitido: ' + ReportePersona.hoy();
    const tipo = document.createElement('p');
    tipo.textContent = 'Cuenta: Persona natural';
    meta.append(emitido, tipo);
    cabezal.append(marca, meta);

    const titular = document.createElement('section');
    titular.className = 'reporte-doc__titular';
    const nombre = document.createElement('h3');
    nombre.className = 'reporte-doc__nombre';
    nombre.textContent = user.nombre || 'Titular sin nombre';
    const correo = document.createElement('p');
    correo.className = 'reporte-doc__correo';
    correo.textContent = user.email || 'Sin correo';
    titular.append(nombre, correo);

    const qrBloque = document.createElement('section');
    qrBloque.className = 'reporte-doc__qr';
    qrBloque.setAttribute('aria-label', 'Código QR de identidad');
    const qrTitulo = document.createElement('h3');
    qrTitulo.className = 'reporte-doc__h';
    qrTitulo.textContent = 'Código QR de identidad';
    const qrAyuda = document.createElement('p');
    qrAyuda.className = 'reporte-doc__qr-ayuda';
    qrAyuda.textContent =
      'Escanee este código para validar la identidad del titular en ServiChile.';
    const qrStatus = document.createElement('p');
    qrStatus.className = 'status-text reporte-doc__qr-status';
    qrStatus.id = 'reporteQrStatus';
    qrStatus.setAttribute('role', 'status');
    qrStatus.textContent = 'Cargando código QR…';
    const qrHost = document.createElement('div');
    qrHost.className = 'reporte-doc__qr-host';
    qrHost.id = 'reporteQrHost';
    qrBloque.append(qrTitulo, qrAyuda, qrStatus, qrHost);

    const resumen = document.createElement('section');
    resumen.className = 'reporte-doc__resumen';
    resumen.setAttribute('aria-label', 'Resumen de confianza');

    const nivelXp = sc ? sc.nivelXp() : Number(perfil.nivel_xp) || 1;
    const nombreNivel = prog ? prog.etiquetaNivel(nivelXp) : 'Identidad';
    const hechas = sc ? sc.tareasHechas() : 0;
    const total = sc ? sc.totalTareas() : 9;
    const pct = sc ? sc.progresoPct() : 0;
    const score = perfil.score_confiabilidad;
    const scoreTxt =
      score == null || score === ''
        ? 'Sin historial'
        : Number(score).toFixed(1) + '%';

    [
      ['Nivel alcanzado', 'Nivel ' + nivelXp + ' · ' + nombreNivel],
      ['Requisitos cumplidos', hechas + ' de ' + total + ' (' + pct + '%)'],
      ['Experiencia (XP)', String(perfil.xp != null ? perfil.xp : 0)],
      ['Confiabilidad', scoreTxt],
      ['RUT', perfil.rut_verificado ? 'Verificado' : 'Pendiente'],
      [
        'Biometría',
        perfil.biometria_verificada ? 'Verificada' : 'Pendiente'
      ],
      [
        'Estado pasaporte',
        perfil.estado_pasaporte === 'verificado' ? 'Verificado' : 'Básico'
      ],
      [
        'Teléfono',
        perfil.telefono && String(perfil.telefono).trim()
          ? String(perfil.telefono).trim()
          : 'Sin registrar'
      ]
    ].forEach(([k, v]) => {
      const chip = document.createElement('div');
      chip.className = 'reporte-doc__chip';
      const dt = document.createElement('span');
      dt.className = 'reporte-doc__chip-k';
      dt.textContent = k;
      const dd = document.createElement('strong');
      dd.className = 'reporte-doc__chip-v';
      dd.textContent = v;
      chip.append(dt, dd);
      resumen.appendChild(chip);
    });

    const nivelesSec = document.createElement('section');
    nivelesSec.className = 'reporte-doc__niveles';
    const nivelesTitulo = document.createElement('h3');
    nivelesTitulo.className = 'reporte-doc__h';
    nivelesTitulo.textContent = 'Detalle por nivel';
    nivelesSec.appendChild(nivelesTitulo);

    const niveles = sc && sc.NIVELES ? sc.NIVELES : [];
    niveles.forEach((nivel) => {
      const bloque = document.createElement('div');
      bloque.className = 'reporte-doc__nivel';
      const done = nivel.tareas.filter((t) => sc.estaHecha(t.id)).length;
      const completo = done === nivel.tareas.length;
      if (completo) bloque.classList.add('reporte-doc__nivel--ok');

      const head = document.createElement('div');
      head.className = 'reporte-doc__nivel-head';
      const badge = document.createElement('span');
      badge.className = 'reporte-doc__badge';
      badge.textContent = String(nivel.id);
      const info = document.createElement('div');
      const titulo = document.createElement('p');
      titulo.className = 'reporte-doc__nivel-titulo';
      titulo.textContent = nivel.titulo;
      const estado = document.createElement('p');
      estado.className = 'reporte-doc__nivel-estado';
      estado.textContent = completo
        ? 'Nivel aprobado · ' + done + '/' + nivel.tareas.length + ' requisitos'
        : 'En progreso · ' + done + '/' + nivel.tareas.length + ' requisitos';
      info.append(titulo, estado);
      head.append(badge, info);

      const lista = document.createElement('ul');
      lista.className = 'reporte-doc__reqs';
      nivel.tareas.forEach((tarea) => {
        const li = document.createElement('li');
        const ok = sc.estaHecha(tarea.id);
        li.className = ok ? 'reporte-doc__req reporte-doc__req--ok' : 'reporte-doc__req';
        const marcaReq = document.createElement('span');
        marcaReq.className = 'reporte-doc__check';
        marcaReq.setAttribute('aria-hidden', 'true');
        marcaReq.textContent = ok ? '✓' : '○';
        const cuerpo = document.createElement('div');
        const lab = document.createElement('p');
        lab.className = 'reporte-doc__req-label';
        lab.textContent = tarea.label;
        const det = document.createElement('p');
        det.className = 'reporte-doc__req-det';
        det.textContent = sc.detallePunto(tarea.id);
        cuerpo.append(lab, det);
        li.append(marcaReq, cuerpo);
        lista.appendChild(li);
      });

      bloque.append(head, lista);
      nivelesSec.appendChild(bloque);
    });

    const pie = document.createElement('footer');
    pie.className = 'reporte-doc__pie';
    const aviso = document.createElement('p');
    aviso.textContent =
      'Documento informativo generado por ServiChile a solicitud del titular. No sustituye certificados oficiales ni constituye un juicio crediticio.';
    const ref = document.createElement('p');
    ref.className = 'reporte-doc__ref';
    ref.textContent =
      'Referencia: ' +
      ReportePersona.refId(user) +
      ' · ' +
      ReportePersona.hoy();
    pie.append(aviso, ref);

    doc.append(cabezal, titular, qrBloque, resumen, nivelesSec, pie);
    return doc;
  },

  async cargarQrInforme() {
    const status = document.getElementById('reporteQrStatus');
    const host = document.getElementById('reporteQrHost');
    if (!host) return;
    if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
      if (status) status.textContent = 'Inicie sesión para incluir el QR en el informe.';
      return;
    }
    if (typeof ReporteQr === 'undefined') {
      if (status) status.textContent = 'No se pudo generar el código QR.';
      return;
    }
    const res = await ReporteQr.emitir();
    if (!res.ok) {
      if (status) status.textContent = res.error || 'No se pudo cargar el QR.';
      return;
    }
    if (status) status.textContent = '';
    while (host.firstChild) host.removeChild(host.firstChild);

    const frame = document.createElement('div');
    frame.className = 'reporte-doc__qr-frame';
    frame.id = 'reporteQrFrame';
    ReporteQr.dibujarQr(frame, res.data.payload);

    const expira = document.createElement('p');
    expira.className = 'reporte-doc__qr-expira';
    expira.textContent =
      'Válido hasta ' + ReporteQr.formatoFecha(res.data.expires_at);

    host.append(frame, expira);
    if (ReporteQr.programarRenovacion) {
      ReporteQr.programarRenovacion(res.data.expires_in);
    }
  },

  imprimir() {
    document.body.classList.add('reporte-print');
    const limpiar = () => {
      document.body.classList.remove('reporte-print');
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    window.print();
    // Fallback si afterprint no dispara (algunos móviles).
    setTimeout(limpiar, 1500);
  },

  hoy() {
    try {
      return new Date().toLocaleString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date().toISOString();
    }
  },

  refId(user) {
    const base = (user && (user.id || user.email)) || 'local';
    let h = 0;
    const s = String(base);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'SC-' + h.toString(16).toUpperCase().padStart(8, '0');
  }
};
