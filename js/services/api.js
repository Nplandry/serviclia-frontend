// API: punto único de entrada para llamadas backend (simuladas ahora, reales después)
const API = {
  // Formulario de orientación personalizada
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

  // Cruce de datos (patrimonio, pólizas, etc)
  executeDataCheck: async function (caseId, rawRut, relato) {
    const anonRut = Security.anonymizeRut(rawRut);
    const token = Security.pseudonymize(rawRut);
    const redactedRelato = Security.redactText(relato || '');
    const seed = token.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);

    return new Promise(function (resolve) {
      setTimeout(function () {
        const tieneBienes = seed % 3 === 0;
        const esPEP = seed % 7 === 0;
        const vigente = seed % 11 !== 0;
        resolve({
          ok: true,
          caseId: caseId,
          sent: { rut: anonRut, token: token, relato: redactedRelato },
          fuentes: ['SII', 'Registro Civil', 'CMF', 'AFC y AFP', 'SUBTEL', 'PEP', 'Interpol'],
          hallazgos: {
            bienesRaices: tieneBienes ? seed % 3 + 1 : 0,
            vehiculos: tieneBienes ? seed % 2 : 0,
            pep: esPEP,
            interpol: false,
            vigente: vigente,
            laboralActivo: seed % 4 !== 0
          },
          latenciaMs: 1200 + seed % 600,
          folio: 'FOLIO-' + (100000 + seed % 900000)
        });
      }, 900);
    });
  }
};
