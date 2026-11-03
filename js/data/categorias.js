// Iconos SVG de los temas. Para cambiar un icono, edite el SVG o agregue uno nuevo con su nombre.
const ICONOS_SVG = {
  'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>',
  'money': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><path d="M12 9v6M9 12h6"></path></svg>',
  'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'
};

// Mapeo id de tema, nombre del icono en ICONOS SVG.
const ICONO_CATEGORIA = {
  'embargo-falso': 'money',
  'seguros': 'briefcase',
  'portabilidad': 'phone'
};

// Temas de orientacion. Cada caso define su diagnostico nivel alto o medio de riesgo.
const CATEGORIAS = [
  {
    id: 'embargo-falso',
    title: 'Amenaza de embargo',
    short: 'Defensa patrimonial',
    description: 'Analice si la llamada o carta que recibió cumple los requisitos legales de un embargo en Chile.',
    preguntaCaso: '¿Qué tipo de notificación recibió?',
    placeholder: 'Ej: me llegó un SMS diciendo que hoy vendrá un receptor judicial a embargar por una deuda de 2018...',
    fundamento: 'Un embargo real solo lo ordena un tribunal y se notifica por escrito, con receptor judicial. Nadie puede embargar por teléfono, SMS o WhatsApp.',
    escalamiento: [
      { nombre: 'Oficina Judicial Virtual', url: 'https://oficinajudicial.pjud.cl', detalle: 'Revise si existe una causa a su nombre.' }
    ],
    items: [
      {
        id: 'embargo-amenaza',
        title: 'Llamada, SMS o WhatsApp',
        diagnostico: { nivel: 'alto', etiqueta: 'Amenaza sin validez legal', titulo: 'Un llamado o mensaje no constituye un embargo' },
        queDecir: 'No entregaré datos ni haré pagos por teléfono. Exijo el nombre del tribunal y el número de causa.',
        content: ['No entregue datos ni pague nada por teléfono.', 'Pida el nombre del tribunal y el número de causa, y revíselos en la Oficina Judicial Virtual.']
      },
      {
        id: 'embargo-carta',
        title: 'Carta de "cobranza judicial"',
        diagnostico: { nivel: 'medio', etiqueta: 'Requiere verificación', titulo: 'Verifique el número de rol y el tribunal antes de responder' },
        queDecir: 'No reconozco esta deuda. Exijo el número de causa y el nombre del tribunal para verificarla directamente.',
        content: ['Verifique que la carta tenga número de rol y tribunal, y búsquelos en la Oficina Judicial Virtual.', 'Guarde la carta como evidencia.']
      }
    ]
  },
  {
    id: 'seguros',
    title: 'Seguros no consentidos',
    short: 'Auditoría financiera',
    description: 'Analice si un descuento en su pensión o cuenta corresponde a un seguro que usted no autorizó.',
    preguntaCaso: '¿Qué situación vive?',
    placeholder: 'Ej: en mi liquidación de pensión aparece un descuento mensual por un seguro de vida que nunca contraté...',
    fundamento: 'Un seguro solo se puede cobrar con su consentimiento expreso, y la empresa debe poder probar que lo aceptó.',
    escalamiento: [
      { nombre: 'CMF', url: 'https://www.cmfchile.cl', detalle: 'Reclame contra bancos y aseguradoras.' }
    ],
    items: [
      {
        id: 'seguro-agregado',
        title: 'Me cobran un seguro que no pedí',
        diagnostico: { nivel: 'alto', etiqueta: 'Cobro sin consentimiento', titulo: 'Puede exigir la anulación y la devolución de lo cobrado' },
        queDecir: 'No autoricé ni firmé este seguro. Exijo la prueba de aceptación y la restitución de lo cobrado.',
        content: ['Pida por escrito la póliza y la prueba de aceptación.', 'Si no la contrató, exija la anulación y la devolución de lo cobrado.']
      },
      {
        id: 'seguro-credito',
        title: 'Me dicen que el seguro es obligatorio',
        diagnostico: { nivel: 'medio', etiqueta: 'Revise antes de firmar', titulo: 'Pregunte si puede contratarlo con otra aseguradora' },
        queDecir: 'Quiero cotizar el seguro con otra aseguradora y llevarme el contrato para revisarlo en mi casa.',
        content: ['Pregunte si puede contratarlo con otra aseguradora.', 'No firme nada bajo presión: revise el contrato en su casa.']
      }
    ]
  },
  {
    id: 'portabilidad',
    title: 'Cambio de plan engañoso',
    short: 'Telecomunicaciones',
    description: 'Analice si una llamada para "mejorar su plan" busca traspasar su número a otra compañía.',
    preguntaCaso: '¿Qué le pasó?',
    placeholder: 'Ej: me llamaron para ofrecerme un plan más barato y me pidieron el código que me llegó por SMS...',
    fundamento: 'Un SMS con código autoriza el traspaso de su número a otra compañía. Ninguna empresa legítima se lo pide por teléfono.',
    escalamiento: [
      { nombre: 'SUBTEL', url: 'https://www.subtel.gob.cl', detalle: 'Reclame por traspasos no autorizados.' }
    ],
    items: [
      {
        id: 'portabilidad-sms',
        title: 'Me piden un código SMS',
        diagnostico: { nivel: 'alto', etiqueta: 'Posible fraude de portabilidad', titulo: 'No entregue el código: autoriza el traspaso de su número' },
        queDecir: 'No autorizo el cambio de compañía ni entregaré códigos SMS.',
        content: ['No entregue el código SMS. Corte la llamada y consulte directamente con su operador.']
      },
      {
        id: 'portabilidad-forzada',
        title: 'Me cambiaron de compañía sin permiso',
        diagnostico: { nivel: 'alto', etiqueta: 'Cambio no autorizado', titulo: 'Puede exigir la reversión del cambio' },
        queDecir: 'Exijo la reversión inmediata del cambio y una constancia escrita de quién lo autorizó.',
        content: ['Exija a la nueva empresa la reversión del cambio y una constancia escrita de quién lo autorizó.']
      }
    ]
  }
];
