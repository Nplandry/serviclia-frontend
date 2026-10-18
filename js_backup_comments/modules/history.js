// Historial de consultas: persistencia por usuario
const Historial = {
  STORAGE_PREFIX: 'servicia.history.',
  MAX_ITEMS: 50,

  owner: 'anon',
  items: [],

  init(ownerEmail) {
    Historial.owner = ownerEmail || 'anon';
    Historial.load();
    return Historial;
  },

  storageKey() {
    return Historial.STORAGE_PREFIX + Historial.owner;
  },

  load() {
    try {
      const raw = localStorage.getItem(Historial.storageKey());
      Historial.items = raw ? JSON.parse(raw) || [] : [];
    } catch (e) {
      Historial.items = [];
    }
  },

  persist() {
    try {
      localStorage.setItem(Historial.storageKey(), JSON.stringify(Historial.items));
    } catch (e) {
      void e;
    }
  },

  add(entry) {
    // Cumplimiento Ley 21.719 (minimización y seguridad): nunca persistir un
    // RUT en claro. Si llega un RUT completo, se anonimiza antes de guardar.
    let rutSeguro = entry.rut || '';
    const pareceRutCompleto = /\d{2}\.?\d{3}\.?\d{3}-?[0-9kK]/.test(rutSeguro);
    if (pareceRutCompleto && typeof Security !== 'undefined' && Security.anonymizeRut) {
      rutSeguro = Security.anonymizeRut(rutSeguro);
      if (typeof Compliance !== 'undefined') {
        Compliance.logSecurityIncident({
          tipo: 'minimizacion_aplicada',
          descripcion: 'Se anonimizó un RUT que llegó en claro al historial.',
          severidad: 'baja'
        });
      }
    }
    const item = {
      id: 'q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      caso: entry.caso || '',
      casoId: entry.casoId || '',
      rut: rutSeguro,
      resumen: entry.resumen || '',
      ok: entry.ok !== false,
      fecha: new Date().toISOString()
    };
    Historial.items.unshift(item);
    if (Historial.items.length > Historial.MAX_ITEMS) {
      Historial.items = Historial.items.slice(0, Historial.MAX_ITEMS);
    }
    Historial.persist();
    return item;
  },

  getAll() {
    return Historial.items.slice();
  },

  clear() {
    Historial.items = [];
    Historial.persist();
  }
};
