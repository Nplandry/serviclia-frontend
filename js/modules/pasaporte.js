// Mi QR: carnet real firmado por la API + lector para validar QR de otras personas.
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
    raiz.appendChild(Pasaporte.renderShell());
    Pasaporte.cargarCarnet();
  },

  renderShell() {
    const wrap = document.createElement('div');
    wrap.className = 'mi-qr';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'Muestre este carnet en el comercio o escanee el QR de otra persona para validar su nivel de confianza.';

    const status = document.createElement('p');
    status.className = 'status-text';
    status.id = 'miQrStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Cargando su carnet…';

    const carnetHost = document.createElement('div');
    carnetHost.id = 'miQrCarnetHost';

    const lector = Pasaporte.renderLector();
    wrap.append(lead, status, carnetHost, lector);
    return wrap;
  },

  renderLector() {
    const sec = document.createElement('section');
    sec.className = 'mi-qr__lector';
    sec.setAttribute('aria-label', 'Lector de QR');

    const titulo = document.createElement('h3');
    titulo.className = 'mi-qr__lector-titulo';
    titulo.textContent = 'Validar QR de otra persona';

    const ayuda = document.createElement('p');
    ayuda.className = 'mi-qr__lector-ayuda';
    ayuda.textContent =
      'Apunte al QR de la otra persona. Si no puede usar cámara, suba una foto o pegue el código.';

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
    const marca = document.createElement('p');
    marca.className = 'mi-qr__marca';
    marca.textContent = 'ServiChile';
    const sub = document.createElement('p');
    sub.className = 'mi-qr__sub';
    sub.textContent = propio ? 'Carnet de confianza' : d.es_propio ? 'Es su propio QR' : 'Carnet validado';
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

    const filas = [
      ['Titular', d.nombre],
      propio && d.email ? ['Correo', d.email] : null,
      ['Nivel pasaporte', 'Nivel ' + d.nivel_pasaporte],
      ['XP', (d.xp != null ? d.xp : 0) + ' · Nivel ' + (d.nivel_xp || 1)],
      ['Estado', Pasaporte.etiquetaEstado(d.estado_pasaporte)],
      [
        'Confiabilidad',
        d.score_confiabilidad == null ? 'Sin reservas cerradas' : d.score_confiabilidad + ' / 100'
      ],
      ['RUT', d.rut_verificado ? 'Verificado' : 'Sin verificar']
    ].filter(Boolean);

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
      if (document.getElementById('verifyView') && !document.getElementById('verifyView').hidden) {
        Pasaporte.cargarCarnet();
      }
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
    if (status) status.textContent = res.data.es_propio ? 'Escaneó su propio carnet.' : 'Carnet válido.';
    if (host) {
      Pasaporte.limpiar(host);
      host.appendChild(Pasaporte.renderCarnet(res.data, false));
    }
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
