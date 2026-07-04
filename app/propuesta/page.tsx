
'use client';

import React from 'react';
import { FileText, Printer, Check, ShieldCheck, RefreshCw, Layers, BookOpen, DollarSign, Camera } from 'lucide-react';

const techStack = [
  ['CMS', 'WordPress 7.0'],
  ['Tema', 'Hello Elementor'],
  ['Plugins', 'WooCommerce, Jetpack, WhatsApp, Elementor, Elementor Pro'],
  ['JavaScript', 'jQuery y jQuery Migrate 3.4.1'],
  ['UI / graficos', 'Open Graph'],
  ['Publicidad', 'Facebook Pixel'],
  ['Widgets', 'Facebook'],
  ['SEO / analytics', 'Site Kit 1.181.0, All in One SEO Pack 4.9.8'],
  ['Seguridad / medicion', 'Cloudflare Browser Insights, Kount'],
  ['Tipografia', 'Cinzel Decorative'],
];

const benefits = [
  'Un solo sistema para contenido, reservas, WhatsApp, personal, almacén y contabilidad.',
  'Sin copiar datos entre cuadros ni depender de IA para mover información.',
  'CRM en WordPress con panel visual y usuario demo restringido.',
  'Contenido publico editable desde WordPress: hero, galeria y blog.',
  'WhatsApp/YCloud listo para conectar APIs y webhooks.',
  'Pagos de reserva preparados para Izipay, Yape, Plin y transferencia bancaria.',
  'Entrega en 5 días hábiles.',
];

const diagnosis = [
  'La home carga con identidad visual premium, pero la consola muestra errores de mixed content en fuentes decorativas.',
  'El body visible expone texto de prueba como "home" y "test2", señal de contenido temporal que debe eliminarse.',
  'La navegación principal ya muestra los accesos clave: Inicio, Nuestra Historia, Habitaciones, Servicios, Consulta Disponibilidad y Paga aquí.',
  'El stack detectado confirma que el sitio ya está montado sobre WordPress con constructor visual y plugins de marketing.',
];

const comparison = [
  ['Sitio actual', 'WordPress + Elementor + plugins dispersos', 'Propuesta BlairCode', 'WordPress headless + CRM operativo + automatización por reglas'],
  ['Contenido', 'Edición limitada y con restos de prueba', 'Hero, galería y blog administrables desde WP'],
  ['Operación', 'Reservas y pagos fragmentados', 'Reservas, pagos, WhatsApp, almacén y finanzas en un solo flujo'],
  ['Demo', 'Sin control restringido', 'Usuario demo admin-hotel con permisos limitados'],
];

export default function PropuestaPage() {
  const handlePrint = () => window.print();
  const total = 750 * 1.18;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-3xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600 print:hidden" />

        <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 mb-8 sm:flex-row sm:items-start sm:justify-between print:mb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] text-blue-600 uppercase">BlairCode AI · B&D Co S.A.C.</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-light mt-2 text-slate-900">Propuesta tecnica y economica</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              Hotel Boutique Casa Grande · CRM en WordPress · Headless CMS · WhatsApp/YCloud · Pagos de reservas ·
              Dashboard de KPIs
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-all print:hidden"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>

        <section className="grid sm:grid-cols-2 gap-4 text-sm mb-8 print:mb-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Presentado a</span><strong className="text-slate-900">Hotel Boutique Casa Grande</strong></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Presentado por</span><span className="text-slate-700">BlairCode AI · B&D Co S.A.C.</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Experiencia / referencia</span><span className="text-slate-700">https://blaircode.com</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Caso de referencia</span><span className="text-slate-700">https://cmfb.gob.pe</span></div>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2">
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Codigo de propuesta</span><span className="font-mono font-bold text-white">CASAGRANDE-07042026-001</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Fecha</span><span className="text-white">04-07-26</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Tipo</span><span className="text-white">Pago unico con IGV incluido</span></div>
            <div><span className="block text-xs uppercase tracking-wider text-slate-400">Entrega</span><span className="text-white">5 dias habiles</span></div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">1. Resumen ejecutivo</h2>
          <p className="text-slate-600 leading-relaxed text-sm mb-3">
            BlairCode propone para Casa Grande una solucion completa sobre WordPress: contenido publico administrable, CRM operativo dentro de wp-admin,
            WhatsApp/YCloud, pagos de reservas, contabilidad basica, almacenes compartidos y graficos KPI en un solo sistema.
          </p>
          <p className="text-slate-600 leading-relaxed text-sm">
            El cliente no necesita pasar informacion de un modulo a otro. Las reservas, los cobros, el personal, la limpieza, el almacen y los reportes
            se alimentan del mismo origen de datos y se ven en un CRM con apariencia profesional dentro de WordPress.
          </p>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">2. Analisis del sitio actual</h2>
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3 rounded-tl-xl">Componente</th>
                  <th className="p-3">Hallazgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {techStack.map(([label, value]) => (
                  <tr key={label}>
                    <td className="p-3 font-semibold text-slate-950">{label}</td>
                    <td className="p-3">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-amber-900 font-semibold"><Camera className="w-4 h-4" /> Primera impresion visual</div>
              <ul className="space-y-2 text-sm text-amber-900/90">
                {diagnosis.map(item => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}
              </ul>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-rose-900 font-semibold"><FileText className="w-4 h-4" /> Errores de consola</div>
              <p className="text-sm text-rose-900/90 mb-3">
                Se registran varios errores de <strong>Mixed Content</strong> porque las fuentes decorativas de Elementor se piden por <code>http://</code>
                dentro de una pagina servida por <code>https://</code>. El navegador bloquea esos recursos y fuerza fallback tipografico.
              </p>
              <p className="text-sm text-rose-900/90">
                El log tambien muestra <strong>JQMIGRATE</strong>, por lo que jQuery Migrate esta cargado correctamente; el problema real es la entrega insegura de fonts.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">3. Beneficios de la propuesta</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
            {benefits.map(item => (
              <div key={item} className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">4. Comparacion</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3 rounded-tl-xl">Actual</th>
                  <th className="p-3">Descripcion</th>
                  <th className="p-3">Propuesta</th>
                  <th className="p-3 rounded-tr-xl">Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {comparison.map(([a, b, c, d]) => (
                  <tr key={a + b}>
                    <td className="p-3 font-semibold text-slate-950">{a}</td>
                    <td className="p-3">{b}</td>
                    <td className="p-3 text-blue-700 font-medium">{c}</td>
                    <td className="p-3 text-slate-800">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">5. Plataforma y CRM</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-orange-500" /> WordPress como CMS y CRM</h3>
              <p className="leading-relaxed">
                Hero, galeria y blog se administran desde WordPress. El CRM vive dentro de wp-admin con vistas para personal, limpieza, turnos, reservas,
                almacen, finanzas, WhatsApp y contenido. El usuario demo solo administra el hotel, no toca plugins, temas, usuarios ni exportaciones.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-500" /> Automatizacion por reglas</h3>
              <p className="leading-relaxed">
                Las reservas pagadas alimentan ingresos, las compras alimentan egresos, el stock baja con movimientos y el WhatsApp responde por reglas
                o manualmente dentro de la ventana de 24 horas. No hay dependencia de IA para transferir datos entre módulos.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">6. Pagos de reservas</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">Metodos listos para configurar</h3>
              <ul className="space-y-2">
                <li>Izipay: codigo de comercio, llave publica, llave privada y endpoint.</li>
                <li>Yape: numero, titular y QR / enlace.</li>
                <li>Plin: numero, titular y QR / enlace.</li>
                <li>Transferencia bancaria: banco, cuenta, CCI, titular y moneda.</li>
              </ul>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Alcance de la conexion</h3>
              <p className="leading-relaxed text-emerald-900/90">
                La conexion es configurativa: se dejan los campos en WordPress para que ustedes carguen sus datos. No se activa un cobro vivo en demo,
                pero la reserva ya guarda metodo de pago y referencia para el seguimiento operativo.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">7. Tutorial de prueba</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-orange-500" /> Acceso demo</h3>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Abra <code>https://casagrande-cms.bcode.work/wp-login.php</code>.</li>
                <li>Use el usuario de prueba <strong>admin-hotel</strong>.</li>
                <li>Presione la card de acceso para rellenar usuario y clave automaticamente.</li>
                <li>Al entrar, revise el CRM Casa Grande y solo las funciones del hotel.</li>
              </ol>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /> Limitaciones del usuario</h3>
              <ul className="space-y-2">
                <li>No puede ver el codigo fuente ni la arquitectura interna.</li>
                <li>No puede tocar plugins, temas, exportaciones ni usuarios del sistema.</li>
                <li>Solo administra el hotel y sus modulos operativos visibles.</li>
                <li>El frontend no forma parte de la demo administrativa.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">8. Plantilla maestra</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2">Uso para cualquier lead</h3>
              <p className="leading-relaxed">
                Esta misma estructura se reutiliza para Casa Grande y para cualquier otro cliente de SIA. La copia de trabajo se nombra como
                <code>codigo_de_propuesta+nombre_cliente+fecha(dd-mm-aa)</code> para mantener orden y versionado comercial.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-950 mb-2">Lo que se copia</h3>
              <p className="leading-relaxed">
                Se conserva el estilo BlairCode, la narrativa comercial, la estructura del diagnóstico, la propuesta tecnica, la economia y el tutorial.
                Solo cambian cliente, analisis, precio, alcance y notas especificas.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 print:mb-6 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-3 mb-4">9. Propuesta economica</h2>
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:bg-white print:text-slate-900 print:border print:border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Inversion unica</p>
              <h3 className="text-3xl font-light mt-1 font-serif print:text-2xl">CRM WordPress + Web + Automatizacion</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md">
                Incluye: contenido editable, CRM operativo, WhatsApp/YCloud, contabilidad basica, almacen compartido, KPIs, tutorial de prueba,
                configuracion de pagos de reservas.
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-xs text-slate-400 block uppercase font-bold">Total unico con IGV incluido</span>
              <span className="text-4xl font-extrabold text-orange-500 font-serif block mt-1 print:text-3xl">S/ {total.toFixed(2)}</span>
              <span className="text-xs text-slate-400 block mt-1">Subtotal: S/ 750.00 + IGV 18% (S/ 135.00)</span>
              <span className="text-xs text-slate-400 block mt-1">Entrega en 5 dias habiles</span>
            </div>
          </div>
        </section>

        <section className="mt-12 pt-8 border-t border-slate-100 break-inside-avoid">
          <div className="grid sm:grid-cols-2 gap-6 text-center sm:text-left">
            <div className="flex flex-col gap-3">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Presentado por</p>
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 font-mono text-2xs text-slate-500 leading-tight">
                <span className="text-slate-800 font-bold block">BlairCode AI</span>
                Mauricio Blair Farah
                <span className="block text-2xs text-slate-500">RUC 20614096561</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Aceptacion y conformidad</p>
              <div className="border-b border-dashed border-slate-300 w-full sm:w-64 h-10" />
              <span className="text-xs text-slate-500">Hotel Boutique Casa Grande</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
