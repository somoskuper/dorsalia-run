BEGIN;
INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,logo_url,background_color,benefit_type,benefit_value,state,validity_days,is_test)
VALUES ('pollo-feliz-prueba','Pollo Feliz','Hasta 10% OFF','Aprovecha tu descuento al consumir en el restaurante.',
  'Cupón de prueba asignado para validar Dorsalia. Un solo uso por cuenta. No es acumulable y no representa una promoción autorizada ni un descuento exigible al restaurante. Vigencia de 30 días desde la asignación.',
  '/coupons/pollo-feliz.png','#ed2024','percent',10,'active',30,true)
ON CONFLICT (slug) DO UPDATE SET logo_url=EXCLUDED.logo_url;
DO $$
DECLARE athlete uuid; campaign uuid; result uuid;
BEGIN
  SELECT id INTO STRICT athlete FROM auth.users WHERE lower(email)='hola@somoskuper.com';
  SELECT id INTO STRICT campaign FROM public.benefit_campaigns WHERE slug='pollo-feliz-prueba';
  result := public.benefit_grant_coupon(athlete,campaign,'Asignación de prueba solicitada por el titular');
  IF result IS NULL THEN RAISE EXCEPTION 'No se pudo asignar el cupón de prueba'; END IF;
END $$;
COMMIT;
