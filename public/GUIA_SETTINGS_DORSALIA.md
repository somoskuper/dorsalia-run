# Guía de trabajo: configuraciones de Dorsalia

Referencia para ampliar `/settings` sin cambiar las decisiones de diseño ya tomadas. Actualizada el 7 de noviembre de 2026.

## Rutas y componentes

| Ruta | Propósito | Pieza principal |
| --- | --- | --- |
| `/settings` | Índice de configuraciones | `settings-page.tsx`, `SettingsSection`, `SettingsProfileHeader` |
| `/settings/edit-profile` | Resumen de campos del perfil | `settings-edit-page.tsx`, `EditProfileSettings`, `SettingsSectionEdit` |
| `/settings/edit-profile/[field]` | Edición de un dato | `settings-edit-field-page.tsx`, `EditProfileSettings` |
| `/settings/edit-profile/cover` | Selección o carga de portada | `ProfileMediaEditor` |
| `/settings/edit-profile/avatar` | Foto de perfil | `ProfileMediaEditor` |
| `/settings/edit-profile/medals` | Medallas destacadas | `ProfileMedalEditor` |

Los archivos de la tabla son los nombres de los componentes y páginas en el proyecto. En el servidor, el código está en `/opt/kuper/dorsalia-carreras/src`; los componentes están bajo `src/components/settings/`, salvo `PageHeader`, que está en `src/components/`. Las páginas están bajo `src/app/settings/`.

La lista de `/settings/edit-profile` **no muestra** filas de Portada ni Medallas destacadas. El encabezado visual del perfil conserva el acceso a editar portada y foto. Las rutas de portada y medallas siguen existiendo para sus controles correspondientes.

## Reglas visuales

- Fondo de página: `#070707`; texto principal blanco; fuente Roboto. Contenido con 15 px de espacio lateral en móvil y ancho máximo de 640 px en las páginas de configuraciones.
- `PageHeader`: reutilizarlo para regresar y mostrar el título centrado. En configuraciones se usa `sticky`; su degradado va del fondo `#070707` a transparente. La acción de guardar usa el botón de vidrio de la derecha y el SVG `check.svg`.
- `SettingsSection`: título de 20 px, peso 600, interlineado de 24 px. Dejar 10 px entre el título y el contenedor de enlaces. El contenedor tiene fondo `#191919`, radio de 20 px y padding de 15 px arriba, abajo e izquierda; 10 px a la derecha. Separación entre enlaces: 16 px.
- En cada enlace del índice, texto de 16 px, icono izquierdo de 24 × 24 px, 10 px entre icono y texto, flecha derecha de 24 × 24 px. El enlace no añade padding propio.
- Separar cada grupo de configuraciones del siguiente por 30 px. Después del encabezado de perfil, dejar 40 px antes del primer grupo.
- `SettingsSectionEdit`: título de 20 px semibold; 10 px debajo aparece el campo. El campo mide 44 px de alto, usa fondo `#191919`, radio de 20 px, 15 px de padding a la izquierda y 10 px a la derecha. Valor de 16 px en blanco al 50 %. Flecha de 24 × 24 px. Separación entre campos: 30 px.
- En `/settings/edit-profile`, el bloque de campos comienza 40 px después del componente `ProfileIdentity`. Las páginas de cada campo usan el mismo encabezado; el formulario comienza 40 px debajo de él y ofrece una breve explicación del dato.
- Acento verde `#C5E500`; error o cierre de sesión `#DE5757`. Los SVG del índice se guardan en `public/settings-icons/`.

## Comportamiento al crear una configuración

1. Define si es un enlace del índice, un campo editable o una pantalla propia. Usa `SettingsSection` para grupos y `SettingsSectionEdit` para campos; evita duplicar su estructura y estilos.
2. Si aún es solo visual, deja el elemento sin `href`. Añade el enlace cuando exista una pantalla que funcione. El índice admite entradas con `label`, `icon` y `href` opcional.
3. Usa una ruta dentro de `/settings/...` para una pantalla nueva. Añade el mismo `PageHeader` con un `fallbackHref` coherente. No abras un modal para editar un campo del perfil: la edición actual utiliza una página completa.
4. Añade una explicación breve y específica debajo del control. Mantén el valor actual visible en el resumen y el borrador separado hasta guardar.
5. Si el dato es persistente, lee y escribe el campo correcto de `athlete_profiles` con el cliente Supabase y el `user_id` autenticado. Muestra errores, bloquea guardados repetidos y actualiza el perfil en pantalla después de guardar. Para el nombre de usuario, comprueba disponibilidad antes de habilitar el guardado y vuelve a comprobarla al enviarlo.
6. Si agregas iconos, conserva los SVG recibidos y verifica su tamaño real en el componente. Usa `alt=""` en iconos decorativos y un nombre accesible en el enlace o botón.
7. Comprueba móvil y escritorio, navegación de regreso, estado sin datos, estado de carga y guardado. Compila antes de publicar y verifica que el servicio quede saludable.

## Cómo se reutilizan las piezas

`PageHeader` también sirve a `/cuenta` y otras páginas. Sus opciones permiten título, acción derecha, guardado de formulario, modo sticky y degradado; ajusta la opción para cada ruta sin crear otra cabecera. `ProfileIdentity` se usa en el perfil y en la edición de perfil. `SettingsProfileHeader` es el encabezado compacto del índice, con avatar de 39 × 39 px, borde verde de 4 px, nombre de 20 px y usuario de 14 px en blanco al 50 %.

La navegación general oculta su barra en `/settings` y en rutas descendientes. El menú móvil incluye “Configuración”, y el menú de escritorio enlaza a la misma ruta.

## Lista breve antes de cerrar una nueva pantalla

- La ruta carga al abrirla directamente y al navegar desde el índice.
- El encabezado, espacios, colores, radios, tamaño de iconos y tipografía coinciden con los componentes compartidos.
- El usuario entiende qué modifica cada campo y recibe confirmación o error al guardar.
- No hay enlaces visuales que parezcan funcionales sin destino.
- La compilación termina sin errores y se comprueba la vista móvil en la web.
