// QR del reporte: emisión firmada + validación de veracidad del reporte.
const ReporteQr = {
  _renovarTimer: null,
  _scanTimer: null,
  _stream: null,
  _escaneando: false,
  _ultimoPayload: '',

  init() {
    const raiz = document.getElementById('reporteRaiz');
    if (!raiz) return;
    ReporteQr.detener();
    ReporteQr.limpiar(raiz);
    // Persona: reporte de niveles. Empresa: reporte de índice (30 observables).
    const esEmpresa =
      typeof App !== 'undefined'
        ? App.esEmpresa()
        : typeof ProgresoCuenta !== 'undefined'
          ? ProgresoCuenta.actual().es('empresa')
          : false;
    if (esEmpresa && typeof ReporteEmpresa !== 'undefined') {
      ReporteEmpresa.init();
      return;
    }
    if (typeof ReportePersona !== 'undefined') {
      ReportePersona.init();
      return;
    }
    raiz.appendChild(ReporteQr.renderShell());
    ReporteQr.cargarCarnet();
  },

  renderShell(opts) {
    const opciones = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'reporte-qr';

    if (opciones.lead) {
      const lead = document.createElement('p');
      lead.className = 'section-lead';
      lead.textContent = opciones.lead;
      wrap.appendChild(lead);
    }

    const status = document.createElement('p');
    status.className = 'status-text';
    status.id = 'reporteQrStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Cargando su reporte…';

    const carnetHost = document.createElement('div');
    carnetHost.id = 'reporteQrCarnetHost';

    const acciones = document.createElement('div');
    acciones.className = 'reporte-qr__acciones no-print';
    const btnValidar = document.createElement('button');
    btnValidar.type = 'button';
    btnValidar.className = 'submit-btn';
    btnValidar.textContent = 'Validar reporte';
    btnValidar.addEventListener('click', () => ReporteQr.abrirModalValidador());
    acciones.appendChild(btnValidar);

    wrap.append(status, carnetHost, acciones, ReporteQr.renderModalValidador());
    return wrap;
  },

  renderModalValidador() {
    const overlay = document.createElement('div');
    overlay.id = 'reporteQrModal';
    overlay.className = 'reporte-qr-modal';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');

    const dialog = document.createElement('div');
    dialog.className = 'reporte-qr-modal__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'reporteQrModalTitulo');

    const head = document.createElement('div');
    head.className = 'reporte-qr-modal__head';
    const headText = document.createElement('div');
    headText.className = 'reporte-qr-modal__head-text';
    const titulo = document.createElement('h3');
    titulo.id = 'reporteQrModalTitulo';
    titulo.className = 'reporte-qr-modal__titulo';
    titulo.textContent = 'Validar reporte';
    const lead = document.createElement('p');
    lead.className = 'reporte-qr-modal__lead';
    lead.textContent =
      'Escanee el QR del reporte de una persona o empresa para comprobar si es verídico.';
    headText.append(titulo, lead);

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'reporte-qr-modal__cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '×';
    cerrar.addEventListener('click', () => ReporteQr.cerrarModalValidador());
    head.append(headText, cerrar);

    const body = document.createElement('div');
    body.className = 'reporte-qr-modal__body';
    body.appendChild(ReporteQr.renderLector());

    dialog.append(head, body);
    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) ReporteQr.cerrarModalValidador();
    });
    return overlay;
  },

  abrirModalValidador() {
    let modal = document.getElementById('reporteQrModal');
    if (!modal) {
      const raiz = document.getElementById('reporteRaiz');
      if (!raiz) return;
      modal = ReporteQr.renderModalValidador();
      raiz.appendChild(modal);
    }
    modal.hidden = false;
    document.body.classList.add('reporte-qr-modal-open');
    if (!ReporteQr._escModalBound) {
      ReporteQr._escModalBound = (e) => {
        if (e.key === 'Escape') ReporteQr.cerrarModalValidador();
      };
      document.addEventListener('keydown', ReporteQr._escModalBound);
    }
    const btn = document.getElementById('reporteQrCamBtn');
    if (btn) btn.focus();
  },

  cerrarModalValidador() {
    const modal = document.getElementById('reporteQrModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('reporte-qr-modal-open');
    if (ReporteQr._escModalBound) {
      document.removeEventListener('keydown', ReporteQr._escModalBound);
      ReporteQr._escModalBound = null;
    }
    ReporteQr.detenerCamara();
  },

  renderLector() {
    const sec = document.createElement('section');
    sec.className = 'reporte-qr__lector';
    sec.setAttribute('aria-label', 'Lector de QR del reporte');

    const titulo = document.createElement('h3');
    titulo.className = 'reporte-qr__lector-titulo';
    titulo.textContent = 'Validar QR del reporte';

    const ayuda = document.createElement('p');
    ayuda.className = 'reporte-qr__lector-ayuda';
    ayuda.textContent =
      'Apunte al QR del reporte, suba una foto o pegue el código firmado.';

    const btnCam = document.createElement('button');
    btnCam.type = 'button';
    btnCam.className = 'reporte-qr__cam-btn';
    btnCam.id = 'reporteQrCamBtn';
    btnCam.setAttribute('aria-pressed', 'false');
    ReporteQr.pintarBotonCamara(btnCam, false);
    btnCam.addEventListener('click', () => ReporteQr.toggleCamara());

    const acciones = document.createElement('div');
    acciones.className = 'reporte-qr__lector-acciones';

    const labelFile = document.createElement('label');
    labelFile.className = 'reporte-qr__file';
    labelFile.textContent = 'Elegir foto del QR';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('capture', 'environment');
    file.hidden = true;
    file.addEventListener('change', (e) => ReporteQr.desdeArchivo(e.target.files && e.target.files[0]));
    labelFile.appendChild(file);

    acciones.appendChild(labelFile);

    const videoWrap = document.createElement('div');
    videoWrap.className = 'reporte-qr__video-wrap';
    videoWrap.id = 'reporteQrVideoWrap';
    videoWrap.hidden = true;
    const video = document.createElement('video');
    video.id = 'reporteQrVideo';
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.autoplay = true;
    const mira = document.createElement('div');
    mira.className = 'reporte-qr__mira';
    mira.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('p');
    hint.className = 'reporte-qr__video-hint';
    hint.id = 'reporteQrVideoHint';
    hint.textContent = 'Centre el QR dentro del marco';
    videoWrap.append(video, mira, hint);

    sec.append(titulo, ayuda, btnCam, videoWrap, acciones);

    const form = document.createElement('form');
    form.className = 'reporte-qr__pegar';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('reporteQrPegar');
      ReporteQr.validarPayload(input && input.value);
    });
    const pegarLabel = document.createElement('label');
    pegarLabel.className = 'auth__label';
    pegarLabel.setAttribute('for', 'reporteQrPegar');
    pegarLabel.textContent = 'O pegue el código';
    const pegar = document.createElement('input');
    pegar.className = 'auth__input';
    pegar.id = 'reporteQrPegar';
    pegar.type = 'text';
    pegar.autocomplete = 'off';
    pegar.placeholder = 'servichile://reporte-qr/…';
    const pegarBtn = document.createElement('button');
    pegarBtn.type = 'submit';
    pegarBtn.className = 'history__clear';
    pegarBtn.textContent = 'Validar';
    form.append(pegarLabel, pegar, pegarBtn);

    const resultado = document.createElement('div');
    resultado.id = 'reporteQrResultado';
    resultado.className = 'reporte-qr__resultado';
    resultado.setAttribute('aria-live', 'polite');

    const err = document.createElement('p');
    err.className = 'status-text';
    err.id = 'reporteQrLectorStatus';
    err.setAttribute('role', 'alert');

    sec.append(form, err, resultado);
    return sec;
  },

  pintarBotonCamara(btn, activo) {
    if (!btn) return;
    ReporteQr.limpiar(btn);
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'reporte-qr__cam-icon');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    if (activo) {
      // Ícono stop: cuadrado dentro de círculo.
      path.setAttribute(
        'd',
        'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3.2 6.8h6.4v6.4H8.8V8.8Z'
      );
    } else {
      // Cámara clásica.
      path.setAttribute(
        'd',
        'M9 4 7.17 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.17L15 4H9Zm3 13.5A4.5 4.5 0 1 1 16.5 13 4.5 4.5 0 0 1 12 17.5Zm0-2a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 12 15.5Z'
      );
    }
    icon.appendChild(path);
    const texto = document.createElement('span');
    texto.textContent = activo ? 'Detener cámara' : 'Escanear QR del reporte';
    btn.append(icon, texto);
    btn.classList.toggle('reporte-qr__cam-btn--activo', activo);
    btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
  },

  async emitir() {
    return Auth.request('/v1/reporte', { token: Auth.sesion.token });
  },

  async validarRemoto(payload) {
    return Auth.request('/v1/reporte/validar', {
      method: 'POST',
      body: { payload: String(payload || '').trim() },
      token: Auth.sesion.token
    });
  },

  async cargarCarnet() {
    const status = document.getElementById('reporteQrStatus');
    const host = document.getElementById('reporteQrCarnetHost');
    if (!host) return;
    if (!Auth.isAuthenticated()) {
      if (status) status.textContent = 'Inicie sesión para ver su reporte.';
      return;
    }
    const res = await ReporteQr.emitir();
    if (!res.ok) {
      if (status) status.textContent = res.error || 'No se pudo cargar el reporte.';
      return;
    }
    if (status) status.textContent = '';
    ReporteQr.limpiar(host);
    host.appendChild(ReporteQr.renderCarnet(res.data, true));
    ReporteQr.programarRenovacion(res.data.expires_in);
  },

  renderCarnet(d, propio) {
    const card = document.createElement('section');
    card.className = 'reporte-qr__carnet';
    card.setAttribute('aria-label', propio ? 'Su reporte ServiChile' : 'Reporte validado');

    const cabezal = document.createElement('header');
    cabezal.className = 'reporte-qr__cabezal';
    const tipoCuenta = ReporteQr.resolverTipoCuenta(d, propio);
    const tipoTxt = ReporteQr.etiquetaTipoCuenta(tipoCuenta);

    const marca = document.createElement('p');
    marca.className = 'reporte-qr__marca';
    marca.textContent = 'ServiChile';
    const sub = document.createElement('p');
    sub.className = 'reporte-qr__sub';
    if (propio) {
      sub.textContent = tipoTxt
        ? 'Carnet de confianza · ' + tipoTxt
        : 'Carnet de confianza';
    } else if (d.es_propio) {
      sub.textContent = 'Es su propio reporte';
    } else {
      sub.textContent = tipoTxt ? 'Carnet validado · ' + tipoTxt : 'Carnet validado';
    }
    cabezal.append(marca, sub);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'reporte-qr__cuerpo';

    if (propio && d.payload) {
      const qrCol = document.createElement('div');
      qrCol.className = 'reporte-qr__qr';
      const qrBox = document.createElement('div');
      qrBox.className = 'reporte-qr__frame';
      qrBox.id = 'reporteQrFrame';
      ReporteQr.dibujarQr(qrBox, d.payload);
      const expira = document.createElement('p');
      expira.className = 'reporte-qr__token';
      expira.textContent = 'Válido hasta ' + ReporteQr.formatoFecha(d.expires_at);
      qrCol.append(qrBox, expira);
      cuerpo.appendChild(qrCol);
    }

    // Al validar a otro: solo datos del API (persona o empresa). No usar ficha local del escáner.
    const filas = !propio
      ? ReporteQr.filasCarnetValidado(d)
      : typeof ProgresoCuenta !== 'undefined'
        ? ProgresoCuenta.para({ tipo_cuenta: tipoCuenta }).filasEstado({
            origen: 'qr',
            perfil: { tipo_cuenta: tipoCuenta },
            datos: d,
            propio
          })
        : [
            ['Tipo', tipoTxt || 'Sin indicar'],
            ['Titular', d.nombre],
            ['Estado', ReporteQr.etiquetaEstado(d.estado_pasaporte)],
            ['RUT', d.rut_verificado ? 'Verificado' : 'Sin verificar']
          ];

    const datos = document.createElement('dl');
    datos.className = 'reporte-qr__datos';
    filas.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      datos.append(dt, dd);
    });
    cuerpo.appendChild(datos);

    const pie = document.createElement('footer');
    pie.className = 'reporte-qr__pie';
    if (propio) {
      const renovar = document.createElement('button');
      renovar.type = 'button';
      renovar.className = 'history__clear';
      renovar.textContent = 'Renovar QR del reporte';
      renovar.addEventListener('click', () => ReporteQr.cargarCarnet());
      pie.appendChild(renovar);
    } else {
      pie.textContent = 'Validado en ' + ReporteQr.formatoFecha(new Date().toISOString());
    }

    card.append(cabezal, cuerpo, pie);
    return card;
  },

  dibujarQr(contenedor, payload) {
    ReporteQr.limpiar(contenedor);
    if (typeof QRCode === 'undefined') {
      const fallback = document.createElement('p');
      fallback.className = 'status-text';
      fallback.textContent = 'No se pudo cargar el generador de QR.';
      contenedor.appendChild(fallback);
      return;
    }
    // qrcodejs escribe dentro del contenedor (canvas o tabla).
    new QRCode(contenedor, {
      text: payload,
      width: 180,
      height: 180,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  },

  programarRenovacion(expiresIn) {
    if (ReporteQr._renovarTimer) clearTimeout(ReporteQr._renovarTimer);
    const seg = Number(expiresIn) || 900;
    // Renueva un minuto antes del vencimiento (mínimo 20 s).
    const espera = Math.max(20, seg - 60) * 1000;
    ReporteQr._renovarTimer = setTimeout(() => {
      const vista = document.getElementById('verifyView');
      if (!vista || vista.hidden) return;
      if (document.getElementById('reporteQrHost')) {
        if (typeof ReporteEmpresa !== 'undefined' && document.querySelector('.reporte-doc--empresa')) {
          ReporteEmpresa.cargarQrInforme();
          return;
        }
        if (typeof ReportePersona !== 'undefined') {
          ReportePersona.cargarQrInforme();
          return;
        }
      }
      ReporteQr.cargarCarnet();
    }, espera);
  },

  async toggleCamara() {
    if (ReporteQr._stream) {
      ReporteQr.detenerCamara();
      return;
    }
    const wrap = document.getElementById('reporteQrVideoWrap');
    const video = document.getElementById('reporteQrVideo');
    const btn = document.getElementById('reporteQrCamBtn');
    const status = document.getElementById('reporteQrLectorStatus');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = 'Este dispositivo no permite cámara. Use subir imagen o pegue el código.';
      return;
    }
    try {
      ReporteQr._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      if (video) {
        video.srcObject = ReporteQr._stream;
        await video.play();
      }
      if (wrap) wrap.hidden = false;
      ReporteQr.pintarBotonCamara(btn, true);
      if (status) status.textContent = 'Buscando QR… apunte al código.';
      ReporteQr.iniciarEscaneo();
    } catch {
      if (status) status.textContent = 'No se pudo abrir la cámara. Permita el acceso o use otra opción.';
      ReporteQr.detenerCamara();
    }
  },

  iniciarEscaneo() {
    if (ReporteQr._scanTimer) clearInterval(ReporteQr._scanTimer);
    if (typeof BarcodeDetector === 'undefined') {
      const status = document.getElementById('reporteQrLectorStatus');
      if (status) {
        status.textContent =
          'Su navegador no detecta QR en vivo. Capture una foto o pegue el código.';
      }
      return;
    }
    let detector;
    try {
      detector = new BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      return;
    }
    ReporteQr._scanTimer = setInterval(async () => {
      if (ReporteQr._escaneando) return;
      const video = document.getElementById('reporteQrVideo');
      if (!video || video.readyState < 2) return;
      try {
        ReporteQr._escaneando = true;
        const codes = await detector.detect(video);
        if (codes && codes.length) {
          const raw = codes[0].rawValue || '';
          if (raw && raw !== ReporteQr._ultimoPayload) {
            ReporteQr._ultimoPayload = raw;
            await ReporteQr.validarPayload(raw);
          }
        }
      } catch {
        // Ignorar frames fallidos.
      } finally {
        ReporteQr._escaneando = false;
      }
    }, 450);
  },

  async desdeArchivo(file) {
    const status = document.getElementById('reporteQrLectorStatus');
    if (!file) return;
    if (typeof BarcodeDetector === 'undefined') {
      if (status) status.textContent = 'Este navegador no puede leer QR desde imagen. Pegue el código.';
      return;
    }
    try {
      const bmp = await createImageBitmap(file);
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(bmp);
      bmp.close && bmp.close();
      if (!codes || !codes.length) {
        if (status) status.textContent = 'No se detectó un QR en la imagen.';
        return;
      }
      await ReporteQr.validarPayload(codes[0].rawValue || '');
    } catch {
      if (status) status.textContent = 'No se pudo leer la imagen.';
    }
  },

  async validarPayload(payload) {
    const status = document.getElementById('reporteQrLectorStatus');
    const host = document.getElementById('reporteQrResultado');
    const texto = String(payload || '').trim();
    if (!texto) {
      if (status) status.textContent = 'Ingrese o escanee un código QR.';
      return;
    }
    if (!Auth.isAuthenticated()) {
      if (status) status.textContent = 'Inicie sesión para validar QR.';
      return;
    }
    if (status) status.textContent = 'Validando…';
    const res = await ReporteQr.validarRemoto(texto);
    if (!res.ok) {
      if (status) status.textContent = res.error || 'No se pudo validar el QR.';
      return;
    }
    if (status) {
      status.textContent = res.data.es_propio
        ? 'Escaneó su propio reporte.'
        : 'Carnet válido.';
    }
    if (host) {
      ReporteQr.limpiar(host);
      host.appendChild(ReporteQr.renderVeredicto(res.data));
      host.appendChild(ReporteQr.renderCarnet(res.data, false));
    }
  },

  filasCarnetValidado(d) {
    const tipo = d.tipo_cuenta === 'empresa' ? 'empresa' : d.tipo_cuenta === 'persona' ? 'persona' : null;
    const tipoTxt = ReporteQr.etiquetaTipoCuenta(tipo) || 'Sin indicar';
    const filas = [
      ['Tipo de cuenta', tipoTxt],
      ['Titular', d.nombre || 'Sin nombre'],
      ['RUT', d.rut_verificado ? 'Verificado' : 'Sin verificar'],
      ['Estado', ReporteQr.etiquetaEstado(d.estado_pasaporte)]
    ];
    if (tipo === 'empresa') {
      filas.push(['Contexto', 'Empresa · reporte de transparencia']);
      if (d.score_confiabilidad != null && d.score_confiabilidad !== '') {
        filas.push(['Confiabilidad', Number(d.score_confiabilidad).toFixed(1) + '%']);
      }
    } else {
      const score =
        d.score_confiabilidad == null || d.score_confiabilidad === ''
          ? 'Sin historial'
          : Number(d.score_confiabilidad).toFixed(1) + '%';
      filas.push(['Confiabilidad', score]);
      if (d.nivel_xp != null) {
        filas.push(['Nivel XP', 'Nivel ' + d.nivel_xp]);
      }
    }
    filas.push(['Válido hasta', ReporteQr.formatoFecha(d.expires_at)]);
    return filas;
  },

  renderVeredicto(d) {
    const box = document.createElement('section');
    box.className = 'reporte-qr__veredicto';
    box.setAttribute('aria-live', 'polite');

    const rutOk = !!d.rut_verificado;
    const esEmpresa = d.tipo_cuenta === 'empresa';
    const esPersona = d.tipo_cuenta === 'persona' || (!esEmpresa && d.tipo_cuenta !== 'empresa');
    const propio = !!d.es_propio;

    let tono = 'ok';
    let titulo = 'Carnet ServiChile válido';
    let detalle = 'Se validó un código firmado de cualquier cuenta activa.';

    if (propio) {
      tono = 'warn';
      titulo = 'Es su propio reporte';
      detalle = 'Escanee el reporte de otra persona o empresa.';
    } else if (esEmpresa) {
      titulo = 'Empresa validada';
      detalle = rutOk
        ? 'Carnet de empresa válido · RUT verificado.'
        : 'Carnet de empresa válido · RUT aún pendiente.';
      if (!rutOk) tono = 'warn';
    } else if (esPersona && rutOk) {
      titulo = 'Persona validada';
      detalle = 'Carnet de persona válido · RUT verificado.';
    } else {
      tono = 'warn';
      titulo = 'Persona con RUT pendiente';
      detalle = 'El reporte es válido, pero esa cuenta aún no verifica RUT.';
    }

    box.classList.add('reporte-qr__veredicto--' + tono);

    const h = document.createElement('h3');
    h.className = 'reporte-qr__veredicto-titulo';
    h.textContent = titulo;
    const p = document.createElement('p');
    p.className = 'reporte-qr__veredicto-texto';
    p.textContent = detalle;
    box.append(h, p);
    return box;
  },

  detenerCamara() {
    if (ReporteQr._scanTimer) {
      clearInterval(ReporteQr._scanTimer);
      ReporteQr._scanTimer = null;
    }
    if (ReporteQr._stream) {
      ReporteQr._stream.getTracks().forEach((t) => t.stop());
      ReporteQr._stream = null;
    }
    const video = document.getElementById('reporteQrVideo');
    if (video) video.srcObject = null;
    const wrap = document.getElementById('reporteQrVideoWrap');
    if (wrap) wrap.hidden = true;
    ReporteQr.pintarBotonCamara(document.getElementById('reporteQrCamBtn'), false);
    ReporteQr._escaneando = false;
    ReporteQr._ultimoPayload = '';
  },

  detener() {
    if (ReporteQr._renovarTimer) {
      clearTimeout(ReporteQr._renovarTimer);
      ReporteQr._renovarTimer = null;
    }
    ReporteQr.cerrarModalValidador();
    ReporteQr.detenerCamara();
  },

  etiquetaEstado(estado) {
    const mapa = {
      basico: 'Básico',
      pendiente: 'En revisión',
      verificado: 'Verificado',
      rechazado: 'Rechazado'
    };
    return mapa[estado] || 'Básico';
  },

  etiquetaTipoCuenta(tipo) {
    if (tipo !== 'empresa' && tipo !== 'persona') return '';
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.de(tipo).etiquetaCorta()
      : tipo === 'empresa'
        ? 'Empresa'
        : 'Persona';
  },

  resolverTipoCuenta(d, propio) {
    if (d && (d.tipo_cuenta === 'empresa' || d.tipo_cuenta === 'persona')) {
      return d.tipo_cuenta;
    }
    if (!propio || typeof Auth === 'undefined') return null;
    const user = Auth.getCurrentUser();
    const tipo = user && user.perfil ? user.perfil.tipo_cuenta : null;
    return tipo === 'empresa' || tipo === 'persona' ? tipo : null;
  },

  formatoFecha(iso) {
    try {
      const d = new Date(iso);
      const fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
      return fecha + ' ' + hora;
    } catch {
      return iso;
    }
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
