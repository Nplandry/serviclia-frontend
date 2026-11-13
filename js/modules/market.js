// Directorio B2B: proveedores evaluables (32 observables / due diligence).
// Consume GET /v1/businesses. Ordena por cercanía a la ubicación del usuario.
const Market = {
  CATEGORIAS: [
    { id: 'tecnologia', label: 'Tecnología y datos' },
    { id: 'industria', label: 'Minería e industria' },
    { id: 'construccion', label: 'Construcción' },
    { id: 'servicios-profesionales', label: 'Servicios profesionales' },
    {
      id: 'logistica',
      label: 'Transporte, Logística y Última Milla'
    },
    { id: 'all', label: 'Todos' }
  ],
  JOBS: [
    {
      id: 'tecnologia',
      label: 'Tecnología',
      hint: 'SaaS · TI · agencias',
      categoria: 'tecnologia'
    },
    {
      id: 'industria',
      label: 'Industria',
      hint: 'Minería · faenas',
      categoria: 'industria'
    },
    {
      id: 'construccion',
      label: 'Construcción',
      hint: 'Obras · montaje',
      categoria: 'construccion'
    },
    {
      id: 'profesionales',
      label: 'Profesionales',
      hint: 'RR.HH. · legal',
      categoria: 'servicios-profesionales'
    },
    {
      id: 'logistica',
      label: 'Logística',
      hint: 'Flotas · courier · bodega',
      categoria: 'logistica'
    }
  ],
  REF_DEFECTO: { lat: -33.4265, lng: -70.6190 },

  negocios: [],
  categoria: 'tecnologia',
  job: 'tecnologia',
  busqueda: '',
  ref: null,
  timer: null,
  seleccionado: null,

  init() {
    Market.el = {
      list: document.getElementById('marketList'),
      detail: document.getElementById('marketDetail'),
      search: document.getElementById('marketSearch'),
      count: document.getElementById('marketCount'),
      grid: document.getElementById('marketGrid'),
      status: document.getElementById('marketStatus'),
      progreso: document.getElementById('marketProgreso'),
      jobs: document.getElementById('marketJobs')
    };
    if (!Market.el.grid) return;
    if (!Market.el.bound) {
      Market.el.search.addEventListener('input', Market.onBuscar);
      Market.el.bound = true;
    }
    Market.cerrarDetalle();
    Market.renderJobs();
    Market.renderProgreso();
    Market.pedirUbicacion();
    Market.cargar();
  },

  renderJobs() {
    if (!Market.el.jobs) return;
    Market.limpiar(Market.el.jobs);

    Market.JOBS.forEach((job) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'market__job' + (Market.job === job.id ? ' market__job--activo' : '');
      const titulo = document.createElement('span');
      titulo.className = 'market__job-label';
      titulo.textContent = job.label;
      const hint = document.createElement('span');
      hint.className = 'market__job-hint';
      hint.textContent = job.hint;
      btn.append(titulo, hint);
      btn.addEventListener('click', () => {
        Market.job = job.id;
        Market.categoria = job.categoria;
        Market.renderJobs();
        Market.renderAccionEmpresa();
        Market.cargar();
      });
      Market.el.jobs.appendChild(btn);
    });
    Market.renderAccionEmpresa();
  },

  esEmpresa() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.actual().es('empresa')
      : false;
  },

  // Oferta: pymes afiliadas mejoran su nota / reclaman ficha.
  renderAccionEmpresa() {
    if (!Market.el.list) return;
    let barra = document.getElementById('marketEmpresaAccion');
    const mostrar = Market.esEmpresa();

    if (!mostrar) {
      if (barra) barra.remove();
      return;
    }

    if (!barra) {
      barra = document.createElement('div');
      barra.id = 'marketEmpresaAccion';
      barra.className = 'market__empresa-accion';

      const texto = document.createElement('p');
      texto.className = 'market__empresa-accion-texto';
      texto.textContent =
        '¿Es proveedor B2B? Mejore su índice de transparencia para no quedar fuera del filtro.';

      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'submit-btn market__empresa-accion-cta';
      cta.textContent = 'Mejorar mi nota';
      cta.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.openSection) App.openSection('subir-confianza');
      });

      barra.append(texto, cta);

      const search = Market.el.search && Market.el.search.closest
        ? Market.el.search.closest('.market__search') || Market.el.search
        : Market.el.search;
      const head = Market.el.list.querySelector('.market__head');
      if (head && search && search.parentNode === head) {
        head.insertBefore(barra, search);
      } else if (head) {
        head.appendChild(barra);
      } else {
        Market.el.list.insertBefore(barra, Market.el.list.firstChild);
      }
    }
  },

  // El marketplace solo monta el widget; el motor tipado vive en ProgresoCuenta.
  renderProgreso() {
    if (!Market.el.progreso || typeof ProgresoCuenta === 'undefined') return;
    ProgresoCuenta.actual().montarIndicador(Market.el.progreso, {
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

  jobActual() {
    return Market.JOBS.find((j) => j.id === Market.job) || null;
  },

  filtrarPorJob(lista) {
    const job = Market.jobActual();
    const excluir = job && Array.isArray(job.excluir) ? job.excluir : [];
    if (!excluir.length) return lista;
    return lista.filter((n) => excluir.indexOf(n.categoria) === -1);
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
    Market.negocios = Market.filtrarPorJob(Array.isArray(res.data) ? res.data : []);
    Market.render();
  },

  render() {
    const lista = Market.ordenarPorCercania(Market.negocios);
    Market.el.count.textContent =
      lista.length + ' proveedor' + (lista.length === 1 ? '' : 'es');
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
      aviso.textContent = Market.textoAvisoNivel(n, pide);
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

    const cuerpo = document.createElement('div');
    cuerpo.className = 'market-detalle__cuerpo';

    const colIzq = document.createElement('div');
    colIzq.className = 'market-detalle__col';
    colIzq.appendChild(Market.bloqueIndice(negocioIndice, true));
    colIzq.appendChild(Market.bloqueDesgloseIndice(n, rep, indiceValor, verificado));

    if (rep && rep.descargo) {
      const descargo = document.createElement('p');
      descargo.className = 'market-detalle__descargo';
      descargo.textContent = rep.descargo;
      colIzq.appendChild(descargo);
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
    colIzq.appendChild(datos);

    const colDer = document.createElement('div');
    colDer.className = 'market-detalle__col market-detalle__col--paywall';
    const sticky = document.createElement('div');
    sticky.className = 'market-detalle__sticky';
    if (typeof MarketMonetizacion !== 'undefined') {
      sticky.appendChild(MarketMonetizacion.panel(n));
    }

    const estado = document.createElement('p');
    estado.id = 'marketDetalleStatus';
    estado.className = 'status-text market-detalle__cta-status';
    estado.setAttribute('aria-live', 'polite');

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.id = 'marketDetalleCta';
    cta.className =
      'market-detalle__cta-contacto' + (bloqueado ? ' market-detalle__cta-contacto--bloqueado' : '');
    if (bloqueado) {
      cta.textContent = Market.textoCtaBloqueado(n, pide);
    } else {
      const ctaLabel = document.createElement('span');
      ctaLabel.className = 'market-detalle__cta-label';
      ctaLabel.textContent = 'Contactar a esta empresa';
      const ctaHint = document.createElement('span');
      ctaHint.className = 'market-detalle__cta-hint';
      ctaHint.textContent = 'Pedir cotización · respuesta rápida';
      cta.append(ctaLabel, ctaHint);
    }
    cta.addEventListener('click', () => Market.accion(n, bloqueado, cta, estado));

    const tipQr = document.createElement('p');
    tipQr.className = 'market-detalle__tip-qr';
    tipQr.textContent =
      'Use el QR del reporte para verificar identidad en terreno, entregas o reuniones de due diligence.';

    sticky.append(cta, estado, tipQr);
    colDer.appendChild(sticky);
    cuerpo.append(colIzq, colDer);
    raiz.appendChild(cuerpo);
  },

  textoAvisoNivel(n, pide) {
    return (
      'Este proveedor pide verificación nivel ' +
      pide +
      '. Complete su verificación y vuelva a la ficha.'
    );
  },

  textoCtaBloqueado(n, pide) {
    return 'Completar verificación (nivel ' + pide + ')';
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

  // Mock: 30 observables — Ciber 30% + Legal 30% + Contractual 20% + Operativa 20%.
  definicionObservablesIndice() {
    return [
      {
        grupo: 'ciber',
        id: 'ssl-tls',
        etiqueta: 'Vigencia y calidad de certificados SSL/TLS',
        detalle:
          'HTTPS válido, TLS moderno y ausencia de certificados expirados o autofirmados.'
      },
      {
        grupo: 'ciber',
        id: 'email-auth',
        etiqueta: 'Seguridad de correo (SPF, DKIM, DMARC)',
        detalle:
          'Registros DNS para prevenir spoofing y suplantación de identidad corporativa.'
      },
      {
        grupo: 'ciber',
        id: 'puertos',
        etiqueta: 'Exposición de puertos y servicios críticos',
        detalle:
          'Detección pasiva de puertos/servicios administrativos abiertos (RDP, SSH, DB, SMB).'
      },
      {
        grupo: 'ciber',
        id: 'brechas',
        etiqueta: 'Credenciales corporativas filtradas en dark web/breaches',
        detalle:
          'Correos @dominio en bases públicas de brechas o filtraciones recientes.'
      },
      {
        grupo: 'ciber',
        id: 'headers-http',
        etiqueta: 'Cabeceras de seguridad HTTP',
        detalle: 'HSTS, CSP, X-Frame-Options y X-Content-Type-Options.'
      },
      {
        grupo: 'ciber',
        id: 'stack-vulnerable',
        etiqueta: 'Tecnologías web obsoletas o vulnerables (CVEs abiertos)',
        detalle:
          'CMS, servidores o librerías con CVEs críticos conocidos sin remediación.'
      },
      {
        grupo: 'ciber',
        id: 'blacklist',
        etiqueta: 'Reputación de IP y dominio en listas negras globales',
        detalle: 'Marcas por malware, phishing o spam en blocklists globales.'
      },
      {
        grupo: 'ciber',
        id: 'dnssec',
        etiqueta: 'Protección de infraestructura DNS y secuestro de dominios',
        detalle: 'DNSSEC, DNS resiliente y señales de riesgo de hijacking.'
      },
      {
        grupo: 'ciber',
        id: 'subdominios',
        etiqueta: 'Seguridad en subdominios expuestos (Shadow IT)',
        detalle:
          'Entornos dev/staging/test u otros subdominios públicos sin autenticación.'
      },
      {
        grupo: 'ciber',
        id: 'whois',
        etiqueta: 'Antigüedad, configuración y estabilidad del dominio',
        detalle:
          'Edad WHOIS, configuración DNS y vigencia de renovación.'
      },
      {
        grupo: 'legal',
        id: 'persona-juridica',
        etiqueta: 'Vigencia y estado de la persona jurídica',
        detalle:
          'Constitución activa, sin disolución ni quiebra declarada.'
      },
      {
        grupo: 'legal',
        id: 'representantes',
        etiqueta: 'Consistencia de representantes legales, directorio y poderes',
        detalle:
          'Coincidencia entre firmantes, directorio y representantes vigentes inscritos.'
      },
      {
        grupo: 'legal',
        id: 'litigios-civiles',
        etiqueta: 'Litigiosidad civil y comercial (juicios pendientes)',
        detalle:
          'Demandas activas como demandado (incumplimientos, indemnizaciones).'
      },
      {
        grupo: 'legal',
        id: 'cobranza',
        etiqueta: 'Demandas de cobranza y juicios ejecutivos',
        detalle: 'Juicios por pagarés, facturas impagas o títulos ejecutivos.'
      },
      {
        grupo: 'legal',
        id: 'multas-laborales',
        etiqueta: 'Multas laborales y previsionales vigentes',
        detalle:
          'Sanciones de la Dirección del Trabajo / no pago de cotizaciones.'
      },
      {
        grupo: 'legal',
        id: 'juicios-laborales',
        etiqueta: 'Demandas laborales activas',
        detalle:
          'Despido injustificado, tutela de derechos o accidentes del trabajo.'
      },
      {
        grupo: 'legal',
        id: 'dicom',
        etiqueta: 'Morosidad comercial y financiera (boletines / DICOM)',
        detalle: 'Deudas morosas publicadas, protestos y endeudamiento impago.'
      },
      {
        grupo: 'legal',
        id: 'sii',
        etiqueta: 'Situación tributaria, cumplimiento y facturación electrónica',
        detalle:
          'Inicio de actividades, facturación electrónica y ausencia de bloqueos SII.'
      },
      {
        grupo: 'legal',
        id: 'mercado-publico',
        etiqueta: 'Historial y penalidades en compras públicas / Estado',
        detalle:
          'Adjudicaciones, multas contractuales o inhabilidades para contratar.'
      },
      {
        grupo: 'legal',
        id: 'sanciones-sectoriales',
        etiqueta: 'Sanciones sectoriales o ambientales',
        detalle:
          'Multas en superintendencias según rubro (Salud, SEC, Medio Ambiente).'
      },
      {
        grupo: 'contractual',
        id: 'politica-privacidad',
        etiqueta: 'Política de Privacidad accesible y actualizada',
        detalle:
          'Documento claro sobre tratamiento de datos (Ley 21.719 / estándares LATAM).'
      },
      {
        grupo: 'contractual',
        id: 'arco',
        etiqueta: 'Responsable y canal de derechos ARCO',
        detalle:
          'Identificación del responsable y canal para acceso, rectificación, cancelación u oposición.'
      },
      {
        grupo: 'contractual',
        id: 'cookies',
        etiqueta: 'Consentimiento de cookies y rastreadores',
        detalle:
          'Banner funcional que permite rechazar cookies/rastreadores no esenciales.'
      },
      {
        grupo: 'contractual',
        id: 'terminos',
        etiqueta: 'Términos y Condiciones públicos de la oferta comercial',
        detalle:
          'Reglas de contratación, garantías, devoluciones y jurisdicción.'
      },
      {
        grupo: 'contractual',
        id: 'sla',
        etiqueta: 'Cláusulas de servicio, SLA y DPA',
        detalle:
          'Transparencia en niveles de servicio y acuerdos de tratamiento de datos (DPA).'
      },
      {
        grupo: 'operativa',
        id: 'domicilio',
        etiqueta: 'Verificación de domicilio operativo real y oficinas',
        detalle:
          'Cruce dirección tributaria vs evidencia física (fachada, oficinas reales).'
      },
      {
        grupo: 'operativa',
        id: 'huella-digital',
        etiqueta: 'Coherencia y solidez de huella digital y reputación corporativa',
        detalle:
          'Correlación entre tamaño declarado, presencia digital y reputación pública.'
      },
      {
        grupo: 'operativa',
        id: 'incidentes',
        etiqueta: 'Historial de incidentes físicos, brechas o escándalos públicos',
        detalle:
          'Noticias, emergencias, clausuras, brechas o escándalos con impacto reputacional.'
      },
      {
        grupo: 'operativa',
        id: 'uptime',
        etiqueta: 'Continuidad operativa y estabilidad de infraestructura (uptime)',
        detalle: 'Disponibilidad histórica de canales digitales e infraestructura.'
      },
      {
        grupo: 'operativa',
        id: 'resenas-reclamos',
        etiqueta: 'Reseñas B2B verificadas, satisfacción y resolución de reclamos',
        detalle:
          'Calificaciones B2B validadas y tasa de respuesta/resolución de reclamos.'
      }
    ];
  },

  pesoObservable(grupo) {
    // Ciber/Legal 30% (10×3%). Contractual/Operativa 20% (5×4%).
    if (grupo === 'ciber' || grupo === 'legal') return '3.0%';
    return '4.0%';
  },

  factoresIndiceMock(n, rep, indiceValor, verificado) {
    const seed = Market.hashTexto(String(n.id || n.nombre || 'negocio'));
    const pct = (base, spread, offset) => {
      const t = ((seed + (offset || 0) * 9973) % 1000) / 1000;
      return Math.max(8, Math.min(98, Math.round(base + t * spread)));
    };
    const google = rep && rep.google_rating_avg != null ? Number(rep.google_rating_avg) : 3.5 + (seed % 15) / 10;
    const reviews = rep && rep.google_reviews_count != null ? Number(rep.google_reviews_count) : 40 + (seed % 260);
    const boostLegal = verificado ? 18 : 0;
    const boostContract = verificado ? 12 : 0;
    const defs = Market.definicionObservablesIndice();
    // Scores reales del backend (sonda DNS/TLS/HTTP + reseñas derivadas).
    const ciberApi = Object.create(null);
    const listaCiber = rep && Array.isArray(rep.observables_ciber) ? rep.observables_ciber : [];
    for (let i = 0; i < listaCiber.length; i++) {
      const o = listaCiber[i];
      if (o && o.id != null && o.score != null) ciberApi[o.id] = Number(o.score);
    }

    const factores = defs.map((d, i) => {
      let score;
      let esReal = false;
      if (ciberApi[d.id] != null && Number.isFinite(ciberApi[d.id])) {
        score = Math.max(0, Math.min(100, Math.round(ciberApi[d.id])));
        esReal = true;
      } else {
        let base = 48;
        let spread = 36;
        if (d.grupo === 'ciber') {
          base = 52;
          spread = 38;
        } else if (d.grupo === 'legal') {
          base = 40 + boostLegal;
          spread = 30;
        } else if (d.grupo === 'contractual') {
          base = 42 + boostContract;
          spread = 34;
        } else if (d.grupo === 'operativa') {
          base = 50;
          spread = 32;
          if (d.id === 'resenas-reclamos') {
            const ratingPart = Math.round((Math.max(0, Math.min(5, google)) / 5) * 55) + 20;
            const volumePart = Math.round(Math.min(25, (Math.log1p(reviews) / Math.log1p(500)) * 25));
            base = Math.min(92, ratingPart + volumePart);
            spread = 10;
          }
        }
        score = pct(base, spread, i + 1);
      }
      return {
        id: d.id,
        grupo: d.grupo,
        etiqueta: esReal ? d.etiqueta + ' (real)' : d.etiqueta,
        valor: score + ' / 100',
        pct: score,
        peso: 'Observable · ' + Market.pesoObservable(d.grupo),
        detalle: d.detalle,
        real: esReal
      };
    });

    factores.push({
      id: 'indice',
      grupo: 'resumen',
      etiqueta: 'Índice resultante',
      valor: Number(indiceValor).toFixed(1) + ' / 10',
      pct: Math.round((Number(indiceValor) / 10) * 100),
      peso: 'Final',
      detalle:
        'Ciber 30% + Legal 30% + Contractual 20% + Operativa 20% (30 observables; 11 desde API sin mapear rutas).'
    });
    return factores;
  },

  filtrosIndiceGrupos() {
    return [
      { id: 'ciber', etiqueta: 'Ciberseguridad (10 · 30%)' },
      { id: 'legal', etiqueta: 'Legal y regulatoria (10 · 30%)' },
      { id: 'contractual', etiqueta: 'Contractual y datos (5 · 20%)' },
      { id: 'operativa', etiqueta: 'Física y reputacional (5 · 20%)' }
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
    // Por defecto: dimensión ciberseguridad.
    const estado = {
      todos: false,
      activos: { ciber: true, legal: false, contractual: false, operativa: false }
    };

    const sec = document.createElement('section');
    sec.className = 'indice-desglose';
    sec.setAttribute('aria-label', 'Desglose del índice de transparencia');

    const titulo = document.createElement('h3');
    titulo.className = 'market-detalle__subtitulo';
    titulo.textContent = 'Desglose del índice';

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
      '30 observables: Ciber 30% · Legal 30% · Contractual 20% · Operativa 20%. Un grupo a la vez, o Ver todos.';

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
        ? 'Mostrando las 4 dimensiones · 30 observables (mock de superficie pública).'
        : 'Dimensión activa · mock sin agente interno ni scrapeo headless.';
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
    if (f.grupo === 'ciber') barra.classList.add('indice-desglose__barra--ciber');
    if (f.grupo === 'legal') barra.classList.add('indice-desglose__barra--legal');
    if (f.grupo === 'contractual') barra.classList.add('indice-desglose__barra--contractual');
    if (f.grupo === 'operativa') barra.classList.add('indice-desglose__barra--operativa');
    if (f.grupo === 'resumen') barra.classList.add('indice-desglose__barra--nucleo');
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

  async accion(n, bloqueado, boton, estadoEl) {
    if (bloqueado) {
      App.openSection('subir-confianza');
      return;
    }
    if (typeof MarketMonetizacion !== 'undefined') {
      MarketMonetizacion.interceptarContacto(n, estadoEl);
      return;
    }
    if (estadoEl) estadoEl.textContent = 'Módulo de contacto no disponible.';
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
    if (n.cta_texto) return n.cta_texto;
    return 'Ver ficha';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
