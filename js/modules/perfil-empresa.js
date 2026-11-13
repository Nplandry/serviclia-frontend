// Perfil: crear empresa en marketplace o reclamar una publicada.
const PerfilEmpresa = {
  modo: null,
  seleccionId: null,
  busquedaTimer: null,

  esEmpresa() {
    return typeof ProgresoCuenta !== 'undefined'
      ? ProgresoCuenta.actual().es('empresa')
      : false;
  },

  init() {
    const host = document.getElementById('perfilEmpresaRaiz');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    if (!PerfilEmpresa.esEmpresa()) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.appendChild(PerfilEmpresa.render());
    PerfilEmpresa.cargarMias();
  },

  categorias() {
    if (typeof Market !== 'undefined' && Array.isArray(Market.CATEGORIAS)) {
      return Market.CATEGORIAS.filter((c) => c.id !== 'all');
    }
    return [
      { id: 'tecnologia', label: 'Tecnología y datos' },
      { id: 'industria', label: 'Minería e industria' },
      { id: 'construccion', label: 'Construcción' },
      { id: 'servicios-profesionales', label: 'Servicios profesionales' },
      { id: 'logistica', label: 'Transporte, Logística y Última Milla' }
    ];
  },

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'perfil-empresa';

    const titulo = document.createElement('h3');
    titulo.className = 'section-heading';
    titulo.textContent = '¿Quiere crear una empresa?';

    const lead = document.createElement('p');
    lead.className = 'section-lead';
    lead.textContent =
      'Publique su ficha en el marketplace o reclame una empresa ya listada si usted es el titular.';

    const acciones = document.createElement('div');
    acciones.className = 'perfil-empresa__acciones';

    const btnCrear = document.createElement('button');
    btnCrear.type = 'button';
    btnCrear.className = 'submit-btn';
    btnCrear.textContent = 'Crear empresa';
    btnCrear.addEventListener('click', () => PerfilEmpresa.mostrarModo('crear'));

    const btnReclamar = document.createElement('button');
    btnReclamar.type = 'button';
    btnReclamar.className = 'submit-btn submit-btn--secondary';
    btnReclamar.textContent = 'Tengo una y quiero reclamarla';
    btnReclamar.addEventListener('click', () => PerfilEmpresa.mostrarModo('reclamar'));

    acciones.append(btnCrear, btnReclamar);

    const panel = document.createElement('div');
    panel.id = 'perfilEmpresaPanel';
    panel.className = 'perfil-empresa__panel';
    panel.hidden = true;

    const miasTitulo = document.createElement('h4');
    miasTitulo.className = 'perfil-empresa__subtitulo';
    miasTitulo.textContent = 'Sus empresas';

    const mias = document.createElement('div');
    mias.id = 'perfilEmpresaMias';
    mias.className = 'perfil-empresa__mias';
    mias.setAttribute('aria-live', 'polite');

    const status = document.createElement('p');
    status.id = 'perfilEmpresaStatus';
    status.className = 'status-text';
    status.setAttribute('role', 'status');

    wrap.append(titulo, lead, acciones, panel, miasTitulo, mias, status);
    return wrap;
  },

  mostrarModo(modo) {
    PerfilEmpresa.modo = modo;
    PerfilEmpresa.seleccionId = null;
    const panel = document.getElementById('perfilEmpresaPanel');
    if (!panel) return;
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    panel.hidden = false;
    panel.appendChild(
      modo === 'crear' ? PerfilEmpresa.formCrear() : PerfilEmpresa.formReclamar()
    );
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  formCrear() {
    const form = document.createElement('form');
    form.className = 'form perfil-empresa__form';
    form.noValidate = true;

    const intro = document.createElement('p');
    intro.className = 'field__hint';
    intro.textContent =
      'Se publicará en Explorar y quedará asociada a su cuenta como titular.';

    form.append(
      intro,
      PerfilEmpresa.campoTexto('peNombre', 'Nombre de la empresa', true, 160),
      PerfilEmpresa.campoCategoria('peCategoria'),
      PerfilEmpresa.campoTexto(
        'peDireccion',
        'Dirección de oficina',
        true,
        200,
        'text',
        'Calle, número, comuna o ciudad donde opera la empresa.'
      ),
      PerfilEmpresa.campoTexto('peTelefono', 'Teléfono', false, 30, 'tel'),
      PerfilEmpresa.campoTexto('peWeb', 'Sitio web', false, 200),
      PerfilEmpresa.campoTexto(
        'peBanner',
        'URL del banner (opcional)',
        false,
        500,
        'url',
        'Enlace https a la imagen de fondo de la ficha. Si lo deja vacío, se usa una imagen por categoría.'
      ),
      PerfilEmpresa.campoTexto(
        'peLogo',
        'URL del logo (opcional)',
        false,
        500,
        'url',
        'Enlace https al logo. Si lo deja vacío, se muestran las iniciales.'
      ),
      PerfilEmpresa.campoTextoarea('peDesc', 'Descripción', 2000)
    );

    const acciones = document.createElement('div');
    acciones.className = 'perfil-empresa__form-acciones';
    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'submit-btn';
    enviar.textContent = 'Publicar empresa';
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'history__clear';
    cancelar.textContent = 'Cancelar';
    cancelar.addEventListener('click', () => PerfilEmpresa.cerrarPanel());
    acciones.append(enviar, cancelar);
    form.appendChild(acciones);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      PerfilEmpresa.enviarCrear();
    });
    return form;
  },

  formReclamar() {
    const wrap = document.createElement('div');
    wrap.className = 'perfil-empresa__reclamar';

    const intro = document.createElement('p');
    intro.className = 'field__hint';
    intro.textContent =
      'Busque la ficha publicada, selecciónela y confirme con el documento de titularidad (RUT u otro).';

    const buscar = PerfilEmpresa.campoTexto('peBuscar', 'Buscar empresa publicada', false, 120);
    const input = buscar.querySelector('input');
    if (input) {
      input.placeholder = 'Nombre o dirección…';
      input.addEventListener('input', () => {
        clearTimeout(PerfilEmpresa.busquedaTimer);
        PerfilEmpresa.busquedaTimer = setTimeout(
          () => PerfilEmpresa.buscarPublicadas(input.value.trim()),
          280
        );
      });
    }

    const lista = document.createElement('div');
    lista.id = 'perfilEmpresaResultados';
    lista.className = 'perfil-empresa__resultados';
    lista.setAttribute('role', 'listbox');
    lista.setAttribute('aria-label', 'Empresas disponibles para reclamar');

    const form = document.createElement('form');
    form.className = 'form perfil-empresa__form';
    form.hidden = true;
    form.id = 'perfilEmpresaClaimForm';
    form.noValidate = true;
    form.append(
      PerfilEmpresa.campoTexto('peDoc', 'Documento de verificación', true, 120),
      PerfilEmpresa.campoTexto('peClaimTel', 'Teléfono (opcional)', false, 30, 'tel'),
      PerfilEmpresa.campoTexto('peClaimWeb', 'Sitio web (opcional)', false, 200)
    );
    const acciones = document.createElement('div');
    acciones.className = 'perfil-empresa__form-acciones';
    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'submit-btn';
    enviar.textContent = 'Reclamar empresa';
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'history__clear';
    cancelar.textContent = 'Cancelar';
    cancelar.addEventListener('click', () => PerfilEmpresa.cerrarPanel());
    acciones.append(enviar, cancelar);
    form.appendChild(acciones);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      PerfilEmpresa.enviarReclamo();
    });

    wrap.append(intro, buscar, lista, form);
    setTimeout(() => PerfilEmpresa.buscarPublicadas(''), 0);
    return wrap;
  },

  cerrarPanel() {
    PerfilEmpresa.modo = null;
    PerfilEmpresa.seleccionId = null;
    const panel = document.getElementById('perfilEmpresaPanel');
    if (panel) {
      panel.hidden = true;
      while (panel.firstChild) panel.removeChild(panel.firstChild);
    }
  },

  campoTexto(id, label, required, max, type, hint) {
    const field = document.createElement('div');
    field.className = 'field';
    const lab = document.createElement('label');
    lab.className = 'field__label';
    lab.htmlFor = id;
    lab.textContent = label;
    const input = document.createElement('input');
    input.id = id;
    input.className = 'field__input';
    input.type = type || 'text';
    input.maxLength = max || 160;
    if (required) input.required = true;
    field.append(lab, input);
    if (hint) {
      const hintEl = document.createElement('p');
      hintEl.className = 'field__hint';
      hintEl.textContent = hint;
      field.appendChild(hintEl);
    }
    return field;
  },

  campoTextoarea(id, label, max) {
    const field = document.createElement('div');
    field.className = 'field';
    const lab = document.createElement('label');
    lab.className = 'field__label';
    lab.htmlFor = id;
    lab.textContent = label;
    const ta = document.createElement('textarea');
    ta.id = id;
    ta.className = 'field__input';
    ta.rows = 3;
    ta.maxLength = max || 2000;
    field.append(lab, ta);
    return field;
  },

  campoCategoria(id) {
    const field = document.createElement('div');
    field.className = 'field';
    const lab = document.createElement('label');
    lab.className = 'field__label';
    lab.htmlFor = id;
    lab.textContent = 'Categoría';
    const select = document.createElement('select');
    select.id = id;
    select.className = 'field__input';
    select.required = true;
    PerfilEmpresa.categorias().forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.label;
      select.appendChild(opt);
    });
    field.append(lab, select);
    return field;
  },

  setStatus(msg) {
    const el = document.getElementById('perfilEmpresaStatus');
    if (el) el.textContent = msg || '';
  },

  async cargarMias() {
    const host = document.getElementById('perfilEmpresaMias');
    if (!host || !Auth.isAuthenticated()) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    const res = await Auth.request('/v1/businesses/mias', { token: Auth.sesion.token });
    if (!res.ok) {
      host.textContent = res.error || 'No se pudieron cargar sus empresas.';
      return;
    }
    const lista = Array.isArray(res.data) ? res.data : [];
    if (!lista.length) {
      const vacio = document.createElement('p');
      vacio.className = 'field__hint';
      vacio.textContent = 'Aún no tiene empresas asociadas a esta cuenta.';
      host.appendChild(vacio);
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'perfil-empresa__lista';
    lista.forEach((n) => {
      const li = document.createElement('li');
      li.className = 'perfil-empresa__item';
      const texto = document.createElement('div');
      texto.className = 'perfil-empresa__item-texto';
      const nombre = document.createElement('strong');
      nombre.textContent = n.nombre;
      const meta = document.createElement('span');
      meta.textContent =
        (n.categoria || '') +
        ' · Índice ' +
        (n.indice_transparencia != null ? Number(n.indice_transparencia).toFixed(1) : '—') +
        (n.is_verified_profile ? ' · Verificada' : '');
      texto.append(nombre, meta);
      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'perfil-danger perfil-empresa__quitar';
      quitar.textContent = 'Quitar del perfil';
      quitar.addEventListener('click', () => PerfilEmpresa.quitarEmpresa(n.id, n.nombre));
      li.append(texto, quitar);
      ul.appendChild(li);
    });
    host.appendChild(ul);
  },

  async quitarEmpresa(id, nombre) {
    if (!Auth.isAuthenticated()) {
      PerfilEmpresa.setStatus('Inicie sesión para gestionar sus empresas.');
      return;
    }
    const ok = window.confirm(
      '¿Quitar «' +
        (nombre || 'esta empresa') +
        '» de su perfil? La ficha seguirá en el marketplace sin titular.'
    );
    if (!ok) return;
    PerfilEmpresa.setStatus('Quitando…');
    const res = await Auth.request(
      '/v1/businesses/' + encodeURIComponent(id) + '/claim',
      { method: 'DELETE', token: Auth.sesion.token }
    );
    if (!res.ok) {
      PerfilEmpresa.setStatus(res.error || 'No se pudo quitar la empresa.');
      return;
    }
    PerfilEmpresa.setStatus('Empresa desasociada de su perfil.');
    PerfilEmpresa.cargarMias();
  },

  async buscarPublicadas(q) {
    const host = document.getElementById('perfilEmpresaResultados');
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const res = await Auth.request('/v1/businesses' + (params.toString() ? '?' + params : ''));
    if (!res.ok) {
      host.textContent = res.error || 'No se pudo buscar.';
      return;
    }
    const libres = (Array.isArray(res.data) ? res.data : []).filter((n) => !n.is_claimed);
    if (!libres.length) {
      const vacio = document.createElement('p');
      vacio.className = 'field__hint';
      vacio.textContent = q
        ? 'No hay fichas libres con ese criterio.'
        : 'No hay empresas sin reclamar en el directorio.';
      host.appendChild(vacio);
      return;
    }
    libres.slice(0, 12).forEach((n) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'perfil-empresa__opcion';
      btn.dataset.id = n.id;
      btn.setAttribute('role', 'option');
      const on = n.id === PerfilEmpresa.seleccionId;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) btn.classList.add('perfil-empresa__opcion--on');
      const nombre = document.createElement('strong');
      nombre.textContent = n.nombre;
      const meta = document.createElement('span');
      meta.textContent = [n.categoria, n.direccion].filter(Boolean).join(' · ');
      btn.append(nombre, meta);
      btn.addEventListener('click', () => {
        PerfilEmpresa.seleccionId = n.id;
        host.querySelectorAll('.perfil-empresa__opcion').forEach((el) => {
          const sel = el.dataset.id === n.id;
          el.classList.toggle('perfil-empresa__opcion--on', sel);
          el.setAttribute('aria-selected', sel ? 'true' : 'false');
        });
        const form = document.getElementById('perfilEmpresaClaimForm');
        if (form) form.hidden = false;
        PerfilEmpresa.setStatus('Seleccionó «' + n.nombre + '». Complete el documento y confirme.');
      });
      host.appendChild(btn);
    });
  },

  async enviarCrear() {
    if (!PerfilEmpresa.esEmpresa()) {
      PerfilEmpresa.setStatus('Solo una cuenta empresa puede crear fichas.');
      return;
    }
    if (!Auth.isAuthenticated()) {
      PerfilEmpresa.setStatus('Inicie sesión para crear una empresa.');
      return;
    }
    const nombre = ((document.getElementById('peNombre') || {}).value || '').trim();
    const categoria = (document.getElementById('peCategoria') || {}).value || '';
    const direccion = ((document.getElementById('peDireccion') || {}).value || '').trim();
    const telefono = ((document.getElementById('peTelefono') || {}).value || '').trim();
    const sitio_web = ((document.getElementById('peWeb') || {}).value || '').trim();
    const imagen_url = ((document.getElementById('peBanner') || {}).value || '').trim();
    const logo_url = ((document.getElementById('peLogo') || {}).value || '').trim();
    const descripcion = ((document.getElementById('peDesc') || {}).value || '').trim();
    if (nombre.length < 2) {
      PerfilEmpresa.setStatus('Ingrese el nombre de la empresa.');
      return;
    }
    if (direccion.length < 3) {
      PerfilEmpresa.setStatus('Ingrese la dirección de oficina.');
      return;
    }
    if (imagen_url && !/^https?:\/\//i.test(imagen_url)) {
      PerfilEmpresa.setStatus('La URL del banner debe comenzar con http:// o https://');
      return;
    }
    if (logo_url && !/^https?:\/\//i.test(logo_url)) {
      PerfilEmpresa.setStatus('La URL del logo debe comenzar con http:// o https://');
      return;
    }
    PerfilEmpresa.setStatus('Publicando…');
    const res = await Auth.request('/v1/businesses', {
      method: 'POST',
      body: {
        nombre,
        categoria,
        direccion,
        telefono: telefono || null,
        sitio_web: sitio_web || null,
        imagen_url: imagen_url || null,
        logo_url: logo_url || null,
        descripcion: descripcion || null
      },
      token: Auth.sesion.token
    });
    if (!res.ok) {
      PerfilEmpresa.setStatus(res.error || 'No se pudo crear la empresa.');
      return;
    }
    PerfilEmpresa.setStatus('Empresa publicada y asociada a su cuenta.');
    PerfilEmpresa.cerrarPanel();
    PerfilEmpresa.cargarMias();
  },

  async enviarReclamo() {
    if (!PerfilEmpresa.esEmpresa()) {
      PerfilEmpresa.setStatus('Solo una cuenta empresa puede reclamar fichas.');
      return;
    }
    if (!Auth.isAuthenticated()) {
      PerfilEmpresa.setStatus('Inicie sesión para reclamar.');
      return;
    }
    if (!PerfilEmpresa.seleccionId) {
      PerfilEmpresa.setStatus('Seleccione una empresa de la lista.');
      return;
    }
    const doc = ((document.getElementById('peDoc') || {}).value || '').trim();
    if (doc.length < 3) {
      PerfilEmpresa.setStatus('Ingrese el documento de verificación.');
      return;
    }
    const telefono = ((document.getElementById('peClaimTel') || {}).value || '').trim();
    const sitio_web = ((document.getElementById('peClaimWeb') || {}).value || '').trim();
    PerfilEmpresa.setStatus('Reclamando…');
    const body = { documento_verificacion: doc };
    if (telefono) body.telefono = telefono;
    if (sitio_web) body.sitio_web = sitio_web;
    const res = await Auth.request(
      '/v1/businesses/' + encodeURIComponent(PerfilEmpresa.seleccionId) + '/claim',
      { method: 'POST', body, token: Auth.sesion.token }
    );
    if (!res.ok) {
      PerfilEmpresa.setStatus(res.error || 'No se pudo reclamar la empresa.');
      return;
    }
    PerfilEmpresa.setStatus(res.data.mensaje || 'Empresa reclamada correctamente.');
    PerfilEmpresa.cerrarPanel();
    PerfilEmpresa.cargarMias();
  }
};
