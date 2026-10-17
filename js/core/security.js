// Seguridad: validación RUT, sanitización, anonimización
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

  anonymizeRut: function (rut) {
    const cleaned = String(rut).replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    if (cleaned.length < 3) {
      return '[RUT_INVALIDO]';
    }
    const check = cleaned.slice(-1);
    return 'RUT_****-' + check;
  },

  pseudonymize: function (value) {
    const str = String(value).toUpperCase().replace(/[\s.\-]/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return 'ANON-' + hash.toString(36).toUpperCase();
  },

  redactText: function (text) {
    return String(text)
      .replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9kK]\b/g, '[RUT]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\+?56\s?9\s?\d{4}\s?\d{4}/g, '[TELEFONO]')
      .trim();
  }
};
