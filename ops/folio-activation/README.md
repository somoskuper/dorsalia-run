# Activación de Coffee Run por folio

22 accesos provisionales, creados el 4 de noviembre de 2026, en athlete_folio_access. No son usuarios definitivos de auth.users: estos se crean cuando el participante registra su correo personal y contraseña nueva. Las cuentas de los compradores no se modifican. El PIN temporal se compara con bcrypt; nunca se devuelve por RPC.

En /auth se acepta folio CRD-XXXXXX en el mismo campo del correo. El acceso por PIN produce un ticket aleatorio de 256 bits, almacenado como hash SHA256, válido por dos horas. Sesión restringida a completar activación; no hay sesión Supabase ni acceso a compras ajenas en esta fase. Cinco PIN incorrectos bloquean quince minutos por folio.

/activar-inscripcion muestra dos pasos: nombre/apellidos/teléfono, y correo personal/username/contraseña nueva/confirmación. El segundo paso incluye el código de verificación de correo del flujo habitual de Supabase, con reenvío. No se acepta un correo ya registrado en otra cuenta. El vínculo definitivo se hace solo si el usuario pendiente verifica el mismo correo preparado. Un username ya ocupado se rechaza. No se guardan contraseñas nuevas en la tabla de provisionales.

Los RPCs de contexto/preparación/vinculación necesitan el ticket; la finalización requiere auth.uid(), correo confirmado y el usuario registrado para ese folio. La finalización crea el perfil, registration_athlete_links y sus beneficios cuando se cumplen las reglas. El folio deja de aceptar el PIN después de activarse. La operación es idempotente. Tablas sin permisos directos para anon/authenticated, RLS activo.

Los registros de compras originales en leads.user_id conservan al comprador. La asignación del participante utiliza registration_athlete_links. Se preservan las cuentas existentes incluso para los ocho folios cuyo titular tenía una cuenta propia: el nuevo acceso provisional exige otro correo único, según la autorización de este lote.

Pruebas SQL con ROLLBACK en verify-folio-activation.sql: 22 PIN/contextos, permisos de tablas, intentos, ticket inválido, correo repetido, cuenta pendiente, bloqueo antes de verificar, username/perfil, folio visible, finalización idempotente y bloqueo del PIN tras activación. Datos QA eliminados por ROLLBACK; no se enviaron correos de prueba. UI comprobada con CRD-B12326 hasta el paso 2, sin registrar correo ni activar el folio.
