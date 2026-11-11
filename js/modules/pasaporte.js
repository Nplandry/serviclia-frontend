// Mi QR: código mock que el comercio escaneará para validar al usuario.
const Pasaporte = {
  init() {
    const raiz = document.getElementById('pasaporteRaiz');
    if (!raiz) return;
    Pasaporte.limpiar(raiz);
    raiz.appendChild(Pasaporte.render());
  },

  datosMock() {
    const sesion = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const perfil = (sesion && sesion.perfil) || {};
    const nombre = (sesion && sesion.nombre) || 'Usuario ServiChile';
    const email = (sesion && sesion.email) || 'usuario@servichile.cl';
    const nivel = Number(perfil.nivel_pasaporte) || 1;
    const score =
      perfil.score_confiabilidad == null || perfil.score_confiabilidad === ''
        ? null
        : Number(perfil.score_confiabilidad);
    const token = Pasaporte.tokenMock(email, nivel);
    return {
      nombre,
      email,
      nivel: Math.min(4, Math.max(1, Math.floor(nivel))),
      score: Number.isFinite(score) ? score : null,
      estado: perfil.estado_pasaporte || 'basico',
      token,
      payload: 'servichile://checkin/' + token,
      emitido: new Date().toISOString()
    };
  },

  tokenMock(email, nivel) {
    const base = String(email || 'anon') + '|' + String(nivel || 1);
    let h = 2166136261;
    for (let i = 0; i < base.length; i++) {
      h ^= base.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hex = (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
    return 'QR-MOCK-' + hex + '-' + String(nivel || 1);
  },

  render() {
    const d = Pasaporte.datosMock();
    const wrap = document.createElement('div');
    wrap.className = 'mi-qr';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'Muestre este carnet en el comercio. Lo escanearán para validar su identidad y nivel (datos mock).';

    const card = document.createElement('section');
    card.className = 'mi-qr__carnet';
    card.setAttribute('aria-label', 'Carnet de validación ServiChile');

    const cabezal = document.createElement('header');
    cabezal.className = 'mi-qr__cabezal';
    const marca = document.createElement('p');
    marca.className = 'mi-qr__marca';
    marca.textContent = 'ServiChile';
    const sub = document.createElement('p');
    sub.className = 'mi-qr__sub';
    sub.textContent = 'Carnet de confianza';
    cabezal.append(marca, sub);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'mi-qr__cuerpo';

    const qrCol = document.createElement('div');
    qrCol.className = 'mi-qr__qr';
    const qrBox = document.createElement('div');
    qrBox.className = 'mi-qr__frame';
    qrBox.appendChild(Pasaporte.svgQr(d.payload));
    const token = document.createElement('code');
    token.className = 'mi-qr__token';
    token.textContent = d.token;
    qrCol.append(qrBox, token);

    const datos = document.createElement('dl');
    datos.className = 'mi-qr__datos';
    [
      ['Titular', d.nombre],
      ['Correo', d.email],
      ['Nivel', 'Nivel ' + d.nivel],
      ['Estado', Pasaporte.etiquetaEstado(d.estado)],
      ['Confiabilidad', d.score == null ? 'Sin reservas cerradas' : d.score + ' / 100'],
      ['Emitido', Pasaporte.formatoFecha(d.emitido)]
    ].forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      datos.append(dt, dd);
    });

    cuerpo.append(qrCol, datos);

    const pie = document.createElement('footer');
    pie.className = 'mi-qr__pie';
    pie.textContent = 'Mock · el comercio escaneará este QR para validarlo';

    card.append(cabezal, cuerpo, pie);
    wrap.append(lead, card);
    return wrap;
  },

  // QR visual mock (patrón determinista + finders). No es un QR ISO real.
  svgQr(payload) {
    const n = 25;
    const bits = Pasaporte.matrizMock(payload, n);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + n + ' ' + n);
    svg.setAttribute('class', 'mi-qr__svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Código QR mock de validación');

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', String(n));
    bg.setAttribute('height', String(n));
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!bits[y][x]) continue;
        const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cell.setAttribute('x', String(x));
        cell.setAttribute('y', String(y));
        cell.setAttribute('width', '1');
        cell.setAttribute('height', '1');
        cell.setAttribute('fill', '#000000');
        svg.appendChild(cell);
      }
    }
    return svg;
  },

  matrizMock(payload, n) {
    const m = Array.from({ length: n }, () => Array(n).fill(false));
    let h = 2166136261;
    const s = String(payload || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        h = Math.imul(h ^ (x * 374761393 + y * 668265263), 2246822519);
        m[y][x] = (h >>> 0) % 3 !== 0;
      }
    }
    Pasaporte.dibujarFinder(m, 0, 0);
    Pasaporte.dibujarFinder(m, n - 7, 0);
    Pasaporte.dibujarFinder(m, 0, n - 7);
    return m;
  },

  dibujarFinder(m, ox, oy) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const borde = x === 0 || y === 0 || x === 6 || y === 6;
        const centro = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y][ox + x] = borde || centro;
      }
    }
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
      return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
