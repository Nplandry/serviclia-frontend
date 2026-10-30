// Modo presentación para reuniones de venta.
// Rutas: /demo/caja/, /demo/muni/, /demo/banco/, /demo/aseguradora/, /demo/persona/
// (cada una redirige a index.html?demo=<tipo>).
//
// Institución: usuario vinculado al convenio, datos de ejemplo en el panel.
// Persona: usuario sin convenio que compra por unidad y contrata el Plan Familiar.
// Cada vez que se abre una demo, su usuario parte desde cero.

const Demo = {
  activo: false,
  paso: 0,
  tipo: null,
  cfg: null,
  bar: null,

  // RUT y patente de ejemplo que producen resultados con alerta en el mock.
  DATOS: {
    autoPatente: 'BBBB12',
    autoRut: '12.345.678-5',
    embargoRut: '12.000.003-9',
    tarjeta: '4242 4242 4242 4242'
  },

  pasosInstitucion(textoUso) {
    return [
      {
        titulo: 'Así lo usa ' + textoUso,
        texto: 'Antes de pagar un auto usado, confirma que el vendedor es el dueño. Es gratis y no consume cupo.',
        accion: () => Demo.prepararCaso('auto-usado', { patente: Demo.DATOS.autoPatente, rut: Demo.DATOS.autoRut })
      },
      {
        titulo: 'La institución paga la consulta',
        texto: 'Revisa si una amenaza de embargo tiene causa judicial. La consulta se descuenta del cupo del convenio.',
        accion: () => Demo.prepararCaso('embargo-falso', { rut: Demo.DATOS.embargoRut, consentir: true })
      },
      {
        titulo: 'Lo que ve la institución',
        texto: 'Panel con uso mensual, alertas entregadas y reporte para el directorio.',
        accion: () => App.showHome(),
        link: () => ({ href: 'panel/?codigo=' + encodeURIComponent(Demo.cfg.convenio), texto: 'Abrir panel de la institución' })
      }
    ];
  },

  TIPOS: {
    caja: { convenio: 'CAJA-DEMO', nombre: 'Caja de Compensación', usa: 'el pensionado afiliado' },
    muni: { convenio: 'MUNI-DEMO', nombre: 'Municipalidad', usa: 'el vecino' },
    banco: { convenio: 'BANCO-DEMO', nombre: 'Banco', usa: 'el cliente del banco' },
    aseguradora: { convenio: 'SEGUROS-DEMO', nombre: 'Aseguradora', usa: 'el asegurado' },
    persona: { convenio: null, nombre: 'Persona natural' }
  },

  pasosPersona() {
    return [
      {
        titulo: 'Compra por unidad',
        texto: 'Va a comprar un auto. Paga ' + App.clp(Planes.PRODUCTOS['verificacion-dueno'].precio) + ' por confirmar que el vendedor es el dueño, sin suscribirse. Presione "Pagar" y luego "Ejecutar Auditoría".',
        accion: () => {
          Demo.prepararCaso('auto-usado', { patente: Demo.DATOS.autoPatente, rut: Demo.DATOS.autoRut, resaltar: false });
          Demo.abrirCompra('.pago__opcion:not(.pago__opcion--destacada)');
        }
      },
      {
        titulo: 'Plan Familiar para proteger a los padres',
        texto: App.clp(Planes.FAMILIAR.precio) + ' al mes: 2 consultas judiciales, verificación de dueño y teléfono sin límite, y avisos a la familia.',
        accion: () => {
          App.showHome();
          const btn = document.getElementById('miPlanContratar');
          if (btn) btn.click();
          Demo.llenarTarjeta(document.getElementById('miPlan'));
        }
      },
      {
        titulo: 'El aviso llega a la familia',
        texto: 'Llaman a su madre con una amenaza de embargo. La consulta va incluida en el plan y, si hay riesgo, su hija recibe un aviso.',
        accion: () => {
          const owner = App.currentOwner();
          if (Planes.suscripcion(owner) && !Planes.get(owner).familiares.length) {
            Planes.agregarFamiliar(owner, 'Carolina (hija)', '+56 9 8765 4321');
          }
          Demo.prepararCaso('embargo-falso', { rut: Demo.DATOS.embargoRut, consentir: true });
        }
      },
      {
        titulo: 'Mi plan',
        texto: 'Consultas restantes del mes, familiares vinculados y avisos enviados.',
        accion: () => {
          App.showHome();
          const mp = document.getElementById('miPlan');
          if (mp && mp.scrollIntoView) mp.scrollIntoView({ block: 'start' });
        }
      }
    ];
  },

  tipoDesdeUrl() {
    try {
      const t = new URLSearchParams(window.location.search).get('demo');
      return t && Object.prototype.hasOwnProperty.call(Demo.TIPOS, t) ? t : null;
    } catch (e) {
      return null;
    }
  },

  init() {
    const tipo = Demo.tipoDesdeUrl();
    if (!tipo) return;
    const cfg = Demo.TIPOS[tipo];
    const conv = cfg.convenio ? Convenios.buscar(cfg.convenio) : null;
    if (cfg.convenio && !conv) return;
    Demo.tipo = tipo;
    Demo.cfg = cfg;

    const email = 'demo.' + tipo + '@servicia.cl';
    const user = Auth.findUser(email);
    if (user) {
      Auth.persistSession(user);
    } else {
      Auth.register({ nombre: tipo === 'persona' ? 'María (demo)' : 'Usuario demo', email: email, password: 'demo-' + Date.now().toString(36) });
    }

    Planes.reset(email);
    if (conv) {
      Convenios.activar(email, conv.codigo);
      if (!Convenios.tieneDatos(conv.codigo)) Convenios.cargarEjemplo(conv.codigo);
      Demo.titulo = 'Demo ' + conv.nombre;
      Demo.PASOS = Demo.pasosInstitucion(cfg.usa);
    } else {
      Convenios.desactivar(email);
      Demo.titulo = 'Demo persona natural';
      Demo.PASOS = Demo.pasosPersona();
    }

    App.applyAuthState();
    Demo.activo = true;
    Demo.ir(0);
  },

  stop() {
    Demo.activo = false;
    if (Demo.bar) Demo.bar.remove();
    Demo.bar = null;
  },

  ir(n) {
    Demo.paso = Math.max(0, Math.min(Demo.PASOS.length - 1, n));
    Demo.PASOS[Demo.paso].accion();
    Demo.renderBar();
  },

  // Abre el caso y deja los campos listos para presionar "Ejecutar Auditoría".
  prepararCaso(categoriaId, d) {
    App.openCategory(categoriaId);
    const root = document.getElementById('categoryContent');
    if (!root) return;
    const radios = root.querySelectorAll('input[name="dcCase-' + categoriaId + '"]');
    if (radios[0]) radios[0].checked = true;
    const rut = root.querySelector('#dcRut-' + categoriaId);
    if (rut && d.rut) rut.value = d.rut;
    const pat = root.querySelector('#dcPatente-' + categoriaId);
    if (pat && d.patente) pat.value = d.patente;
    if (d.consentir) {
      root.querySelectorAll('.consent__finalidades input[type="checkbox"]').forEach(cb => { cb.checked = true; });
    }
    if (d.resaltar !== false) Demo.resaltar(root.querySelector('.datacheck__run'));
  },

  // En la caja de pago del caso abierto, elige una opción y llena la tarjeta.
  abrirCompra(selector) {
    const root = document.getElementById('categoryContent');
    const op = root ? root.querySelector(selector) : null;
    if (!op) return;
    op.click();
    Demo.llenarTarjeta(root);
    const run = root.querySelector('.datacheck__run');
    if (run) {
      const pay = root.querySelector('.checkout .convenio__btn');
      if (pay) pay.addEventListener('click', () => Demo.resaltar(run), { once: true });
    }
  },

  llenarTarjeta(root) {
    const input = root ? root.querySelector('.checkout__card') : null;
    if (!input) return;
    input.value = Demo.DATOS.tarjeta;
    const pay = root.querySelector('.checkout .convenio__btn');
    Demo.resaltar(pay);
  },

  resaltar(btn) {
    if (!btn) return;
    btn.classList.add('demo-pulse');
    btn.addEventListener('click', () => btn.classList.remove('demo-pulse'), { once: true });
  },

  boton(texto, cls, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'demo-bar__btn' + (cls ? ' ' + cls : '');
    b.textContent = texto;
    b.addEventListener('click', onClick);
    return b;
  },

  renderBar() {
    if (!Demo.activo) return;
    if (!Demo.bar) {
      Demo.bar = document.createElement('aside');
      Demo.bar.className = 'demo-bar';
      Demo.bar.setAttribute('aria-label', 'Recorrido de demostración');
      document.body.appendChild(Demo.bar);
    }
    const bar = Demo.bar;
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    const p = Demo.PASOS[Demo.paso];

    const head = document.createElement('p');
    head.className = 'demo-bar__head';
    head.textContent = Demo.titulo + ' · Paso ' + (Demo.paso + 1) + ' de ' + Demo.PASOS.length;
    bar.appendChild(head);

    const t = document.createElement('p');
    t.className = 'demo-bar__title';
    t.textContent = p.titulo;
    bar.appendChild(t);

    const x = document.createElement('p');
    x.className = 'demo-bar__text';
    x.textContent = p.texto;
    bar.appendChild(x);

    const actions = document.createElement('div');
    actions.className = 'demo-bar__actions';
    const prev = Demo.boton('Anterior', 'demo-bar__btn--ghost', () => Demo.ir(Demo.paso - 1));
    prev.disabled = Demo.paso === 0;
    actions.appendChild(prev);

    if (p.link) {
      const l = p.link();
      const a = document.createElement('a');
      a.className = 'demo-bar__btn';
      a.href = l.href;
      a.textContent = l.texto;
      actions.appendChild(a);
    } else if (Demo.paso < Demo.PASOS.length - 1) {
      actions.appendChild(Demo.boton('Siguiente', '', () => Demo.ir(Demo.paso + 1)));
    }

    const otras = document.createElement('a');
    otras.className = 'demo-bar__btn demo-bar__btn--ghost';
    otras.href = 'demo/';
    otras.textContent = 'Otras demos';
    actions.appendChild(otras);
    actions.appendChild(Demo.boton('Salir', 'demo-bar__btn--ghost', Demo.stop));

    bar.appendChild(actions);
  }
};
