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
    const item = {
      id: 'q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      caso: entry.caso || '',
      casoId: entry.casoId || '',
      rut: entry.rut || '',
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
