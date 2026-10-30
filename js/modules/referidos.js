// Puente ServicIA -> ServiChile.
// Tras el diagnóstico gratuito se ofrece el servicio pagado en ServiChile con
// un enlace de referido. El enlace no lleva datos personales (ni RUT ni
// patente): solo el caso, el servicio y un id de clic para atribuir la comisión.

const Referidos = {
  SERVICHILE_URL: 'https://servi-chile-cl.vercel.app',
  CLICKS_KEY: 'servicia.referidos.clicks',
  MAX_CLICKS: 200,

  nuevoClickId() {
    return 'ref-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
  },

  construirLink(oferta, categoriaId, clickId, convenio) {
    const params = new URLSearchParams({
      caso: oferta.caso,
      servicio: oferta.servicio,
      ref: 'servicia',
      src: categoriaId,
      cid: clickId
    });
    if (convenio) params.set('conv', convenio.codigo);
    return Referidos.SERVICHILE_URL + '/contacto.html?' + params.toString();
  },

  registrarClick(entry) {
    try {
      const raw = localStorage.getItem(Referidos.CLICKS_KEY);
      const list = raw ? JSON.parse(raw) || [] : [];
      list.unshift({
        cid: entry.cid,
        caso: entry.caso,
        servicio: entry.servicio,
        src: entry.src,
        conv: entry.conv || null,
        fecha: new Date().toISOString()
      });
      localStorage.setItem(Referidos.CLICKS_KEY, JSON.stringify(list.slice(0, Referidos.MAX_CLICKS)));
    } catch (e) {
      void e;
    }
  },

  getClicks() {
    try {
      const raw = localStorage.getItem(Referidos.CLICKS_KEY);
      return raw ? JSON.parse(raw) || [] : [];
    } catch (e) {
      return [];
    }
  }
};
