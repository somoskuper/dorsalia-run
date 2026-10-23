# Dorsalia.run

Marketplace público de carreras y eventos deportivos de Dorsalia. Esta aplicación es la referencia funcional y visual de la experiencia web móvil que se recreará de forma completamente nativa en iOS.

> Estado: producción en `https://dorsalia.run` · repositorio privado

## Alcance

La aplicación permite a participantes explorar eventos, filtrar y buscar carreras, consultar detalles, guardar favoritos, iniciar sesión, gestionar perfil, realizar compras/inscripciones, consultar tickets y participar en actividad social.

La operación de organizadores vive en `portal.dorsalia.run`; la edición de sitios en `editor.dorsalia.run`.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase autoalojado: Auth, PostgreSQL, Storage, PostgREST y Edge Functions
- MapLibre GL y Leaflet para mapas y rutas
- pnpm 9 / Node.js 20
- Docker multi-stage para producción

## Arquitectura

`dorsalia.run` es el cliente público. Se comunica por HTTPS con los servicios de Dorsalia y nunca accede directamente a PostgreSQL, Docker, SSH ni secretos del VPS.

```text
Web / futura app iOS
        ↓ HTTPS autenticado
API y Supabase de Dorsalia
        ↓
PostgreSQL · Storage · Edge Functions · Stripe
```

## Desarrollo local

### Requisitos

- Node.js 20+
- Corepack habilitado
- pnpm 9+
- Acceso a un entorno de desarrollo o staging de Dorsalia

### Instalación

```bash
git clone git@github.com:somoskuper/dorsalia-run.git
cd dorsalia-run
corepack enable
pnpm install
pnpm dev
```

La aplicación inicia en `http://localhost:3001`.

### Variables de entorno

Crea un archivo `.env.local` que **no** se sube a Git:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<entorno-dorsalia>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave-publica-del-entorno>
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.dorsalia.run
NEXT_PUBLIC_CARTO_API_KEY=<si-aplica>
```

Nunca agregues al repositorio claves `service_role`, credenciales SSH, contraseñas de base de datos, secretos de Stripe ni archivos `.env`.

## Comandos

```bash
pnpm dev       # desarrollo, puerto 3001
pnpm build     # build de producción
pnpm start     # servidor Next.js, puerto 3000
pnpm lint      # lint
```

## Estructura relevante

```text
src/app/          Rutas, páginas y endpoints internos de Next.js
src/components/   Interfaz de marketplace, cuenta, comunidad, mapas y reseñas
src/lib/          Auth, Supabase, eventos, favoritos, tickets y datos de dominio
public/           Branding, imágenes, fuentes y assets públicos
db/               Migraciones SQL versionadas
Dockerfile        Build y runtime de producción
```

## Capacidades actuales

- Inicio: Eventos, Para ti y Actividad
- Búsqueda, filtros, colecciones y guardados
- Detalle de evento: datos, precios, mapa/ruta, galería, reseñas y preguntas
- Cuenta: onboarding, perfil, avatar/cabecera, compras, tickets y QR
- Comunidad: perfiles, seguidores, publicaciones, reacciones y notificaciones
- Inscripciones, cupones, comprobantes, checkout y pagos mediante los servicios existentes

## Relación con la app iOS nativa

La app iOS se construirá en un repositorio separado, `dorsalia-ios`, con Swift y SwiftUI. No será un WebView ni reutilizará componentes React.

La web es la fuente de verdad para funcionalidad y datos. iOS reutilizará los contratos de backend y los flujos de producto, con implementación nativa:

| Web actual | App iOS nativa |
| --- | --- |
| Eventos, Para ti y Actividad | `TabView`, `NavigationStack` y estado persistente |
| Búsqueda y filtros | `searchable`, chips y haptics |
| Mapas y rutas | MapKit; MapLibre sólo cuando se requieran capas equivalentes |
| Sesión y perfil | Keychain, Face ID/Touch ID y passkeys si se habilitan |
| Tickets y QR | VisionKit/AVFoundation, compartir y Wallet cuando aplique |
| Avisos | APNs, deep links, widgets y Live Activities cuando aporten valor |
| Checkout | Integración nativa con el backend existente y Apple Pay cuando sea compatible |

La documentación de arquitectura y paridad vive en docs.somoskuper.com.

## Despliegue

Producción se ejecuta en Docker detrás de Traefik con TLS. La imagen usa Node 20 y expone el puerto 3000; el endpoint de salud es `/healthz`.

El código desplegado reside en el VPS, pero el flujo de cambios debe ser:

1. Crear rama y cambiar código en Git.
2. Ejecutar lint y build localmente.
3. Revisar los cambios.
4. Desplegar mediante el proceso operativo acordado, sin editar producción directamente salvo una incidencia autorizada.

## Seguridad

- El repositorio es privado.
- `.gitignore` excluye dependencias, builds, backups locales, variables de entorno y archivos del sistema.
- La deploy key del VPS está limitada a este repositorio.
- No publiques secretos en issues, commits, logs ni capturas.

## Próximos pasos

- Crear `dorsalia-ios` localmente con SwiftUI.
- Documentar el contrato OpenAPI de los endpoints del MVP.
- Configurar development, staging y production.
- Probar builds nativas en dispositivos físicos y distribuir betas por TestFlight.
