// Reporte de transparencia para cuenta empresa: índice (30 observables) + QR, imprimible a PDF.
const ReporteEmpresa = {
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
    raiz.appendChild(ReporteEmpresa.render());
  },

  usuario() {
    return typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
  },

  perfil() {
    const u = ReporteEmpresa.usuario();
    return (u && u.perfil) || {};
  },

  ficha() {
    if (typeof ProgresoCuenta !== 'undefined') {
      return ProgresoCuenta.de('empresa').calcularFicha();
    }
    const user = ReporteEmpresa.usuario() || {};
    return {
      id: 'empresa:' + (user.email || 'local'),
      nombre: user.nombre || 'Mi empresa',
      indice_transparencia: 4.2,
      is_verified_profile: false,
      _docsCargados: 0,
      _verificado: false
    };
  },

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'reporte';

    const lead = document.createElement('p');
    lead.className = 'section-lead reporte__lead no-print';
    lead.textContent =
      'Consulte el desglose de su índice de transparencia (30 observables), muestre su QR y valide el de otra parte. Puede imprimir o guardar el informe en PDF.';

    const acciones = document.createElement('div');
    acciones.className = 'reporte__acciones no-print';

    const btnPdf = document.createElement('button');
    btnPdf.type = 'button';
    btnPdf.className = 'submit-btn';
    btnPdf.textContent = 'Imprimir o guardar PDF';
    btnPdf.addEventListener('click', () => ReporteEmpresa.imprimir());

    const btnQr = document.createElement('button');
    btnQr.type = 'button';
    btnQr.className = 'submit-btn submit-btn--secondary';
    btnQr.textContent = 'Validar QR';
    btnQr.addEventListener('click', () => {
      if (typeof ReporteQr !== 'undefined') ReporteQr.abrirModalValidador();
    });

    acciones.append(btnPdf, btnQr);

    const doc = ReporteEmpresa.renderDocumento();

    const pieAcciones = document.createElement('div');
    pieAcciones.className = 'reporte__acciones reporte__acciones--pie no-print';
    const btnAct = document.createElement('button');
    btnAct.type = 'button';
    btnAct.className = 'history__clear';
    btnAct.textContent = 'Actualizar datos';
    btnAct.addEventListener('click', () => ReporteEmpresa.init());
    pieAcciones.appendChild(btnAct);

    const modal =
      typeof ReporteQr !== 'undefined'
        ? ReporteQr.renderModalValidador()
        : document.createComment('sin-modal-qr');

    wrap.append(lead, acciones, doc, pieAcciones, modal);
    setTimeout(() => ReporteEmpresa.cargarQrInforme(), 0);
    return wrap;
  },

  renderDocumento() {
    const user = ReporteEmpresa.usuario() || {};
    const perfil = ReporteEmpresa.perfil();
    const ficha = ReporteEmpresa.ficha();
    const indice = Number(ficha.indice_transparencia) || 0;
    const verificado = !!ficha._verificado || !!ficha.is_verified_profile;

    const doc = document.createElement('article');
    doc.className = 'reporte-doc reporte-doc--empresa';
    doc.id = 'reporteDocumento';
    doc.setAttribute('aria-label', 'Reporte de transparencia ServiChile');

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
    marcaSub.textContent = 'Reporte de transparencia empresarial';
    marcaTxt.append(marcaNombre, marcaSub);
    marca.append(logo, marcaTxt);

    const meta = document.createElement('div');
    meta.className = 'reporte-doc__meta';
    const emitido = document.createElement('p');
    emitido.textContent = 'Emitido: ' + ReporteEmpresa.hoy();
    const tipo = document.createElement('p');
    tipo.textContent = 'Cuenta: Empresa';
    meta.append(emitido, tipo);
    cabezal.append(marca, meta);

    const titular = document.createElement('section');
    titular.className = 'reporte-doc__titular';
    const nombre = document.createElement('h3');
    nombre.className = 'reporte-doc__nombre';
    nombre.textContent = ficha.nombre || user.nombre || 'Empresa sin nombre';
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
      'Escanee este código para validar la identidad de la empresa en ServiChile.';
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
    resumen.setAttribute('aria-label', 'Resumen de transparencia');

    const docs =
      typeof ProgresoCuenta !== 'undefined'
        ? ProgresoCuenta.de('empresa').idsDocumento().length
        : 4;
    const cargados = ficha._docsCargados != null ? ficha._docsCargados : 0;

    [
      ['Índice resultante', indice.toFixed(1) + ' / 10'],
      ['Perfil', verificado ? 'Verificado' : 'Sin verificar'],
      ['Documentos legales', cargados + ' de ' + docs],
      ['RUT', perfil.rut_verificado ? 'Verificado' : 'Pendiente'],
      [
        'Teléfono',
        perfil.telefono && String(perfil.telefono).trim()
          ? String(perfil.telefono).trim()
          : 'Sin registrar'
      ],
      ['Observables', '30 · Ciber / Legal / Contractual / Operativa']
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

    const desgloseWrap = document.createElement('section');
    desgloseWrap.className = 'reporte-doc__desglose';
    if (typeof Market !== 'undefined' && Market.bloqueDesgloseIndice) {
      const n = {
        id: ficha.id,
        nombre: ficha.nombre || user.nombre || 'Mi empresa'
      };
      const desglose = Market.bloqueDesgloseIndice(n, null, indice, verificado);
      desglose.classList.add('reporte-doc__indice');
      desgloseWrap.appendChild(desglose);
      // En el informe se muestran las 4 dimensiones por defecto.
      setTimeout(() => {
        const todos = desglose.querySelector('.indice-desglose__filtro--todos');
        if (todos) todos.click();
      }, 0);
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'status-text';
      fallback.textContent = 'No se pudo cargar el desglose del índice.';
      desgloseWrap.appendChild(fallback);
    }

    const pie = document.createElement('footer');
    pie.className = 'reporte-doc__pie';
    const aviso = document.createElement('p');
    aviso.textContent =
      'Documento informativo generado por ServiChile a solicitud de la empresa titular. El desglose es un mock de superficie pública (30 observables) y no sustituye auditorías oficiales.';
    const ref = document.createElement('p');
    ref.className = 'reporte-doc__ref';
    ref.textContent =
      'Referencia: ' +
      ReporteEmpresa.refId(user) +
      ' · ' +
      ReporteEmpresa.hoy();
    pie.append(aviso, ref);

    doc.append(cabezal, titular, qrBloque, resumen, desgloseWrap, pie);
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
    // Asegura que el PDF lleve las 4 dimensiones visibles.
    const todos = document.querySelector(
      '#reporteDocumento .indice-desglose__filtro--todos'
    );
    if (todos && todos.getAttribute('aria-pressed') !== 'true') todos.click();

    document.body.classList.add('reporte-print');
    const limpiar = () => {
      document.body.classList.remove('reporte-print');
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);
    window.print();
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
    return 'SC-E-' + h.toString(16).toUpperCase().padStart(8, '0');
  }
};
