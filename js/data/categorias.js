// Biblioteca de iconos SVG. Para cambiar un icono, edite el SVG o agregue uno nuevo con su nombre.
const ICONOS_SVG = {
  'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>',
  'document': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
  'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
  'money': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M12 9v6M9 12h6"></path></svg>',
  'id-card': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><circle cx="7" cy="7" r="1.5"></circle><line x1="11" y1="7" x2="18" y2="7"></line><line x1="11" y1="12" x2="18" y2="12"></line></svg>',
  'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
  'document-sealed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline><path d="M12 17v-2m0 6v-2"></path></svg>'
};

// Mapeo: id de categoría -> nombre del icono en ICONOS_SVG. Cambie el valor para cambiar el icono de la tarjeta.
const ICONO_CATEGORIA = {
  'embargo-falso': 'money',
  'seguros': 'briefcase',
  'portabilidad': 'phone'
};

const CATEGORIAS = [
  {
    id: 'embargo-falso',
    title: 'Amenaza de embargo',
    short: 'Caso 1 - Defensa patrimonial',
    description: 'Llamada o carta que amenaza con embargar su casa o auto por una deuda antigua.',
    cruce: { endpoint: '/v1/patrimonio', fuentes: ['SII (Propiedades)', 'Registro Civil (Vehículos)'] },
    preliminar: {
      resumen: 'Es una llamada o carta que exige pagar una deuda antigua amenazando con quitarle su casa o auto. En Chile un embargo real solo lo ordena un tribunal y siempre se notifica por escrito, nunca por teléfono.',
      riesgos: ['Pagar una deuda que ya prescribió o que no existe.', 'Entregar datos personales o bancarios a desconocidos.', 'Firmar acuerdos de pago bajo presión.', 'Perder dinero en "gestiones" falsas.']
    },
    escalamiento: [
      { nombre: 'Oficina Judicial Virtual', url: 'https://oficinajudicial.pjud.cl', detalle: 'Verifique si existe una causa real a su nombre.' },
      { nombre: 'SERNAC', url: 'https://www.sernac.cl', detalle: 'Denuncie cobranzas abusivas o engañosas.' },
      { nombre: 'PDI', url: 'https://www.pdichile.cl', detalle: 'Denuncie si sospecha que es una estafa.' }
    ],
    items: [
      { id: 'embargo-amenaza', title: 'Me amenazan con embargar mis bienes', queDecir: 'No registro bienes embargables a mi nombre. Exijo notificación judicial formal antes de responder.', content: ['No entregue datos ni acepte pagar nada por teléfono.', 'Pida el nombre del tribunal, el número de causa y una notificación formal.', 'Un embargo real siempre llega por vía judicial, no por una llamada.', 'El acompañante puede verificar si usted registra bienes a su nombre con el cruce de datos.'] },
      { id: 'embargo-carta', title: 'Me llegó una carta de "cobranza judicial"', queDecir: 'No reconozco esta deuda. Exijo el número de causa y el nombre del tribunal para verificarla directamente.', content: ['Revise si la carta tiene número de rol y nombre de tribunal verificables.', 'Las cobranzas extrajudiciales no pueden simular documentos judiciales.', 'Guarde la carta como evidencia.', 'Denuncie la amenaza falsa en SERNAC.'] }
    ]
  },
  {
    id: 'seguros',
    title: 'Seguros no consentidos',
    short: 'Caso 2 - Auditoría financiera',
    description: 'Descuento extraño en la pensión o cartola bajo concepto de seguros o asistencias.',
    cruce: { endpoint: '/v1/polizas', fuentes: ['CMF'] },
    preliminar: {
      resumen: 'Son descuentos por seguros o asistencias que usted nunca contrató, cobrados en su pensión o cuenta bancaria. La ley exige su consentimiento expreso y la empresa debe tener la prueba de aceptación.',
      riesgos: ['Descuentos mensuales que se acumulan por años.', 'Cobros que aumentan sin aviso.', 'Perder el derecho a reclamar si pasa mucho tiempo.', 'Renovaciones automáticas no autorizadas.']
    },
    escalamiento: [
      { nombre: 'CMF', url: 'https://www.cmfchile.cl', detalle: 'Reclame contra bancos y aseguradoras.' },
      { nombre: 'Defensoría del Asegurado', url: 'https://www.ddachile.cl', detalle: 'Orientación gratuita en conflictos con seguros.' },
      { nombre: 'SERNAC', url: 'https://www.sernac.cl', detalle: 'Reclamo por cobros no consentidos.' }
    ],
    items: [
      { id: 'seguro-agregado', title: 'Me agregaron un seguro que no pedí', queDecir: 'No autoricé ni firmé este seguro. Exijo la prueba de aceptación y la restitución retroactiva de lo cobrado.', content: ['Revise los cargos en su cartola bancaria o liquidación de pensión.', 'Solicite la póliza y la prueba de aceptación por escrito.', 'Si no la contrató, exija anulación y devolución con intereses.', 'El acompañante genera un folio de reclamo CMF/SERNAC.'] },
      { id: 'seguro-credito', title: 'Me dijeron que el seguro es obligatorio', queDecir: 'Quiero cotizar el seguro con otra aseguradora y llevarme el contrato para revisarlo en mi casa.', content: ['Pregunte si puede contratarlo con otra aseguradora.', 'Pida el costo total del seguro durante toda la vida del crédito.', 'Compare precios con al menos dos aseguradoras.', 'Si le presionan, no firme y revise el contrato en su casa.'] }
    ]
  },
  {
    id: 'portabilidad',
    title: 'Cambio de plan engañoso',
    short: 'Caso 3 - Telecomunicaciones',
    description: 'Llamada para "actualizar su plan" que exige un código SMS de verificación.',
    cruce: { endpoint: '/v1/subtel', fuentes: ['SUBTEL (Traspaso de operador)'] },
    preliminar: {
      resumen: 'Es una llamada que ofrece "mejorar su plan" y le pide un código que llegó por SMS. Ese código autoriza el traspaso de su número a otra compañía sin que usted se dé cuenta.',
      riesgos: ['Perder su número de teléfono.', 'Quedar sin señal durante días.', 'Planes más caros contratados sin permiso.', 'Uso de sus códigos para suplantar su identidad.']
    },
    escalamiento: [
      { nombre: 'SUBTEL', url: 'https://www.subtel.gob.cl', detalle: 'Reclame por traspasos no autorizados.' },
      { nombre: 'SERNAC', url: 'https://www.sernac.cl', detalle: 'Reclamo contra la empresa de telecomunicaciones.' },
      { nombre: 'ChileAtiende', url: 'https://www.chileatiende.gob.cl', detalle: 'Orientación para trámites y reclamos.' }
    ],
    items: [
      { id: 'portabilidad-sms', title: 'Me piden un código SMS para "mejorar mi plan"', queDecir: 'No autorizo el cambio de compañía ni entregaré códigos SMS.', content: ['Nunca entregue un código SMS que llega a su teléfono.', 'Ese código autoriza el traspaso de su número a otra compañía.', 'Corte la llamada y verifique directamente con su operador.', 'El acompañante revisa si hay una señal de traspaso en SUBTEL.'] },
      { id: 'portabilidad-forzada', title: 'Me cambiaron de compañía sin mi permiso', queDecir: 'Exijo la reversión inmediata del cambio y una constancia escrita de quién lo autorizó.', content: ['Revise sus boletas y contratos recientes.', 'Exija a la nueva empresa la reversión del cambio.', 'Pida constancia escrita de quién autorizó el cambio.', 'Denuncie ante SUBTEL o SERNAC.'] }
    ]
  }
];

const FRASES_EMERGENCIA = [
  'Sé que no registro bienes embargables a mi nombre. Exijo notificación judicial formal antes de responder.',
  'No autoricé ni firmé este seguro. Exijo la prueba de aceptación y la restitución de lo cobrado.',
  'No autorizo el cambio de compañía ni entregaré códigos SMS.',
  'Necesito que me envíen esto por escrito para revisarlo con calma.',
  'No voy a dar datos ni firmar nada hasta conversar con mi familia.'
];

const RECOMENDADOS = [
  {
    id: 'rec-1',
    titulo: 'Verificar si soy afiliado a una AFP',
    categoria: 'embargo-falso',
    icono: 'briefcase',
    descripcion: 'Confirma tu estado previsional y datos registrados'
  },
  {
    id: 'rec-2',
    titulo: 'Derechos si pierdo mi trabajo',
    categoria: 'embargo-falso',
    icono: 'document',
    descripcion: 'Conoce protecciones legales y beneficios'
  },
  {
    id: 'rec-3',
    titulo: 'Comprar o vender una propiedad',
    categoria: 'portabilidad',
    icono: 'home',
    descripcion: 'Pasos legales y documentación necesaria'
  },
  {
    id: 'rec-4',
    titulo: 'Protegerme de estafas inmobiliarias',
    categoria: 'seguros',
    icono: 'search',
    descripcion: 'Señales de alerta y cómo verificar transacciones'
  },
  {
    id: 'rec-5',
    titulo: 'Solicitar un crédito de forma segura',
    categoria: 'seguros',
    icono: 'money',
    descripcion: 'Qué revisar antes de firmar contratos'
  },
  {
    id: 'rec-6',
    titulo: 'Actualizar datos en el Registro Civil',
    categoria: 'embargo-falso',
    icono: 'id-card',
    descripcion: 'Pasos para correcciones y trámites'
  },
  {
    id: 'rec-7',
    titulo: 'Reclamar por servicios de telecomunicaciones',
    categoria: 'portabilidad',
    icono: 'phone',
    descripcion: 'Derechos ante cobros injustificados'
  },
  {
    id: 'rec-8',
    titulo: 'Herencia y trámites sucesorios',
    categoria: 'embargo-falso',
    icono: 'document-sealed',
    descripcion: 'Guía sobre derechos y obligaciones legales'
  }
];
