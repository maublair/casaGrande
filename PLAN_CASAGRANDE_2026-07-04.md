# Plan Casa Grande — CRM hotelero completo + propuesta S/850 (2026-07-04)

## Contexto
Demo para Hotel Boutique Casa Grande (Arequipa): front Next.js estático + WordPress headless
(CMS + CRM). Otra sesión avanzó mu-plugins (crm, crm-ui, headless) y la propuesta; esta sesión
audita, repara y completa. El túnel (Error 1033) ya fue restaurado.

## Decisiones comerciales (propuesta)
- Precio único: **S/ 850.00 incluido IGV**. Sin pagos recurrentes.
- **No incluye hosting ni dominio** (decisión registrada: no ofrecer hosting comercial).
  Instalamos en el hosting que el cliente contrate; asesoría de compra incluida.
- Entrega: 5 días hábiles. Garantía y soporte técnico: 90 días.
- WhatsApp: configuración YCloud **gratuita**; respuestas manuales desde el CRM dentro de la
  ventana de servicio de WhatsApp (24 h renovables con cada mensaje del cliente — el cliente
  pidió "48h", se aclara en la propuesta la ventana real para no sobre-prometer).
- Funcionalidades extra: conversables (no incluidas).
- Template: Google Doc CMFB (14 secciones) con firma de Mauricio Blair al final.
  El mismo template debe quedar registrado en RNA y SIA.

## Fases
1. **Auditoría** de mu-plugins y front modificados por la otra sesión; lint; detectar rupturas.
2. **Reparación**: lo que "no funciona" (build sin desplegar, endpoints, wp-admin).
3. **Usuario demo limitado**: admin-hotel (rol cg_hotel) sin acceso a código/plugins/temas/
   usuarios/export — solo administra el hotel. Card de acceso en login (ya existe) se conserva.
4. **Media WP**: importar fotos reales a la mediateca con ALT/título (SEO); selector de imagen
   por **modal nativo wp.media** en slides/galería/habitaciones (nada de rutas a mano);
   página Galería moderna por categorías con miniaturas + formulario simple.
5. **Noticias**: sección en home (últimos posts), administrable desde wp-admin (posts + media).
6. **Servicios**: corregir imágenes equivocadas (sala de reuniones con foto de dormitorio).
7. **CRM hotelero completo** (referencia PMS: front desk, housekeeping, turnos, almacén,
   contabilidad, KPIs): pulir + añadir KPIs hoteleros (ocupación, ADR, RevPAR, llegadas/salidas hoy).
8. **Propuesta** `/propuesta` según template CMFB con los términos de arriba.
9. **Deploy**: build estático, deploy, verificación live, commits incrementales.
10. **Registro**: RNA/SIA (template), bitácora, memoria, screenshots.
