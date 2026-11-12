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
    { id: 'automotriz', label: 'Automotriz' },
    { id: 'otro', label: 'Educación y otros' }
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
      status: document.getElementById('marketStatus'),
      progreso: document.getElementById('marketProgreso')
    };
    if (!Market.el.grid) return;
    if (!Market.el.bound) {
      Market.el.search.addEventListener('input', Market.onBuscar);
      Market.el.bound = true;
    }
    Market.cerrarDetalle();
    Market.renderProgreso();
    Market.renderFiltros();
    Market.pedirUbicacion();
    Market.cargar();
  },

  // El marketplace solo monta el widget; la lógica de progreso vive en SubirConfianza.
  renderProgreso() {
    if (!Market.el.progreso || typeof SubirConfianza === 'undefined') return;
    SubirConfianza.montarIndicador(Market.el.progreso, {
      onAbrir: () => {
        if (typeof App !== 'undefined' && App.openSection) App.openSection('subir-confianza');
      }
    });
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
    raiz.appendChild(Market.bloqueDesgloseIndice(n, rep, indiceValor, verificado));

    if (rep && rep.descargo) {
      const descargo = document.createElement('p');
      descargo.className = 'market-detalle__descargo';
      descargo.textContent = rep.descargo;
      raiz.appendChild(descargo);
    }

    const filas = [
      ['Descripción', n.descripcion || 'Sin descripción por ahora.'],
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
      const fila = document.createElement('div');
      fila.className = 'market-detalle__fila';
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      fila.append(dt, dd);
      datos.appendChild(fila);
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

    raiz.append(datos, estado, cta);
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

  // Mock: solo datos por API oficial, registros del Estado o aporte del titular.
  // Nada que requiera scrapeo con Puppeteer/Playwright u otros headless.
  factoresIndiceMock(n, rep, indiceValor, verificado) {
    const seed = Market.hashTexto(String(n.id || n.nombre || 'negocio'));
    const pct = (base, spread) => Math.max(8, Math.min(98, Math.round(base + ((seed % 1000) / 1000) * spread)));
    const google = rep && rep.google_rating_avg != null ? Number(rep.google_rating_avg) : 3.5 + (seed % 15) / 10;
    const reviews = rep && rep.google_reviews_count != null ? Number(rep.google_reviews_count) : 40 + (seed % 260);
    const googleNorm = Math.round((Math.max(0, Math.min(5, google)) / 5) * 100);
    const volumenNorm = Math.round(Math.min(100, (Math.log1p(reviews) / Math.log1p(500)) * 100));

    // Docs legales pesan más que el resto, pero sin aplastar el núcleo (24% vs ~14–16%).
    const rutDeclarado = verificado ? pct(82, 14) : pct(45, 25);
    const docsLegales = verificado ? pct(78, 10) : pct(28, 20);
    const openDataSanciones = pct(70, 22);
    const openDataListados = pct(66, 24);
    const consistenciaPlaces = pct(58, 30);
    const seoPlaces = pct(48, 42);
    const ley21719 = pct(42, 40);
    const verifNorm = verificado ? 100 : 40;
    const indiceTxt = Number(indiceValor).toFixed(1);

    return [
      {
        id: 'docs-legales',
        grupo: 'identidad',
        etiqueta: 'Documentos legales procesados',
        valor: docsLegales + ' / 100',
        pct: docsLegales,
        peso: 'Núcleo · 24%',
        detalle:
          'Factor de mayor peso (moderado). PDF/metadata del comercio (constitución, patente, inicio de actividades) analizados en API propia.'
      },
      {
        id: 'titularidad',
        grupo: 'identidad',
        etiqueta: 'Titularidad ServiChile',
        valor: verificado ? 'Reclamado' : 'Sin reclamo',
        pct: verifNorm,
        peso: 'Núcleo · 16%',
        detalle:
          'Estado interno del claim: amarra identidad del dueño a la ficha sin crawlear terceros.'
      },
      {
        id: 'rut-declarado',
        grupo: 'identidad',
        etiqueta: 'RUT y giro declarados',
        valor: rutDeclarado + ' / 100',
        pct: rutDeclarado,
        peso: 'Núcleo · 14%',
        detalle:
          'Aporte del titular al reclamar/verificar (formulario ServiChile). Sin scrapeo de portales.'
      },
      {
        id: 'open-data-sanciones',
        grupo: 'estado',
        etiqueta: 'Sanciones en registros del Estado',
        valor: openDataSanciones + ' / 100',
        pct: openDataSanciones,
        peso: 'Núcleo · 12%',
        detalle:
          'Cruce por RUT/razón social contra registros oficiales publicados por organismos del Estado (archivos o API pública).'
      },
      {
        id: 'open-data-listados',
        grupo: 'estado',
        etiqueta: 'Listados oficiales del Estado',
        valor: openDataListados + ' / 100',
        pct: openDataListados,
        peso: 'Núcleo · 12%',
        detalle:
          'Presencia o ausencia en listados gubernamentales publicados para consulta (p. ej. inhabilidades, quiebras u otros boletines oficiales).'
      },
      {
        id: 'ley-21719',
        grupo: 'gobernanza',
        etiqueta: 'Señal Ley 21.719',
        valor: ley21719 + ' / 100',
        pct: ley21719,
        peso: 'Observable · 5%',
        detalle:
          'Mock: transparencia declarada sobre protección de datos personales (p. ej. política de privacidad visible). No certifica cumplimiento de la Ley 21.719.'
      },
      {
        id: 'places-consistencia',
        grupo: 'mercado',
        etiqueta: 'Consistencia ficha Places',
        valor: consistenciaPlaces + ' / 100',
        pct: consistenciaPlaces,
        peso: 'Observable · 7%',
        detalle:
          'Google Places API: nombre, dirección, categoría y estado del negocio. API oficial, sin headless.'
      },
      {
        id: 'seo',
        grupo: 'mercado',
        etiqueta: 'Presencia SEO local',
        valor: seoPlaces + ' / 100',
        pct: seoPlaces,
        peso: 'Observable · 5%',
        detalle:
          'Derivado de Places/Search APIs (completitud de ficha, sitio, fotos). No scrapeo de SERPs con bots.'
      },
      {
        id: 'google',
        grupo: 'mercado',
        etiqueta: 'Calificación Google',
        valor: google.toFixed(1) + ' / 5',
        pct: googleNorm,
        peso: 'Observable · 3%',
        detalle: 'Places API (`rating`). Observable de mercado, no prueba legal.'
      },
      {
        id: 'volumen',
        grupo: 'mercado',
        etiqueta: 'Volumen de reseñas',
        valor: reviews + ' reseñas',
        pct: volumenNorm,
        peso: 'Observable · 2%',
        detalle: 'Places API (`user_ratings_total`). Apoyo estadístico abierto.'
      },
      {
        id: 'indice',
        grupo: 'resumen',
        etiqueta: 'Índice resultante',
        valor: indiceTxt + ' / 10',
        pct: Math.round((Number(indiceValor) / 10) * 100),
        peso: 'Final',
        detalle:
          'Mock: documentos legales pesan más (24%); el resto del núcleo y observables completan el 100%.'
      }
    ];
  },

  filtrosIndiceGrupos() {
    return [
      { id: 'identidad', etiqueta: 'Identidad (docs, titularidad, RUT)' },
      { id: 'estado', etiqueta: 'Registros del Estado' },
      { id: 'gobernanza', etiqueta: 'Gobernanza de datos' },
      { id: 'mercado', etiqueta: 'Presencia de mercado' }
    ];
  },

  hashTexto(texto) {
    let h = 2166136261;
    const s = String(texto || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  bloqueDesgloseIndice(n, rep, indiceValor, verificado) {
    const factores = Market.factoresIndiceMock(n, rep, indiceValor, verificado);
    const resumen = factores.find((f) => f.grupo === 'resumen');
    const detalleFactores = factores.filter((f) => f.grupo !== 'resumen');
    // Por defecto: docs, titularidad y RUT/giro.
    const estado = { todos: false, activos: { identidad: true, estado: false, gobernanza: false, mercado: false } };

    const sec = document.createElement('section');
    sec.className = 'indice-desglose';
    sec.setAttribute('aria-label', 'Por qué este índice');

    const titulo = document.createElement('h3');
    titulo.className = 'market-detalle__subtitulo';
    titulo.textContent = 'Por qué este índice';

    const cabecera = document.createElement('div');
    cabecera.className = 'indice-desglose__cabecera';
    if (resumen) {
      const item = Market.itemFactorIndice(resumen);
      item.classList.add('indice-desglose__item--cabecera');
      cabecera.appendChild(item);
    }

    const lead = document.createElement('p');
    lead.className = 'indice-desglose__lead';
    lead.textContent =
      'Filtro inicial: documentos, titularidad y RUT/giro. Un grupo a la vez, o Ver todos.';

    const filtros = document.createElement('div');
    filtros.className = 'indice-desglose__filtros';
    filtros.setAttribute('role', 'group');
    filtros.setAttribute('aria-label', 'Filtros del desglose');

    const lista = document.createElement('ul');
    lista.className = 'indice-desglose__lista';

    const vacio = document.createElement('p');
    vacio.className = 'indice-desglose__vacio';
    vacio.hidden = true;
    vacio.textContent = 'Ningún factor con los filtros actuales. Active un grupo o pulse Ver todos.';

    const nota = document.createElement('p');
    nota.className = 'indice-desglose__nota';

    function gruposActivos() {
      if (estado.todos) return null;
      return Object.keys(estado.activos).filter((k) => estado.activos[k]);
    }

    function pintarFiltros() {
      Market.limpiar(filtros);
      Market.filtrosIndiceGrupos().forEach((g) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'indice-desglose__filtro';
        btn.textContent = g.etiqueta;
        const on = !estado.todos && !!estado.activos[g.id];
        btn.classList.toggle('indice-desglose__filtro--on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.addEventListener('click', () => {
          estado.todos = false;
          Object.keys(estado.activos).forEach((k) => {
            estado.activos[k] = false;
          });
          estado.activos[g.id] = true;
          pintarFiltros();
          pintarLista();
        });
        filtros.appendChild(btn);
      });

      const todos = document.createElement('button');
      todos.type = 'button';
      todos.className = 'indice-desglose__filtro indice-desglose__filtro--todos';
      todos.textContent = 'Ver todos';
      todos.classList.toggle('indice-desglose__filtro--on', estado.todos);
      todos.setAttribute('aria-pressed', estado.todos ? 'true' : 'false');
      todos.addEventListener('click', () => {
        estado.todos = true;
        Object.keys(estado.activos).forEach((k) => {
          estado.activos[k] = false;
        });
        pintarFiltros();
        pintarLista();
      });
      filtros.appendChild(todos);
    }

    function pintarLista() {
      Market.limpiar(lista);
      const activos = gruposActivos();
      const visibles = detalleFactores.filter((f) => !activos || activos.indexOf(f.grupo) !== -1);
      vacio.hidden = visibles.length > 0;
      visibles.forEach((f) => lista.appendChild(Market.itemFactorIndice(f)));
      nota.textContent = estado.todos
        ? 'Mostrando todos los factores (mock).'
        : 'Filtros activos · mock sin scrapeo headless.';
    }

    pintarFiltros();
    pintarLista();
    sec.append(titulo, cabecera, lead, filtros, vacio, lista, nota);
    return sec;
  },

  itemFactorIndice(f) {
    const li = document.createElement('li');
    li.className = 'indice-desglose__item';

    const cabezal = document.createElement('div');
    cabezal.className = 'indice-desglose__cabezal';
    const nombre = document.createElement('span');
    nombre.className = 'indice-desglose__nombre';
    nombre.textContent = f.etiqueta;
    const meta = document.createElement('span');
    meta.className = 'indice-desglose__meta';
    meta.textContent = f.valor + ' · ' + f.peso;
    cabezal.append(nombre, meta);

    const pista = document.createElement('div');
    pista.className = 'indice-desglose__pista';
    pista.setAttribute('role', 'meter');
    pista.setAttribute('aria-valuemin', '0');
    pista.setAttribute('aria-valuemax', '100');
    pista.setAttribute('aria-valuenow', String(f.pct));
    pista.setAttribute('aria-label', f.etiqueta + ': ' + f.pct + ' por ciento');
    const barra = document.createElement('span');
    barra.className = 'indice-desglose__barra';
    if (String(f.peso).indexOf('Núcleo') === 0) barra.classList.add('indice-desglose__barra--nucleo');
    if (f.id === 'docs-legales') barra.classList.add('indice-desglose__barra--docs');
    if (f.id === 'seo') barra.classList.add('indice-desglose__barra--seo');
    if (f.grupo === 'gobernanza') barra.classList.add('indice-desglose__barra--gob');
    barra.style.width = f.pct + '%';
    pista.appendChild(barra);

    const detalle = document.createElement('p');
    detalle.className = 'indice-desglose__detalle';
    detalle.textContent = f.detalle;

    li.append(cabezal, pista, detalle);
    return li;
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
      App.openSection('subir-confianza');
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
