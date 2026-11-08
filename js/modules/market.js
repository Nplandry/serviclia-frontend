// Marketplace: grilla de tarjetas de comercios, arriendos y eventos.
// Consume GET /v1/businesses (público). "Geolocalizado" = ordena por cercanía a la ubicación
// del usuario (o a un punto de referencia si no da permiso) y muestra la distancia estimada.
const Market = {
  CATEGORIAS: [
    { id: 'all', label: 'Todos' },
    { id: 'gimnasio', label: 'Gimnasios' },
    { id: 'clinica-dental', label: 'Salud' },
    { id: 'restaurante', label: 'Comida' },
    { id: 'comercio', label: 'Comercio' },
    { id: 'arriendo', label: 'Arriendos' },
    { id: 'evento', label: 'Eventos' },
    { id: 'automotriz', label: 'Automotriz' }
  ],
  // Punto de referencia por defecto (Providencia) si el usuario no comparte su ubicación.
  REF_DEFECTO: { lat: -33.4265, lng: -70.6190 },

  negocios: [],
  categoria: 'all',
  busqueda: '',
  ref: null,
  timer: null,

  init() {
    Market.el = {
      search: document.getElementById('marketSearch'),
      filters: document.getElementById('marketFilters'),
      count: document.getElementById('marketCount'),
      grid: document.getElementById('marketGrid'),
      status: document.getElementById('marketStatus')
    };
    if (!Market.el.grid) return;
    if (!Market.el.bound) {
      Market.el.search.addEventListener('input', Market.onBuscar);
      Market.el.bound = true;
    }
    Market.renderFiltros();
    Market.pedirUbicacion();
    Market.cargar();
  },

  // Pide la ubicación una sola vez; si la obtiene, reordena por cercanía real.
  pedirUbicacion() {
    if (Market.ref || !navigator.geolocation) {
      Market.ref = Market.ref || Market.REF_DEFECTO;
      return;
    }
    Market.ref = Market.REF_DEFECTO;
    navigator.geolocation.getCurrentPosition(
      pos => {
        Market.ref = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (Market.negocios.length) Market.render();
      },
      () => {}  // sin permiso: se mantiene el punto de referencia por defecto
    );
  },

  onBuscar() {
    Market.busqueda = Market.el.search.value.trim();
    clearTimeout(Market.timer);
    Market.timer = setTimeout(Market.cargar, 250);
  },

  async cargar() {
    Market.el.status.textContent = 'Cargando...';
    const params = new URLSearchParams();
    if (Market.categoria !== 'all') params.set('categoria', Market.categoria);
    if (Market.busqueda) params.set('q', Market.busqueda);
    const qs = params.toString();
    const res = await Auth.request('/v1/businesses' + (qs ? '?' + qs : ''));
    if (!res.ok) {
      Market.el.status.textContent = 'No se pudieron cargar los lugares. Intente de nuevo.';
      return;
    }
    Market.el.status.textContent = '';
    Market.negocios = res.data;
    Market.render();
  },

  render() {
    const lista = Market.ordenarPorCercania(Market.negocios);
    Market.el.count.textContent = `${lista.length} lugar${lista.length === 1 ? '' : 'es'}`;
    Market.limpiar(Market.el.grid);
    if (lista.length === 0) {
      const vacio = document.createElement('p');
      vacio.className = 'market__vacio';
      vacio.textContent = 'No se encontraron resultados para esta búsqueda.';
      Market.el.grid.appendChild(vacio);
      return;
    }
    lista.forEach(n => Market.el.grid.appendChild(Market.tarjeta(n)));
  },

  tarjeta(n) {
    const card = document.createElement('article');
    card.className = 'market__card';

    // Cabecera: categoría + estado de verificación
    const top = document.createElement('div');
    top.className = 'market__card-top';
    const cat = document.createElement('span');
    cat.className = 'market__chip';
    const icono = document.createElement('span');
    icono.className = 'market__icono';
    icono.innerHTML = ICONOS_SVG[ICONO_NEGOCIO[n.categoria] || 'pin'];
    const catLbl = document.createElement('span');
    catLbl.textContent = Market.etiquetaDe(n.categoria);
    cat.append(icono, catLbl);
    const estado = document.createElement('span');
    estado.className = 'market__estado' + (n.is_verified_profile ? ' market__estado--ok' : '');
    estado.textContent = n.is_verified_profile ? 'Verificado' : 'Índice básico';
    top.append(cat, estado);

    const nombre = document.createElement('h3');
    nombre.className = 'market__card-nombre';
    nombre.textContent = n.nombre;

    const dir = document.createElement('p');
    dir.className = 'market__card-dir';
    const dist = Market.distanciaTexto(n);
    dir.textContent = n.direccion + (dist ? ' · ' + dist : '');

    const desc = document.createElement('p');
    desc.className = 'market__card-desc';
    desc.textContent = n.descripcion || '';

    // Pie: índice + CTA
    const pie = document.createElement('div');
    pie.className = 'market__card-pie';
    const score = document.createElement('span');
    score.className = 'market__card-score';
    score.innerHTML = '';
    const num = document.createElement('strong');
    num.textContent = '★ ' + n.indice_transparencia.toFixed(1);
    const lbl = document.createElement('span');
    lbl.className = 'market__card-score-lbl';
    lbl.textContent = ' Índice';
    score.append(num, lbl);

    const cta = document.createElement('button');
    cta.type = 'button';
    const bloqueado = n.requiere_nivel >= 2 && Market.nivelUsuario() < 2;
    cta.className = 'market__cta' + (bloqueado ? ' market__cta--bloqueado' : '');
    cta.textContent = bloqueado ? 'Verificar Pasaporte' : Market.textoCta(n.categoria);
    cta.addEventListener('click', () => Market.accion(n, bloqueado));

    pie.append(score, cta);
    card.append(top, nombre, dir, desc, pie);
    return card;
  },

  // Ordena por distancia al punto de referencia (recomendación geolocalizada).
  ordenarPorCercania(negocios) {
    const ref = Market.ref || Market.REF_DEFECTO;
    return negocios
      .map(n => ({ n, d: Market.distanciaKm(n, ref) }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
      .map(x => x.n);
  },

  // Distancia aproximada en km (fórmula de Haversine).
  distanciaKm(n, ref) {
    if (n.latitud == null || n.longitud == null) return null;
    const R = 6371;
    const dLat = (n.latitud - ref.lat) * Math.PI / 180;
    const dLng = (n.longitud - ref.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(ref.lat * Math.PI / 180) * Math.cos(n.latitud * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  distanciaTexto(n) {
    const d = Market.distanciaKm(n, Market.ref || Market.REF_DEFECTO);
    if (d == null) return '';
    return d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km';
  },

  renderFiltros() {
    Market.limpiar(Market.el.filters);
    Market.CATEGORIAS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'market__filtro' + (Market.categoria === c.id ? ' market__filtro--activo' : '');
      b.textContent = c.label;
      b.addEventListener('click', () => {
        Market.categoria = c.id;
        Market.renderFiltros();
        Market.cargar();
      });
      Market.el.filters.appendChild(b);
    });
  },

  accion(n, bloqueado) {
    if (bloqueado) {
      App.openSection('perfil');
      return;
    }
    window.alert('Solicitud enviada para ' + n.nombre + '.');
  },

  nivelUsuario() {
    const sesion = Auth.getCurrentUser();
    return sesion && sesion.perfil ? (sesion.perfil.nivel_pasaporte || 1) : 1;
  },

  etiquetaDe(cat) {
    const c = Market.CATEGORIAS.find(x => x.id === cat);
    return c ? c.label : cat;
  },

  textoCta(cat) {
    const textos = {
      gimnasio: 'Agendar pase',
      'clinica-dental': 'Agendar cita',
      restaurante: 'Reservar mesa',
      arriendo: 'Postular',
      evento: 'Reservar ticket',
      comercio: 'Ver comercio',
      automotriz: 'Ver servicio'
    };
    return textos[cat] || 'Ver más';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
