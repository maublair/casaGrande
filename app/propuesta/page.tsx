'use client';

import React from 'react';
import { Printer, Check, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

/* ============================================================================
   Propuesta técnica y económica — Hotel Boutique Casa Grande
   Estructura: plantilla oficial BlairCode (14 secciones, formato CMFB).
   Precio: S/ 850.00 incluido IGV — pago único, sin recurrencias.
   En este proyecto no se incluye hosting ni dominio dentro de la cotización base; si el cliente lo solicita, se cotiza aparte.
   ========================================================================== */

const TOTAL = 850;
const BASE = TOTAL / 1.18;
const IGV = TOTAL - BASE;

const stackActual = [
  ['CMS', 'WordPress 7.0 (con vulnerabilidades expuestas)'],
  ['Tema', 'Hello Elementor'],
  ['Constructor', 'Elementor + Elementor Pro (cruce pesado de scripts)'],
  ['Comercio / Pagos', 'WooCommerce 10.9.3 + Redirección manual externa a Izipay'],
  ['Plugins Detectados', 'Jetpack, Simply Schedule Appointments, Site Kit 1.182.0, All in One SEO 4.9.9'],
  ['JavaScript', 'jQuery + jQuery Migrate 3.4.1 (bloqueantes en primer render)'],
  ['Medicion', 'Google Analytics (inactivo/sin setear), Facebook Pixel, MonsterInsights'],
  ['Seguridad / Inyeccion', 'Div oculto absoluto con links de spam de casino (casinotest2.com)'],
];

const problemas = [
  ['Seguridad Crítica', 'Inyección de enlaces ocultos de spam de casino ("casinotest2.com") e indexación de páginas temporales de prueba.', 'Limpieza del CMS, auditoría de malware y desarrollo de front-end estático Next.js inmune a inyecciones de servidor.'],
  ['Pasarela de Pagos', 'Botones de pago que redirigen a sitios externos de Izipay (micuentaweb.pe) rompiendo la confianza y experiencia del usuario.', 'Integración fluida y transparente en el flujo interno de reserva del hotel.'],
  ['SEO Técnico', 'Meta descripción configurada genéricamente como "test2" y títulos de página con slugs internos expuestos (ej: "elementor-41" para Inicio).', 'Estructuración semántica real, Schema.org Hotel, sitemap automático y metadatos dinámicos.'],
  ['Rendimiento Web', 'Carga lenta debido al procesamiento simultáneo de múltiples hojas de estilo de plugins pesados y fuentes con carga insegura.', 'Arquitectura Jamstack con Next.js (carga instantánea en milisegundos).'],
  ['Autonomía del Menú', 'El menú del restaurante y las tarifas se muestran estáticos y son difíciles de actualizar para el personal.', 'Base de datos conectada en tiempo real administrable de forma visual y amigable.'],
];

const stackPropuesto = [
  ['Front publico', 'Next.js (React) estatico', 'Velocidad maxima, SEO tecnico completo (JSON-LD Hotel, sitemap, OG).'],
  ['CMS', 'WordPress headless', 'Hero, galeria, blog/noticias, habitaciones, menu del restaurante y ajustes.'],
  ['CRM hotelero', 'Modulo propio en wp-admin (sin plugins de pago)', 'Reservas, recepcion, limpieza, personal, turnos, almacen, finanzas y WhatsApp.'],
  ['Reservas', 'Motor propio con inventario por tipo', 'Disponibilidad real por fechas, anti-overbooking, estados y pagos.'],
  ['WhatsApp', 'Integracion YCloud (API oficial)', 'Formulario web, WhatsApp y chat directo en un solo inbox; respuesta automatica por reglas y respuesta manual.'],
  ['Pagos', 'Campos preparados: Izipay, Yape, Plin, transferencia', 'La reserva registra metodo y referencia; activacion con las credenciales del hotel.'],
  ['Imagenes', 'Mediateca de WordPress con texto alternativo', 'Seleccion por modal visual; SEO de imagenes cumplido.'],
];

const analisisConsola = [
  ['Métrica Lighthouse', 'Estado Actual (hotelcasagrande.pe)', 'Significado y Puntuación Óptima', 'Garantía BlairCode'],
  ['Rendimiento (Performance)', '42 / 100 (Crítico)', 'Mide la velocidad de carga y tiempo de respuesta interactiva. Óptimo: 90 a 100 (Verde). Menos de 50 ahuyenta a las visitas.', 'Superior a 95 / 100 (Carga instantánea en < 2 segundos).'],
  ['SEO (Posicionamiento)', '40 / 100 (Deficiente)', 'Optimización para indexación de Google. Óptimo: 90 a 100. Puntuación baja reduce visibilidad y reservas directas.', '100 / 100 (Títulos limpios, metadata estructurada Hotel).'],
  ['Buenas Prácticas (BP)', '50 / 100 (Riesgo)', 'Uso de tecnologías seguras y modernas. Óptimo: 90 a 100. Calificación baja expone al sitio a hackeos.', '100 / 100 (Headless aislado de vulnerabilidades).'],
  ['Accesibilidad (A11y)', 'Crítico / Navbar Duplicado', 'Diseño limpio y fácil navegación. En la web actual la barra de navegación (navbar) se duplica en varias partes y no se ve bien visualmente.', 'Superior a 95 / 100 (Contraste curado y diseño accesible de nivel premium).'],
  ['Seguridad (Malware)', 'Inyección de Casino Detectada', 'Integridad del código. Enlaces de spam inyectados deterioran el prestigio y SEO en lista negra de Google.', 'Seguridad total (Código estático inmune a inyecciones).'],
];

const comparativaPropuesta = [
  ['Carga inicial', 'Aproximadamente 12 s y con errores', 'Carga en menos de 3 s con front estatico'],
  ['Herramientas', 'Varias piezas separadas y licencias dispersas', 'Un solo software propio del hotel'],
  ['Mensualidades', 'Dependencia de herramientas externas', 'Sin mensualidades por herramientas ajenas'],
  ['Control operativo', 'Datos repartidos en plugins y paneles sueltos', 'CRM unico con recepcion, almacen y restaurante'],
  ['Personalizacion', 'Ajustes limitados por el constructor', 'Flujo adaptado a como maneja el hotel su negocio'],
  ['Habitaciones', 'Listado simple', 'Mapa vivo con ficha, reservas, inventario y mantenimiento'],
  ['Almacen', 'Tabla generica', 'Cards por categoria con filtros y trazabilidad'],
  ['Restaurante', 'Carta aislada', 'Pedidos, consumos y cargos a la reserva'],
  ['Finanzas', 'No consolida impuestos ni planilla', 'Ingresos, egresos, IGV, ESSALUD, renta y utilidad en vivo'],
  ['Turnos y limpieza', 'Reglas dispersas', 'Horario de turnos y ventanas de limpieza por ocupacion'],
];

const modulosCRM = [
  ['Dashboard', 'KPIs en vivo: ingresos, egresos, utilidad, IGV, ocupacion, ADR, RevPAR, WhatsApp; graficos de 6 meses.'],
  ['Recepcion', 'Llegadas y salidas del dia, reservas recientes con estado y pago.'],
  ['Reservas', 'Disponibilidad por fechas, gestion de estados (pendiente/confirmada/cancelada) y pagos (por pagar/parcial/pagado).'],
  ['Limpieza', 'Estado por habitacion (limpio, sucio, en limpieza, ocupado, mantenimiento), horarios para ocupadas y libres, y asignacion de personal.'],
  ['Personal y turnos', 'Equipo con roles y sueldos; turno con codigo unico de 4 letras, horario editable, mapa semanal/mensual e historial de asignaciones.'],
  ['Almacen', 'Inventario por categoria y por almacen; entradas, salidas, devoluciones, boletas internas, alertas de stock y notificaciones al administrador.'],
  ['Restaurante', 'Pedidos a habitaciones, recetas, consumos por SKU y cargos directos a la reserva.'],
  ['Finanzas', 'Ingresos, egresos, utilidad, IGV, ESSALUD, renta mensual/anual, planilla y movimientos del almacen calculados desde reservas, compras y boletas.'],
  ['Mensajes', 'Formulario web, WhatsApp y chat directo en cards; al abrir una conversacion se muestra la ficha del lead con historial, respuesta manual, archivos, links de pago y saludo automatico del bot.'],
  ['Chatbot', 'Personalizable desde el panel (nombre, color, saludo) y entrenable con conocimiento propio; responde con datos REALES: tarifas, disponibilidad, carta y horarios. Sin APIs de IA (S/0 mensual) y blindado: sanitizacion, limites y sin LLM que manipular.'],
];

const mapaSitio = [
  ['Inicio', 'Hero administrable, buscador de reservas, habitaciones, servicios, historia, testimonios, noticias, galeria, tour 360, contacto'],
  ['Nosotros', 'Historia real del hotel desde 1994, esencia y edificios'],
  ['Habitaciones', 'Tipos con fotos, precios, amenidades y disponibilidad real por fechas'],
  ['Servicios', 'Luna de miel, salas de reuniones (auditorio/escuela/U), catering y eventos'],
  ['Restaurante', 'Carta arequipena administrable desde WordPress (20 platos, 5 categorias)'],
  ['Galeria', 'Fotos reales por categorias, administradas desde la mediateca'],
  ['Blog / Noticias', 'Publicaciones desde WordPress, renderizadas en React con SEO'],
  ['Tour virtual 360', 'Recorrido 360 publico Kuula (version encontrada en internet y usada como referencia demo)'],
  ['Contacto', 'Formulario, WhatsApp, mapa de Google real'],
];

const requerimientos = [
  ['Panel de administracion', 'WordPress con CRM integrado y usuario de prueba con rol Gerente del Hotel.'],
  ['Reservas en linea', 'Motor propio con disponibilidad real, codigo de reserva y anti-overbooking (rechaza sin cupo).'],
  ['Noticias y novedades', 'Entradas de WordPress con imagen destacada; aparecen en el home y en /blog.'],
  ['Galeria administrable', 'Pagina moderna por categorias con miniaturas y formulario simple.'],
  ['Hero / promociones', 'Slides con imagen (modal visual), textos, boton opcional y activar/desactivar.'],
  ['Imagenes con SEO', 'Toda imagen en la mediateca con titulo y texto alternativo.'],
  ['WhatsApp centralizado', 'Inbox en el CRM con clasificacion por servicio, bot y respuesta manual.'],
  ['Turnos y limpieza', 'Turnos con hora de inicio/fin y horarios distintos para habitaciones ocupadas y liberadas.'],
  ['Contabilidad y finanzas reales', 'Ingresos, egresos, utilidad, IGV, ESSALUD, renta mensual/anual, planilla, almacen y restaurant, alimentados automaticamente.'],
  ['Almacen', 'Almacenes configurables por area y ubicacion, con movimientos, alertas y trazabilidad de entrada/salida/devolucion.'],
  ['Compatibilidad', 'Responsive completo: movil, tablet y escritorio.'],
];

const turnosOperativos = [
  ['Mañana', '06:00 - 14:00', 'Recepcion inicial, desayuno, housekeeping principal y control de salidas tempranas.'],
  ['Tarde', '14:00 - 22:00', 'Check-ins, refuerzo de limpieza de ocupadas, reposicion y soporte al huesped.'],
  ['Noche', '22:00 - 06:00', 'Auditoria, incidencias, seguridad y limpieza puntual silenciosa si hace falta.'],
  ['Configuracion', 'Editable en CRM', 'Los horarios se ajustan por temporada, ocupacion o politica interna del hotel.'],
];

const limpiezaOperativa = [
  ['Habitaciones ocupadas', '10:00 - 14:00', 'Limpieza ligera y orden sin invadir la estancia; coordinacion con el huesped.'],
  ['Habitaciones liberadas', '11:30 - 15:30', 'Limpieza completa post checkout, cambio de blancos y revision de amenities.'],
  ['Habitaciones vacias', '08:00 - 10:00', 'Repaso preventivo, ventilacion, control de inventario y preparacion para ingresos.'],
  ['Profunda / mantenimiento', '15:30 - 18:00', 'Intervenciones que requieren mas tiempo, detalle o ruido controlado.'],
];

const cronograma = [
  ['1', 'Diagnostico y preparacion', 'Revision del sitio actual, inventario de contenidos, estructura y accesos.', 'E1'],
  ['2', 'Implementacion base', 'WordPress headless + front Next.js con la identidad del hotel; carga de contenido real.', 'E2'],
  ['3', 'Contenido y medios', 'Fotos reales en la mediateca con SEO, galeria, hero, noticias, habitaciones y carta.', 'E2'],
  ['4', 'CRM y WhatsApp', 'Modulos operativos, KPIs, usuario de prueba del hotel, conexion YCloud lista para credenciales.', 'E3'],
  ['5', 'Produccion y entrega', 'Pruebas, puesta en produccion en el hosting del cliente, capacitacion via Google Meet y manual.', 'E4/E5'],
];

const entregables = [
  ['E1', 'Diagnostico y plan de trabajo', 'Dia 1'],
  ['E2', 'Sitio publico funcional con contenido real y SEO', 'Dia 3'],
  ['E3', 'CRM hotelero operativo + WhatsApp listo para credenciales', 'Dia 4'],
  ['E4', 'Puesta en produccion en el hosting del cliente', 'Dia 5'],
  ['E5', 'Capacitacion via Google Meet, manual de uso y entrega de accesos', 'Dia 5'],
];

const presupuesto = [
  ['1', 'Sitio web premium (Next.js) con contenido real del hotel'],
  ['2', 'WordPress headless: hero, galeria, noticias, habitaciones, carta y ajustes'],
  ['3', 'CRM hotelero: recepcion, reservas, limpieza, personal, turnos, almacen, finanzas con IGV, ESSALUD y renta'],
  ['4', 'Motor de reservas con disponibilidad real y anti-overbooking'],
  ['5', 'WhatsApp/YCloud: inbox, bot por reglas y respuesta manual (configuracion incluida)'],
  ['6', 'Pagos de reserva preparados: Izipay, Yape, Plin, transferencia'],
  ['7', 'Mediateca con fotos reales optimizadas y texto alternativo (SEO)'],
  ['8', 'SEO tecnico: JSON-LD Hotel, sitemap, robots, Open Graph'],
  ['9', 'Instalacion y puesta en produccion en el hosting del cliente'],
  ['10', 'Capacitacion via Google Meet, manual de uso y soporte de garantia por 90 dias'],
];

const beneficiosChannelManager = [
  ['Eje de Beneficio', 'Funcionamiento con el CRM Propuesto', 'Impacto y Retorno Sostenible en el Tiempo'],
  ['Curva de aprendizaje', 'Centralización absoluta. Todo el personal opera desde una única interfaz local (WordPress) que ya conocen. Las reservas externas (Booking, Expedia) e internas se muestran ordenadas en una sola pantalla.', 'Simplificación total de procesos. No requiere entrenar al equipo en 5 extranets diferentes ni memorizar contraseñas ni paneles complejos. Una capacitación de 1 hora basta.'],
  ['Beneficio operativo', 'Sincronización automática de inventarios en tiempo real. Cuando ingresa una reserva web o física, el CRM cierra automáticamente el cupo en los canales de venta externos; y viceversa.', 'Elimina los errores humanos de digitación, evita el riesgo de overbooking (sobreventa) de habitaciones y la necesidad de monitorear o hacer cierres manuales de madrugada.'],
  ['Beneficio económico', 'Eliminación de comisiones intermedias en el software desarrollado a medida. El hotel solo cubre la suscripción básica del proveedor técnico elegido.', 'Ahorro sustancial frente a costosos PMS hoteleros. Facilita la venta directa y permite competir cara a cara en Google Hotel Ads listando la web propia con la etiqueta de "Sitio Oficial".'],
];

const opcionales = [
  ['Pasarela de pago en vivo (cobro online real)', 'Configuración técnica incluida en el desarrollo. Nota: La pasarela elegida (Izipay, Culqi, Niubiz, etc.) cobra comisiones directas por transacción y retiro (varía según el proveedor).'],
  ['Channel manager (Booking, Expedia)', 'Opcional (cotizado según proveedor externo). Centraliza y sincroniza en tiempo real las habitaciones ocupadas en Booking, Expedia, Airbnb y la web propia para evitar sobreventa (overbooking).'],
  ['Mantenimiento mensual continuo posterior a la garantía', 'Desde S/ 120.00 mensual (puede incluir soporte reactivo, copias de seguridad y actualizaciones de seguridad).'],
  ['Funcionalidades adicionales a pedido', 'Conversable y cotizado a medida según el alcance solicitado.'],
];

const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mb-10 print:mb-6 break-inside-avoid">
    <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">{n}. {title}</h2>
    {children}
  </section>
);

const Tabla = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto my-4 rounded-xl border border-slate-200/80 shadow-sm">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-900 text-slate-100 font-bold border-b border-amber-500/80">
          {head.map((h, idx) => (
            <th key={h} className={`p-3 text-left font-semibold tracking-wide ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === head.length - 1 ? 'rounded-tr-xl' : ''}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50/80 transition-colors duration-150 odd:bg-slate-50/20">
            {r.map((c, j) => (
              <td key={j} className={`p-3 align-top leading-relaxed ${j === 0 ? 'font-semibold text-slate-900 bg-slate-50/40 w-1/4' : ''}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function PropuestaPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-3xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border-none print:p-0 [&>*]:relative [&>*]:z-10">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600 print:hidden" />

        {/* Sello de agua (logo) — no estorba la lectura */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <img src="/logo-bcode.png" alt="" className="w-[420px] max-w-[70%] opacity-[0.05] rotate-[-12deg]" />
        </div>

        {/* Franja superior del template */}
        <div className="relative z-10 flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2.5 mb-6 bg-white/80">
          <img src="/logo-bcode.png" alt="BlairCode" className="h-[72px] object-contain" />
          <span className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">Propuesta Tecnica y Economica – 2026</span>
        </div>

        {/* Encabezado */}
        <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 mb-8 sm:flex-row sm:items-start sm:justify-between print:mb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] text-blue-600 uppercase">BlairCode AI · B&D Co S.A.C.</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-light mt-2 text-slate-900">Propuesta Tecnica y Economica</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              Servicio de rediseno, implementacion, puesta en produccion y soporte tecnico de la plataforma web
              y CRM hotelero del Hotel Boutique Casa Grande — Arequipa.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-all print:hidden"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>

        {/* Metadatos */}
        <section className="grid sm:grid-cols-2 gap-4 text-sm mb-4 print:mb-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Presentado a</span><strong className="text-slate-900">Hotel Boutique Casa Grande (Arequipa, Peru)</strong></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Presentado por</span><span className="text-slate-700">BlairCode AI · B&D Co S.A.C. — Soluciones Digitales, Arequipa</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">R.U.C.</span><span className="text-slate-700">20614096561 · www.blaircode.com · Mauricio Blair</span></div>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2">
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Codigo de propuesta</span><span className="font-mono font-bold">20260706-CASAGRANDE-001</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Fecha</span><span>06 de julio del 2026 · Validez: 30 dias naturales</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Demo en vivo</span><span className="text-orange-400 font-semibold">casagrande.bcode.work</span></div>
          </div>
        </section>
        <p className="text-xs text-slate-400 mb-8">Documento confidencial para evaluacion del cliente. Propuesta de pago unico: no genera cobros recurrentes.</p>

        <Sec n="1" title="Resumen ejecutivo">
          <p className="text-slate-600 leading-relaxed text-sm mb-3">
            BlairCode AI · B&D Co S.A.C. presenta esta propuesta para el rediseño, desarrollo y puesta en
            producción del nuevo ecosistema digital del <strong>Hotel Boutique Casa Grande</strong>: un portal web premium de alta
            velocidad (React/Next.js) gestionado desde <strong>WordPress Headless</strong>, complementado con un <strong>CRM hotelero</strong> completo
            dentro del propio panel de control que integra recepción, reservas, inventario, restaurante, finanzas y mensajería de WhatsApp.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            Hemos realizado una auditoría técnica externa e independiente de su portal web actual (<strong>hotelcasagrande.pe</strong>) para identificar
            cuellos de botella y oportunidades críticas en rendimiento, SEO y seguridad, y hemos preparado una demostración funcional en <strong>casagrande.bcode.work</strong> para ilustrar el salto en calidad, velocidad y autonomía operativa que proponemos.
          </p>
        </Sec>

        <Sec n="2" title="Alcance general del servicio">
          <ul className="grid sm:grid-cols-2 gap-3 text-slate-600 text-sm">
            {[
              'Rediseno visual premium, responsivo y con la identidad del hotel.',
              'Sitio publico veloz (Next.js) + WordPress headless como centro de contenido.',
              'CRM hotelero completo dentro de wp-admin (8 modulos operativos).',
              'Motor de reservas propio con disponibilidad real y anti-overbooking.',
              'Chatbot entrenado con los datos reales del hotel, SIN APIs de IA: S/0 de costo mensual e inmune a prompt injection.',
              'Mensajeria unificada: chat de la web y WhatsApp en un solo panel de cards con ficha de lead.',
              'Respuesta manual con envio de archivos y links de pago (Yape, Plin, Izipay) en un clic.',
              'Tutorial integrado en cada seccion del sistema (modal de ayuda) + guia completa.',
              'Fotos reales en la mediateca con texto alternativo (SEO de imagenes).',
              'Capacitacion, manual de uso y 90 dias de garantia y soporte tecnico.',
              'Instalacion en el hosting que el cliente contrate (hosting y dominio no incluidos).',
            ].map(t => (
              <li key={t} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{t}</span>
              </li>
            ))}
          </ul>
        </Sec>

        <Sec n="3" title="Diagnostico del sitio web actual">
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">3.1 Tecnologia y componentes detectados</h3>
          <div className="mb-5"><Tabla head={['Componente', 'Detectado']} rows={stackActual} /></div>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">3.2 Contenido existente a conservar</h3>
          <p className="text-sm text-slate-600 mb-5">
            Identidad visual y logotipo, textos institucionales (historia desde 1994), tipos de habitacion y tarifas,
            fotografias del hotel, datos de contacto (Av. Luna Pizarro 202, Vallecito) y redes sociales. Todo el contenido
            vigente se migra depurado; los textos de prueba se eliminan.
          </p>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">3.3 Problemas identificados y accion propuesta</h3>
          <Tabla head={['Area', 'Problema observado', 'Accion propuesta']} rows={problemas} />
          <h3 className="font-semibold text-slate-950 mt-6 mb-2 text-sm">3.4 Analisis de consola y rendimiento</h3>
          <Tabla head={['Metrica', 'Actual', 'Hallazgo', 'Respuesta propuesta']} rows={analisisConsola} />
        </Sec>

        <Sec n="4" title="Propuesta tecnica">
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.1 Enfoque de implementacion</h3>
          <p className="text-sm text-slate-600 mb-5">
            Se implementa una arquitectura headless: el visitante navega un sitio estatico ultrarrapido (React/Next.js),
            mientras el personal del hotel administra todo desde WordPress. Se desarrolla y valida en un entorno de demostracion
            (ya operativo, alojado en nuestros servidores de trabajo) y se publica en produccion en el hosting del cliente sin cortes de servicio.
            En el hosting final la entrega queda mas liviana y rapida para el usuario.
          </p>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.2 Stack tecnologico propuesto</h3>
          <div className="mb-5"><Tabla head={['Componente', 'Herramienta', 'Uso en el proyecto']} rows={stackPropuesto} /></div>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.3 Decision tecnica para el hero y las promociones</h3>
          <p className="text-sm text-slate-600 mb-5">
            El hero del home se administra desde WordPress como slides con imagen (elegida en un modal visual de la mediateca),
            titulo, subtitulo y boton opcional. Para lanzar una promocion basta crear un slide y activarlo; al terminar, se desactiva.
            Sin plugins de sliders pesados: carga instantanea y sin licencias adicionales. Si el cliente prefiere formulario, WhatsApp o chat web, el sistema lo expone directo en la misma experiencia.
          </p>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.4 Modulos del CRM hotelero</h3>
          <div className="mb-2"><Tabla head={['Modulo', 'Funcion']} rows={modulosCRM} /></div>
          <p className="text-xs text-slate-500">Referencia funcional: sistemas PMS hoteleros (front desk, housekeeping, inventario, restaurante y reportes) implementados a la medida, sin licencias mensuales de terceros.</p>
          <h3 className="font-semibold text-slate-950 mt-6 mb-2 text-sm">4.5 Turnos y limpieza operativa</h3>
          <div className="grid lg:grid-cols-2 gap-5 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Turnos con horario fijo editable</p>
              <Tabla head={['Turno', 'Horario', 'Uso operativo']} rows={turnosOperativos} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Ventanas de limpieza por ocupacion</p>
              <Tabla head={['Estado de habitacion', 'Horario', 'Criterio']} rows={limpiezaOperativa} />
            </div>
          </div>
          <h3 className="font-semibold text-slate-950 mt-6 mb-2 text-sm">4.6 Comparativa directa: hoy vs propuesta</h3>
          <Tabla head={['Area', 'Sitio actual', 'Propuesta BlairCode']} rows={comparativaPropuesta} />
          
          <h3 className="font-semibold text-slate-950 mt-6 mb-2 text-sm">4.7 Integración estratégica con Channel Manager ( Booking, Expedia y Google )</h3>
          <p className="text-sm text-slate-600 mb-4">
            El <strong>Channel Manager</strong> actúa como un traductor universal de inventarios. En lugar de crear conexiones individuales y complejas para cada agencia de viaje (Booking.com, Expedia, Airbnb, Agoda, etc.), programamos un <strong>único conector bidireccional centralizado</strong> desde nuestro CRM hacia un Channel Manager aliado (como <em>Channex, WuBook o MyAllocator</em>). La suite unifica la operación bajo el siguiente esquema coordinado:
          </p>
          <Tabla head={['Eje de Beneficio', 'Funcionamiento con el CRM Propuesto', 'Impacto y Retorno Sostenible en el Tiempo']} rows={beneficiosChannelManager} />
        </Sec>

        <Sec n="5" title="Arquitectura de informacion propuesta">
          <Tabla head={['Seccion', 'Contenido']} rows={mapaSitio} />
        </Sec>

        <Sec n="6" title="Requerimientos funcionales cubiertos">
          <Tabla head={['Requerimiento', 'Solucion implementada']} rows={requerimientos} />
        </Sec>

        <Sec n="7" title="Seguridad, accesibilidad, rendimiento y datos">
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-500" /> Seguridad</h3>
              <ul className="space-y-1.5">
                <li>• Todo el trafico por HTTPS (se elimina el mixed content actual).</li>
                <li>• Usuario de administracion del hotel con rol restringido: sin acceso a plugins, temas, codigo, usuarios ni exportaciones.</li>
                <li>• El publico navega un sitio estatico: superficie de ataque minima.</li>
                <li>• Reservas validadas en servidor (anti-overbooking, sanitizacion).</li>
                <li>• Plugins, formularios y conectores de correo se auditan para evitar spam, abuso o filtraciones.</li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-500" /> Rendimiento y SEO</h3>
              <ul className="space-y-1.5">
                <li>• Front estatico: carga en milisegundos, sin base de datos por visita.</li>
                <li>• Imagenes WebP optimizadas con texto alternativo (SEO).</li>
                <li>• Datos estructurados schema.org/Hotel, sitemap, robots y Open Graph.</li>
                <li>• Los datos del formulario y reservas llegan solo al hotel; no se comparten con terceros.</li>
                <li>• Se corrigen slugs temporales, titulos de prueba y contenido duplicado para elevar el SEO real.</li>
              </ul>
            </div>
          </div>
        </Sec>

        <Sec n="8" title="Alojamiento web y dominio (cotizable)">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-900/90 space-y-2">
            <p><strong>En este proyecto no estamos incluyendo hosting ni dominio dentro de la cotizacion base</strong>; si el cliente desea que lo gestionemos, lo cotizamos aparte sin problema. El hotel puede contratarlo por su cuenta o usar lo que ya tenga y mantiene el control total.</p>
            <p><strong>Incluido en el precio:</strong> asesoria para elegir el plan adecuado, instalacion completa y puesta en produccion en ese hosting.</p>
            <p><strong>Requisitos minimos del hosting:</strong> PHP 8.2+, MySQL/MariaDB, SSL incluido (los planes compartidos estandar en Peru los cumplen).</p>
            <p><strong>Nota critica:</strong> antes de cualquier cambio de DNS validamos los registros MX/SPF/DKIM para que el correo corporativo del hotel no sufra ninguna interrupcion.</p>
          </div>
        </Sec>

        <Sec n="9" title="Plan de trabajo y cronograma">
          <p className="text-sm text-slate-600 mb-3">Plazo total: <strong>5 dias habiles</strong> desde la confirmacion y entrega de accesos.</p>
          <Tabla head={['Dia', 'Etapa', 'Actividades', 'Entregable']} rows={cronograma} />
        </Sec>

        <Sec n="10" title="Entregables">
          <Tabla head={['Entregable', 'Contenido', 'Plazo']} rows={entregables} />
        </Sec>

        <Sec n="11" title="Propuesta economica">
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">11.1 Presupuesto detallado del servicio</h3>
          <div className="mb-5"><Tabla head={['Item', 'Descripcion']} rows={presupuesto} /></div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-5 print:bg-white print:text-slate-900 print:border print:border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Inversion unica del proyecto</p>
              <h3 className="text-3xl font-light mt-1 font-serif print:text-2xl">Web premium + CRM hotelero</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md">
                Pago unico. Sin mensualidades, sin licencias de terceros, sin cobros recurrentes de BlairCode.
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-xs text-slate-400 block uppercase font-bold">Total (incluye IGV)</span>
              <span className="text-4xl font-extrabold text-orange-500 font-serif block mt-1 print:text-3xl">S/ {TOTAL.toFixed(2)}</span>
              <span className="text-xs text-slate-400 block mt-1">Valor venta: S/ {BASE.toFixed(2)} + IGV 18%: S/ {IGV.toFixed(2)}</span>
              <span className="text-xs text-slate-400 block mt-1">Entrega: 5 dias habiles · Garantia: 90 dias</span>
            </div>
          </div>

          <h3 className="font-semibold text-slate-950 mb-2 text-sm">11.2 WhatsApp con YCloud — atencion sin costo</h3>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-sm text-emerald-900/90 mb-5 space-y-2">
            <p>Ofrecemos la <strong>configuracion gratuita</strong> de la linea de WhatsApp del hotel con YCloud (API oficial de WhatsApp Business) y su uso para <strong>responder manualmente desde el CRM</strong> los mensajes que llegan.</p>
            <p>Responder dentro de la <strong>ventana de servicio de WhatsApp</strong> (que se renueva con cada mensaje del cliente y puede cambiar segun las normativas de Meta/Facebook/WhatsApp) <strong>no tiene costo por mensaje</strong>. Fuera de esa ventana, WhatsApp exige plantillas pagadas — el CRM lo indica en cada conversacion para que el equipo siempre sepa cuando responder gratis.</p>
            <p>El bot de respuesta automatica por reglas (sin IA, sin costos de terceros) atiende consultas frecuentes de todos los servicios: reservas, restaurante, catering y eventos.</p>
          </div>

          <h3 className="font-semibold text-slate-950 mb-2 text-sm">11.3 Opcionales no incluidos (conversables)</h3>
          <div className="mb-5"><Tabla head={['Opcional', 'Costo referencial']} rows={opcionales} /></div>

          <h3 className="font-semibold text-slate-950 mb-2 text-sm">11.4 Condiciones economicas</h3>
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li>• Pago unico de S/ 850.00 (incluye IGV). Sin pagos recurrentes de ningun tipo.</li>
            <li>• El precio es el mismo con o sin migracion de contenido del sitio actual.</li>
            <li>• Hosting y dominio no estan dentro de la cotizacion base, pero se pueden cotizar aparte si el cliente lo pide.</li>
            <li>• Cambios estructurales posteriores a la conformidad final se cotizan por separado.</li>
            <li>• Garantia y soporte tecnico por 90 dias calendario desde la puesta en produccion.</li>
            <li>• Capacitacion final por Google Meet y acta de recepcion con conformidad de uso.</li>
          </ul>
        </Sec>

        <Sec n="12" title="Propiedad intelectual y entrega de accesos">
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li>• Todos los disenos, contenidos, base de datos y configuraciones desarrollados para el hotel se entregan al cliente al finalizar el servicio.</li>
            <li>• No se utilizan plugins, plantillas ni recursos sin licencia valida; la solucion no depende de licencias de pago de terceros.</li>
            <li>• Los accesos administrativos (WordPress, hosting, backups) se entregan documentados al concluir.</li>
            <li>• BlairCode no conserva credenciales del hotel despues de culminado el servicio, salvo autorizacion expresa.</li>
          </ul>
        </Sec>

        <Sec n="13" title="Conclusión">
          <p className="text-sm text-slate-600 mb-8">
            Esta propuesta esta pensada para dejar al hotel con una plataforma mas rapida, mas clara y mas suya: un sitio que
            responde mejor, un CRM que ordena el dia a dia y una forma de trabajo que evita depender de piezas sueltas o
            mensualidades innecesarias. Partimos de un analisis tecnico del portal actual como linea base de mejora y entregamos con
            metricas visibles, procesos trazables y una operacion que se siente ordenada desde el primer uso.
          </p>
          <p className="text-sm text-slate-600 mb-8">
            La demo que mostramos ya funciona; la entrega final sigue esa misma logica, pero ajustada a la operacion real del hotel,
            con el respaldo tecnico y la documentacion necesaria para que el traspaso sea limpio, util y sostenible en el tiempo.
          </p>
          <p className="text-sm text-slate-500 mb-10">Arequipa, 06 de julio del 2026</p>

          <div>
            <div>
              <div className="border-b border-slate-300 w-96 max-w-full mb-3 pb-1">
                <img src="/firma-mauricio-blair.png" alt="Firma de Mauricio Blair Farah" className="h-40 object-contain" />
              </div>
              <p className="text-sm font-bold text-slate-900">Mauricio Blair Farah</p>
              <p className="text-xs text-slate-500">BlairCode AI · B&D Co S.A.C.</p>
              <p className="text-xs text-slate-400">CE N.° 000925350 | RUC N.° 20614096561</p>
            </div>
          </div>
        </Sec>

        <Sec n="14" title="Forma de pago, factura y soporte">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-600 space-y-2">
            <p>• Se emite factura detallada del proyecto.</p>
            <p>• Pago de <strong>50% de adelanto</strong> para iniciar trabajos.</p>
            <p>• <strong>50% restante</strong> contra entrega y conformidad de recepcion del proyecto.</p>
            <p>• La garantia y soporte posterior a la entrega cubren <strong>90 dias</strong> calendario.</p>
            <p>• La capacitacion final se realiza por <strong>Google Meet</strong>, con manual y acceso documentado.</p>
          </div>
        </Sec>

        <div className="border border-slate-300 mt-10 grid sm:grid-cols-2 text-xs text-slate-500">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-slate-300 flex items-center gap-2">
            <img src="/logo-bcode.png" alt="" className="h-9 object-contain" />
            <span>BlairCode AI · B&D Co S.A.C. | www.blaircode.com<br />R.U.C.: 20614096561</span>
          </div>
          <div className="p-3 flex items-center justify-end gap-1 text-right">
            <FileText className="w-3.5 h-3.5" /> Pagina | Confidencial — Casa Grande
          </div>
        </div>
      </div>
    </div>
  );
}
