// Pasaporte de Confianza: muestra el nivel, el score de confiabilidad y el estado de arriendo
// del usuario con la sesión actual. Los datos vienen de /v1/auth/yo y de /v1/perfil.
const Pasaporte = {
  ESTADOS_ARRIENDO: {
    basico: 'Sin documentos de arriendo',
    pendiente: 'En revisión',
    verificado: 'Verificado',
    rechazado: 'Rechazado'
  },

  init() {
    const raiz = document.getElementById('pasaporteRaiz');
    if (!raiz) return;
    Pasaporte.render(raiz);
  },

  render(raiz) {
    Pasaporte.limpiar(raiz);
    const sesion = Auth.getCurrentUser();
    if (!sesion) {
      raiz.appendChild(Pasaporte.texto('Inicie sesión para ver su Pasaporte de Confianza.', 'pasaporte__nota'));
      return;
    }
    const perfil = sesion.perfil || {};
    const tarjeta = document.createElement('article');
    tarjeta.className = 'pasaporte__tarjeta';
    tarjeta.setAttribute('aria-live', 'polite');

    const cabecera = document.createElement('div');
    cabecera.className = 'pasaporte__cabecera';
    cabecera.append(
      Pasaporte.texto('PASAPORTE DE CONFIANZA', 'pasaporte__marca'),
      Pasaporte.texto('Nivel ' + (perfil.nivel_pasaporte || 1), 'pasaporte__badge')
    );

    const titular = document.createElement('div');
    titular.className = 'pasaporte__titular';
    titular.append(
      Pasaporte.texto(Pasaporte.iniciales(sesion.nombre), 'pasaporte__avatar'),
      Pasaporte.texto(sesion.nombre || '', 'pasaporte__nombre'),
      Pasaporte.texto(perfil.rut_verificado ? 'RUT verificado' : 'RUT sin verificar', 'pasaporte__rut')
    );

    tarjeta.append(
      cabecera,
      titular,
      Pasaporte.seccionConfiabilidad(perfil),
      Pasaporte.seccionArriendo(perfil)
    );
    raiz.appendChild(tarjeta);

    if (!perfil.rut_verificado) raiz.appendChild(Pasaporte.formularioRut());
    if (perfil.estado_pasaporte === 'basico') raiz.appendChild(Pasaporte.formularioDocumento());
  },

  seccionConfiabilidad(perfil) {
    const bloque = document.createElement('div');
    bloque.className = 'pasaporte__bloque';
    const score = perfil.score_confiabilidad;
    bloque.append(
      Pasaporte.texto('Confiabilidad (nivel 1)', 'pasaporte__subtitulo'),
      Pasaporte.texto(
        score === null || score === undefined ? 'Sin reservas cerradas todavía' : score + ' / 100',
        'pasaporte__score'
      ),
      Pasaporte.texto('Porcentaje de asistencias sobre reservas cerradas.', 'pasaporte__nota')
    );
    return bloque;
  },

  seccionArriendo(perfil) {
    const bloque = document.createElement('div');
    bloque.className = 'pasaporte__bloque';
    const scoring = perfil.inmobiliaria_scoring;
    const estado = Pasaporte.ESTADOS_ARRIENDO[perfil.estado_pasaporte] || perfil.estado_pasaporte;
    bloque.append(
      Pasaporte.texto('Arriendo (nivel 2)', 'pasaporte__subtitulo'),
      Pasaporte.texto(estado, 'pasaporte__estado')
    );
    if (scoring && scoring.score_financiero !== null && scoring.score_financiero !== undefined) {
      bloque.append(Pasaporte.texto('Score de arriendo: ' + scoring.score_financiero + ' / 1000', 'pasaporte__score'));
      const fecha = new Date(scoring.actualizado_en);
      if (!Number.isNaN(fecha.getTime())) {
        bloque.append(Pasaporte.texto('Actualizado el ' + fecha.toLocaleDateString('es-CL'), 'pasaporte__nota'));
      }
    }
    return bloque;
  },

  formularioRut() {
    const formulario = document.createElement('form');
    formulario.className = 'pasaporte__formulario';
    const etiqueta = Pasaporte.texto('Verifique su RUT para subir de nivel', 'pasaporte__nota');
    const campo = document.createElement('input');
    campo.className = 'field__input';
    campo.type = 'text';
    campo.placeholder = 'Ej: 12.345.678-5';
    campo.maxLength = 15;
    campo.required = true;
    const boton = Pasaporte.boton('Verificar RUT');
    const estado = Pasaporte.texto('', 'pasaporte__nota');
    formulario.addEventListener('submit', async e => {
      e.preventDefault();
      boton.disabled = true;
      const res = await Auth.actualizarPerfil({ rut: campo.value.trim() });
      if (res.ok) {
        Pasaporte.init();
        return;
      }
      estado.textContent = res.error;
      boton.disabled = false;
    });
    formulario.append(etiqueta, campo, boton, estado);
    return formulario;
  },

  formularioDocumento() {
    const formulario = document.createElement('form');
    formulario.className = 'pasaporte__formulario';
    formulario.append(
      Pasaporte.texto(
        'Suba su liquidación de sueldo o certificado Dicom en PDF (máximo 1 MB) para obtener su score de arriendo. El archivo se procesa en memoria y no se guarda.',
        'pasaporte__nota'
      )
    );
    const campo = document.createElement('input');
    campo.type = 'file';
    campo.accept = 'application/pdf';
    const boton = Pasaporte.boton('Subir PDF');
    const estado = Pasaporte.texto('', 'pasaporte__nota');
    formulario.addEventListener('submit', async e => {
      e.preventDefault();
      boton.disabled = true;
      const res = await Auth.subirDocumentoArriendo(campo.files[0]);
      if (res.ok) {
        Pasaporte.init();
        return;
      }
      estado.textContent = res.error;
      boton.disabled = false;
    });
    formulario.append(campo, boton, estado);
    return formulario;
  },

  boton(texto) {
    const boton = document.createElement('button');
    boton.type = 'submit';
    boton.className = 'submit-btn';
    boton.textContent = texto;
    return boton;
  },

  texto(valor, clase) {
    const el = document.createElement(clase === 'pasaporte__nota' ? 'p' : 'span');
    el.className = clase;
    el.textContent = valor;
    return el;
  },

  iniciales(nombre) {
    return (nombre || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || '?';
  },

  limpiar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
