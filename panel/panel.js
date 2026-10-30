// Panel de la institución en convenio. Lee el historial agregado de Convenios.
// Para producción: reemplazar Convenios.mes/periodos/historial por fetch al backend.

const Panel = {
  SESSION_KEY: 'servicia.panel.codigo',
  convenio: null,
  el: {},

  NOMBRES_EXTRA: { otro: 'Otros' },

  init() {
    ['panelInst', 'panelLogin', 'panelLoginForm', 'panelCodigo', 'panelLoginError', 'panelView', 'panelEjemplo',
      'panelPeriodo', 'panelCsv', 'panelPrint', 'panelKpis', 'panelMeter', 'panelMeterFill', 'panelCupoText',
      'panelCasos', 'panelTrend', 'panelEjemploBtn', 'panelBorrar', 'panelSalir']
      .forEach(id => { Panel.el[id] = document.getElementById(id); });

    Panel.el.panelLoginForm.addEventListener('submit', e => {
      e.preventDefault();
      Panel.entrar(Panel.el.panelCodigo.value);
    });
    Panel.el.panelPeriodo.addEventListener('change', Panel.render);
    Panel.el.panelCsv.addEventListener('click', Panel.descargarCsv);
    Panel.el.panelPrint.addEventListener('click', () => window.print());
    Panel.el.panelEjemploBtn.addEventListener('click', () => {
      Convenios.cargarEjemplo(Panel.convenio.codigo);
      Panel.renderPeriodos();
      Panel.render();
    });
    Panel.el.panelBorrar.addEventListener('click', () => {
      if (!window.confirm('¿Borrar todos los datos de uso de ' + Panel.convenio.nombre + ' en este navegador?')) return;
      Convenios.borrarDatos(Panel.convenio.codigo);
      Panel.renderPeriodos();
      Panel.render();
    });
    Panel.el.panelSalir.addEventListener('click', Panel.salir);

    let codigo = '';
    try {
      codigo = new URLSearchParams(window.location.search).get('codigo') || sessionStorage.getItem(Panel.SESSION_KEY) || '';
    } catch (e) {
      codigo = '';
    }
    if (codigo) Panel.entrar(codigo);
  },

  entrar(codigo) {
    const conv = Convenios.buscar(codigo);
    if (!conv) {
      Panel.el.panelLoginError.textContent = 'El código no corresponde a ninguna institución en convenio.';
      Panel.el.panelLoginError.hidden = false;
      return;
    }
    Panel.convenio = conv;
    try { sessionStorage.setItem(Panel.SESSION_KEY, conv.codigo); } catch (e) { void e; }
    Panel.el.panelLoginError.hidden = true;
    Panel.el.panelLogin.hidden = true;
    Panel.el.panelView.hidden = false;
    Panel.el.panelInst.textContent = conv.nombre;
    Panel.renderPeriodos();
    Panel.render();
  },

  salir() {
    try { sessionStorage.removeItem(Panel.SESSION_KEY); } catch (e) { void e; }
    Panel.convenio = null;
    Panel.el.panelInst.textContent = '';
    Panel.el.panelView.hidden = true;
    Panel.el.panelLogin.hidden = false;
    Panel.el.panelCodigo.value = '';
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
  },

  nombreCaso(id) {
    const c = (typeof CATEGORIAS !== 'undefined') ? CATEGORIAS.find(x => x.id === id) : null;
    return c ? c.title : (Panel.NOMBRES_EXTRA[id] || id);
  },

  nombreMes(periodo) {
    const [y, m] = periodo.split('-').map(Number);
    const txt = new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  },

  clp(n) {
    return '$' + Math.round(n || 0).toLocaleString('es-CL');
  },

  clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  renderPeriodos() {
    const sel = Panel.el.panelPeriodo;
    const actual = sel.value;
    Panel.clear(sel);
    Convenios.periodos(Panel.convenio.codigo).forEach(p => {
      const o = document.createElement('option');
      o.value = p;
      o.textContent = Panel.nombreMes(p) + (p === Convenios.periodo() ? ' (en curso)' : '');
      sel.appendChild(o);
    });
    if (actual && Array.from(sel.options).some(o => o.value === actual)) sel.value = actual;
  },

  kpi(label, value, detail) {
    const card = document.createElement('div');
    card.className = 'panel__kpi';
    const v = document.createElement('p');
    v.className = 'panel__kpi-value';
    v.textContent = value;
    const l = document.createElement('p');
    l.className = 'panel__kpi-label';
    l.textContent = label;
    card.appendChild(v);
    card.appendChild(l);
    if (detail) {
      const d = document.createElement('p');
      d.className = 'panel__kpi-detail';
      d.textContent = detail;
      card.appendChild(d);
    }
    return card;
  },

  render() {
    const conv = Panel.convenio;
    if (!conv) return;
    const periodo = Panel.el.panelPeriodo.value || Convenios.periodo();
    const m = Convenios.mes(conv.codigo, periodo);
    Panel.el.panelEjemplo.hidden = !Convenios.esEjemplo(conv.codigo);

    // KPIs
    const k = Panel.el.panelKpis;
    Panel.clear(k);
    const tasa = m.consultas ? Math.round(m.alertas / m.consultas * 100) : 0;
    k.appendChild(Panel.kpi('Consultas', m.consultas.toLocaleString('es-CL')));
    k.appendChild(Panel.kpi('Personas atendidas', m.usuarios.length.toLocaleString('es-CL')));
    k.appendChild(Panel.kpi('Alertas entregadas', m.alertas.toLocaleString('es-CL'), tasa + '% de las consultas'));
    const autos = m.porCaso['auto-usado'] || { consultas: 0, alertas: 0 };
    k.appendChild(Panel.kpi('Compras de auto detenidas', autos.alertas.toLocaleString('es-CL'), 'El vendedor no era el dueño inscrito'));
    if (conv.precioMensual && m.usuarios.length) {
      k.appendChild(Panel.kpi('Costo por persona atendida', Panel.clp(conv.precioMensual / m.usuarios.length), 'Plan de ' + Panel.clp(conv.precioMensual) + ' al mes'));
    }

    // Cupo
    const pct = Math.min(100, Math.round(m.cubiertas / conv.cupoMensual * 100));
    Panel.el.panelMeterFill.style.width = pct + '%';
    Panel.el.panelMeter.setAttribute('aria-valuenow', String(pct));
    Panel.el.panelMeter.setAttribute('aria-label', pct + '% del cupo usado');
    Panel.el.panelMeterFill.classList.toggle('panel__meter-fill--alto', pct >= 85);
    Panel.el.panelCupoText.textContent = m.cubiertas + ' de ' + conv.cupoMensual + ' consultas usadas (' + pct + '%). '
      + 'Las verificaciones de auto, teléfono y la orientación no consumen cupo.';

    // Casos
    const tb = Panel.el.panelCasos;
    Panel.clear(tb);
    const casos = Object.keys(m.porCaso).map(id => Object.assign({ id: id }, m.porCaso[id]))
      .sort((a, b) => b.consultas - a.consultas);
    if (!casos.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'panel__muted';
      td.textContent = 'Aún no hay consultas este mes.';
      tr.appendChild(td);
      tb.appendChild(tr);
    }
    casos.forEach(c => {
      const tr = document.createElement('tr');
      [Panel.nombreCaso(c.id), c.consultas.toLocaleString('es-CL'), c.alertas.toLocaleString('es-CL'),
        (c.consultas ? Math.round(c.alertas / c.consultas * 100) : 0) + '%'].forEach((v, i) => {
        const td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        td.textContent = v;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });

    Panel.renderTrend();
  },

  renderTrend() {
    const conv = Panel.convenio;
    const wrap = Panel.el.panelTrend;
    Panel.clear(wrap);
    const meses = [];
    for (let i = 5; i >= 0; i--) meses.push(Convenios.mes(conv.codigo, Convenios.periodo(i)));
    const max = Math.max(1, ...meses.map(x => x.consultas));
    wrap.setAttribute('aria-label', 'Consultas por mes: ' + meses.map(x => Panel.nombreMes(x.periodo) + ' ' + x.consultas).join(', '));
    meses.forEach(x => {
      const col = document.createElement('div');
      col.className = 'panel__bar';
      const val = document.createElement('span');
      val.className = 'panel__bar-value';
      val.textContent = x.consultas;
      const enCurso = x.periodo === Convenios.periodo();
      const bar = document.createElement('span');
      bar.className = 'panel__bar-fill' + (enCurso ? ' panel__bar-fill--curso' : '');
      bar.style.height = Math.round(x.consultas / max * 100) + '%';
      const lbl = document.createElement('span');
      lbl.className = 'panel__bar-label';
      lbl.textContent = Panel.nombreMes(x.periodo).slice(0, 3) + (enCurso ? ' (en curso)' : '');
      col.appendChild(val);
      col.appendChild(bar);
      col.appendChild(lbl);
      wrap.appendChild(col);
    });
  },

  // CSV de todos los meses con datos. Solo conteos agregados.
  csv() {
    const conv = Panel.convenio;
    const rows = [['institucion', 'periodo', 'caso', 'consultas', 'alertas', 'personas_atendidas_mes', 'consultas_con_costo_mes', 'costo_cubierto_clp_mes']];
    Convenios.periodos(conv.codigo).slice().reverse().forEach(p => {
      const m = Convenios.mes(conv.codigo, p);
      const ids = Object.keys(m.porCaso);
      (ids.length ? ids : ['']).forEach(id => {
        const c = m.porCaso[id] || { consultas: 0, alertas: 0 };
        rows.push([conv.nombre, p, id ? Panel.nombreCaso(id) : '', c.consultas, c.alertas, m.usuarios.length, m.cubiertas, m.costoCLP]);
      });
    });
    const esc = v => {
      const s = String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map(r => r.map(esc).join(';')).join('\r\n');
  },

  descargarCsv() {
    const blob = new Blob(['\ufeff' + Panel.csv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'servicia-' + Panel.convenio.codigo.toLowerCase() + '-' + Convenios.periodo() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

document.addEventListener('DOMContentLoaded', Panel.init);
