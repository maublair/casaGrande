# Casa Grande handoff

Fecha: 2026-07-04

## Estado actual

- La propuesta comercial de Casa Grande ya existe en `app/propuesta/page.tsx`.
- La propuesta quedó ajustada a:
  - CRM en WordPress
  - headless/WordPress como centro de contenido
  - WhatsApp/YCloud
  - pagos de reservas con Izipay, Yape, Plin y transferencia bancaria
  - contabilidad básica
  - almacén compartido
  - dashboards KPI
  - tutorial con usuario demo `admin-hotel`
- Se removió toda mención comercial de hosting de la propuesta.
- Se registró en RNA la decisión de no ofrecer hosting como servicio comercial.


## Update 2026-07-06

- La experiencia pública de `habitaciones` quedó reforzada para mostrar cada tipo como card con modal flotante, galería, animaciones de iconos de características y formulario/botón de reserva.
- La documentación de memoria se alineó en RNA y en este handoff local para evitar drift entre la propuesta, el CRM demo y el contexto operativo.
- Typecheck verificado después de los ajustes de horarios, turnos y propuesta comercial.

## Archivos clave

- `app/propuesta/page.tsx`
- `components/hotel/Navbar.tsx`
- `components/hotel/BookingModal.tsx`
- `components/hotel/ChatWidget.tsx`
- `components/admin/ReservationDetailModal.tsx`
- `lib/wp.ts`
- `wp/mu-plugins/casagrande-headless.php`

## Lo que ya quedó hecho

- Diagnóstico del sitio público:
  - WordPress 7.0
  - Hello Elementor
  - WooCommerce
  - Jetpack
  - WhatsApp
  - Elementor / Elementor Pro
  - jQuery y jQuery Migrate 3.4.1
  - Site Kit 1.181.0
  - All in One SEO Pack 4.9.8
  - Cloudflare Browser Insights
  - Kount
  - tipografía Cinzel Decorative
- Se detectaron errores de consola por `Mixed Content` en fuentes cargadas por `http://` en una página servida por `https://`.
- Se vio contenido visible de prueba en la home (`home`, `test2`) que debe limpiarse en el sitio final.
- Se construyó la propuesta con:
  - análisis del stack actual
  - comparación estado actual vs propuesta
  - beneficios
  - pagos preparados
  - tutorial de demo
  - pricing con IGV incluido

## Pendientes

- Verificar que la propuesta se vea en la ruta pública o enlazarla si todavía no está expuesta.
- Si falta despliegue, ejecutar el build/deploy correspondiente.
- Terminar o pulir cualquier ajuste visual pendiente del CRM si el cliente necesita demo más pulida.
- Si se quiere, crear una versión plantilla reutilizable para otros leads con naming:
  - `codigo_de_propuesta+nombre_cliente+fecha(dd-mm-aa)`

## Nota para continuidad

- No volver a ofrecer hosting como parte de la propuesta comercial.
- Mantener el tono de la propuesta como plantilla de BlairCode para leads fríos.
- Si hay que seguir trabajando, priorizar exposición visible de la propuesta y pulido final del CRM demo.
