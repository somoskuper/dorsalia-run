# Desarrollo local

## Inicio rápido

```bash
git clone git@github.com:somoskuper/dorsalia-run.git
cd dorsalia-run
cp .env.example .env.local
pnpm install
pnpm dev
```

La aplicación queda disponible en `http://localhost:3001`.

## Variables

`.env.example` contiene todas las variables que consume el marketplace. Las dos
variables que no deben guardarse en Git son:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CARTO_API_KEY`

Pide el archivo `.env.local` preparado desde el VPS por un canal seguro y
cópialo a la raíz del clone. Aunque la clave anónima de Supabase se entrega al
navegador, se conserva fuera del repositorio para evitar copias accidentales.

No uses ni copies en este proyecto las credenciales de servidor: `SERVICE_ROLE_KEY`,
`JWT_SECRET`, claves de Stripe, OpenRouter, Google OAuth ni contraseñas de
PostgreSQL. El código para cambiar la contraseña sí se envía con Resend:
`RESEND_API_KEY` y `RESEND_FROM_EMAIL` viven solo en `.env.local` o en el
entorno del servidor, nunca en Git.

## Autenticación local

Las pantallas públicas, eventos, datos de perfil y API pública pueden usar el
backend de Dorsalia con el archivo local. Para que Google OAuth y el callback de
inicio de sesión funcionen completamente desde `localhost`, el backend debe
permitir explícitamente `http://localhost:3001/auth/callback` como URL de
redirección y la aplicación debe evitar forzar el dominio de cookie
`.dorsalia.run` durante el desarrollo local.

Hasta habilitar esas dos configuraciones, valida los flujos autenticados en el
dominio de staging/producción; no intentes llevar secretos de Auth al archivo
local.
