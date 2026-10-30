// Venta a personas naturales: compra por unidad y Plan Familiar mensual.
//
// Demo solo frontend: el pago es simulado y todo vive en localStorage.
// Para producción, reemplazar comprar/suscribir por la pasarela de pago
// (Flow, Mercado Pago u otra) y mover el control de créditos al backend.

const Planes = {
  KEY: 'servicia.plan.',

  // Productos por unidad. caso: categoría donde se puede usar el crédito.
  PRODUCTOS: {
    'verificacion-dueno': { nombre: 'Verificación de dueño del auto', precio: 3990, caso: 'auto-usado' },
    'consulta-judicial': { nombre: 'Consulta judicial', precio: 3990, caso: 'embargo-falso' }
  },

  FAMILIAR: {
    id: 'familiar',
    nombre: 'Plan Familiar',
    precio: 5990,
    judicialesMes: 2,
    maxFamiliares: 3,
    incluye: [
      'Hasta 3 adultos mayores vinculados',
      '2 consultas de causas judiciales al mes',
      'Verificación de dueño de autos, teléfono y orientación sin límite',
      'Aviso al familiar cuando hay una alerta'
    ]
  },

  // Casos que el Plan Familiar cubre sin consumir créditos judiciales.
  CASOS_ILIMITADOS: ['auto-usado', 'portabilidad', 'seguros'],

  periodo() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  },

  vacio() {
    return { creditos: {}, suscripcion: null, familiares: [], avisos: [], compras: [] };
  },

  get(owner) {
    try {
      const raw = localStorage.getItem(Planes.KEY + owner);
      return raw ? Object.assign(Planes.vacio(), JSON.parse(raw)) : Planes.vacio();
    } catch (e) {
      return Planes.vacio();
    }
  },

  _save(owner, data) {
    try {
      localStorage.setItem(Planes.KEY + owner, JSON.stringify(data));
    } catch (e) {
      void e;
    }
  },

  reset(owner) {
    try {
      localStorage.removeItem(Planes.KEY + owner);
    } catch (e) {
      void e;
    }
  },

  // ---------- Pago simulado ----------

  // Valida una tarjeta de prueba. Devuelve { ok, ultimos4 | error }.
  validarTarjeta(numero) {
    const n = String(numero || '').replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(n)) return { ok: false, error: 'Ingrese un número de tarjeta válido.' };
    let sum = 0;
    for (let i = 0; i < n.length; i++) {
      let d = parseInt(n.charAt(n.length - 1 - i), 10);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    if (sum % 10 !== 0) return { ok: false, error: 'El número de tarjeta no es válido.' };
    return { ok: true, ultimos4: n.slice(-4) };
  },

  _registrarCompra(data, item, monto, ultimos4) {
    data.compras.unshift({
      id: 'OC-' + Date.now().toString(36).toUpperCase(),
      item: item,
      monto: monto,
      tarjeta: '•••• ' + ultimos4,
      fecha: new Date().toISOString()
    });
    data.compras = data.compras.slice(0, 50);
  },

  comprar(owner, productoId, tarjeta) {
    const prod = Planes.PRODUCTOS[productoId];
    if (!prod) return { ok: false, error: 'Producto no disponible.' };
    const t = Planes.validarTarjeta(tarjeta);
    if (!t.ok) return t;
    const data = Planes.get(owner);
    data.creditos[productoId] = (data.creditos[productoId] || 0) + 1;
    Planes._registrarCompra(data, prod.nombre, prod.precio, t.ultimos4);
    Planes._save(owner, data);
    return { ok: true, compra: data.compras[0] };
  },

  suscribir(owner, tarjeta) {
    const t = Planes.validarTarjeta(tarjeta);
    if (!t.ok) return t;
    const data = Planes.get(owner);
    data.suscripcion = {
      plan: Planes.FAMILIAR.id,
      desde: new Date().toISOString(),
      periodo: Planes.periodo(),
      judicialesUsadas: 0,
      tarjeta: '•••• ' + t.ultimos4
    };
    Planes._registrarCompra(data, Planes.FAMILIAR.nombre + ' (mensual)', Planes.FAMILIAR.precio, t.ultimos4);
    Planes._save(owner, data);
    return { ok: true, compra: data.compras[0] };
  },

  cancelar(owner) {
    const data = Planes.get(owner);
    data.suscripcion = null;
    Planes._save(owner, data);
  },

  // Reinicia el contador mensual si cambió el mes.
  suscripcion(owner) {
    const data = Planes.get(owner);
    const s = data.suscripcion;
    if (!s) return null;
    if (s.periodo !== Planes.periodo()) {
      s.periodo = Planes.periodo();
      s.judicialesUsadas = 0;
      Planes._save(owner, data);
    }
    return s;
  },

  judicialesDisponibles(owner) {
    const s = Planes.suscripcion(owner);
    return s ? Math.max(0, Planes.FAMILIAR.judicialesMes - s.judicialesUsadas) : 0;
  },

  productoDeCaso(casoId) {
    return Object.keys(Planes.PRODUCTOS).find(k => Planes.PRODUCTOS[k].caso === casoId) || null;
  },

  // ¿Puede esta persona pagar el caso con su plan o un crédito comprado?
  // Devuelve { cubierto, fuente: 'plan' | 'credito', productoId, detalle }.
  cobertura(owner, casoId, costoCLP) {
    const sus = Planes.suscripcion(owner);
    const productoId = Planes.productoDeCaso(casoId);
    const data = Planes.get(owner);

    if (sus) {
      if (!costoCLP && Planes.CASOS_ILIMITADOS.indexOf(casoId) !== -1) {
        return { cubierto: true, fuente: 'plan', productoId: null, detalle: 'Incluido en su Plan Familiar.' };
      }
      if (costoCLP && Planes.judicialesDisponibles(owner) > 0) {
        return { cubierto: true, fuente: 'plan', productoId: null, detalle: 'Incluido en su Plan Familiar. Le quedan ' + Planes.judicialesDisponibles(owner) + ' consultas judiciales este mes.' };
      }
    }
    if (productoId && (data.creditos[productoId] || 0) > 0) {
      return { cubierto: true, fuente: 'credito', productoId: productoId, detalle: 'Usará 1 ' + Planes.PRODUCTOS[productoId].nombre.toLowerCase() + ' comprado. Le quedan ' + data.creditos[productoId] + '.' };
    }
    return { cubierto: false, fuente: null, productoId: productoId, detalle: '' };
  },

  // Descuenta lo que corresponda después de una consulta exitosa.
  consumir(owner, cob, costoCLP) {
    if (!cob || !cob.cubierto) return;
    const data = Planes.get(owner);
    if (cob.fuente === 'plan' && costoCLP && data.suscripcion) {
      Planes.suscripcion(owner);
      const d2 = Planes.get(owner);
      d2.suscripcion.judicialesUsadas += 1;
      Planes._save(owner, d2);
      return;
    }
    if (cob.fuente === 'credito' && cob.productoId) {
      data.creditos[cob.productoId] = Math.max(0, (data.creditos[cob.productoId] || 0) - 1);
      Planes._save(owner, data);
    }
  },

  // ---------- Familiares y avisos ----------

  agregarFamiliar(owner, nombre, telefono) {
    const data = Planes.get(owner);
    if (!data.suscripcion) return { ok: false, error: 'Necesita el Plan Familiar para vincular familiares.' };
    const n = String(nombre || '').trim().replace(/[<>]/g, '');
    const tel = String(telefono || '').replace(/[\s-]/g, '');
    if (n.length < 2) return { ok: false, error: 'Ingrese el nombre del familiar.' };
    if (!/^(\+?56)?9\d{8}$/.test(tel)) return { ok: false, error: 'Ingrese un celular chileno válido.' };
    if (data.familiares.length >= Planes.FAMILIAR.maxFamiliares) {
      return { ok: false, error: 'El Plan Familiar permite hasta ' + Planes.FAMILIAR.maxFamiliares + ' familiares.' };
    }
    data.familiares.push({ nombre: n.slice(0, 60), telefono: '+56 9 **** ' + tel.slice(-4) });
    Planes._save(owner, data);
    return { ok: true };
  },

  quitarFamiliar(owner, idx) {
    const data = Planes.get(owner);
    data.familiares.splice(idx, 1);
    Planes._save(owner, data);
  },

  // Aviso simulado al familiar responsable (en producción: SMS o WhatsApp).
  avisar(owner, caso, resumen) {
    const data = Planes.get(owner);
    if (!data.suscripcion) return null;
    const aviso = { caso: caso, resumen: resumen, fecha: new Date().toISOString() };
    data.avisos.unshift(aviso);
    data.avisos = data.avisos.slice(0, 20);
    Planes._save(owner, data);
    return aviso;
  }
};
