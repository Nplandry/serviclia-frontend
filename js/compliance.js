// Aviso de cookies y registro local de incidentes de seguridad Ley 21.719.
const Compliance = {
  COOKIE_KEY: 'servichile.cookies.consent',
  INCIDENT_KEY: 'servichile.security.incidents',

  logSecurityIncident(detail) {
    try {
      const raw = localStorage.getItem(Compliance.INCIDENT_KEY);
      const list = raw ? JSON.parse(raw) || [] : [];
      list.unshift({
        id: 'inc-' + Date.now(),
        fecha: new Date().toISOString(),
        tipo: detail && detail.tipo ? detail.tipo : 'desconocido',
        descripcion: detail && detail.descripcion ? detail.descripcion : '',
        severidad: detail && detail.severidad ? detail.severidad : 'media'
      });
      localStorage.setItem(Compliance.INCIDENT_KEY, JSON.stringify(list.slice(0, 100)));
    } catch {}
  },

  getCookieConsent() {
    try {
      return localStorage.getItem(Compliance.COOKIE_KEY) || null;
    } catch {
      return null;
    }
  },

  setCookieConsent(value) {
    try {
      localStorage.setItem(Compliance.COOKIE_KEY, value);
    } catch {}
  },

  initCookieBanner() {
    if (Compliance.getCookieConsent()) return;
    if (document.getElementById('cookieBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Aviso de cookies y protección de datos');

    const text = document.createElement('p');
    text.className = 'cookie-banner__text';
    text.innerHTML = 'Usamos almacenamiento local necesario para el funcionamiento de la app '
      + '(sesión y preferencias).';
    banner.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'cookie-banner__actions';

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'cookie-banner__btn cookie-banner__btn--ghost';
    rejectBtn.textContent = 'Solo lo necesario';
    rejectBtn.addEventListener('click', function () {
      Compliance.setCookieConsent('necesario');
      banner.remove();
    });

    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'cookie-banner__btn cookie-banner__btn--primary';
    acceptBtn.textContent = 'Aceptar todo';
    acceptBtn.addEventListener('click', function () {
      Compliance.setCookieConsent('todo');
      banner.remove();
    });

    actions.appendChild(rejectBtn);
    actions.appendChild(acceptBtn);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }
};
