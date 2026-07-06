'use client';

import React from 'react';
import { Printer, Check, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

/* ============================================================================
   Propuesta técnica y económica — Hotel Boutique Casa Grande
   Estructura: plantilla oficial BlairCode (14 secciones, formato CMFB).
   Precio: S/ 850.00 incluido IGV — pago único, sin recurrencias.
   Para este proyecto no se considera hosting ni dominio en la tarifa base; a pedido del cliente se cotiza aparte.
   ========================================================================== */

const TOTAL = 850;
const BASE = TOTAL / 1.18;
const IGV = TOTAL - BASE;

const stackActual = [
  ['CMS', 'WordPress 7.0'],
  ['Tema', 'Hello Elementor'],
  ['Constructor', 'Elementor + Elementor Pro'],
  ['Comercio', 'WooCommerce'],
  ['Plugins', 'Jetpack, WhatsApp chat, Site Kit 1.181.0, All in One SEO 4.9.8'],
  ['JavaScript', 'jQuery + jQuery Migrate 3.4.1'],
  ['Medicion', 'Cloudflare Browser Insights, Kount, Facebook Pixel'],
  ['Tipografia', 'Cinzel Decorative (fuentes con carga insegura)'],
];

const problemas = [
  ['Seguridad', 'Errores de Mixed Content: fuentes servidas por http:// dentro de una pagina https://; el navegador las bloquea.', 'Servir todos los recursos por HTTPS y depurar fuentes.'],
  ['Contenido', 'Textos de prueba visibles en la home ("home", "test2").', 'Depuracion de contenido antes de publicar.'],
  ['Operacion', 'Reservas y pagos fragmentados; sin CRM ni panel operativo.', 'CRM hotelero integrado en WordPress.'],
  ['Autonomia', 'Cambios visuales dependen de terceros o de conocer el constructor.', 'Hero, galeria, noticias y habitaciones editables con selector visual de imagenes.'],
  ['Rendimiento', 'Multiples plugins y constructores cargando en cada pagina.', 'Front estatico Next.js: carga en milisegundos, WordPress solo administra.'],
];

const stackPropuesto = [
  ['Front publico', 'Next.js (React) estatico', 'Velocidad maxima, SEO tecnico completo (JSON-LD Hotel, sitemap, OG).'],
  ['CMS', 'WordPress headless', 'Hero, galeria, blog/noticias, habitaciones, menu del restaurante y ajustes.'],
  ['CRM hotelero', 'Modulo propio en wp-admin (sin plugins de pago)', 'Reservas, recepcion, limpieza, personal, turnos, almacen, finanzas y WhatsApp.'],
  ['Reservas', 'Motor propio con inventario por tipo', 'Disponibilidad real por fechas, anti-overbooking, estados y pagos.'],
  ['WhatsApp', 'Integracion YCloud (API oficial)', 'Inbox en el CRM, respuesta automatica por reglas y respuesta manual.'],
  ['Pagos', 'Campos preparados: Izipay, Yape, Plin, transferencia', 'La reserva registra metodo y referencia; activacion con las credenciales del hotel.'],
  ['Imagenes', 'Mediateca de WordPress con texto alternativo', 'Seleccion por modal visual; SEO de imagenes cumplido.'],
];

const analisisConsola = [
  ['Perf', '62', 'Carga reportada de 12068 ms y LCP 8.9 s.', 'Front estatico, eliminacion de recursos pesados y optimizacion de imagenes.'],
  ['SEO', '100', 'Meta description muy corta.', 'Redaccion SEO completa, schema Hotel y snippets claros.'],
  ['A11y', '93', '5/5 imagenes sin alt.', 'Alt text en toda la mediateca y piezas editoriales.'],
  ['BP', '69', '12 errores de consola y 12 requests fallidos.', 'Depuracion de mixed content, scripts y assets rotos.'],
  ['LCP', '8.9 s', 'Demasiado alto para conversion hotelera.', 'Hero estatico rapido y contenido precargado.'],
  ['CLS', '0', 'Sin saltos visuales relevantes.', 'Se conserva la estabilidad visual actual.'],
  ['TBT', '20 ms', 'Bloqueo de interaccion bajo.', 'Se mantiene y mejora con menos JS.'],
  ['Problema clave', 'Mixed Content', 'Fuentes bloqueadas por http:// en una pagina https://.', 'Servir todo por HTTPS y limpiar fuentes inseguros.'],
  ['Impresion general', 'Lento y friccionado', 'La pagina carga cerca de 12 s y rompe funciones.', 'Reducir CSS/JS no usado y optimizar la entrega.'],
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
];

const modulosCRM = [
  ['Dashboard', 'KPIs en vivo: ingresos, egresos, utilidad, IGV, ocupacion, ADR, RevPAR, WhatsApp; graficos de 6 meses.'],
  ['Recepcion', 'Llegadas y salidas del dia, reservas recientes con estado y pago.'],
  ['Reservas', 'Disponibilidad por fechas, gestion de estados (pendiente/confirmada/cancelada) y pagos (por pagar/parcial/pagado).'],
  ['Limpieza', 'Estado por habitacion (limpio, sucio, en limpieza, ocupado, mantenimiento) y asignacion de personal.'],
  ['Personal y turnos', 'Equipo con roles y sueldos; turnos manana/tarde/noche por dia.'],
  ['Almacen', 'Inventario de hotel, restaurante y catering; entradas/salidas; alertas de stock minimo.'],
  ['Restaurante', 'Pedidos a habitaciones, recetas, consumos por SKU y cargos directos a la reserva.'],
  ['Finanzas', 'Ingresos, egresos, utilidad e IGV estimado calculados solos desde reservas, compras y planilla.'],
  ['Mensajes', 'WhatsApp + chat web en cards; al abrir una conversacion se muestra la ficha del lead con historial, respuesta manual, archivos y links de pago.'],
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
  ['Tour virtual 360', 'Recorrido Kuula integrado'],
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
  ['Contabilidad basica', 'Ingresos, egresos, impuestos y utilidad, alimentados automaticamente.'],
  ['Almacen', 'Tres areas (hotel, restaurante, catering) con movimientos y alertas.'],
  ['Compatibilidad', 'Responsive completo: movil, tablet y escritorio.'],
];

const cronograma = [
  ['1', 'Diagnostico y preparacion', 'Revision del sitio actual, inventario de contenidos, estructura y accesos.', 'E1'],
  ['2', 'Implementacion base', 'WordPress headless + front Next.js con la identidad del hotel; carga de contenido real.', 'E2'],
  ['3', 'Contenido y medios', 'Fotos reales en la mediateca con SEO, galeria, hero, noticias, habitaciones y carta.', 'E2'],
  ['4', 'CRM y WhatsApp', 'Modulos operativos, KPIs, usuario de prueba del hotel, conexion YCloud lista para credenciales.', 'E3'],
  ['5', 'Produccion y entrega', 'Pruebas, puesta en produccion en el hosting del cliente, capacitacion y manual.', 'E4/E5'],
];

const entregables = [
  ['E1', 'Diagnostico y plan de trabajo', 'Dia 1'],
  ['E2', 'Sitio publico funcional con contenido real y SEO', 'Dia 3'],
  ['E3', 'CRM hotelero operativo + WhatsApp listo para credenciales', 'Dia 4'],
  ['E4', 'Puesta en produccion en el hosting del cliente', 'Dia 5'],
  ['E5', 'Capacitacion, manual de uso y entrega de accesos', 'Dia 5'],
];

const presupuesto = [
  ['1', 'Sitio web premium (Next.js) con contenido real del hotel'],
  ['2', 'WordPress headless: hero, galeria, noticias, habitaciones, carta y ajustes'],
  ['3', 'CRM hotelero: recepcion, reservas, limpieza, personal, turnos, almacen, finanzas'],
  ['4', 'Motor de reservas con disponibilidad real y anti-overbooking'],
  ['5', 'WhatsApp/YCloud: inbox, bot por reglas y respuesta manual (configuracion incluida)'],
  ['6', 'Pagos de reserva preparados: Izipay, Yape, Plin, transferencia'],
  ['7', 'Mediateca con fotos reales optimizadas y texto alternativo (SEO)'],
  ['8', 'SEO tecnico: JSON-LD Hotel, sitemap, robots, Open Graph'],
  ['9', 'Instalacion y puesta en produccion en el hosting del cliente'],
  ['10', 'Capacitacion, manual de uso y soporte de garantia por 90 dias'],
];

const opcionales = [
  ['Pasarela de pago en vivo (cobro online real)', 'Cotizacion segun pasarela elegida'],
  ['Channel manager (Booking, Expedia)', 'Cotizacion segun proveedor'],
  ['Mantenimiento mensual continuo posterior a la garantia', 'Desde S/ 120.00 mensual (puede incluir cambios y mejoras segun alcance y costo)'],
  ['Funcionalidades adicionales a pedido', 'Conversable segun alcance'],
];

const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mb-10 print:mb-6 break-inside-avoid">
    <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">{n}. {title}</h2>
    {children}
  </section>
);

const Tabla = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border border-slate-300 border-collapse">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          {head.map(h => <th key={h} className="p-2.5 border border-slate-300 text-center">{h}</th>)}
        </tr>
      </thead>
      <tbody className="text-slate-600">
        {rows.map((r, i) => (
          <tr key={i} className={i % 2 ? 'bg-slate-50/60' : ''}>
            {r.map((c, j) => <td key={j} className={`p-2.5 border border-slate-300 align-top ${j === 0 ? 'font-semibold text-slate-950' : ''}`}>{c}</td>)}
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
          <img src="/logo-bcode.png" alt="BlairCode" className="h-9 object-contain" />
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
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Codigo de propuesta</span><span className="font-mono font-bold">20260704-CASAGRANDE-001</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Fecha</span><span>Julio 2026 · Validez: 30 dias naturales</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Demo en vivo</span><span className="text-orange-400 font-semibold">casagrande.bcode.work</span></div>
          </div>
        </section>
        <p className="text-xs text-slate-400 mb-8">Documento confidencial para evaluacion del cliente. Propuesta de pago unico: no genera cobros recurrentes.</p>

        <Sec n="1" title="Resumen ejecutivo">
          <p className="text-slate-600 leading-relaxed text-sm mb-3">
            BlairCode AI · B&D Co S.A.C. presenta esta propuesta para ejecutar el rediseno, implementacion y puesta en
            produccion de la nueva plataforma digital del <strong>Hotel Boutique Casa Grande</strong>: un sitio web premium de alta
            velocidad (React/Next.js) administrado desde <strong>WordPress</strong>, mas un <strong>CRM hotelero</strong> completo dentro del propio
            wp-admin que centraliza reservas, recepcion, limpieza, personal, turnos, almacen, finanzas y WhatsApp.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            Todo esta conectado y es automatico: las reservas pagadas alimentan los ingresos, las compras alimentan los egresos
            y el stock, la planilla se agrega sola y los KPIs se calculan en vivo — sin copiar informacion de un cuadro a otro y
            sin depender de inteligencia artificial. La demo esta operativa en <strong>casagrande.bcode.work</strong> con usuario de prueba restringido.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            La idea es reunir en un solo software propio todas las herramientas digitales que hoy usa por separado el hotel:
            web, CRM, reservas, almacen, restaurante, WhatsApp y reportes. No se pagan mensualidades por herramientas ajenas;
            solo el hosting y el dominio, contratados por el cliente. A partir de como maneja hoy su negocio, levantamos lo que
            le falta y lo ajustamos a sus necesidades reales, con todo personalizado para su operacion.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            Para construir esta demo usamos imagenes y datos publicos del hotel. Si el cliente decide no continuar con nuestros
            servicios, eliminaremos esos datos de nuestros servidores de trabajo cuando nos lo confirme.
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
            (ya operativo) y se publica en produccion en el hosting del cliente sin cortes de servicio.
          </p>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.2 Stack tecnologico propuesto</h3>
          <div className="mb-5"><Tabla head={['Componente', 'Herramienta', 'Uso en el proyecto']} rows={stackPropuesto} /></div>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.3 Decision tecnica para el hero y las promociones</h3>
          <p className="text-sm text-slate-600 mb-5">
            El hero del home se administra desde WordPress como slides con imagen (elegida en un modal visual de la mediateca),
            titulo, subtitulo y boton opcional. Para lanzar una promocion basta crear un slide y activarlo; al terminar, se desactiva.
            Sin plugins de sliders pesados: carga instantanea y sin licencias adicionales.
          </p>
          <h3 className="font-semibold text-slate-950 mb-2 text-sm">4.4 Modulos del CRM hotelero</h3>
          <div className="mb-2"><Tabla head={['Modulo', 'Funcion']} rows={modulosCRM} /></div>
          <p className="text-xs text-slate-500">Referencia funcional: sistemas PMS hoteleros (front desk, housekeeping, inventario, restaurante y reportes) implementados a la medida, sin licencias mensuales de terceros.</p>
          <h3 className="font-semibold text-slate-950 mt-6 mb-2 text-sm">4.5 Comparativa directa: hoy vs propuesta</h3>
          <Tabla head={['Area', 'Sitio actual', 'Propuesta BlairCode']} rows={comparativaPropuesta} />
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
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-500" /> Rendimiento y SEO</h3>
              <ul className="space-y-1.5">
                <li>• Front estatico: carga en milisegundos, sin base de datos por visita.</li>
                <li>• Imagenes WebP optimizadas con texto alternativo (SEO).</li>
                <li>• Datos estructurados schema.org/Hotel, sitemap, robots y Open Graph.</li>
                <li>• Los datos del formulario y reservas llegan solo al hotel; no se comparten con terceros.</li>
              </ul>
            </div>
          </div>
        </Sec>

        <Sec n="8" title="Alojamiento web y dominio (cotizable)">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-900/90 space-y-2">
            <p><strong>Para este proyecto no esta considerado hosting ni dominio en la tarifa base</strong>, pero a peticion del cliente lo podemos cotizar aparte. El hotel contrata su hosting y dominio directamente (o usa los que ya tiene) y mantiene el control total.</p>
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
            <li>• Hosting y dominio los contrata el cliente directamente (asesoria e instalacion incluidas).</li>
            <li>• Cambios estructurales posteriores a la conformidad final se cotizan por separado.</li>
            <li>• Garantia y soporte tecnico por 90 dias calendario desde la puesta en produccion.</li>
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

        <Sec n="13" title="Declaracion de cumplimiento">
          <p className="text-sm text-slate-600 mb-8">
            BlairCode AI · B&D Co S.A.C. declara que ejecutara el servicio conforme a lo descrito en esta propuesta,
            mantendra confidencialidad sobre la informacion del hotel, no insertara publicidad ni codigo malicioso,
            utilizara recursos con licencias validas y, si el hotel nos da la oportunidad de mejorar su presencia digital,
            implementara la solucion comprometida para cumplir con ese objetivo de forma personalizada y verificable.
          </p>
          <p className="text-sm text-slate-500 mb-10">Arequipa, 04 de julio del 2026</p>

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

        <div className="border border-slate-300 mt-10 grid sm:grid-cols-2 text-xs text-slate-500">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-slate-300 flex items-center gap-2">
            <img src="/logo-bcode.png" alt="" className="h-5 object-contain" />
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
