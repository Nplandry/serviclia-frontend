// Datos de demostración del Pasaporte Digital. Reemplazar por la respuesta del backend cuando exista el endpoint.
const PASAPORTE_MOCK = {
  titular: {
    iniciales: 'NP',
    nombre: 'Nicolás Poblete L.',
    rut: '18.345.678-K',
    biometria: 'Biometría OK'
  },
  token: 'SVC-2026-9948X',
  validoHasta: 'Válido hasta: 02/FEB/2027',
  rubroInicial: 'arriendo',
  rubros: {
    arriendo: {
      nombre: 'Arriendo residencial',
      badge: 'ARRIENDO RESIDENCIAL',
      score: 96,
      items: [
        { label: 'Identidad y Registro Civil', estado: 'OK (biometría)', tono: 'ok' },
        { label: 'Causas judiciales y embargos (PJud)', estado: 'Sin registros', tono: 'ok' },
        { label: 'Comportamiento previsional (AFC)', estado: 'Verificado', tono: 'ok' },
        { label: 'Bienes raíces y vehículos (SII/Civil)', estado: '1 inmueble registrado', tono: 'info' }
      ]
    },
    auto: {
      nombre: 'Auto usado',
      badge: 'COMPRAVENTA VEHÍCULO (AUTOCHECK)',
      score: 92,
      items: [
        { label: 'Registro de vehículos motorizados', estado: 'Propietario coincide', tono: 'ok' },
        { label: 'Órdenes de embargo judicial (PJud)', estado: 'Libre de embargo', tono: 'ok' },
        { label: 'Multas TAG y JPL', estado: '0 pendientes', tono: 'ok' },
        { label: 'Encargo por robo o prenda', estado: 'Sin encargo vigente', tono: 'ok' }
      ]
    },
    laboral: {
      nombre: 'Idoneidad laboral',
      badge: 'IDONEIDAD Y CONFIANZA LABORAL',
      score: 98,
      items: [
        { label: 'Verificación biográfica anti-suplantación', estado: 'Validado', tono: 'ok' },
        { label: 'Inhabilidades del Registro Civil (Ley 20.594)', estado: 'Sin inhabilidades', tono: 'ok' },
        { label: 'Registro Nacional de Deudores de Alimentos', estado: 'Sin deudas', tono: 'ok' },
        { label: 'Antecedentes penales y judiciales', estado: 'Certificado limpio', tono: 'ok' }
      ]
    },
    pyme: {
      nombre: 'Proveedor pyme B2B',
      badge: 'PROVEEDOR PYME VERIFICADO',
      score: 90,
      items: [
        { label: 'Vigencia de sociedad y poderes (Diario Oficial)', estado: 'Sociedad activa', tono: 'ok' },
        { label: 'Cumplimiento tributario y giros (SII)', estado: 'Sin facturas falsas', tono: 'ok' },
        { label: 'Cumplimiento Ley 21.719', estado: 'Middleware activo', tono: 'ok' },
        { label: 'Solvencia financiera B2B', estado: 'Riesgo bajo', tono: 'info' }
      ]
    }
  }
};
