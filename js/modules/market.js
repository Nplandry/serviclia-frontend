// Marketplace: grilla de tarjetas y ficha de detalle.
// Consume GET /v1/businesses. Ordena por cercanía a la ubicación del usuario.
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
  REF_DEFECTO: { lat: -33.4265, lng: -70.6190 },

  negocios: [],
  categoria: 'all',
  busqueda: '',
  ref: null,
  timer: null,
  seleccionado: null,

  init() {
    Market.el = {
      list: document.getElementById('marketList'),
      detail: document.getElementById('marketDetail'),
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
    Market.cerrarDetalle();
    Market.renderFiltros();
    Market.pedirUbicacion();
    Market.cargar();
  },

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
      () => {}
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
    const bloqueado = Market.estaBloqueado(n);
    const card = document.createElement('article');
    card.className = 'market__card market__card--click' + (bloqueado ? ' market__card--nivel' : '');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute(
      'aria-label',
      bloqueado
        ? n.nombre + '. Pide nivel ' + (n.requiere_nivel || 1)
        : 'Ver detalle de ' + n.nombre
    );
    card.addEventListener('click', () => Market.abrirDetalle(n));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Market.abrirDetalle(n);
      }
    });

    const media = document.createElement('div');
    media.className = 'market__media';

    const foto = document.createElement('img');
    foto.className = 'market__foto';
    foto.src = n.imagen_url || '';
    foto.alt = '';
    foto.loading = 'lazy';
    foto.decoding = 'async';

    const top = document.createElement('div');
    top.className = 'market__card-top';
    top.append(Market.chipCategoria(n), Market.logoMarca(n));
    media.append(foto, top);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'market__card-body';

    const nombre = document.createElement('h3');
    nombre.className = 'market__card-nombre';
    nombre.textContent = n.nombre;

    const dir = document.createElement('p');
    dir.className = 'market__card-dir';
    dir.textContent = Market.textoDireccion(n);

    const desc = document.createElement('p');
    desc.className = 'market__card-desc';
    desc.textContent = n.descripcion || '';

    const pie = document.createElement('div');
    pie.className = 'market__card-pie';
    pie.append(
      Market.bloqueIndice(n),
      bloqueado ? Market.avisoNivel(n) : Market.selloVerificado(n)
    );

    cuerpo.append(nombre, dir, desc, pie);
    card.append(media, cuerpo);
    return card;
  },

  async abrirDetalle(n) {
    Market.seleccionado = n;
    if (Market.el.list) Market.el.list.hidden = true;
    if (Market.el.detail) {
      Market.el.detail.hidden = false;
      Market.renderDetalle(n, { cargando: true });
    }
    window.scrollTo(0, 0);

    const res = await Auth.request('/v1/businesses/' + encodeURIComponent(n.id) + '/reputation');
    if (!Market.seleccionado || Market.seleccionado.id !== n.id) return;
    if (!res.ok) {
      Market.renderDetalle(n, { error: res.error || 'No se pudo cargar la reputación.' });
      return;
    }
    Market.renderDetalle(n, { reputacion: res.data });
  },

  cerrarDetalle() {
    Market.seleccionado = null;
    if (Market.el.list) Market.el.list.hidden = false;
    if (Market.el.detail) {
      Market.el.detail.hidden = true;
      Market.limpiar(Market.el.detail);
    }
  },

  renderDetalle(n, extras) {
    const raiz = Market.el.detail;
    Market.limpiar(raiz);
    const bloqueado = Market.estaBloqueado(n);
    const pide = n.requiere_nivel || 1;
    const rep = extras && extras.reputacion ? extras.reputacion : null;
    const indiceValor = rep && rep.indice_transparencia != null
      ? rep.indice_transparencia
      : n.indice_transparencia;
    const verificado = rep ? !!rep.is_verified_profile : !!n.is_verified_profile;

    const volver = document.createElement('button');
    volver.type = 'button';
    volver.className = 'market-detalle__volver';
    volver.textContent = 'Volver al marketplace';
    volver.addEventListener('click', Market.cerrarDetalle);

    const media = document.createElement('div');
    media.className = 'market-detalle__media';
    const foto = document.createElement('img');
    foto.className = 'market-detalle__foto';
    foto.src = n.imagen_url || '';
    foto.alt = n.nombre;
    media.appendChild(foto);

    const chips = document.createElement('div');
    chips.className = 'market-detalle__chips';
    const sello = document.createElement('span');
    if (bloqueado) {
      chips.append(Market.logoMarca(n), Market.chipCategoria(n), Market.avisoNivel(n));
    } else {
      sello.className = 'market__sello' + (verificado ? ' market__sello--ok' : '');
      sello.textContent = verificado ? 'Perfil verificado' : 'Sin verificar';
      chips.append(Market.logoMarca(n), Market.chipCategoria(n), sello);
    }

    const nombre = document.createElement('h2');
    nombre.className = 'section-heading';
    nombre.textContent = n.nombre;

    const dir = document.createElement('p');
    dir.className = 'market-detalle__dir';
    dir.textContent = Market.textoDireccion(n);

    raiz.append(volver, media, chips, nombre, dir);

    if (bloqueado) {
      const aviso = document.createElement('p');
      aviso.className = 'market-detalle__aviso-nivel';
      aviso.textContent =
        'Tu nivel es ' + Market.nivelUsuario() + '. Este lugar pide nivel ' + pide + '.';
      raiz.appendChild(aviso);
    }

    if (extras && extras.cargando) {
      const carga = document.createElement('p');
      carga.className = 'status-text';
      carga.textContent = 'Cargando datos del negocio...';
      raiz.appendChild(carga);
      return;
    }

    if (extras && extras.error) {
      const err = document.createElement('p');
      err.className = 'error-text';
      err.textContent = extras.error;
      raiz.appendChild(err);
    }

    const negocioIndice = Object.assign({}, n, { indice_transparencia: indiceValor, is_verified_profile: verificado });
    raiz.appendChild(Market.bloqueIndice(negocioIndice, true));

    if (rep && rep.descargo) {
      const descargo = document.createElement('p');
      descargo.className = 'market-detalle__descargo';
      descargo.textContent = rep.descargo;
      raiz.appendChild(descargo);
    }

    const descTitulo = document.createElement('h3');
    descTitulo.className = 'market-detalle__subtitulo';
    descTitulo.textContent = 'Descripción';

    const desc = document.createElement('p');
    desc.className = 'market-detalle__desc';
    desc.textContent = n.descripcion || 'Sin descripción por ahora.';

    const filas = [
      ['Categoría', Market.etiquetaDe(n.categoria)],
      ['Dirección', n.direccion || 'Sin dirección'],
      ['Distancia', Market.distanciaTexto(n) || 'No disponible'],
      ['Nivel pedido', 'Nivel ' + pide],
      ['Perfil', verificado ? 'Verificado' : 'Sin verificar']
    ];
    if (rep) {
      filas.push(
        [
          'Nota Google',
          rep.google_rating_avg != null
            ? Number(rep.google_rating_avg).toFixed(1) + ' de 5'
            : 'Sin nota'
        ],
        ['Reseñas', String(rep.google_reviews_count || 0)]
      );
    }

    const datos = document.createElement('dl');
    datos.className = 'market-detalle__datos';
    filas.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      datos.append(dt, dd);
    });

    const estado = document.createElement('p');
    estado.id = 'marketDetalleStatus';
    estado.className = 'status-text';
    estado.setAttribute('aria-live', 'polite');

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.id = 'marketDetalleCta';
    cta.className = 'market__cta' + (bloqueado ? ' market__cta--bloqueado' : '');
    cta.textContent = bloqueado ? 'Subir a nivel ' + pide : Market.textoCta(n);
    cta.addEventListener('click', () => Market.accion(n, bloqueado, cta, estado));

    raiz.append(descTitulo, desc, datos, estado, cta);
  },

  estaBloqueado(n) {
    return (n.requiere_nivel || 1) > Market.nivelUsuario();
  },

  avisoNivel(n) {
    const aviso = document.createElement('span');
    aviso.className = 'market__nivel';
    aviso.textContent = 'Pide nivel ' + (n.requiere_nivel || 1);
    return aviso;
  },

  chipCategoria(n) {
    const cat = document.createElement('span');
    cat.className = 'market__chip';
    const icono = document.createElement('span');
    icono.className = 'market__icono';
    icono.innerHTML = ICONOS_SVG[ICONO_NEGOCIO[n.categoria] || 'pin'];
    const catLbl = document.createElement('span');
    catLbl.textContent = Market.etiquetaDe(n.categoria);
    cat.append(icono, catLbl);
    return cat;
  },

  logoMarca(n) {
    if (n.logo_url) {
      const img = document.createElement('img');
      img.className = 'market__logo market__logo--img';
      img.src = n.logo_url;
      img.alt = n.nombre;
      img.loading = 'lazy';
      return img;
    }
    const logo = document.createElement('span');
    logo.className = 'market__logo';
    logo.setAttribute('aria-hidden', 'true');
    logo.textContent = n.logo_texto || 'S';
    logo.title = n.nombre;
    return logo;
  },

  selloVerificado(n) {
    const sello = document.createElement('span');
    if (n.is_verified_profile) {
      sello.className = 'market__sello market__sello--ok';
      sello.textContent = 'Perfil verificado';
    } else {
      sello.className = 'market__sello';
      sello.textContent = 'Sin verificar';
    }
    return sello;
  },

  bloqueIndice(n, grande) {
    const score = document.createElement('div');
    score.className = 'market__card-score' + (grande ? ' market__card-score--detalle' : '');
    const num = document.createElement('strong');
    num.textContent = '★ ' + Number(n.indice_transparencia).toFixed(1);
    const lbl = document.createElement('span');
    lbl.className = 'market__card-score-lbl';
    lbl.textContent = ' Índice generado por IA';
    score.append(num, lbl);
    return score;
  },

  textoDireccion(n) {
    const dist = Market.distanciaTexto(n);
    return n.direccion + (dist ? ' · ' + dist : '');
  },

  ordenarPorCercania(negocios) {
    const ref = Market.ref || Market.REF_DEFECTO;
    return negocios
      .map(n => ({ n, d: Market.distanciaKm(n, ref) }))
      .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity))
      .map(x => x.n);
  },

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

  async accion(n, bloqueado, boton, estadoEl) {
    if (bloqueado) {
      App.openSection('verificacion');
      return;
    }
    const sesion = Auth.getCurrentUser();
    if (!sesion || !sesion.token) {
      if (estadoEl) estadoEl.textContent = 'Inicie sesión para continuar.';
      return;
    }
    if (boton) boton.disabled = true;
    if (estadoEl) {
      estadoEl.style.color = '';
      estadoEl.textContent = 'Enviando reserva...';
    }
    const res = await Auth.request('/v1/reservas', {
      method: 'POST',
      body: { business_id: n.id },
      token: sesion.token
    });
    if (boton) boton.disabled = false;
    if (!estadoEl) return;
    if (!res.ok) {
      estadoEl.style.color = 'var(--color-error)';
      estadoEl.textContent = res.error || 'No se pudo crear la reserva.';
      return;
    }
    estadoEl.style.color = 'var(--color-success)';
    estadoEl.textContent =
      'Reserva creada. Estado: ' + res.data.estado + '. Código: ' + res.data.qr_token;
  },

  nivelUsuario() {
    const sesion = Auth.getCurrentUser();
    return sesion && sesion.perfil ? (sesion.perfil.nivel_pasaporte || 1) : 1;
  },

  etiquetaDe(cat) {
    const c = Market.CATEGORIAS.find(x => x.id === cat);
    return c ? c.label : cat;
  },

  textoCta(n) {
    return n.cta_texto || 'Ver más';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
