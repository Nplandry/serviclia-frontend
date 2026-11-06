const Security = {
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
  }
};
