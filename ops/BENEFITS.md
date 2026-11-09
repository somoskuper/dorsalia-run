# Cupones de beneficios de atletas

## Accesos

- `/cuenta?tab=historial`: cartera del usuario autenticado, tabs Disponibles y Vencidos (incluye canjeados y revocados).
- `/cuenta?tab=historial&vista=compras`: historial de compras e inscripciones existente.
- `/cuenta/cupones/{id}`: ficha privada con vigencia, condiciones, código personal y canje confirmado.

## Tablas

- `benefit_campaigns`: comercio, contenido, logo/color, tipo/valor, vigencia de campaña, días de validez, cupo total y estado.
- `benefit_rules`: condiciones alternativas para recibir un cupón; evento opcional y cantidad mínima de eventos distintos.
- `benefit_participations`: asistencias verificadas/importadas por el backend. Una inscripción no confirma asistencia.
- `athlete_coupons`: asignación individual, código aleatorio, vigencia, motivo y estado. Único por usuario/campaña, incluso si después vence o se revoca.
- `benefit_redemptions`: un canje por cupón con fecha, usuario y copia de las condiciones vigentes al canjear.

El sistema de descuentos de checkout (`coupons`, `validate_coupon`, `redeem_coupon`) continúa siendo independiente.

## Reglas

- `event_registration`: inscripción de `leads` asociada al atleta con pago `paid`/`verified`; excluye Stripe de prueba y registros archivados.
- `event_participation`: asistencia de `benefit_participations` o participación confirmada mediante puntuación/reseña publicada después de que terminó el evento.
- `event_rating`: puntuación publicada de 1–5 tras finalizar el evento, con o sin texto.
- `event_review`: reseña publicada con texto o fotos tras finalizar el evento.

`race_event_id = NULL` aplica a cualquier evento. `required_count` permite hitos (por ejemplo, participar en tres eventos distintos). Las reglas de una campaña son alternativas. El atleta solo recibe un cupón por campaña.

La sincronización se ejecuta al registrar/cambiar inscripciones, puntuaciones/reseñas o asistencias verificadas. Abrir la cartera aplica también las reglas nuevas a los datos históricos. Al activar una campaña puede ejecutarse `benefit_sync_user(usuario)` desde el backend para sincronizar inmediatamente a usuarios concretos.

## Administración desde el backend

Solo el rol de servicio o el administrador de la base puede crear/editar campañas y reglas, confirmar asistencia o asignar beneficios manualmente. No enviar la clave de servicio al navegador.

```sql
-- Primero crear la campaña en draft y sus reglas; luego activar.
INSERT INTO public.benefit_campaigns
 (slug,merchant_name,title,description,terms,benefit_type,benefit_value,state,validity_days)
VALUES ('comercio-beneficio','Comercio','10% OFF','Descripción','Condiciones reales','percent',10,'draft',30)
RETURNING id;

INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id)
VALUES ('CAMPAIGN_UUID','event_participation','EVENT_UUID');

UPDATE public.benefit_campaigns SET state='active' WHERE id='CAMPAIGN_UUID';

-- Confirmar asistencia desde una fuente validada.
INSERT INTO public.benefit_participations(user_id,race_event_id,source)
VALUES ('USER_UUID','EVENT_UUID','check-in verificado')
ON CONFLICT (user_id,race_event_id) DO NOTHING;

-- Asignación manual, idempotente y sujeta a vigencia/cupo de campaña.
SELECT public.benefit_grant_coupon('USER_UUID','CAMPAIGN_UUID','Motivo de la asignación');
```

## API del atleta

RPC autenticadas: `athlete_my_coupons()`, `athlete_coupon_detail(p_coupon_id)` y `athlete_redeem_benefit_coupon(p_coupon_id)`. El dueño se obtiene de `auth.uid()`, nunca del cliente. El canje es atómico, comprueba vigencia y estado, y es idempotente.

Canjear en esta primera versión significa que el atleta confirma el uso dentro de su propia cuenta. La validación por cajero, QR firmado o terminal de comercio será otra integración.

## Prueba inicial

La campaña `pollo-feliz-prueba` está marcada `is_test=true`, se asignó únicamente al correo autorizado por el usuario, tiene validez de 30 días desde la asignación y no contiene reglas de distribución automática. No representa una promoción comercial autorizada. Volver a ejecutar `ops/seed-pollo-feliz-test.sql` no duplica la asignación.

## Verificación

La migración es transaccional. Las comprobaciones SQL se ejecutan en una transacción con rollback; no consumen el cupón asignado. Cubren asignación única, cupo total, propietario, RLS, expiración, canje idempotente y disparadores de reglas.

La lista adapta el frame Figma `443:1599` y usa los assets locales de `public/coupons/`. El acceso a `Cupon Ficha` quedó bloqueado por el límite del plan de Figma; la ficha actual es funcional y reutiliza los controles de vidrio existentes, pendiente de contrastar con ese frame.
