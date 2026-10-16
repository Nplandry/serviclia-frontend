const Security = {
  escapeHtml: function (text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function (char) {
      return map[char];
    });
  },

  sanitizeText: function (text) {
    return String(text).trim().replace(/[<>]/g, '');
  },

  validateRut: function (rut) {
    const cleaned = String(rut).replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    if (/^\d{7,8}[0-9K]$/.test(cleaned) === false) {
      return false;
    }

    const body = cleaned.slice(0, -1);
    const checkDigit = cleaned.slice(-1);

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const expected = 11 - remainder;
    let expectedDigit;
    if (expected === 11) {
      expectedDigit = '0';
    } else if (expected === 10) {
      expectedDigit = 'K';
    } else {
      expectedDigit = String(expected);
    }

    return expectedDigit === checkDigit;
  },

  formatRut: function (rut) {
    const cleaned = String(rut).replace(/[^0-9Kk]/g, '').toUpperCase();
    if (cleaned.length < 2) {
      return cleaned;
    }
    const body = cleaned.slice(0, -1);
    const check = cleaned.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedBody + '-' + check;
  },

  simulateApiCall: async function (endpoint, payload) {
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

  // Principio Fail-Closed (Ley 21.719): anonimiza RUTs, nombres y datos
  // sensibles ANTES de que salgan del cliente hacia cualquier modelo externo.
  anonymizeRut: function (rut) {
    const cleaned = String(rut).replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    if (cleaned.length < 3) {
      return '[RUT_INVALIDO]';
    }
    // Conserva solo el dígito verificador para trazabilidad, enmascara el cuerpo.
    const check = cleaned.slice(-1);
    return 'RUT_****-' + check;
  },

  // Hash determinístico no reversible (no criptográfico) para correlacionar
  // consultas del mismo sujeto sin exponer el dato real.
  pseudonymize: function (value) {
    const str = String(value).toUpperCase().replace(/[\s.\-]/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return 'ANON-' + hash.toString(36).toUpperCase();
  },

  // Expurga nombres, correos y teléfonos de texto libre antes de transmitir.
  redactText: function (text) {
    return String(text)
      .replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9kK]\b/g, '[RUT]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\+?56\s?9\s?\d{4}\s?\d{4}/g, '[TELEFONO]')
      .trim();
  },

  // Motor de cruce forense simulado. En producción golpea /v1/patrimonio,
  // /v1/compliance, etc. Aquí deriva un resultado determinístico del RUT
  // anonimizado para que la demo sea estable y repetible.
  simulateDataCheck: async function (caseId, rawRut, relato) {
    const anonRut = Security.anonymizeRut(rawRut);
    const token = Security.pseudonymize(rawRut);
    const redactedRelato = Security.redactText(relato || '');
    // Semilla determinística a partir del token anonimizado.
    const seed = token.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);

    return new Promise(function (resolve) {
      setTimeout(function () {
        const tieneBienes = seed % 3 === 0; // ~1/3 registra bienes
        const esPEP = seed % 7 === 0;
        const vigente = seed % 11 !== 0; // supervivencia Registro Civil
        resolve({
          ok: true,
          caseId: caseId,
          // Lo que efectivamente "viaja": solo datos anonimizados.
          sent: { rut: anonRut, token: token, relato: redactedRelato },
          fuentes: ['SII', 'Registro Civil', 'CMF', 'AFC/AFP', 'SUBTEL', 'PEP', 'Interpol'],
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
