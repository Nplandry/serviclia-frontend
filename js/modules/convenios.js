// Convenios institucionales: una caja de compensación, municipio, banco o
// aseguradora paga las consultas de sus beneficiarios.
//
// Demo solo frontend: todo vive en localStorage. Para pasar a producción,
// reemplazar _readHist/_writeHist y activar/autorizar por llamadas al backend;
// el resto de la app y el panel no cambian. El cliente nunca debe decidir en
// producción si una consulta está cubierta.

const Convenios = {
  USER_KEY: 'servicia.convenio.',
  HIST_KEY: 'servicia.convenio.hist.',
  EJEMPLO_KEY: 'servicia.convenio.ejemplo.',
  MAX_USUARIOS_MES: 5000,

  // cupoMensual: consultas con costo cubiertas al mes. precioMensual en CLP (null = a medida).
  CATALOGO: [
    { codigo: 'CAJA-DEMO', nombre: 'Caja de Compensación Demo', tipo: 'caja', cupoMensual: 400, precioMensual: 1190000 },
    { codigo: 'MUNI-DEMO', nombre: 'Municipalidad Demo', tipo: 'municipio', cupoMensual: 150, precioMensual: 490000 },
    { codigo: 'BANCO-DEMO', nombre: 'Banco Demo', tipo: 'banco', cupoMensual: 400, precioMensual: null },
    { codigo: 'SEGUROS-DEMO', nombre: 'Aseguradora Demo', tipo: 'aseguradora', cupoMensual: 400, precioMensual: null }
  ],

  normalizar(codigo) {
    return String(codigo || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  },

  buscar(codigo) {
    const c = Convenios.normalizar(codigo);
    return Convenios.CATALOGO.find(x => x.codigo === c) || null;
  },

  // offset: meses hacia atrás desde el actual.
  periodo(offset) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (offset || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  },

  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      void e;
    }
  },

  _remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      void e;
    }
  },

  // ---------- Usuario ----------

  activar(owner, codigo) {
    const conv = Convenios.buscar(codigo);
    if (!conv) {
      return { ok: false, error: 'El código no corresponde a ninguna institución en convenio.' };
    }
    Convenios._write(Convenios.USER_KEY + owner, { codigo: conv.codigo, desde: new Date().toISOString() });
    return { ok: true, convenio: conv };
  },

  desactivar(owner) {
    Convenios._remove(Convenios.USER_KEY + owner);
  },

  delUsuario(owner) {
    const v = Convenios._read(Convenios.USER_KEY + owner, null);
    return v ? Convenios.buscar(v.codigo) : null;
  },

  // ---------- Historial agregado (sin datos personales) ----------

  mesVacio(periodo) {
    return { periodo: periodo, consultas: 0, cubiertas: 0, costoCLP: 0, alertas: 0, porCaso: {}, usuarios: [] };
  },

  _readHist(codigo) {
    return Convenios._read(Convenios.HIST_KEY + codigo, {}) || {};
  },

  _writeHist(codigo, hist) {
    Convenios._write(Convenios.HIST_KEY + codigo, hist);
  },

  historial(codigo) {
    return Convenios._readHist(codigo);
  },

  tieneDatos(codigo) {
    return Object.keys(Convenios._readHist(codigo)).length > 0;
  },

  // Periodos con datos más el actual, del más reciente al más antiguo.
  periodos(codigo) {
    const set = new Set(Object.keys(Convenios._readHist(codigo)));
    set.add(Convenios.periodo());
    return Array.from(set).sort().reverse();
  },

  mes(codigo, periodo) {
    const p = periodo || Convenios.periodo();
    const m = Convenios._readHist(codigo)[p];
    return m ? Object.assign(Convenios.mesVacio(p), m) : Convenios.mesVacio(p);
  },

  // Compatibilidad: total = consultas con costo cubiertas en el mes actual.
  uso(codigo) {
    const m = Convenios.mes(codigo);
    return { periodo: m.periodo, total: m.cubiertas, costoCLP: m.costoCLP, porCaso: m.porCaso };
  },

  disponible(codigo) {
    const conv = Convenios.buscar(codigo);
    if (!conv) return 0;
    return Math.max(0, conv.cupoMensual - Convenios.mes(codigo).cubiertas);
  },

  // Decide quién paga una consulta antes de ejecutarla.
  // Devuelve { permitido, pagador: 'gratis' | 'convenio', convenio, error }.
  autorizar(owner, costoCLP) {
    if (!costoCLP) return { permitido: true, pagador: 'gratis', convenio: Convenios.delUsuario(owner) };
    const conv = Convenios.delUsuario(owner);
    if (!conv) {
      return {
        permitido: false,
        pagador: null,
        convenio: null,
        error: 'Esta consulta tiene un costo de $' + costoCLP.toLocaleString('es-CL')
          + '. Ingrese el código de su caja de compensación, municipio o banco para que sea gratis.'
      };
    }
    if (Convenios.disponible(conv.codigo) <= 0) {
      return {
        permitido: false,
        pagador: null,
        convenio: conv,
        error: conv.nombre + ' ya usó todas las consultas de este mes. Se renuevan el día 1.'
      };
    }
    return { permitido: true, pagador: 'convenio', convenio: conv };
  },

  // d: { casoId, costoCLP, alerta, owner }
  // El usuario se guarda seudonimizado, solo para contar usuarios únicos.
  registrarUso(codigo, d) {
    const datos = d || {};
    const hist = Convenios._readHist(codigo);
    const m = Convenios.mes(codigo);
    m.consultas += 1;
    if (datos.costoCLP > 0) {
      m.cubiertas += 1;
      m.costoCLP += datos.costoCLP;
    }
    if (datos.alerta) m.alertas += 1;

    const casoId = datos.casoId || 'otro';
    const caso = m.porCaso[casoId] || { consultas: 0, alertas: 0 };
    caso.consultas += 1;
    if (datos.alerta) caso.alertas += 1;
    m.porCaso[casoId] = caso;

    if (datos.owner && typeof Security !== 'undefined' && Security.pseudonymize) {
      const token = Security.pseudonymize(codigo + ':' + datos.owner);
      if (m.usuarios.indexOf(token) === -1 && m.usuarios.length < Convenios.MAX_USUARIOS_MES) {
        m.usuarios.push(token);
      }
    }

    hist[m.periodo] = m;
    Convenios._writeHist(codigo, hist);
    return m;
  },

  // ---------- Datos de ejemplo para la demo de venta ----------

  esEjemplo(codigo) {
    return Convenios._read(Convenios.EJEMPLO_KEY + codigo, false) === true;
  },

  // Genera 6 meses de uso creciente, determinista por código.
  // Reemplaza el historial existente del convenio.
  cargarEjemplo(codigo) {
    const conv = Convenios.buscar(codigo);
    if (!conv) return false;
    let seed = conv.codigo.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const reparto = [
      ['auto-usado', 0.38, 0.30],
      ['embargo-falso', 0.30, 0.18],
      ['portabilidad', 0.20, 0.12],
      ['seguros', 0.12, 0.25]
    ];
    const adopcion = [0.30, 0.40, 0.50, 0.58, 0.66, 0.74];
    const hist = {};
    let n = 0;

    for (let i = 5; i >= 0; i--) {
      const p = Convenios.periodo(i);
      const parcial = i === 0 ? 0.5 : 1;
      const total = Math.round(conv.cupoMensual * 1.6 * adopcion[5 - i] * (0.92 + rand() * 0.16) * parcial);
      const m = Convenios.mesVacio(p);
      reparto.forEach(([casoId, share, tasaAlerta]) => {
        const consultas = Math.round(total * share);
        const alertas = Math.round(consultas * tasaAlerta * (0.85 + rand() * 0.3));
        m.porCaso[casoId] = { consultas: consultas, alertas: alertas };
        m.consultas += consultas;
        m.alertas += alertas;
        if (casoId === 'embargo-falso') {
          m.cubiertas = Math.min(consultas, conv.cupoMensual);
          m.costoCLP = m.cubiertas * 2000;
        }
      });
      const unicos = Math.round(m.consultas * 0.72);
      for (let u = 0; u < unicos; u++) m.usuarios.push('EJ-' + (n++).toString(36));
      hist[p] = m;
    }

    Convenios._writeHist(conv.codigo, hist);
    Convenios._write(Convenios.EJEMPLO_KEY + conv.codigo, true);
    return true;
  },

  borrarDatos(codigo) {
    const conv = Convenios.buscar(codigo);
    if (!conv) return;
    Convenios._remove(Convenios.HIST_KEY + conv.codigo);
    Convenios._remove(Convenios.EJEMPLO_KEY + conv.codigo);
  }
};
