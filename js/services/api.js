// Capa de datos de ServicIA.
// Fuente única: Boostr (boostr.cl). Servicios usados:
//   - rutificador: nombre asociado a un RUT (plan mensual)
//   - pjud: causas judiciales civiles, penales y cortes (por consulta)
//   - telefonia: validación de número chileno (por consulta)
//   - patentes: solo se usa el dueño inscrito, comparado con el RUT del vendedor (plan mensual)
// Mientras MODO_DEMO sea true, las respuestas son simuladas.
// Reemplazar cada función mock* por la llamada real (vía backend propio,
// nunca exponer la API key de Boostr en el navegador).

const API = {
  MODO_DEMO: true,

  // Precios publicados en boostr.cl (CLP). Rutificador es plan mensual: 0 por consulta.
  COSTOS: { rutificador: 0, pjud: 2000, telefonia: 25, patentes: 0 },

  SERVICIOS: {
    rutificador: 'Boostr Rutificador',
    pjud: 'Boostr Poder Judicial',
    telefonia: 'Boostr Telefonía',
    patentes: 'Boostr Patentes'
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
  },

  // servicios: lista de claves de API.SERVICIOS que requiere el caso.
  // extras: { telefono } para telefonia, { patente } para patentes.
  executeDataCheck: async function (caseId, rawRut, relato, servicios, extras) {
    const lista = Array.isArray(servicios) ? servicios : [];
    const token = Security.pseudonymize(rawRut);
    const seed = token.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    const telefono = extras && extras.telefono ? String(extras.telefono) : '';

    const resultados = {};
    if (lista.indexOf('rutificador') !== -1) resultados.rutificador = API.mockRutificador(rawRut, seed);
    if (lista.indexOf('pjud') !== -1) resultados.pjud = API.mockPjud(seed);
    if (lista.indexOf('telefonia') !== -1) resultados.telefonia = API.mockTelefonia(telefono, seed);
    if (lista.indexOf('patentes') !== -1) resultados.patentes = API.mockPatentes(extras && extras.patente, rawRut);

    const costo = lista.reduce(function (sum, s) { return sum + (API.COSTOS[s] || 0); }, 0);

    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          ok: true,
          demo: API.MODO_DEMO,
          caseId: caseId,
          sent: {
            rut: Security.anonymizeRut(rawRut),
            token: token,
            relato: Security.redactText(relato || '')
          },
          fuentes: lista.map(function (s) { return API.SERVICIOS[s]; }),
          resultados: resultados,
          costoCLP: costo,
          folio: 'FOLIO-' + (100000 + seed % 900000)
        });
      }, 900);
    });
  },

  mockRutificador: function (rawRut, seed) {
    const nombres = ['MARÍA GONZÁLEZ PÉREZ', 'JUAN MUÑOZ ROJAS', 'CAROLINA SOTO DÍAZ', 'LUIS CONTRERAS SILVA'];
    const encontrado = seed % 10 !== 0;
    return {
      encontrado: encontrado,
      rut: Security.formatRut(rawRut),
      nombre: encontrado ? nombres[seed % nombres.length] : null
    };
  },

  mockPjud: function (seed) {
    const total = seed % 4 === 0 ? 1 + (seed % 2) : 0;
    const causas = [];
    for (let i = 0; i < total; i++) {
      causas.push({
        rol: 'C-' + (1000 + (seed * (i + 3)) % 9000) + '-' + (2022 + i),
        competencia: 'Civil',
        tribunal: ['1º Juzgado Civil de Santiago', '3º Juzgado Civil de Valparaíso', 'Juzgado de Letras de Rancagua'][(seed + i) % 3],
        caratulado: ['BANCO DEMO / DEMANDADO', 'COBRANZAS DEMO SPA / DEMANDADO', 'RETAIL DEMO S.A. / DEMANDADO'][(seed + i) % 3],
        fechaIngreso: (2022 + i) + '-0' + (1 + (seed + i) % 9) + '-15',
        estado: i === 0 && seed % 3 === 0 ? 'Tramitación' : 'Archivada'
      });
    }
    return { causas: causas };
  },

  mockTelefonia: function (telefono, seed) {
    const limpio = telefono.replace(/[^\d]/g, '').replace(/^56/, '');
    const formatoOk = /^9\d{8}$/.test(limpio);
    return {
      numero: limpio ? '+56 9 **** ' + limpio.slice(-4) : '',
      valido: formatoOk && seed % 9 !== 0
    };
  },

  normalizarPatente: function (patente) {
    return String(patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  },

  // Formatos chilenos: antiguo AA1234 y nuevo BBBB12.
  validarPatente: function (patente) {
    return /^([A-Z]{2}\d{4}|[A-Z]{4}\d{2})$/.test(API.normalizarPatente(patente));
  },

  // Único dato usado: si el RUT del vendedor coincide con el dueño inscrito.
  // El nombre y el RUT del dueño no se muestran al usuario.
  mockPatentes: function (patente, rutVendedor) {
    const p = API.normalizarPatente(patente);
    const seed = p.split('').reduce(function (a, c) { return a + c.charCodeAt(0) * 7; }, 0);
    const rutSeed = Security.pseudonymize(rutVendedor).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    return {
      encontrado: seed % 13 !== 0,
      patente: p,
      duenoCoincide: (seed + rutSeed) % 5 !== 0
    };
  }
};
