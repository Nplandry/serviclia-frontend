// Mockup visual de Niveles de Confianza.
const Pasaporte = {
  NIVELES: [
    {
      id: 1,
      nombre: 'Básico',
      pide: 'Cédula y registro',
      abre: 'Eventos, reservas, comercios',
      especial: false
    },
    {
      id: 2,
      nombre: 'Disciplina',
      pide: 'Asistencia y puntualidad',
      abre: 'Descuentos y prioridad',
      especial: false
    },
    {
      id: 3,
      nombre: 'Cívico',
      pide: 'Antecedentes, biometría y aval',
      abre: 'Galas y preventas',
      especial: false
    },
    {
      id: 4,
      nombre: 'Financiero',
      pide: 'Liquidación o AFP',
      abre: 'Solo arriendos',
      especial: true
    }
  ],

  init() {
    const raiz = document.getElementById('pasaporteRaiz');
    if (!raiz) return;
    Pasaporte.render(raiz);
  },

  nivelActual() {
    const sesion = Auth.getCurrentUser();
    const nivel = sesion && sesion.perfil ? Number(sesion.perfil.nivel_pasaporte) : 1;
    if (!Number.isFinite(nivel) || nivel < 1) return 1;
    return Math.min(4, Math.max(1, Math.floor(nivel)));
  },

  estadoArriendo() {
    const sesion = Auth.getCurrentUser();
    return sesion && sesion.perfil ? sesion.perfil.estado_pasaporte : 'basico';
  },

  render(raiz) {
    Pasaporte.limpiar(raiz);
    const actual = Pasaporte.nivelActual();
    const info = Pasaporte.NIVELES.find(n => n.id === actual) || Pasaporte.NIVELES[0];

    raiz.append(
      Pasaporte.heroNivel(info),
      Pasaporte.barraProgreso(actual),
      Pasaporte.listaNiveles(actual)
    );
  },

  heroNivel(info) {
    const hero = document.createElement('div');
    hero.className = 'niveles__hero' + (info.especial ? ' niveles__hero--especial' : '');
    hero.setAttribute('aria-live', 'polite');

    const etiqueta = document.createElement('p');
    etiqueta.className = 'niveles__hero-etiqueta';
    etiqueta.textContent = 'Tu nivel ahora';

    const fila = document.createElement('div');
    fila.className = 'niveles__hero-fila';

    const num = document.createElement('span');
    num.className = 'niveles__hero-num';
    num.textContent = String(info.id);

    const texto = document.createElement('div');
    texto.className = 'niveles__hero-texto';

    const nombre = document.createElement('p');
    nombre.className = 'niveles__hero-nombre';
    nombre.textContent = info.nombre;

    const pista = document.createElement('p');
    pista.className = 'niveles__hero-pista';
    pista.textContent = 'Subes de nivel con tu conducta.';

    texto.append(nombre, pista);
    fila.append(num, texto);
    hero.append(etiqueta, fila);
    return hero;
  },

  barraProgreso(actual) {
    const wrap = document.createElement('div');
    wrap.className = 'niveles__progreso';
    wrap.setAttribute('aria-label', 'Mapa de niveles');

    const pista = document.createElement('ol');
    pista.className = 'niveles__pista';

    Pasaporte.NIVELES.forEach(n => {
      const li = document.createElement('li');
      li.className = 'niveles__paso';
      if (n.id < actual) li.classList.add('niveles__paso--hecho');
      if (n.id === actual) li.classList.add('niveles__paso--actual');
      if (n.id > actual) li.classList.add('niveles__paso--bloqueado');
      if (n.especial) li.classList.add('niveles__paso--especial');

      const num = document.createElement('span');
      num.className = 'niveles__paso-num';
      num.textContent = String(n.id);

      const label = document.createElement('span');
      label.className = 'niveles__paso-label';
      label.textContent = n.nombre;

      li.append(num, label);

      if (n.id === actual) {
        const aqui = document.createElement('span');
        aqui.className = 'niveles__aqui';
        aqui.textContent = 'Aquí';
        li.appendChild(aqui);
      }

      pista.appendChild(li);
    });

    wrap.appendChild(pista);
    return wrap;
  },

  listaNiveles(actual) {
    const lista = document.createElement('div');
    lista.className = 'niveles__lista';
    lista.setAttribute('role', 'list');

    Pasaporte.NIVELES.forEach((n, i) => {
      const item = document.createElement('article');
      item.className = 'niveles__item';
      item.setAttribute('role', 'listitem');
      item.style.setProperty('--niveles-i', String(i));
      if (n.id === actual) item.classList.add('niveles__item--actual');
      if (n.id < actual) item.classList.add('niveles__item--hecho');
      if (n.id > actual) item.classList.add('niveles__item--bloqueado');
      if (n.especial) item.classList.add('niveles__item--especial');

      const head = document.createElement('header');
      head.className = 'niveles__item-head';

      const num = document.createElement('span');
      num.className = 'niveles__badge';
      num.textContent = String(n.id);

      const nombre = document.createElement('h3');
      nombre.className = 'niveles__nombre';
      nombre.textContent = n.nombre;

      const estado = document.createElement('span');
      estado.className = 'niveles__estado';
      estado.textContent = Pasaporte.etiquetaEstado(n, actual);

      head.append(num, nombre, estado);

      const meta = document.createElement('ul');
      meta.className = 'niveles__meta';
      [
        ['Pide', n.pide],
        ['Abre', n.abre]
      ].forEach(([k, v]) => {
        const li = document.createElement('li');
        const key = document.createElement('span');
        key.className = 'niveles__meta-key';
        key.textContent = k;
        const val = document.createElement('span');
        val.className = 'niveles__meta-val';
        val.textContent = v;
        li.append(key, val);
        meta.appendChild(li);
      });

      item.append(head, meta);
      lista.appendChild(item);
    });

    return lista;
  },

  etiquetaEstado(nivel, actual) {
    if (nivel.especial) {
      const arriendo = Pasaporte.estadoArriendo();
      if (arriendo === 'verificado') return 'Activo';
      if (arriendo === 'pendiente') return 'En revisión';
      if (arriendo === 'rechazado') return 'Rechazado';
      return 'Opcional';
    }
    if (nivel.id < actual) return 'Listo';
    if (nivel.id === actual) return 'Estás aquí';
    return 'Bloqueado';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
