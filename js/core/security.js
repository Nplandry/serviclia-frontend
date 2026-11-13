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
    // Máximo 8 dígitos de cuerpo + DV.
    const capped = cleaned.length > 9 ? cleaned.slice(0, 9) : cleaned;
    const body = capped.slice(0, -1);
    const check = capped.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedBody + '-' + check;
  },

  // Chile móvil: +56 9 XXXX XXXX. Autoformatea mientras escribe o al pegar.
  formatTelefono: function (tel) {
    let digits = String(tel || '').replace(/\D/g, '');
    if (!digits) return '';

    // Quita prefijo país / 0 inicial.
    if (digits.startsWith('56')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    // Si pegaron sin el 9 inicial pero son 8 dígitos, no inventamos el 9.
    if (digits.length > 9) digits = digits.slice(0, 9);

    // Móvil (empieza con 9): +56 9 XXXX XXXX
    if (digits.charAt(0) === '9' || digits.length <= 9) {
      // Si no empieza con 9 aún y el usuario va escribiendo el país, fuerza prefijo visual.
      if (!digits) return '';
      if (digits.charAt(0) !== '9') {
        // Fijo corto u otro: +56 XXXX XXXX (máx 8)
        digits = digits.slice(0, 8);
        if (digits.length <= 4) return '+56 ' + digits;
        return '+56 ' + digits.slice(0, 4) + ' ' + digits.slice(4);
      }
      if (digits.length === 1) return '+56 9';
      if (digits.length <= 5) return '+56 9 ' + digits.slice(1);
      return '+56 9 ' + digits.slice(1, 5) + ' ' + digits.slice(5, 9);
    }
    return '+56 ' + digits;
  },

  validateTelefono: function (tel) {
    const raw = String(tel || '').trim();
    if (!raw) return false;
    const formatted = Security.formatTelefono(raw);
    return /^\+56 9 \d{4} \d{4}$/.test(formatted);
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
