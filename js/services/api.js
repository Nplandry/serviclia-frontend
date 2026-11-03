const API = {

  // Consulta al asistente con RAG, mediante POST a v1 consultas. Requiere sesion iniciada.
  consultarAsistente: async function (pregunta, categoria) {
    const sesion = Auth.getCurrentUser();
    if (!sesion || !sesion.token) return { ok: false, status: 401, error: 'Inicie sesión para usar el asistente.' };
    const body = { pregunta: String(pregunta || '').trim() };
    if (categoria) body.categoria = categoria;
    const res = await Auth.request('/v1/consultas', { method: 'POST', body: body, token: sesion.token });
    if (res.ok) return res;
    if (res.status === 401) return Object.assign(res, { error: 'Su sesión expiró. Inicie sesión nuevamente.' });
    if (res.status === 422) return Object.assign(res, { error: 'Escriba una pregunta un poco más larga (mínimo 5 caracteres).' });
    return res;
  },

  submitOrientation: async function (endpoint, payload) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          ok: true,
          endpoint: endpoint,
          received: payload,
          message: 'Solicitud recibida. Un orientador la revisará pronto.',
          ticket: 'SVC-' + Math.floor(Math.random() * 900000 + 100000)
        });
      }, 500);
    });
  }
};
