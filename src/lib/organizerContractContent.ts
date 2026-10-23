/**
 * Contrato digital / términos que el organizador debe aceptar al crear un evento.
 * Texto deliberadamente explícito para reducir ambigüedad.
 * Alineado con apps/web/src/lib/legal/organizerContractContent.ts
 */

export type ContractSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const ORGANIZER_CONTRACT_TITLE = 'Contrato digital y términos de uso — Organizador';
export const ORGANIZER_CONTRACT_SUBTITLE =
  'Léelo completo. Al confirmar, aceptas todas las cláusulas. Dorsalia Run opera en México.';
export const ORGANIZER_CONTRACT_VERSION = '2026-09-21.1';
export const ORGANIZER_CONTRACT_LAST_UPDATED = '21 de septiembre de 2026';

export const ORGANIZER_CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: 'definiciones',
    title: '1. Definiciones (qué significa cada parte)',
    paragraphs: [
      'Para evitar dudas, en este contrato se entienden así los términos:',
    ],
    bullets: [
      '“Dorsalia”, “Dorsalia Run” o “la Plataforma”: la empresa/operador de los servicios digitales descritos abajo, con operación en México.',
      '“Organizador”, “tú” o “tu cuenta”: la persona física o moral que crea, administra y publica un evento en la Plataforma y acepta este contrato al crear el evento.',
      '“Evento” o “carrera”: el evento deportivo (o afín) que creas en el portal, con sus distancias, precios, contenido, políticas y sitio asociado.',
      '“Atleta” o “participante”: quien se inscribe o interactúa con tu Evento a través de la Plataforma.',
      '“Sitio del evento”: la página web generada o hospedada por Dorsalia para tu Evento (subdominio *.dorsalia.run y, si aplica, dominio personalizado apuntando a nuestra infraestructura).',
      '“Contenido del organizador”: textos, imágenes, logos, videos, reglamentos, políticas, precios y cualquier material que tú subas o escribas.',
      '“Contenido de la Plataforma”: marca Dorsalia, diseño, plantillas, editor, código, componentes, tipografías de sistema y software de Dorsalia.',
    ],
  },
  {
    id: 'plataforma',
    title: '2. Qué es Dorsalia y qué servicios incluye (explícito)',
    paragraphs: [
      'Dorsalia opera, como mínimo, estos servicios (todos de su propiedad y bajo su control técnico):',
    ],
    bullets: [
      'portal.dorsalia.run — panel del organizador: crear eventos, inscripciones, cobros, configuración, chat Dalia, finanzas y herramientas de gestión.',
      'editor.dorsalia.run — editor visual del Sitio del evento (diseño y contenido público del evento), incluyendo funciones asistidas por IA sujetas a créditos del plan.',
      'dorsalia.run — marketplace / índice público de carreras y acceso a sitios publicados.',
      'Subdominios bajo *.dorsalia.run — hosting de Sitios del evento (por ejemplo tu-carrera.dorsalia.run).',
      'Almacenamiento de medios del workspace (uso designado: logos, flyers, galería, rutas, referencias IA, etc.) con cuota por defecto de 5 GB, según la sección de almacenamiento.',
    ],
  },
  {
    id: 'ambito-mexico',
    title: '3. Ámbito territorial y naturaleza del servicio',
    paragraphs: [
      'Los servicios anteriores son operados por Dorsalia en México. El uso de la Plataforma se rige por la legislación mexicana aplicable y por este contrato, las Normas de la Comunidad y las políticas de pago vigentes.',
      'Dorsalia proporciona una plataforma tecnológica (software, hosting, pagos vía terceros y comunicaciones). Dorsalia NO es el organizador deportivo de tu carrera: no dirige el evento en campo, no asume la seguridad en pista, no garantiza aforo, clima, permisos municipales, seguros deportivos ni la calidad del kit físico, salvo que un producto distinto lo diga por escrito.',
      'Al pulsar “Confirmar y crear” aceptas este contrato en su totalidad para ese Evento y para el uso continuo de la Plataforma relacionado con él. Si no estás de acuerdo, debes pulsar “Cancelar”: no se creará el Evento y permanecerás en el flujo actual sin obligación de creación.',
      'Dorsalia puede actualizar este contrato. La versión aplicable a cada creación es la mostrada en el modal en ese momento (versión ' +
        ORGANIZER_CONTRACT_VERSION +
        '). Los cambios relevantes posteriores se comunicarán en el portal o por correo; el uso continuado después de la notificación implica aceptación de la versión actualizada, salvo que la ley exija otro mecanismo.',
    ],
  },
  {
    id: 'sitios-dominios',
    title: '4. Sitios web, propiedad, dominios .dorsalia.run y dominios propios',
    paragraphs: [
      '4.1 Propiedad del Sitio bajo *.dorsalia.run. Todo Sitio del evento publicado en un subdominio que termine en .dorsalia.run (incluida la URL, la instancia hospedada, la plantilla base y la integración con la Plataforma) es propiedad de Dorsalia. Tú recibes una licencia de uso limitada, no exclusiva, intransferible y revocable (“préstamo de hosting”) para publicar y administrar el contenido de tu Evento mientras tu cuenta esté activa y cumplas este contrato.',
      '4.2 Qué NO te transferimos. La licencia de uso NO te convierte en dueño de: la marca Dorsalia; el código fuente; el editor; las plantillas; los componentes; la infraestructura; ni el derecho a reclamar como tuyo el dominio o subdominio *.dorsalia.run.',
      '4.3 Dominios .dorsalia.run. Dorsalia es el titular/registrante (o controla) los nombres de dominio que terminan en .dorsalia.run. Tú no adquieres propiedad sobre “tu-subdominio.dorsalia.run”. Dorsalia puede reasignar, suspender o eliminar un subdominio si incumples términos, hay riesgo legal/fraude, o por necesidades operativas, con el aviso razonable que permita la urgencia del caso.',
      '4.4 Dominios personalizados (tuyos). Si conectas un dominio propio (por ejemplo www.mituacarrera.com) mediante CNAME u otro registro DNS hacia la infraestructura de Dorsalia: (a) tú o tu registrador siguen siendo dueños de ese dominio; (b) Dorsalia no es dueña de tu dominio personalizado; (c) Dorsalia solo presta el hosting/aplicación detrás de ese apuntado; (d) si terminas el servicio, cancelas la cuenta o desconectas el DNS, tu dominio te sigue perteneciendo, pero el Sitio dejará de servirse desde Dorsalia.',
      '4.5 Contenido del organizador. Los textos, fotos, logos y materiales que tú subas siguen siendo tuyos (o de quien te autorizó). Me concedes a Dorsalia una licencia mundial, no exclusiva, para alojar, copiar, mostrar, transmitir y procesar ese contenido solo en la medida necesaria para operar el Sitio, inscripciones, correos, backups y soporte. Tú declaras tener derechos suficientes para publicarlo.',
      '4.6 Despublicación. Al terminar la licencia (cancelación, sanción, falta de pago de plan cuando aplique, o cierre del Evento), Dorsalia puede despublicar el Sitio y dejar de hospedar el contenido en producción. Conservación de datos: sujeta a política de retención, obligaciones legales y backups técnicos.',
    ],
  },
  {
    id: 'responsabilidades',
    title: '5. Responsabilidades del organizador (traspaso de obligaciones operativas)',
    paragraphs: [
      'Tú eres el único responsable frente a atletas, staff, patrocinadores, autoridades y terceros por el Evento. Las siguientes obligaciones —inspiradas en deberes de gestión de riesgo de plataformas de pago— se traspasan a ti como organizador de tu Evento:',
    ],
    bullets: [
      'Pérdidas del Evento: respondes por reembolsos, cambios, cancelaciones, no shows gestionados por tu política, contracargos (chargebacks), disputas de pago y faltas de pago atribuibles a tu Evento o a tu gestión. Si Stripe o Dorsalia retienen reservas, limitan cobros o exigen garantías por riesgo elevado vinculado a tu cuenta/Evento, cooperarás y asumirás las consecuencias económicas que te correspondan según Stripe y este contrato.',
      'Onboarding y cumplimiento: proporcionarás datos de identidad y fiscales veraces (nombre, RFC, razón social, domicilio, cuenta bancaria, etc., cuando se soliciten). No operarás categorías de actividad restringidas por Stripe, por la ley mexicana o por las Normas de la Comunidad de Dorsalia.',
      'Evaluación de riesgos: antes y durante el Evento evaluarás si puedes cumplir lo prometido a los atletas (fechas, precios, kit, reembolsos) y si tienes liquidez/capacidad para absorber cancelaciones o contracargos razonablemente previsibles.',
      'Monitoreo y detección: vigilarás inscripciones anómalas, fraude con tarjetas, abusos de cupones, cuentas falsas y contenido engañoso en tu Sitio. Reportarás a Dorsalia indicios serios de fraude.',
      'Acciones de mitigación: usarás de buena fe las herramientas de la Plataforma y de Stripe (pausar cobros, verificar identidad, limitar aforo, corregir precios erróneos). Harás lo razonable para proteger a atletas de buena fe mientras reduces pérdidas.',
      'Comunicación con atletas: si una medida de riesgo, fraude o cumplimiento afecta a inscritos (pago retenido, inscripción anulada, evento cancelado), los notificarás con claridad y en tiempo razonable por los canales disponibles.',
      'Rectificación: si tu cuenta o Evento queda en estado de riesgo, aportarás la información y correcciones que Dorsalia o Stripe pidan para volver a un estado saludable.',
      'Soporte al participante: serás el primer contacto para dudas de tu Evento (horarios, kit, reembolsos, cambios de distancia, llegada). Dorsalia puede ayudar con fallas técnicas de la Plataforma, no sustituye tu atención de organizador.',
      'Permisos y legalidad del Evento: te corresponde obtener permisos, seguros, autorizaciones de ruta/vía pública y cumplir regulaciones deportivas o municipales aplicables. Dorsalia no las gestiona por ti.',
    ],
  },
  {
    id: 'reembolsos',
    title: '6. Políticas de reembolso y cambios (definidas por el organizador)',
    paragraphs: [
      '6.1 Quién define la política. Tú defines y publicas la política de: reembolsos monetarios; cambios de distancia; transferencias de inscripción; y cancelación del Evento. Debes redactarla en el briefing/configuración del Evento de forma clara, visible y coherente con lo que comunicas a atletas.',
      '6.2 Qué NO hace Dorsalia. Dorsalia no garantiza reembolsos automáticos ni actúa como árbitro obligatorio de cada disputa entre tú y un atleta, salvo cuando intervenga por fraude, cargo indebido, orden de autoridad o política de Stripe.',
      '6.3 Si ofreces reembolso. Eres responsable de ejecutarlo según tu política publicada y la ley aplicable (incluyendo tiempos y medios). Puede haber montos no reembolsables: comisiones de Dorsalia ya causadas, comisiones/cargos de Stripe, o costos ya erogados; debes dejarlo escrito en tu política si aplica.',
      '6.4 Eventos gratuitos. Es válido indicar que no hay reembolso monetario (porque no hubo cobro). Eso NO implica automáticamente “no se permiten cambios de distancia u otras reglas”. Si permites o prohíbes cambios, debes decirlo explícitamente; no se interpretará por deducción.',
      '6.5 Precio erróneo. Si publicas un precio manifiestamente erróneo, debes corregirlo de inmediato. Dorsalia puede pausar cobros si detecta error grave o abuso.',
      '6.6 Contracargos. Si un atleta disputa el cargo ante su banco, cooperarás con evidencia (reglamento, entrega de kit, política aceptada, correspondencia). Las pérdidas por contracargos ganados por el titular de la tarjeta pueden cargarse a tu cuenta Connect según reglas de Stripe.',
    ],
  },
  {
    id: 'comisiones',
    title: '7. Comisiones, precio al atleta y qué recibes tú (números explícitos)',
    paragraphs: [
      '7.1 Modelo. En inscripciones de pago, el atleta no paga solo tu precio base: paga un precio final calculado con “gross-up” para que, después de comisiones e impuestos sobre comisiones, tú recibas el precio base del boleto/pase que configuraste (salvo redondeos bancarios y casos excepcionales documentados).',
      '7.2 Componentes vigentes al momento de redactar este contrato (pueden actualizarse; rige la tarifa al momento del cobro):',
    ],
    bullets: [
      'Comisión Dorsalia: 5.7% (0.057) sobre la base aplicable del cálculo de fees + IVA 16% sobre esa comisión.',
      'Stripe México (orientativo): aproximadamente 3.6% + $3.00 MXN por cargo con tarjeta nacional exitoso, más IVA sobre los cargos de Stripe cuando aplique. Tarjeta internacional puede sumar ~0.5%.',
      'Costos de uso de Stripe Connect (a cargo del organizador, no de Dorsalia): (i) cuenta activa mensual orientativa ~$35 MXN (+ IVA si aplica) en los meses en que retires fondos a tu banco/tarjeta; (ii) por cada payout/retiro, orientativo 0.25% + $12 MXN (+ IVA si aplica). Abrir la cuenta Connect no tiene costo de alta. Estos conceptos son independientes de la comisión Dorsalia y del procesamiento por boleto.',
      'Ejemplo ilustrativo (no contractual de un cobro futuro): si tu boleto base es $300 MXN, el atleta puede ver un total cercano a ~$337 MXN según redondeo y tarifas exactas del día; tú apuntas a recibir $300 MXN de neto organizador por ese boleto (antes de costos de cuenta activa/payouts de Connect).',
      'Dónde verlo: el portal muestra una vista previa “lo que paga el atleta / lo que recibes tú”. Úsala antes de publicar precios.',
    ],
  },
  {
    id: 'comisiones-extra',
    title: '8. Qué no está incluido en la comisión de inscripción',
    paragraphs: [
      'Eventos 100% gratuitos (precio $0 en todas las modalidades cobrables) no generan comisión de cobro por inscripción.',
      'Planes de suscripción, cupos extra, add-ons, servicios profesionales o publicidad pueden facturarse aparte si los contratas; no se confunden con la comisión por boleto.',
      'Los costos de cuenta activa Connect y de payouts/retiros de Stripe no están incluidos en la comisión por inscripción ni en el plan mensual; corren por cuenta del organizador (ver cláusula 9.2-bis).',
      'Impuestos de tu actividad como organizador (ISR, IVA de tu régimen, retenciones) son tu responsabilidad fiscal; Dorsalia no es tu contador.',
    ],
  },
  {
    id: 'stripe-tiempos',
    title: '9. Stripe Connect: onboarding, cobros y tiempo de reflejo (sin ambigüedad)',
    paragraphs: [
      '9.1 Quién cobra. Los cobros de Eventos de pago se procesan con Stripe Connect. El dinero del atleta pasa por la infraestructura de Stripe; Dorsalia configura application fees / comisiones según la sección de comisiones.',
      '9.2 Onboarding obligatorio para cobrar. Para aceptar pagos en vivo debes completar y mantener al día el onboarding de Stripe (identidad, cuenta bancaria mexicana u otra admitida, datos del negocio). Si Connect no está listo, puedes crear un borrador del Evento, pero la publicación con cobro o el cobro efectivo pueden quedar bloqueados hasta habilitar pagos.',
      '9.2-bis Costos de uso Connect a tu cargo. Al crear o habilitar tu cuenta Connect aceptas que los costos de “cuenta activa” y de payouts/retiros de Stripe Connect son responsabilidad del Organizador. Dorsalia no los absorbe ni los incluye en su comisión de plataforma. El portal mostrará un aviso obligatorio la primera vez y recordatorios periódicos en Cobros. Los montos de Stripe México son orientativos y pueden actualizarse; rige la tarifa de Stripe al momento del cargo.',
      '9.3 Tiempo de reflejo (lo que sí y lo que no prometemos).',
    ],
    bullets: [
      '“Saldo disponible” en Stripe ≠ “ya está en tu CLABE”. Primero el pago debe liquidarse en Stripe; después Stripe programa el payout a tu banco.',
      'Plazo típico de referencia: entre 2 y 7 días hábiles después de que el saldo esté disponible para payout, según el calendario de Stripe México / Connect Express y tu historial.',
      'Factores que ALARGAN o BLOQUEAN el reflejo: revisión de riesgo, reservas, disputas/contracargos, datos bancarios incorrectos, cuenta restringida, volumen anómalo, o políticas cambiantes de Stripe.',
      'Dorsalia NO controla ni garantiza el día exacto en que tu banco acredite. Cualquier estimación en soporte es informativa, no una promesa de fecha cierta.',
      'Fines de semana y días festivos mexicanos/estadounidenses de procesamiento pueden desplazar el conteo de días hábiles.',
    ],
  },
  {
    id: 'stripe-acceso',
    title: '10. Qué NO ve ni controla Dorsalia en tu cuenta Connect / banco',
    paragraphs: [
      '10.1 Sin acceso al día a día bancario. Dorsalia no opera tu banca: no ve el detalle cotidiano de tu cuenta bancaria personal o empresarial, ni “entra” a modificar CLABE, claves interbancarias, usuarios, contraseñas bancarias, tokens de autenticación ni datos de liquidación que solo tú gestionas en el flujo de Stripe Connect / tu banco.',
      '10.2 Quién guarda los datos bancarios sensibles. La captura y custodia de datos de payout (p. ej. CLABE) ocurre en el onboarding y paneles de Stripe. Dorsalia no tiene un panel propio para editar tu CLABE ni para cambiar las credenciales de tu cuenta Connect como si fuera el titular.',
      '10.3 Qué sí puede hacer Dorsalia vía plataforma Stripe (límites). Como plataforma Connect, Dorsalia puede realizar acciones que Stripe permite a la plataforma, por ejemplo: ver estados de onboarding (charges/payouts enabled, detalles enviados), IDs de cuenta Connect, montos de application fee / comisiones, estados de pagos e inscripciones en la Plataforma; y, cuando proceda por riesgo, abuso o cierre, solicitar o ejecutar medidas que Stripe habilite (p. ej. restringir cobros, cooperar en revisiones, o desconectar/cancelar la cuenta Connect vinculada). Eso NO equivale a poder entrar a tu banco y cambiar datos.',
      '10.4 Corrección de datos bancarios. Si tu CLABE u otros datos de payout están mal, la corrección la haces tú (o con soporte de Stripe) en el flujo Connect. Dorsalia puede orientarte operativamente, pero no sustituye tu control sobre esos datos.',
    ],
  },
  {
    id: 'mapas',
    title: '11. Mapas: OpenStreetMap, Esri y Leaflet (uso y atribución obligatoria)',
    paragraphs: [
      'El trazado de rutas, la búsqueda de lugares y los mapas del Sitio/portal usan datos y software de terceros. Al usar esas funciones aceptas cumplir sus licencias:',
    ],
    bullets: [
      'OpenStreetMap (OSM): datos geográficos © colaboradores de OpenStreetMap. Licencia Open Database License (ODbL) 1.0. Debes respetar la atribución y las obligaciones ODbL. Referencia: https://www.openstreetmap.org/copyright',
      'Esri / servicios públicos de teselas: basemaps oscuros y satélite usados en vistas de ruta. Debes mantener la atribución exigida por el proveedor de teselas.',
      'Leaflet (u otras librerías de mapa del producto): según su licencia BSD u otra publicada en el software.',
      'Prohibido: eliminar, ocultar o falsear la atribución visible o en créditos legales; extraer masivamente datos OSM/Esri para competir o revender bases cartográficas al margen de la licencia; presentar los datos como si fueran de tu exclusiva autoría.',
      'En Configuración → Legales del portal encontrarás el listado de atribuciones que debes conservar.',
    ],
  },
  {
    id: 'email-resend',
    title: '12. Correo electrónico (Resend y canales de mensajería)',
    paragraphs: [
      '12.1 Para qué se usa. Dorsalia puede enviar correos transaccionales ligados al Evento: confirmación de inscripción, tickets/folios, avisos de pago, recuperación de cuenta y notificaciones operativas, mediante proveedores como Resend u otros equivalentes.',
      '12.2 Remitente. El nombre de remitente y el pie deben identificar de forma veraz tu Evento u organización. No suplantarás marcas ajenas ni te harás pasar por Dorsalia, bancos o autoridades.',
      '12.3 Prohibido en el canal de correo: spam; phishing; cadenas engañosas; marketing masivo no solicitado usando la infraestructura transaccional; contenido ilegal o fraudulento.',
      '12.4 Consecuencia. El abuso puede provocar suspensión inmediata del envío, del Evento o de la cuenta, y reporte al proveedor de correo.',
      '12.5 Entrega. Dorsalia y Resend no garantizan que todo buzón reciba el correo (filtros antispam del destinatario, errores de dirección, etc.). Debes verificar datos de contacto de atletas cuando sea crítico.',
      '12.6 Registros de envío. Dorsalia puede conservar metadatos y registros de correos enviados (destinatario, plantilla/tipo, estado de entrega cuando el proveedor lo reporte, timestamps) como parte de la operación y de la base descrita en las secciones de datos.',
    ],
  },
  {
    id: 'datos-inscripciones',
    title: '13. Datos de inscripciones: qué sí ve Dorsalia y qué no',
    paragraphs: [
      '13.1 Datos de inscripción en la Plataforma. Cuando un atleta se registra o completa un pago a través de Dorsalia, la Plataforma puede almacenar, entre otros: identidad y contacto del participante (nombre, correo, teléfono y campos del formulario del Evento); datos del Evento/distancia/boleto; estado de pago; folio/ticket; talla u otros campos que configures; y evidencias o referencias de pago que el flujo requiera.',
      '13.2 Registro de usuarios que completan pagos. Dorsalia sí puede ver y conservar el registro agregado y detallado de usuarios/atletas que completan pagos e inscripciones en la Plataforma (historial operativo necesario para soporte, antifraude, finanzas de plataforma, reportes y mejora del producto).',
      '13.3 Correos. Dorsalia sí puede ver y conservar información ligada a correos enviados por la infraestructura (p. ej. vía Resend): a quién se envió, tipo de mensaje, y estados reportados por el proveedor.',
      '13.4 Qué NO constituye “ver tu día a día”. Dorsalia no supervisa ni tiene acceso al manejo cotidiano de tu organización fuera de la Plataforma (tu contabilidad interna, chats privados ajenos al producto, tu app bancaria, etc.). Tampoco ve ni edita tus datos bancarios sensibles ni CLABE como se detalla en la sección 10.',
      '13.5 Rol del organizador. Tú tratas datos de participantes de tu Evento y debes publicar un aviso de privacidad del Evento cuando corresponda. No publicarás listados con datos personales (dorsales + nombre + contacto) sin base legal y, cuando aplique, consentimiento. Cumplirás la LFPDPPP y normativa mexicana aplicable.',
      '13.6 IA. Si usas funciones de IA, aplica la sección de OpenRouter/modelos: no pegues en prompts datos personales de atletas más allá de lo estrictamente necesario para redactar el Sitio.',
    ],
  },
  {
    id: 'datos-uso-cesion',
    title: '14. Uso de la base de datos, mejora de la Plataforma y cesión a terceros (publicidad)',
    paragraphs: [
      '14.1 Uso propio. Al aceptar este contrato reconoces que Dorsalia usará la base de datos de inscripciones, pagos completados, perfiles de contacto asociados al flujo de la Plataforma y registros de correos enviados para: operar el servicio; soporte; seguridad y prevención de fraude; analítica interna; y mejora continua del producto y de la experiencia de atletas y organizadores.',
      '14.2 Mejora de experiencia publicitaria. Dorsalia podrá usar esa información (directamente o mediante agregación/segmentación) para mejorar la relevancia de comunicaciones, recomendaciones de carreras, promociones del marketplace y experiencias publicitarias dirigidas a usuarios y organizadores dentro o en conexión con la Plataforma.',
      '14.3 Cesión / comercialización a terceros. Dorsalia podrá compartir, licenciar o vender a terceros conjuntos de datos o segmentos derivados de esa base (incluidos datos de contacto de usuarios que completaron inscripciones/pagos y metadatos de engagement/correo), con la finalidad de mejorar la experiencia publicitaria y comercial de usuarios y organizadores, o fines análogos de marketing/publicidad legítimos, sujeto a la legislación mexicana aplicable (incluidas obligaciones de aviso, consentimiento o legitimación que correspondan según el tipo de dato y el destinatario).',
      '14.4 Límites. Esta facultad no autoriza a Dorsalia a entregar a terceros tus secretos bancarios, CLABE, claves interbancarias ni credenciales de Stripe Connect que Dorsalia no custodia como editor. Los datos de tarjeta del atleta los procesa Stripe conforme a sus reglas; Dorsalia no vende PAN/CVV.',
      '14.5 Transparencia al atleta. Debes alinear el aviso de privacidad de tu Evento con este contrato cuando uses la Plataforma. El aviso público de Dorsalia (https://dorsalia.run/privacidad) describe el tratamiento a nivel plataforma. Los derechos ARCO u otros que procedan se ejercerán por los canales publicados.',
      '14.6 Actualizaciones. Si cambia de forma material el alcance de cesión a terceros, Dorsalia lo reflejará en una versión nueva de este contrato y/o del aviso de privacidad.',
    ],
  },
  {
    id: 'admin-plataforma',
    title: '15. Facultades de administración de la Plataforma (operación y publicidad)',
    paragraphs: [
      '15.1 Conservación de control operativo. Al usar la Plataforma reconoces que Dorsalia, como operador, conserva facultades de administración sobre el software, el hosting, el marketplace y las herramientas asociadas. El personal autorizado de Dorsalia puede ejercer esas facultades mediante instrumentos internos de administración de la Plataforma, sin que ello te convierta a Dorsalia en organizador deportivo de tu Evento ni te transfiera la propiedad del código o de *.dorsalia.run.',
      '15.2 Eventos. Dorsalia puede, cuando lo estime necesario por operación, soporte, cumplimiento, calidad, seguridad, abuso o política de la Plataforma: consultar el estado de Eventos; cancelarlos; activarlos; o desactivarlos/pausarlos (incluida la afectación a publicación, cobros o visibilidad en el índice, según el caso).',
      '15.3 Sitios y editor. Dorsalia puede visualizar y editar el Sitio del Evento en el editor de la Plataforma aunque el personal autorizado no sea titular de tu cuenta de organizador. Esa intervención se limita al ámbito del editor / contenido publicado del Sitio y a fines de soporte, corrección, cumplimiento, calidad o seguridad; no implica acceso a tu banca ni a modificar CLABE o claves interbancarias (sección 10).',
      '15.4 Anuncios y publicidad. Dorsalia se reserva el derecho de mostrar avisos, anuncios y espacios publicitarios en el portal del organizador, en la página pública (dorsalia.run / índice) y en el editor, incluyendo: (a) comunicaciones y publicidad propias de Dorsalia; y (b) publicidad de terceros, sea o no remunerada para Dorsalia. La presencia de publicidad no te otorga derecho a retirar esos espacios salvo acuerdo escrito distinto.',
      '15.5 Límites y buen uso. Estas facultades se ejercerán de forma razonable y proporcionada. No autorizan a Dorsalia a apropiarse de tu contenido de organizador más allá de las licencias ya concedidas en este contrato, ni a suplantar tu relación contractual con atletas respecto del Evento en campo.',
    ],
  },
  {
    id: 'prohibido',
    title: '16. Conductas estrictamente prohibidas',
    paragraphs: [
      'Queda estrictamente prohibido, sin excepción de “uso interno” o “prueba”, salvo autorización escrita de Dorsalia:',
    ],
    bullets: [
      'Fraude, suplantación de identidad, crear eventos falsos o cobros engañosos.',
      'Evadir comisiones o controles de pago (incluidos esquemas para no registrar el precio real cobrado al atleta).',
      'Manipular inscripciones, dorsales, resultados o datos de atletas de forma ilícita.',
      'Publicar o promover contenido ilegal, discriminatorio grave, violento ilícito, sexualmente explícito indebido en contexto de la Plataforma, o que viole derechos de autor/marca de terceros sin licencia.',
      'Vender o promover productos/actividades restringidas por Stripe o por la ley (incluidas las listas de actividades prohibidas de Stripe vigentes).',
      'Intentar reclamar propiedad sobre *.dorsalia.run, la marca Dorsalia, el código o las plantillas.',
      'Ataques técnicos, scraping abusivo, sobrecarga deliberada, o intento de acceder a datos de otros organizadores/atletas.',
      'Incumplir de forma reiterada tu propia política de reembolso publicada o inducir cobros indebidos.',
      'Usar la Plataforma para lavado de dinero, financiamiento ilícito o cualquier delito.',
    ],
  },
  {
    id: 'sanciones',
    title: '17. Incumplimiento y sanciones (qué puede pasar)',
    paragraphs: [
      'Si incumples este contrato, las Normas de la Comunidad o políticas de Stripe, Dorsalia puede —según gravedad y reincidencia—, de forma acumulable:',
    ],
    bullets: [
      'Enviar una advertencia y exigir corrección en un plazo.',
      'Despublicar el Sitio del evento o quitarlo del marketplace.',
      'Pausar cobros, inscripciones o envío de correos.',
      'Retener o limitar payouts en la medida que permitan las reglas de Stripe y la ley.',
      'Suspender o eliminar la cuenta del organizador.',
      'Conservar registros y cooperar con autoridades o con Stripe en investigaciones.',
    ],
  },
  {
    id: 'limitacion',
    title: '18. Limitación de responsabilidad de Dorsalia (alcance claro)',
    paragraphs: [
      'En la máxima medida permitida por la ley mexicana: Dorsalia no responde por lucros cesantes, pérdida de chance, daño reputacional o daños indirectos derivados del Evento deportivo en sí, de decisiones tuyas de organización, ni de fallas de terceros (Stripe, bancos, Resend, DNS, ISP, OSM/Esri, OpenRouter u operadores de modelos de IA).',
      'La responsabilidad total de Dorsalia frente a ti por un Evento concreto, cuando exista por ley o por este contrato, se limitará en conjunto a lo efectivamente pagado por ti a Dorsalia como comisión de plataforma por ese Evento en los 3 meses previos al reclamo (o un monto simbólico mínimo si no hubo comisión), salvo dolo o culpa grave demostrados.',
      'Nada en este contrato excluye responsabilidad que la ley prohíba limitar (por ejemplo, en los términos que fije la normativa de consumidores cuando aplique a Dorsalia como prestador).',
    ],
  },
  {
    id: 'planes-suscripcion',
    title: '19. Planes de suscripción, cupos de eventos, precios e IVA (explícito)',
    paragraphs: [
      '19.1 Qué compra un plan. La suscripción mensual a Dorsalia (si eliges un plan de pago) te da cupos de eventos simultáneos, créditos de IA mensuales y, en planes de pago, funciones como analítica y dominio propio según el plan. No sustituye las comisiones por boleto de la sección de pagos de inscripción.',
      '19.2 Precios mensuales publicados en el portal (MXN, vigentes al redactar este contrato; pueden actualizarse y rige el precio mostrado al pagar):',
    ],
    bullets: [
      'Gratis — $0 MXN/mes: 1 evento simultáneo. Tras la fecha del evento, el cupo se libera después de 3 días de gracia; entonces puedes crear el siguiente.',
      'Básico — $99 MXN/mes: hasta 2 eventos simultáneos; dominio propio y analítica desbloqueados.',
      'Plus — $150 MXN/mes: hasta 3 eventos simultáneos.',
      'Pro — $300 MXN/mes: hasta 6 eventos simultáneos; pensado para varias fechas.',
      '“Evento simultáneo” = carrera que aún ocupa cupo (desde su creación/activación hasta 3 días después de su fecha de evento). Si alcanzas el máximo, no puedes crear/activar otro hasta liberar cupo o subir de plan.',
    ],
  },
  {
    id: 'planes-iva',
    title: '20. IVA e impuestos en la suscripción',
    paragraphs: [
      'Los montos $99 / $150 / $300 MXN mensuales son los precios de plan mostrados en Configuración → Plan del portal.',
      'El total que pagues puede incluir IVA u otros impuestos según la configuración fiscal de Dorsalia en Stripe y la normativa mexicana aplicable al momento del cobro. El desglose definitivo (subtotal, impuestos, total) se muestra en Stripe Checkout y/o en la factura/recibo de Stripe. Conserva esa factura como comprobante.',
      'Si Stripe muestra el impuesto incluido en el precio (tax inclusive) o añadido encima (tax exclusive), prevalece lo que veas en el checkout de esa compra. Dorsalia no oculta impuestos: el organizador debe revisar el total antes de confirmar el pago.',
      'Cancelación/cambio de plan: puedes gestionar o cancelar la suscripción desde el portal de facturación de Stripe vinculado a tu cuenta. Los efectos sobre cupos de eventos (desactivar eventos excedentes al bajar de plan) se aplican según las reglas del portal al confirmar el cambio.',
    ],
  },
  {
    id: 'creditos-ia',
    title: '21. Créditos de IA: cuántos tocan, para qué sirven y reinicio',
    paragraphs: [
      '21.1 Unidad. Dorsalia asigna un pool mensual de “créditos IA” por workspace según el plan. Internamente se relacionan con un presupuesto en USD de uso de modelos (aprox. 100 créditos por cada $1 USD de presupuesto de plan).',
      '21.2 Cantidades incluidas por mes (reinicio periódico del ciclo del workspace):',
    ],
    bullets: [
      'Plan Gratis: 50 créditos IA / mes (presupuesto orientativo ~$0.50 USD).',
      'Plan Básico: 130 créditos IA / mes (~$1.30 USD).',
      'Plan Plus: 195 créditos IA / mes (~$1.95 USD).',
      'Plan Pro: 325 créditos IA / mes (~$3.25 USD).',
      'Operaciones que consumen el pool (principalmente): generar sitio con IA, refinar sitio, mejorar textos del sitio. Cada operación descuenta créditos según tokens/uso real convertido a créditos.',
      'Si te quedas en 0 créditos, esas funciones IA se bloquean hasta el reinicio del periodo o hasta que Dorsalia ofrezca recargas (si existen). El panel Configuración → Plan / créditos IA muestra usados, restantes y fecha de reinicio.',
      'El chat Dalia u otras asistencias pueden usar modelos vía la infraestructura de Dorsalia; Dorsalia puede incluirlas en el descuento de créditos en el futuro. Aceptas el uso razonable y las cuotas publicadas en el producto.',
    ],
  },
  {
    id: 'openrouter-ia',
    title: '22. OpenRouter, API keys y qué recopilan los modelos (transparencia)',
    paragraphs: [
      '22.1 Cómo se conecta. Dorsalia llama a proveedores de modelos de lenguaje/visión a través de OpenRouter (openrouter.ai) u otros intermediarios equivalentes, usando API keys de Dorsalia (no se te pide tu propia API key de OpenRouter para el uso estándar del producto).',
      '22.2 Qué se envía. Al usar funciones IA puedes transmitir, entre otros: el texto que escribes (prompts, mensajes del chat Dalia, instrucciones de diseño); un resumen o borrador del Evento (nombre, fechas, precios, distancias, políticas, etc.); URLs o imágenes de referencia que subas para generar/refinar el sitio; metadatos técnicos (workspace, tipo de operación, conteo de tokens).',
      '22.3 Qué NO debes enviar. No introduzcas en prompts secretos bancarios, contraseñas, datos de tarjetas, NI datos personales sensibles de atletas más allá de lo necesario para redactar el Sitio. Eres responsable del contenido que pegas en la IA.',
      '22.4 Qué hace OpenRouter / el modelo. OpenRouter recibe la petición autenticada con la API key de Dorsalia, enruta al modelo elegido (p. ej. familias Gemini, GPT, Llama u otros configurados) y puede registrar uso (tokens, coste, modelo, timestamps) para facturar a Dorsalia. El operador del modelo procesa el prompt para generar la respuesta. Sus prácticas de retención, entrenamiento y logs se rigen por las políticas de OpenRouter y del proveedor del modelo (p. ej. Google, OpenAI, Meta), no por Dorsalia en solitario.',
      '22.5 Rol de Dorsalia. Dorsalia no vende tus prompts a terceros con fines de marketing. Usa la API para prestarte la función. Puede registrar en sus servidores el uso (créditos, operación, timestamps, ids de workspace/evento) para cuotas, soporte y abuso. Conserva logs según necesidad operativa y legal.',
      '22.6 Sin garantía de exactitud. La IA puede equivocarse: debes revisar textos, precios, fechas y políticas antes de publicar. Dorsalia no garantiza que la salida de un modelo sea correcta ni libre de alucinaciones.',
      '22.7 Enlaces de políticas de terceros (pueden actualizarse): https://openrouter.ai/privacy y las políticas del proveedor del modelo concreto usado en cada llamada.',
    ],
  },
  {
    id: 'almacenamiento',
    title: '23. Almacenamiento designado del workspace (uso permitido y límites)',
    paragraphs: [
      '23.1 Para qué es. El almacenamiento del workspace está destinado exclusivamente a archivos necesarios para operar tus Eventos en Dorsalia: logos, flyers, portadas, galería, imágenes del Sitio, referencias para IA, mapas/GPX de rutas, avatares de cuenta y medios similares del producto. No es un disco personal genérico ni un servicio de backup ilimitado para archivos ajenos al Evento.',
      '23.2 Cuota por defecto. Cada workspace tiene un límite de almacenamiento designado de 5 GB (5 368 709 120 bytes), salvo que Dorsalia asigne otro límite por plan, promoción o acuerdo escrito. El uso se mide sobre objetos guardados en el almacenamiento de la Plataforma asociados a tu workspace.',
      '23.3 Límites por archivo (ejemplos vigentes en producto; pueden ajustarse): imágenes de evento/logo suelen topar entre 2 MB y 12 MB según el campo; fotos en flujos Dalia ~8 MB; GPX de ruta ~5 MB; otros tipos según la pantalla de carga. Archivos que excedan el tope serán rechazados.',
      '23.4 Prohibido en almacenamiento: material ilegal; malware; contenido que no sea para el Evento/cuenta; redistribuir archivos masivos ajenos; intentar superar cuotas con cuentas múltiples abusivas.',
      '23.5 Si te pasas de cuota. Dorsalia puede impedir nuevas subidas hasta que borres archivos o se amplíe el límite. Puede borrar o pedir que borres contenido claramente fuera del uso designado tras aviso razonable, salvo riesgo/legal urgente.',
      '23.6 Copias. Eres responsable de conservar copias maestras de tus originales. La Plataforma no sustituye un sistema de respaldo profesional tuyo.',
    ],
  },
  {
    id: 'aceptacion',
    title: '24. Cómo se acepta este contrato al crear',
    paragraphs: [
      'Debes desplazarte hasta el final del documento (o usar “Ir al final”), marcar la casilla de confirmación y pulsar “Confirmar y crear”. Solo entonces se crea el Evento.',
      'Si pulsas “Cancelar” o cierras el modal: no se crea el Evento, no se publica Sitio, y puedes seguir en el chat o asistente. Si vuelves a intentar crear, se mostrará de nuevo este contrato hasta que lo aceptes.',
      'La aceptación queda asociada a tu acción de creación en esa sesión de trabajo. Conserva una copia o consulta la versión pública en https://dorsalia.run/terminos',
    ],
  },
  {
    id: 'derechos',
    title: '25. Derechos reservados y contacto',
    paragraphs: [
      '© Dorsalia Run. Todos los derechos reservados.',
      'portal.dorsalia.run, editor.dorsalia.run y dorsalia.run son operados por Dorsalia en México. Queda prohibida la reproducción, ingeniería inversa ilícita o explotación comercial de la Plataforma fuera de la licencia de organizador, sin autorización escrita.',
      'Consultas: canal de soporte de tu cuenta en el portal, o los medios publicados en dorsalia.run. Normas de la comunidad: https://dorsalia.run/normas-comunidad — Privacidad: https://dorsalia.run/privacidad — Términos: https://dorsalia.run/terminos',
    ],
  },
];

export const ORGANIZER_CONTRACT_ACCEPT_LABEL =
  'Confirmo que leí y acepto este contrato: responsabilidades, reembolsos, comisiones, Stripe Connect (costos de cuenta activa y payouts a mi cargo; sin acceso de Dorsalia a mi CLABE/claves bancarias), datos de inscripciones y correos, uso/cesión publicitaria de la base, facultades de administración de la Plataforma (eventos, editor, anuncios propios y de terceros), planes/IVA, créditos IA, OpenRouter, almacenamiento 5 GB, mapas, Resend y derechos de Dorsalia en México.';
