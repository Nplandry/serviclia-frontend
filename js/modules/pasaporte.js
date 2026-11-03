// Pasaporte Digital de Integridad Patrimonial: selector de rubro y tarjeta de la credencial.
const Pasaporte = {
  elementos: {},

  init() {
    const raiz = document.getElementById('pasaporteRaiz');
    if (!raiz) return;
    Pasaporte.construir(raiz);
    Pasaporte.mostrar(PASAPORTE_MOCK.rubroInicial);
  },

  construir(raiz) {
    Pasaporte.limpiar(raiz);

    const selector = document.createElement('div');
    selector.className = 'pasaporte__rubros';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', 'Rubro de la verificación');
    Object.keys(PASAPORTE_MOCK.rubros).forEach(clave => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'pasaporte__rubro';
      boton.dataset.rubro = clave;
      boton.textContent = PASAPORTE_MOCK.rubros[clave].nombre;
      boton.addEventListener('click', () => Pasaporte.mostrar(clave));
      selector.appendChild(boton);
    });
    Pasaporte.elementos.botones = selector.querySelectorAll('.pasaporte__rubro');
    raiz.appendChild(selector);

    const tarjeta = document.createElement('article');
    tarjeta.className = 'pasaporte__tarjeta';
    tarjeta.setAttribute('aria-live', 'polite');

    const cabecera = document.createElement('div');
    cabecera.className = 'pasaporte__cabecera';
    const marca = document.createElement('span');
    marca.className = 'pasaporte__marca';
    marca.textContent = 'SERVICIA TRUST PASS';
    Pasaporte.elementos.badge = document.createElement('span');
    Pasaporte.elementos.badge.className = 'pasaporte__badge';
    cabecera.append(marca, Pasaporte.elementos.badge);

    const titular = document.createElement('div');
    titular.className = 'pasaporte__titular';
    const avatar = document.createElement('div');
    avatar.className = 'pasaporte__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = PASAPORTE_MOCK.titular.iniciales;
    const datos = document.createElement('div');
    const nombre = document.createElement('h3');
    nombre.className = 'pasaporte__nombre';
    nombre.textContent = PASAPORTE_MOCK.titular.nombre;
    const rut = document.createElement('p');
    rut.className = 'pasaporte__rut';
    rut.textContent = 'RUT ' + PASAPORTE_MOCK.titular.rut + ' · ' + PASAPORTE_MOCK.titular.biometria;
    const scoreFila = document.createElement('p');
    scoreFila.className = 'pasaporte__score-fila';
    const scoreEtiqueta = document.createElement('span');
    scoreEtiqueta.textContent = 'Score de certeza: ';
    Pasaporte.elementos.score = document.createElement('strong');
    Pasaporte.elementos.score.className = 'pasaporte__score';
    scoreFila.append(scoreEtiqueta, Pasaporte.elementos.score);
    datos.append(nombre, rut, scoreFila);
    titular.append(avatar, datos);

    Pasaporte.elementos.lista = document.createElement('ul');
    Pasaporte.elementos.lista.className = 'pasaporte__lista';

    const pie = document.createElement('div');
    pie.className = 'pasaporte__pie';
    const token = document.createElement('div');
    const tokenEtiqueta = document.createElement('span');
    tokenEtiqueta.className = 'pasaporte__token-etiqueta';
    tokenEtiqueta.textContent = 'Token de verificación pública';
    const tokenValor = document.createElement('span');
    tokenValor.className = 'pasaporte__token';
    tokenValor.textContent = PASAPORTE_MOCK.token;
    const validez = document.createElement('span');
    validez.className = 'pasaporte__validez';
    validez.textContent = PASAPORTE_MOCK.validoHasta;
    token.append(tokenEtiqueta, tokenValor, validez);
    pie.append(token, Pasaporte.qr());

    const descarga = document.createElement('button');
    descarga.type = 'button';
    descarga.className = 'pasaporte__descarga';
    descarga.disabled = true;
    descarga.textContent = 'Descargar pase certificado';
    const nota = document.createElement('p');
    nota.className = 'pasaporte__nota';
    nota.textContent = 'Función en desarrollo. Por ahora este pase es solo de demostración.';

    tarjeta.append(cabecera, titular, Pasaporte.elementos.lista, pie, descarga, nota);
    raiz.appendChild(tarjeta);
  },

  qr() {
    const caja = document.createElement('div');
    caja.className = 'pasaporte__qr';
    caja.setAttribute('role', 'img');
    caja.setAttribute('aria-label', 'Código QR de verificación (demostración)');
    const celdas = [
      1, 1, 1, 0, 1, 0, 1,
      1, 0, 1, 0, 0, 1, 1,
      1, 1, 1, 0, 1, 0, 0,
      0, 0, 0, 1, 0, 1, 1,
      1, 0, 1, 1, 1, 0, 1,
      0, 1, 0, 0, 1, 1, 0,
      1, 0, 1, 1, 0, 1, 1
    ];
    celdas.forEach(c => {
      const celda = document.createElement('span');
      celda.className = c ? 'pasaporte__qr-celda pasaporte__qr-celda--on' : 'pasaporte__qr-celda';
      caja.appendChild(celda);
    });
    return caja;
  },

  mostrar(clave) {
    const rubro = PASAPORTE_MOCK.rubros[clave];
    if (!rubro) return;
    Pasaporte.elementos.botones.forEach(b => {
      const activo = b.dataset.rubro === clave;
      b.classList.toggle('pasaporte__rubro--activo', activo);
      b.setAttribute('aria-pressed', String(activo));
    });
    Pasaporte.elementos.badge.textContent = rubro.badge;
    Pasaporte.elementos.score.textContent = rubro.score + ' / 100';

    Pasaporte.limpiar(Pasaporte.elementos.lista);
    rubro.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'pasaporte__item';
      const etiqueta = document.createElement('span');
      etiqueta.textContent = item.label;
      const estado = document.createElement('span');
      estado.className = 'pasaporte__estado pasaporte__estado--' + item.tono;
      estado.textContent = item.estado;
      li.append(etiqueta, estado);
      Pasaporte.elementos.lista.appendChild(li);
    });
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
