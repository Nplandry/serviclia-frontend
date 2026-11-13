// Mi QR: carnet firmado + lector para validar QR de persona, empresa o cualquiera.
const Pasaporte = {
  _renovarTimer: null,
  _scanTimer: null,
  _stream: null,
  _escaneando: false,
  _ultimoPayload: '',

  init() {
    const raiz = document.getElementById('pasaporteRaiz');
    if (!raiz) return;
    Pasaporte.detener();
    Pasaporte.limpiar(raiz);
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
    raiz.appendChild(Pasaporte.renderShell());
    Pasaporte.cargarCarnet();
  },

  renderShell(opts) {
    const opciones = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'mi-qr';

    if (opciones.lead) {
      const lead = document.createElement('p');
      lead.className = 'section-lead';
      lead.textContent = opciones.lead;
      wrap.appendChild(lead);
    }

    const status = document.createElement('p');
    status.className = 'status-text';
    status.id = 'miQrStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Cargando su carnet…';

    const carnetHost = document.createElement('div');
    carnetHost.id = 'miQrCarnetHost';

    const acciones = document.createElement('div');
    acciones.className = 'mi-qr__acciones no-print';
    const btnValidar = document.createElement('button');
    btnValidar.type = 'button';
    btnValidar.className = 'submit-btn';
    btnValidar.textContent = 'Validar QR';
    btnValidar.addEventListener('click', () => Pasaporte.abrirModalValidador());
    acciones.appendChild(btnValidar);

    wrap.append(status, carnetHost, acciones, Pasaporte.renderModalValidador());
    return wrap;
  },

  renderModalValidador() {
    const overlay = document.createElement('div');
    overlay.id = 'miQrModal';
    overlay.className = 'mi-qr-modal';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');

    const dialog = document.createElement('div');
    dialog.className = 'mi-qr-modal__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'miQrModalTitulo');

    const head = document.createElement('div');
    head.className = 'mi-qr-modal__head';
    const headText = document.createElement('div');
    headText.className = 'mi-qr-modal__head-text';
    const titulo = document.createElement('h3');
    titulo.id = 'miQrModalTitulo';
    titulo.className = 'mi-qr-modal__titulo';
    titulo.textContent = 'Validar QR';
    const lead = document.createElement('p');
    lead.className = 'mi-qr-modal__lead';
    lead.textContent =
      'Funciona con QR de persona, empresa o cualquier cuenta ServiChile. Escanee, suba una foto o pegue el código.';
    headText.append(titulo, lead);

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'mi-qr-modal__cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '×';
    cerrar.addEventListener('click', () => Pasaporte.cerrarModalValidador());
    head.append(headText, cerrar);

    const body = document.createElement('div');
    body.className = 'mi-qr-modal__body';
    body.appendChild(Pasaporte.renderLector());

    dialog.append(head, body);
    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Pasaporte.cerrarModalValidador();
    });
    return overlay;
  },

  abrirModalValidador() {
    let modal = document.getElementById('miQrModal');
    if (!modal) {
      const raiz = document.getElementById('pasaporteRaiz');
      if (!raiz) return;
      modal = Pasaporte.renderModalValidador();
      raiz.appendChild(modal);
    }
    modal.hidden = false;
    document.body.classList.add('mi-qr-modal-open');
    if (!Pasaporte._escModalBound) {
      Pasaporte._escModalBound = (e) => {
        if (e.key === 'Escape') Pasaporte.cerrarModalValidador();
      };
      document.addEventListener('keydown', Pasaporte._escModalBound);
    }
    const btn = document.getElementById('miQrCamBtn');
    if (btn) btn.focus();
  },

  cerrarModalValidador() {
    const modal = document.getElementById('miQrModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('mi-qr-modal-open');
    if (Pasaporte._escModalBound) {
      document.removeEventListener('keydown', Pasaporte._escModalBound);
      Pasaporte._escModalBound = null;
    }
    Pasaporte.detenerCamara();
  },

  renderLector() {
    const sec = document.createElement('section');
    sec.className = 'mi-qr__lector';
    sec.setAttribute('aria-label', 'Lector de QR');

    const titulo = document.createElement('h3');
    titulo.className = 'mi-qr__lector-titulo';
    titulo.textContent = 'Validar QR de cualquiera';

    const ayuda = document.createElement('p');
    ayuda.className = 'mi-qr__lector-ayuda';
    ayuda.textContent =
      'Persona o empresa: apunte al QR, suba una foto o pegue el código.';

    const btnCam = document.createElement('button');
    btnCam.type = 'button';
    btnCam.className = 'mi-qr__cam-btn';
    btnCam.id = 'miQrCamBtn';
    btnCam.setAttribute('aria-pressed', 'false');
    Pasaporte.pintarBotonCamara(btnCam, false);
    btnCam.addEventListener('click', () => Pasaporte.toggleCamara());

    const acciones = document.createElement('div');
    acciones.className = 'mi-qr__lector-acciones';

    const labelFile = document.createElement('label');
    labelFile.className = 'mi-qr__file';
    labelFile.textContent = 'Elegir foto del QR';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('capture', 'environment');
    file.hidden = true;
    file.addEventListener('change', (e) => Pasaporte.desdeArchivo(e.target.files && e.target.files[0]));
    labelFile.appendChild(file);

    acciones.appendChild(labelFile);

    const videoWrap = document.createElement('div');
    videoWrap.className = 'mi-qr__video-wrap';
    videoWrap.id = 'miQrVideoWrap';
    videoWrap.hidden = true;
    const video = document.createElement('video');
    video.id = 'miQrVideo';
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.autoplay = true;
    const mira = document.createElement('div');
    mira.className = 'mi-qr__mira';
    mira.setAttribute('aria-hidden', 'true');
    const hint = document.createElement('p');
    hint.className = 'mi-qr__video-hint';
    hint.id = 'miQrVideoHint';
    hint.textContent = 'Centre el QR dentro del marco';
    videoWrap.append(video, mira, hint);

    sec.append(titulo, ayuda, btnCam, videoWrap, acciones);

    const form = document.createElement('form');
    form.className = 'mi-qr__pegar';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('miQrPegar');
      Pasaporte.validarPayload(input && input.value);
    });
    const pegarLabel = document.createElement('label');
    pegarLabel.className = 'auth__label';
    pegarLabel.setAttribute('for', 'miQrPegar');
    pegarLabel.textContent = 'O pegue el código';
    const pegar = document.createElement('input');
    pegar.className = 'auth__input';
    pegar.id = 'miQrPegar';
    pegar.type = 'text';
    pegar.autocomplete = 'off';
    pegar.placeholder = 'servichile://mi-qr/…';
    const pegarBtn = document.createElement('button');
    pegarBtn.type = 'submit';
    pegarBtn.className = 'history__clear';
    pegarBtn.textContent = 'Validar';
    form.append(pegarLabel, pegar, pegarBtn);

    const resultado = document.createElement('div');
    resultado.id = 'miQrResultado';
    resultado.className = 'mi-qr__resultado';
    resultado.setAttribute('aria-live', 'polite');

    const err = document.createElement('p');
    err.className = 'status-text';
    err.id = 'miQrLectorStatus';
    err.setAttribute('role', 'alert');

    sec.append(form, err, resultado);
    return sec;
  },

  pintarBotonCamara(btn, activo) {
    if (!btn) return;
    Pasaporte.limpiar(btn);
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'mi-qr__cam-icon');
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
    texto.textContent = activo ? 'Detener cámara' : 'Escanear QR con la cámara';
    btn.append(icon, texto);
    btn.classList.toggle('mi-qr__cam-btn--activo', activo);
    btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
  },

  async cargarCarnet() {
    const status = document.getElementById('miQrStatus');
    const host = document.getElementById('miQrCarnetHost');
    if (!host) return;
    if (!Auth.isAuthenticated()) {
      if (status) status.textContent = 'Inicie sesión para ver su carnet.';
      return;
    }
    const res = await Auth.request('/v1/mi-qr', { token: Auth.sesion.token });
    if (!res.ok) {
      if (status) status.textContent = res.error || 'No se pudo cargar el carnet.';
      return;
    }
    if (status) status.textContent = '';
    Pasaporte.limpiar(host);
    host.appendChild(Pasaporte.renderCarnet(res.data, true));
    Pasaporte.programarRenovacion(res.data.expires_in);
  },

  renderCarnet(d, propio) {
    const card = document.createElement('section');
    card.className = 'mi-qr__carnet';
    card.setAttribute('aria-label', propio ? 'Su carnet ServiChile' : 'Carnet validado');

    const cabezal = document.createElement('header');
    cabezal.className = 'mi-qr__cabezal';
    const tipoCuenta = Pasaporte.resolverTipoCuenta(d, propio);
    const tipoTxt = Pasaporte.etiquetaTipoCuenta(tipoCuenta);

    const marca = document.createElement('p');
    marca.className = 'mi-qr__marca';
    marca.textContent = 'ServiChile';
    const sub = document.createElement('p');
    sub.className = 'mi-qr__sub';
    if (propio) {
      sub.textContent = tipoTxt
        ? 'Carnet de confianza · ' + tipoTxt
        : 'Carnet de confianza';
    } else if (d.es_propio) {
      sub.textContent = 'Es su propio QR';
    } else {
      sub.textContent = tipoTxt ? 'Carnet validado · ' + tipoTxt : 'Carnet validado';
    }
    cabezal.append(marca, sub);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'mi-qr__cuerpo';

    if (propio && d.payload) {
      const qrCol = document.createElement('div');
      qrCol.className = 'mi-qr__qr';
      const qrBox = document.createElement('div');
      qrBox.className = 'mi-qr__frame';
      qrBox.id = 'miQrFrame';
      Pasaporte.dibujarQr(qrBox, d.payload);
      const expira = document.createElement('p');
      expira.className = 'mi-qr__token';
      expira.textContent = 'Válido hasta ' + Pasaporte.formatoFecha(d.expires_at);
      qrCol.append(qrBox, expira);
      cuerpo.appendChild(qrCol);
    }

    // Al validar a otro: solo datos del API (persona o empresa). No usar ficha local del escáner.
    const filas = !propio
      ? Pasaporte.filasCarnetValidado(d)
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
            ['Estado', Pasaporte.etiquetaEstado(d.estado_pasaporte)],
            ['RUT', d.rut_verificado ? 'Verificado' : 'Sin verificar']
          ];

    const datos = document.createElement('dl');
    datos.className = 'mi-qr__datos';
    filas.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      datos.append(dt, dd);
    });
    cuerpo.appendChild(datos);

    const pie = document.createElement('footer');
    pie.className = 'mi-qr__pie';
    if (propio) {
      const renovar = document.createElement('button');
      renovar.type = 'button';
      renovar.className = 'history__clear';
      renovar.textContent = 'Renovar QR';
      renovar.addEventListener('click', () => Pasaporte.cargarCarnet());
      pie.appendChild(renovar);
    } else {
      pie.textContent = 'Validado en ' + Pasaporte.formatoFecha(new Date().toISOString());
    }

    card.append(cabezal, cuerpo, pie);
    return card;
  },

  dibujarQr(contenedor, payload) {
    Pasaporte.limpiar(contenedor);
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
    if (Pasaporte._renovarTimer) clearTimeout(Pasaporte._renovarTimer);
    const seg = Number(expiresIn) || 900;
    // Renueva un minuto antes del vencimiento (mínimo 20 s).
    const espera = Math.max(20, seg - 60) * 1000;
    Pasaporte._renovarTimer = setTimeout(() => {
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
      Pasaporte.cargarCarnet();
    }, espera);
  },

  async toggleCamara() {
    if (Pasaporte._stream) {
      Pasaporte.detenerCamara();
      return;
    }
    const wrap = document.getElementById('miQrVideoWrap');
    const video = document.getElementById('miQrVideo');
    const btn = document.getElementById('miQrCamBtn');
    const status = document.getElementById('miQrLectorStatus');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = 'Este dispositivo no permite cámara. Use subir imagen o pegue el código.';
      return;
    }
    try {
      Pasaporte._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      if (video) {
        video.srcObject = Pasaporte._stream;
        await video.play();
      }
      if (wrap) wrap.hidden = false;
      Pasaporte.pintarBotonCamara(btn, true);
      if (status) status.textContent = 'Buscando QR… apunte al código.';
      Pasaporte.iniciarEscaneo();
    } catch {
      if (status) status.textContent = 'No se pudo abrir la cámara. Permita el acceso o use otra opción.';
      Pasaporte.detenerCamara();
    }
  },

  iniciarEscaneo() {
    if (Pasaporte._scanTimer) clearInterval(Pasaporte._scanTimer);
    if (typeof BarcodeDetector === 'undefined') {
      const status = document.getElementById('miQrLectorStatus');
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
    Pasaporte._scanTimer = setInterval(async () => {
      if (Pasaporte._escaneando) return;
      const video = document.getElementById('miQrVideo');
      if (!video || video.readyState < 2) return;
      try {
        Pasaporte._escaneando = true;
        const codes = await detector.detect(video);
        if (codes && codes.length) {
          const raw = codes[0].rawValue || '';
          if (raw && raw !== Pasaporte._ultimoPayload) {
            Pasaporte._ultimoPayload = raw;
            await Pasaporte.validarPayload(raw);
          }
        }
      } catch {
        // Ignorar frames fallidos.
      } finally {
        Pasaporte._escaneando = false;
      }
    }, 450);
  },

  async desdeArchivo(file) {
    const status = document.getElementById('miQrLectorStatus');
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
      await Pasaporte.validarPayload(codes[0].rawValue || '');
    } catch {
      if (status) status.textContent = 'No se pudo leer la imagen.';
    }
  },

  async validarPayload(payload) {
    const status = document.getElementById('miQrLectorStatus');
    const host = document.getElementById('miQrResultado');
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
    const res = await Auth.request('/v1/mi-qr/validar', {
      method: 'POST',
      body: { payload: texto },
      token: Auth.sesion.token
    });
    if (!res.ok) {
      if (status) status.textContent = res.error || 'No se pudo validar el QR.';
      return;
    }
    if (status) {
      status.textContent = res.data.es_propio
        ? 'Escaneó su propio carnet.'
        : 'Carnet válido.';
    }
    if (host) {
      Pasaporte.limpiar(host);
      host.appendChild(Pasaporte.renderVeredicto(res.data));
      host.appendChild(Pasaporte.renderCarnet(res.data, false));
    }
  },

  filasCarnetValidado(d) {
    const tipo = d.tipo_cuenta === 'empresa' ? 'empresa' : d.tipo_cuenta === 'persona' ? 'persona' : null;
    const tipoTxt = Pasaporte.etiquetaTipoCuenta(tipo) || 'Sin indicar';
    const filas = [
      ['Tipo de cuenta', tipoTxt],
      ['Titular', d.nombre || 'Sin nombre'],
      ['RUT', d.rut_verificado ? 'Verificado' : 'Sin verificar'],
      ['Estado', Pasaporte.etiquetaEstado(d.estado_pasaporte)]
    ];
    if (tipo === 'empresa') {
      filas.push(['Contexto', 'Empresa · carnet de identidad corporativa']);
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
    filas.push(['Válido hasta', Pasaporte.formatoFecha(d.expires_at)]);
    return filas;
  },

  renderVeredicto(d) {
    const box = document.createElement('section');
    box.className = 'mi-qr__veredicto';
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
      titulo = 'Es su propio QR';
      detalle = 'Escanee el carnet de otra persona o empresa.';
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
      detalle = 'El carnet es válido, pero esa cuenta aún no verifica RUT.';
    }

    box.classList.add('mi-qr__veredicto--' + tono);

    const h = document.createElement('h3');
    h.className = 'mi-qr__veredicto-titulo';
    h.textContent = titulo;
    const p = document.createElement('p');
    p.className = 'mi-qr__veredicto-texto';
    p.textContent = detalle;
    box.append(h, p);
    return box;
  },

  detenerCamara() {
    if (Pasaporte._scanTimer) {
      clearInterval(Pasaporte._scanTimer);
      Pasaporte._scanTimer = null;
    }
    if (Pasaporte._stream) {
      Pasaporte._stream.getTracks().forEach((t) => t.stop());
      Pasaporte._stream = null;
    }
    const video = document.getElementById('miQrVideo');
    if (video) video.srcObject = null;
    const wrap = document.getElementById('miQrVideoWrap');
    if (wrap) wrap.hidden = true;
    Pasaporte.pintarBotonCamara(document.getElementById('miQrCamBtn'), false);
    Pasaporte._escaneando = false;
    Pasaporte._ultimoPayload = '';
  },

  detener() {
    if (Pasaporte._renovarTimer) {
      clearTimeout(Pasaporte._renovarTimer);
      Pasaporte._renovarTimer = null;
    }
    Pasaporte.cerrarModalValidador();
    Pasaporte.detenerCamara();
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
