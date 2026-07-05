<?php
/**
 * Plugin Name: Casa Grande CRM (datos)
 * Description: CRM operativo del hotel: personal, cuartos/limpieza, turnos, reservas, almacen (hotel/restaurante/catering), contabilidad y KPIs — TODO conectado y automatico (se calcula solo, sin copiar datos ni IA). Incluye inbox WhatsApp/YCloud (bot por reglas + respuesta manual), usuario demo restringido y card de acceso en el login. Sin dependencias externas.
 */
if (!defined('ABSPATH')) exit;

/* ================= Helpers base ================= */
function cg_tbl($n) { global $wpdb; return $wpdb->prefix . 'cg_' . $n; }
function cg_money($n) { return 'S/ ' . number_format((float) $n, 2); }
function cg_crm_defaults() {
  return [
    'ycloud_api_key' => '', 'wa_from' => '', 'webhook_token' => 'casagrande',
    'bot_enabled' => '1', 'igv_rate' => '18',
    'biz_name' => 'Hotel Boutique Casa Grande',
  ];
}
function cg_crm_settings() { return array_merge(cg_crm_defaults(), (array) get_option('cg_crm_settings', [])); }
function cg_crm_set($k, $v) { $s = cg_crm_settings(); $s[$k] = $v; update_option('cg_crm_settings', $s); }

/* ================= Creacion de tablas (versionada) ================= */
add_action('init', function () {
  if (get_option('cg_crm_db') === '1') return;
  global $wpdb;
  $charset = $wpdb->get_charset_collate();
  require_once ABSPATH . 'wp-admin/includes/upgrade.php';

  $t_staff = cg_tbl('staff');
  $t_shifts = cg_tbl('shifts');
  $t_hk = cg_tbl('housekeeping');
  $t_inv = cg_tbl('inventory');
  $t_mov = cg_tbl('stock_moves');
  $t_led = cg_tbl('ledger');
  $t_conv = cg_tbl('wa_conversations');
  $t_msg = cg_tbl('wa_messages');

  dbDelta("CREATE TABLE $t_staff (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL, role VARCHAR(60) NOT NULL DEFAULT 'Recepcion',
    phone VARCHAR(40) DEFAULT '', salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1, created DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)) $charset;");

  dbDelta("CREATE TABLE $t_shifts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL, work_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL DEFAULT 'manana',
    PRIMARY KEY (id), KEY staff_id (staff_id), KEY work_date (work_date)) $charset;");

  dbDelta("CREATE TABLE $t_hk (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    room_id BIGINT UNSIGNED NOT NULL DEFAULT 0, room_name VARCHAR(120) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'limpio', staff_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    note VARCHAR(255) DEFAULT '', updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY room_id (room_id)) $charset;");

  dbDelta("CREATE TABLE $t_inv (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sku VARCHAR(40) DEFAULT '', name VARCHAR(160) NOT NULL,
    area VARCHAR(20) NOT NULL DEFAULT 'hotel', unit VARCHAR(20) NOT NULL DEFAULT 'und',
    stock DECIMAL(12,2) NOT NULL DEFAULT 0, min_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0, updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY area (area)) $charset;");

  dbDelta("CREATE TABLE $t_mov (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    item_id BIGINT UNSIGNED NOT NULL, kind VARCHAR(10) NOT NULL DEFAULT 'entrada',
    qty DECIMAL(12,2) NOT NULL DEFAULT 0, unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0, note VARCHAR(255) DEFAULT '',
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY item_id (item_id), KEY ts (ts)) $charset;");

  dbDelta("CREATE TABLE $t_led (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kind VARCHAR(10) NOT NULL DEFAULT 'ingreso', category VARCHAR(40) NOT NULL DEFAULT 'General',
    concept VARCHAR(200) NOT NULL DEFAULT '', amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    taxable TINYINT(1) NOT NULL DEFAULT 1, ref_type VARCHAR(30) DEFAULT '', ref_id VARCHAR(40) DEFAULT '',
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY kind (kind), KEY ts (ts)) $charset;");

  dbDelta("CREATE TABLE $t_conv (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    phone VARCHAR(40) NOT NULL, name VARCHAR(120) DEFAULT '',
    service VARCHAR(30) NOT NULL DEFAULT 'General', status VARCHAR(20) NOT NULL DEFAULT 'abierta',
    bot_enabled TINYINT(1) NOT NULL DEFAULT 1, unread INT NOT NULL DEFAULT 0,
    last_body VARCHAR(255) DEFAULT '', last_ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), UNIQUE KEY phone (phone)) $charset;");

  dbDelta("CREATE TABLE $t_msg (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conv_id BIGINT UNSIGNED NOT NULL, direction VARCHAR(4) NOT NULL DEFAULT 'in',
    body TEXT, via VARCHAR(12) NOT NULL DEFAULT 'human', ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY conv_id (conv_id)) $charset;");

  update_option('cg_crm_db', '1');
}, 5);

/* ================= Agregaciones (contabilidad, almacen, KPIs) =================
   Todo se CALCULA en vivo desde las tablas/CPTs compartidos. No se copian datos. */

// Reservas pagadas => ingresos por alojamiento (sin duplicar: se leen del CPT reservation)
function cg_income_reservations($from = null, $to = null) {
  $q = new WP_Query([
    'post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_payment', 'value' => 'pagado']],
  ]);
  $rows = [];
  foreach ($q->posts as $id) {
    $total = (float) get_post_meta($id, 'cg_total', true);
    if ($total <= 0) continue;
    $date = get_post_meta($id, 'cg_check_in', true) ?: get_post_field('post_date', $id);
    $d = substr($date, 0, 10);
    if ($from && $d < $from) continue;
    if ($to && $d > $to) continue;
    $rows[] = ['date' => $d, 'concept' => get_post_meta($id, 'cg_room', true) ?: 'Alojamiento',
      'amount' => $total, 'category' => 'Alojamiento'];
  }
  return $rows;
}

// Compras de insumos => egresos (se leen de stock_moves entrada)
function cg_expense_purchases($from = null, $to = null) {
  global $wpdb; $t = cg_tbl('stock_moves'); $i = cg_tbl('inventory');
  $sql = "SELECT m.ts, m.total, i.name, i.area FROM $t m LEFT JOIN $i i ON i.id=m.item_id WHERE m.kind='entrada'";
  $rows = [];
  foreach ($wpdb->get_results($sql) as $r) {
    $d = substr($r->ts, 0, 10);
    if ($from && $d < $from) continue; if ($to && $d > $to) continue;
    $rows[] = ['date' => $d, 'concept' => 'Compra: ' . $r->name, 'amount' => (float) $r->total,
      'category' => 'Almacen ' . ucfirst($r->area ?: 'hotel')];
  }
  return $rows;
}

// Planilla => egreso mensual recurrente (personal activo)
function cg_expense_payroll_monthly() {
  global $wpdb; $t = cg_tbl('staff');
  return (float) $wpdb->get_var("SELECT COALESCE(SUM(salary),0) FROM $t WHERE active=1");
}

// Asientos manuales del libro (ventas restaurante/catering, servicios, gastos varios)
function cg_ledger_rows($kind = null, $from = null, $to = null) {
  global $wpdb; $t = cg_tbl('ledger');
  $where = '1=1'; if ($kind) $where .= $wpdb->prepare(' AND kind=%s', $kind);
  $rows = [];
  foreach ($wpdb->get_results("SELECT * FROM $t WHERE $where ORDER BY ts DESC") as $r) {
    $d = substr($r->ts, 0, 10);
    if ($from && $d < $from) continue; if ($to && $d > $to) continue;
    $rows[] = ['date' => $d, 'concept' => $r->concept, 'amount' => (float) $r->amount,
      'category' => $r->category, 'taxable' => (int) $r->taxable];
  }
  return $rows;
}

// Resumen financiero del periodo (todo junto, automatico)
function cg_finance_summary($from, $to) {
  $ing = array_merge(cg_income_reservations($from, $to), cg_ledger_rows('ingreso', $from, $to));
  $egr = array_merge(cg_expense_purchases($from, $to), cg_ledger_rows('egreso', $from, $to));
  // Planilla: entra por boletas PAGADAS (ledger, categoria Personal) — sin estimados duplicados.

  $ingresos = array_sum(array_column($ing, 'amount'));
  $egresos = array_sum(array_column($egr, 'amount'));
  $rate = (float) cg_crm_settings()['igv_rate'] / 100;
  // IGV por pagar = IGV ventas - IGV compras (simplificado sobre montos gravados)
  $igv_ventas = $ingresos - ($ingresos / (1 + $rate));
  $igv_compras = array_sum(array_map(function ($e) use ($rate) {
    return $e['amount'] - ($e['amount'] / (1 + $rate));
  }, array_filter($egr, function ($e) { return ($e['category'] ?? '') !== 'Personal'; })));
  $igv = max(0, $igv_ventas - $igv_compras);
  return [
    'ingresos' => $ingresos, 'egresos' => $egresos, 'utilidad' => $ingresos - $egresos,
    'igv' => $igv, 'igv_ventas' => $igv_ventas, 'igv_compras' => $igv_compras,
    'ing_rows' => $ing, 'egr_rows' => $egr,
  ];
}

// Serie de 6 meses para el grafico ingresos vs egresos
function cg_monthly_series($n = 6) {
  $out = [];
  for ($k = $n - 1; $k >= 0; $k--) {
    $from = date('Y-m-01', strtotime("-$k month"));
    $to = date('Y-m-t', strtotime("-$k month"));
    $f = cg_finance_summary($from, $to);
    $out[] = ['label' => date('M', strtotime($from)), 'ingresos' => $f['ingresos'], 'egresos' => $f['egresos']];
  }
  return $out;
}

// Almacen
function cg_inventory_summary() {
  global $wpdb; $t = cg_tbl('inventory');
  $rows = $wpdb->get_results("SELECT * FROM $t ORDER BY area, name");
  $val = 0; $alerts = 0; $by_area = [];
  foreach ($rows as $r) {
    $v = (float) $r->stock * (float) $r->cost; $val += $v;
    if ((float) $r->stock <= (float) $r->min_stock) $alerts++;
    $a = $r->area ?: 'hotel'; $by_area[$a] = ($by_area[$a] ?? 0) + $v;
  }
  return ['rows' => $rows, 'value' => $val, 'alerts' => $alerts, 'count' => count($rows), 'by_area' => $by_area];
}

// Ocupacion hoy (desde CPT room + reservas, reusa logica del headless)
function cg_occupancy_today() {
  $today = current_time('Y-m-d'); $tom = date('Y-m-d', strtotime($today . ' +1 day'));
  $q = new WP_Query(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids']);
  $units = 0; $occ = 0;
  foreach ($q->posts as $id) {
    $u = (int) get_post_meta($id, 'cg_units', true); $u = $u > 0 ? $u : 3; $units += $u;
    if (function_exists('cg_reserved_count')) $occ += min($u, cg_reserved_count($id, $today, $tom));
  }
  return ['units' => $units, 'occupied' => $occ, 'free' => max(0, $units - $occ),
    'rate' => $units ? round($occ / $units * 100) : 0];
}

function cg_staff_counts() {
  global $wpdb; $t = cg_tbl('staff'); $s = cg_tbl('shifts'); $today = current_time('Y-m-d');
  $active = (int) $wpdb->get_var("SELECT COUNT(*) FROM $t WHERE active=1");
  $on = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(DISTINCT staff_id) FROM $s WHERE work_date=%s", $today));
  return ['active' => $active, 'on_shift' => $on];
}
function cg_hk_counts() {
  global $wpdb; $t = cg_tbl('housekeeping');
  $rows = $wpdb->get_results("SELECT status, COUNT(*) c FROM $t GROUP BY status");
  $m = ['limpio' => 0, 'sucio' => 0, 'en_limpieza' => 0, 'mantenimiento' => 0, 'ocupado' => 0];
  foreach ($rows as $r) $m[$r->status] = (int) $r->c;
  return $m;
}

/* ================= WhatsApp / YCloud ================= */
function cg_wa_classify($text) {
  $t = mb_strtolower($text);
  $has = function ($arr) use ($t) { foreach ($arr as $w) if (strpos($t, $w) !== false) return true; return false; };
  if ($has(['catering', 'evento', 'banquet', 'buffet para', 'coffee break'])) return 'Catering';
  if ($has(['reserva', 'habitacion', 'cuarto', 'noche', 'disponibilidad', 'alojamiento'])) return 'Reservas';
  if ($has(['restaurante', 'almuerzo', 'cena', 'desayuno', 'carta', 'menu', 'plato'])) return 'Restaurante';
  if ($has(['salon', 'reunion', 'boda', 'matrimonio', 'conferencia'])) return 'Eventos';
  return 'General';
}
function cg_wa_bot_reply($text, $service) {
  $t = mb_strtolower($text);
  $s = function ($k, $d = '') { $v = get_option('cg_settings', []); return $v[$k] ?? $d; };
  if (strpos($t, 'precio') !== false || strpos($t, 'tarifa') !== false || strpos($t, 'cuesta') !== false) {
    // tarifas reales desde el CMS
    $lines = [];
    foreach (get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'meta_value_num', 'meta_key' => 'cg_price', 'order' => 'ASC']) as $rm)
      $lines[] = $rm->post_title . ': S/' . number_format((float) get_post_meta($rm->ID, 'cg_price', true), 0);
    return 'Nuestras tarifas por noche (desayuno incluido): ' . implode(' · ', $lines) . '. Dime tus fechas y te confirmo disponibilidad con numero de habitacion. 🗓️';
  }
  if (strpos($t, 'capacidad') !== false || strpos($t, 'personas') !== false || strpos($t, 'ninos') !== false || strpos($t, 'niños') !== false)
    return 'Tenemos 75 habitaciones en 5 pisos (101 al 515). Cada tipo admite entre 1 y 2 adultos con espacio para ninos segun la habitacion (la Suite admite 2 adultos y 2 ninos). ¿Para cuantas personas seria? 👨‍👩‍👧';
  if (strpos($t, 'ubica') !== false || strpos($t, 'direcc') !== false || strpos($t, 'donde') !== false)
    return 'Estamos en Av. Luna Pizarro 202, Vallecito, Arequipa, a minutos del centro historico. 📍 maps.app.goo.gl/SnxbM6dird9A5Y2fA';
  if (strpos($t, 'catering') !== false || $service === 'Catering')
    return 'Ofrecemos catering para eventos: coffee breaks, almuerzos y banquetes. ¿Para cuantas personas y que fecha? Con gusto te preparamos una cotizacion. 🍽️';
  if (strpos($t, 'desayuno') !== false)
    return 'El desayuno buffet esta incluido en todas las habitaciones, de 7:00 a 10:00 am. ☕';
  if (strpos($t, 'hora') !== false && (strpos($t, 'check') !== false || strpos($t, 'entrada') !== false))
    return 'Check-in a partir de las 2:00 pm y check-out hasta las 12:00 pm. Guardamos tu equipaje sin costo si llegas antes. 🧳';
  if (strpos($t, 'gracias') !== false) return '¡Con gusto! Aqui estamos para lo que necesites. 😊';
  return 'Gracias por escribir al Hotel Boutique Casa Grande (75 habitaciones en Vallecito, Arequipa). Puedo ayudarte con reservas (te asigno habitacion al confirmar), restaurante, catering o eventos. 🙌';
}
function cg_ycloud_send($to, $text) {
  $s = cg_crm_settings();
  if (empty($s['ycloud_api_key']) || empty($s['wa_from'])) return 'demo'; // sin credenciales: modo demo
  $r = wp_remote_post('https://api.ycloud.com/v2/whatsapp/messages', [
    'timeout' => 15,
    'headers' => ['Content-Type' => 'application/json', 'X-API-Key' => $s['ycloud_api_key']],
    'body' => wp_json_encode([
      'from' => $s['wa_from'], 'to' => $to, 'type' => 'text', 'text' => ['body' => $text],
    ]),
  ]);
  if (is_wp_error($r)) return 'error';
  $code = wp_remote_retrieve_response_code($r);
  return ($code >= 200 && $code < 300) ? 'ycloud' : 'error';
}
function cg_wa_upsert_conversation($phone, $name, $service) {
  global $wpdb; $t = cg_tbl('wa_conversations');
  $id = $wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE phone=%s", $phone));
  if ($id) return (int) $id;
  $wpdb->insert($t, ['phone' => $phone, 'name' => $name ?: $phone, 'service' => $service,
    'status' => 'abierta', 'bot_enabled' => 1, 'unread' => 0]);
  return (int) $wpdb->insert_id;
}
function cg_wa_add_message($conv_id, $direction, $body, $via) {
  global $wpdb; $tm = cg_tbl('wa_messages'); $tc = cg_tbl('wa_conversations');
  $wpdb->insert($tm, ['conv_id' => $conv_id, 'direction' => $direction, 'body' => $body, 'via' => $via]);
  $inc = $direction === 'in' ? 1 : 0;
  $wpdb->query($wpdb->prepare("UPDATE $tc SET last_body=%s, last_ts=NOW(), unread=unread+%d WHERE id=%d",
    mb_substr($body, 0, 240), $inc, $conv_id));
}
// Webhook entrante (pegar esta URL en YCloud). Seguridad por token.
add_action('rest_api_init', function () {
  register_rest_route('casagrande/v1', '/whatsapp/webhook', [
    'methods' => 'POST', 'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $r) {
      $s = cg_crm_settings();
      if (($r->get_param('token') ?: '') !== $s['webhook_token']) return new WP_REST_Response(['error' => 'forbidden'], 403);
      $b = $r->get_json_params();
      // Formato YCloud: whatsappInboundMessage.{from,text.body,customerProfile.name}
      $m = $b['whatsappInboundMessage'] ?? $b;
      $from = $m['from'] ?? ($m['waId'] ?? '');
      $text = $m['text']['body'] ?? ($m['body'] ?? '');
      $name = $m['customerProfile']['name'] ?? ($m['profileName'] ?? '');
      if (!$from || $text === '') return new WP_REST_Response(['ok' => true, 'skipped' => 1], 200);
      $service = cg_wa_classify($text);
      $conv = cg_wa_upsert_conversation($from, $name, $service);
      cg_wa_add_message($conv, 'in', $text, 'human');
      // Bot: responde dentro de la ventana de 24h (mensaje de sesion, gratis)
      global $wpdb; $tc = cg_tbl('wa_conversations');
      $bot_on = (int) $wpdb->get_var($wpdb->prepare("SELECT bot_enabled FROM $tc WHERE id=%d", $conv));
      if ($s['bot_enabled'] === '1' && $bot_on) {
        $reply = cg_wa_bot_reply($text, $service);
        $via = cg_ycloud_send($from, $reply);
        cg_wa_add_message($conv, 'out', $reply, $via === 'ycloud' ? 'ycloud' : ($via === 'demo' ? 'bot' : 'bot'));
      }
      return new WP_REST_Response(['ok' => true], 200);
    },
  ]);
});



add_action('init', function () {
  global $wpdb;
  $today = current_time('Y-m-d');
  $now = current_time('mysql');

  $t_staff = cg_tbl('staff');
  if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $t_staff") === 0) {
    $staff = [
      ['Laura Quispe', 'Recepcion', '999111001', 1800],
      ['Pedro Huaman', 'Housekeeping', '999111002', 1400],
      ['Diana Flores', 'Cocina', '999111003', 1900],
      ['Jorge Paredes', 'Catering', '999111004', 2100],
      ['Rosa Medina', 'Administracion', '999111005', 2600],
    ];
    foreach ($staff as $row) {
      $wpdb->insert($t_staff, [
        'name' => $row[0], 'role' => $row[1], 'phone' => $row[2], 'salary' => $row[3], 'active' => 1,
      ]);
    }
  }

  $t_inv = cg_tbl('inventory');
  if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $t_inv") === 0) {
    $items = [
      ['HOT-001', 'Toallas hotel', 'hotel', 'und', 120, 40, 18],
      ['HOT-002', 'Sabanas queen', 'hotel', 'und', 80, 20, 32],
      ['RST-010', 'Papa amarilla', 'restaurante', 'kg', 60, 18, 4.8],
      ['RST-011', 'Aceite vegetal', 'restaurante', 'lt', 30, 8, 9.9],
      ['CAT-020', 'Vajilla catering', 'catering', 'und', 150, 50, 12],
      ['CAT-021', 'Gaseosa y agua', 'catering', 'und', 200, 60, 2.2],
    ];
    foreach ($items as $row) {
      $wpdb->insert($t_inv, [
        'sku' => $row[0], 'name' => $row[1], 'area' => $row[2], 'unit' => $row[3],
        'stock' => $row[4], 'min_stock' => $row[5], 'cost' => $row[6],
      ]);
    }
  }

  $t_hk = cg_tbl('housekeeping');
  if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $t_hk") === 0) {
    $rooms = ['Suite con Jacuzzi', 'Suite Ejecutiva', 'Habitacion Doble Superior', 'Suite Familiar'];
    $statuses = ['limpio', 'en_limpieza', 'sucio', 'mantenimiento'];
    foreach ($rooms as $i => $room) {
      $wpdb->insert($t_hk, [
        'room_id' => 0,
        'room_name' => $room,
        'status' => $statuses[$i % count($statuses)],
        'staff_id' => 0,
        'note' => 'Demo operativo',
        'updated' => $now,
      ]);
    }
  }

  $t_shift = cg_tbl('shifts');
  if ((int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $t_shift WHERE work_date=%s", $today)) === 0) {
    $staff_ids = $wpdb->get_col("SELECT id FROM $t_staff ORDER BY id ASC");
    $shift_types = ['manana', 'tarde', 'noche'];
    foreach ($staff_ids as $i => $staff_id) {
      $wpdb->insert($t_shift, [
        'staff_id' => (int) $staff_id,
        'work_date' => $today,
        'shift' => $shift_types[$i % count($shift_types)],
      ]);
    }
  }

  $t_led = cg_tbl('ledger');
  if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $t_led") === 0) {
    $entries = [
      ['ingreso', 'Hospedaje', 'Reserva Suite Ejecutiva', 1280, 1],
      ['ingreso', 'Restaurante', 'Evento corporativo', 860, 1],
      ['ingreso', 'Catering', 'Coffee break empresarial', 1240, 1],
      ['egreso', 'Almacen Hotel', 'Compra de lenceria', 640, 1],
      ['egreso', 'Almacen Restaurante', 'Compra de insumos', 930, 1],
      ['egreso', 'Servicios', 'Mantenimiento general', 480, 1],
    ];
    foreach ($entries as $row) {
      $wpdb->insert($t_led, [
        'kind' => $row[0], 'category' => $row[1], 'concept' => $row[2],
        'amount' => $row[3], 'taxable' => $row[4], 'ref_type' => '', 'ref_id' => '', 'ts' => $now,
      ]);
    }
  }

  $t_conv = cg_tbl('wa_conversations');
  $t_msg = cg_tbl('wa_messages');
  if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $t_conv") === 0) {
    $demo_threads = [
      ['51999111001', 'Lucia Gomez', 'Reservas', 'Me pasas tarifas para dos noches y desayuno?'],
      ['51999111002', 'Carlos Mena', 'Catering', 'Necesito un catering para 40 personas este viernes.'],
      ['51999111003', 'Ana Vega', 'Restaurante', 'Tienen carta para almuerzo ejecutivo?'],
    ];
    foreach ($demo_threads as $thread) {
      [$phone, $name, $service, $body] = $thread;
      $conv = cg_wa_upsert_conversation($phone, $name, $service);
      cg_wa_add_message($conv, 'in', $body, 'human');
      $reply = cg_wa_bot_reply($body, $service);
      cg_wa_add_message($conv, 'out', $reply, 'bot');
    }
  }
}, 23);

/* ================= Usuario demo restringido + rol "Gerente" ================= */
add_action('init', function () {
  if (get_option('cg_demo_user') === '1') return;

  // Rol restringido: administra el hotel, NO puede robar la idea (sin plugins/temas/codigo/export/usuarios)
  remove_role('cg_hotel');
  add_role('cg_hotel', 'Gerente del Hotel', [
    'read' => true, 'upload_files' => true,
    'edit_posts' => true, 'edit_published_posts' => true, 'publish_posts' => true,
    'edit_others_posts' => true, 'delete_posts' => true,
    'edit_pages' => true, 'edit_published_pages' => true, 'edit_others_pages' => true,
    'manage_hotel' => true, // capacidad propia para las pantallas del CRM
  ]);
  // La capacidad manage_hotel tambien para el admin
  $admin = get_role('administrator'); if ($admin) $admin->add_cap('manage_hotel');

  // Usuario demo
  $user = get_user_by('login', 'admin-hotel');
  $pass = get_option('cg_demo_pass');
  if (!$pass) { $pass = 'CasaGrande2026'; update_option('cg_demo_pass', $pass); }
  if (!$user) {
    $uid = wp_insert_user(['user_login' => 'admin-hotel', 'user_pass' => $pass,
      'display_name' => 'Gerente Casa Grande', 'role' => 'cg_hotel',
      'user_email' => 'gerente@hotelcasagrande.pe']);
  } else {
    $user->set_role('cg_hotel');
  }
  update_option('cg_demo_user', '1');
}, 6);

// Ocultar menus sensibles a quien no es administrador (solo administrar el hotel)
add_action('admin_menu', function () {
  if (current_user_can('manage_options')) return; // el admin real ve todo
  foreach (['plugins.php', 'themes.php', 'tools.php', 'users.php', 'options-general.php',
            'edit.php?post_type=page', 'theme-editor.php', 'export.php'] as $m) {
    remove_menu_page($m); remove_submenu_page('themes.php', $m);
  }
}, 999);
// Bloquear acceso directo a pantallas sensibles para el rol demo
add_action('admin_init', function () {
  if (current_user_can('manage_options')) return;
  global $pagenow;
  $blocked = ['plugins.php', 'plugin-install.php', 'plugin-editor.php', 'themes.php', 'theme-editor.php',
              'users.php', 'user-new.php', 'tools.php', 'export.php', 'import.php', 'options-general.php'];
  if (in_array($pagenow, $blocked, true)) { wp_die('Acceso restringido: este usuario solo administra el hotel.', 'Acceso restringido', ['response' => 403, 'back_link' => true]); }
});

// Card de acceso demo en el login
add_action('login_footer', function () {
  $pass = esc_js(get_option('cg_demo_pass', 'CasaGrande2026'));
  $user = 'admin-hotel';
  ?>
  <style>
    #cg-demo-card{max-width:320px;margin:18px auto 0;background:#fff;border:1px solid #e3e6ea;border-radius:12px;
      padding:16px 18px;box-shadow:0 8px 30px rgba(8,30,42,.12);font-family:-apple-system,Segoe UI,Roboto,sans-serif}
    #cg-demo-card h4{margin:0 0 4px;color:#0c2b3d;font-size:14px}
    #cg-demo-card p{margin:0 0 10px;color:#6b7280;font-size:12px;line-height:1.4}
    #cg-demo-card .row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dashed #eef0f2}
    #cg-demo-card .row b{color:#0c2b3d}
    #cg-demo-btn{margin-top:12px;width:100%;background:linear-gradient(135deg,#c9a84c,#e8be49);color:#0c2b3d;
      border:0;border-radius:8px;padding:10px;font-weight:700;cursor:pointer;font-size:13px}
    #cg-demo-btn:hover{filter:brightness(1.05)}
  </style>
  <div id="cg-demo-card">
    <h4>Acceso demo — Casa Grande</h4>
    <p>Usuario de demostracion para administrar el hotel (sin permisos de sistema).</p>
    <div class="row"><span>Usuario</span><b><?php echo esc_html($user); ?></b></div>
    <div class="row"><span>Clave</span><b><?php echo esc_html(get_option('cg_demo_pass', 'CasaGrande2026')); ?></b></div>
    <button id="cg-demo-btn" type="button">Rellenar y entrar</button>
  </div>
  <script>
    (function(){
      var b=document.getElementById('cg-demo-btn');
      if(!b)return;
      b.addEventListener('click',function(){
        var u=document.getElementById('user_login'), p=document.getElementById('user_pass');
        if(u&&p){ u.value='<?php echo $user; ?>'; p.value='<?php echo $pass; ?>';
          var f=document.getElementById('loginform'); if(f) f.submit(); }
      });
    })();
  </script>
  <?php
});

/* ================= KPIs hoteleros (PMS): ADR, RevPAR, llegadas/salidas ================= */
// ADR = ingreso alojamiento / noches vendidas; RevPAR = ingreso alojamiento / (unidades x dias)
function cg_hotel_kpis($from, $to) {
  $rows = cg_income_reservations($from, $to);
  $revenue = array_sum(array_column($rows, 'amount'));
  // noches vendidas del periodo (reservas pagadas)
  $nights = 0;
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_payment', 'value' => 'pagado']]]);
  foreach ($q->posts as $id) {
    $ci = get_post_meta($id, 'cg_check_in', true); $co = get_post_meta($id, 'cg_check_out', true);
    if (!$ci || !$co || $co <= $ci) continue;
    if ($ci < $from || $ci > $to) continue;
    $nights += max(1, (int) ((strtotime($co) - strtotime($ci)) / 86400));
  }
  // unidades totales del hotel
  $units = 0;
  foreach (get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish']) as $rm)
    $units += cg_room_units($rm->ID);
  $days = max(1, (int) round((strtotime($to) - strtotime($from)) / 86400) + 1);
  return [
    'revenue' => $revenue, 'nights' => $nights,
    'adr' => $nights ? $revenue / $nights : 0,
    'revpar' => ($units && $days) ? $revenue / ($units * $days) : 0,
  ];
}
// Llegadas y salidas de hoy (front desk)
function cg_today_movements() {
  $today = current_time('Y-m-d');
  $mk = function ($key) use ($today) {
    $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => 20, 'post_status' => 'publish',
      'meta_query' => [
        ['key' => $key, 'value' => $today],
        ['key' => 'cg_status', 'value' => 'cancelada', 'compare' => '!='],
      ]]);
    $out = [];
    foreach ($q->posts as $p) $out[] = [
      'code' => get_post_meta($p->ID, 'cg_code', true) ?: $p->post_title,
      'name' => get_post_meta($p->ID, 'cg_name', true) ?: trim(explode('-', $p->post_title)[1] ?? ''),
      'room' => get_post_meta($p->ID, 'cg_room', true) ?: '—',
      'edit' => get_edit_post_link($p->ID, 'raw'),
    ];
    return $out;
  };
  return ['arrivals' => $mk('cg_check_in'), 'departures' => $mk('cg_check_out')];
}

/* ================= Habitaciones fisicas (rack 101-515, 15 por piso) ================= */
add_action('init', function () {
  if (get_option('cg_crm_db2') === '1') return;
  global $wpdb; $charset = $wpdb->get_charset_collate();
  require_once ABSPATH . 'wp-admin/includes/upgrade.php';

  dbDelta("CREATE TABLE " . cg_tbl('rooms') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    number SMALLINT UNSIGNED NOT NULL, floor TINYINT UNSIGNED NOT NULL DEFAULT 1,
    type_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    cap_adults TINYINT UNSIGNED NOT NULL DEFAULT 2, cap_children TINYINT UNSIGNED NOT NULL DEFAULT 1,
    active TINYINT(1) NOT NULL DEFAULT 1, note VARCHAR(160) DEFAULT '',
    PRIMARY KEY (id), UNIQUE KEY number (number)) $charset;");

  // Personal: fechas de contrato, archivo de contrato y pagos de ley
  dbDelta("CREATE TABLE " . cg_tbl('staff_payments') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL, period CHAR(7) NOT NULL,
    concept VARCHAR(30) NOT NULL DEFAULT 'sueldo', amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid TINYINT(1) NOT NULL DEFAULT 0, paid_date DATE NULL,
    PRIMARY KEY (id), KEY staff_id (staff_id), KEY period (period)) $charset;");

  // Proveedores y servicios de terceros
  dbDelta("CREATE TABLE " . cg_tbl('suppliers') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL, ruc VARCHAR(15) DEFAULT '', contact VARCHAR(120) DEFAULT '',
    phone VARCHAR(40) DEFAULT '', category VARCHAR(60) DEFAULT 'General',
    is_service TINYINT(1) NOT NULL DEFAULT 0, note VARCHAR(200) DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id)) $charset;");

  // columnas nuevas de staff (dbDelta no altera bien: ALTER manual tolerante)
  foreach ([
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN hire_date DATE NULL",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN contract_end DATE NULL",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN contract_att BIGINT UNSIGNED NOT NULL DEFAULT 0",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN doc_id VARCHAR(15) DEFAULT ''",
    "ALTER TABLE " . cg_tbl('inventory') . " ADD COLUMN supplier_id BIGINT UNSIGNED NOT NULL DEFAULT 0",
    "ALTER TABLE " . cg_tbl('stock_moves') . " ADD COLUMN destino VARCHAR(120) DEFAULT ''",
  ] as $sql) { $wpdb->hide_errors(); $wpdb->query($sql); $wpdb->show_errors(); }

  update_option('cg_crm_db2', '1');
}, 5);

// Unidades por tipo DERIVADAS del rack fisico (fallback a cg_units si el rack esta vacio)
function cg_room_units_physical($type_id) {
  global $wpdb; $t = cg_tbl('rooms');
  static $counts = null;
  if ($counts === null) {
    $counts = [];
    foreach ((array) $wpdb->get_results("SELECT type_id, COUNT(*) c FROM $t WHERE active=1 GROUP BY type_id") as $r)
      $counts[(int) $r->type_id] = (int) $r->c;
  }
  return $counts[(int) $type_id] ?? 0;
}
// Sobreescribir el conteo del headless: si hay rack, manda el rack
add_filter('cg_room_units_override', function ($units, $room_id) {
  $n = cg_room_units_physical($room_id);
  return $n > 0 ? $n : $units;
}, 10, 2);

function cg_rack_rows($floor = 0) {
  global $wpdb; $t = cg_tbl('rooms');
  $where = $floor ? $wpdb->prepare('WHERE floor=%d', $floor) : '';
  return $wpdb->get_results("SELECT * FROM $t $where ORDER BY number ASC");
}
function cg_rack_floors() {
  global $wpdb; return array_map('intval', $wpdb->get_col("SELECT DISTINCT floor FROM " . cg_tbl('rooms') . " ORDER BY floor"));
}

/* ============ Folio / cuenta del cuarto ============ */
add_action('init', function () {
  if (get_option('cg_crm_db3') === '1') return;
  global $wpdb; require_once ABSPATH . 'wp-admin/includes/upgrade.php';
  dbDelta("CREATE TABLE " . cg_tbl('folio') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    res_id BIGINT UNSIGNED NOT NULL, concept VARCHAR(160) NOT NULL,
    qty DECIMAL(8,2) NOT NULL DEFAULT 1, unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0, settled TINYINT(1) NOT NULL DEFAULT 0,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY res_id (res_id)) " . $wpdb->get_charset_collate() . ";");
  update_option('cg_crm_db3', '1');
}, 5);
function cg_folio_rows($res_id) {
  global $wpdb; return $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('folio') . " WHERE res_id=%d ORDER BY ts", $res_id));
}
function cg_folio_total($res_id) {
  global $wpdb; return (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(total),0) FROM " . cg_tbl('folio') . " WHERE res_id=%d AND settled=0", $res_id));
}

/* ================= v3: planilla peruana, fichas, almacen total, FKs ================= */
add_action('init', function () {
  if (get_option('cg_crm_db4') === '1') return;
  global $wpdb; $cs = $wpdb->get_charset_collate();
  require_once ABSPATH . 'wp-admin/includes/upgrade.php';

  dbDelta("CREATE TABLE " . cg_tbl('payslips') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL, period CHAR(7) NOT NULL,
    base DECIMAL(10,2) NOT NULL DEFAULT 0, family_allow DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonuses DECIMAL(10,2) NOT NULL DEFAULT 0, bonus_note VARCHAR(160) DEFAULT '',
    gross DECIMAL(10,2) NOT NULL DEFAULT 0,
    pension_type VARCHAR(10) NOT NULL DEFAULT 'afp', pension_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    net DECIMAL(10,2) NOT NULL DEFAULT 0, essalud DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid TINYINT(1) NOT NULL DEFAULT 0, paid_date DATE NULL,
    PRIMARY KEY (id), UNIQUE KEY staff_period (staff_id, period)) $cs;");

  dbDelta("CREATE TABLE " . cg_tbl('staff_children') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL, name VARCHAR(120) NOT NULL, birthdate DATE NOT NULL,
    PRIMARY KEY (id), KEY staff_id (staff_id)) $cs;");

  dbDelta("CREATE TABLE " . cg_tbl('attendance') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id BIGINT UNSIGNED NOT NULL, work_date DATE NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'presente', note VARCHAR(160) DEFAULT '',
    PRIMARY KEY (id), UNIQUE KEY staff_date (staff_id, work_date)) $cs;");

  foreach ([
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN duties TEXT NULL",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN schedule VARCHAR(120) DEFAULT ''",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN pension_type VARCHAR(10) NOT NULL DEFAULT 'afp'",
    "ALTER TABLE " . cg_tbl('staff') . " ADD COLUMN afp_name VARCHAR(40) DEFAULT ''",
    "ALTER TABLE " . cg_tbl('inventory') . " ADD COLUMN item_type VARCHAR(20) NOT NULL DEFAULT 'material'",
    "ALTER TABLE " . cg_tbl('inventory') . " ADD COLUMN location VARCHAR(80) DEFAULT 'Almacen general'",
    "ALTER TABLE " . cg_tbl('inventory') . " ADD COLUMN acquired_date DATE NULL",
    "ALTER TABLE " . cg_tbl('inventory') . " ADD COLUMN expiry_date DATE NULL",
  ] as $sql) { $wpdb->hide_errors(); $wpdb->query($sql); $wpdb->show_errors(); }

  // Relaciones (FOREIGN KEYs) — best effort InnoDB
  foreach ([
    ['payslips', 'fk_payslip_staff', 'FOREIGN KEY (staff_id) REFERENCES ' . cg_tbl('staff') . '(id) ON DELETE CASCADE'],
    ['staff_children', 'fk_child_staff', 'FOREIGN KEY (staff_id) REFERENCES ' . cg_tbl('staff') . '(id) ON DELETE CASCADE'],
    ['attendance', 'fk_att_staff', 'FOREIGN KEY (staff_id) REFERENCES ' . cg_tbl('staff') . '(id) ON DELETE CASCADE'],
    ['staff_payments', 'fk_pay_staff', 'FOREIGN KEY (staff_id) REFERENCES ' . cg_tbl('staff') . '(id) ON DELETE CASCADE'],
    ['shifts', 'fk_shift_staff', 'FOREIGN KEY (staff_id) REFERENCES ' . cg_tbl('staff') . '(id) ON DELETE CASCADE'],
    ['stock_moves', 'fk_move_item', 'FOREIGN KEY (item_id) REFERENCES ' . cg_tbl('inventory') . '(id) ON DELETE CASCADE'],
    ['inventory', 'fk_item_supplier', 'FOREIGN KEY (supplier_id) REFERENCES ' . cg_tbl('suppliers') . '(id) ON DELETE SET DEFAULT'],
    ['wa_messages', 'fk_msg_conv', 'FOREIGN KEY (conv_id) REFERENCES ' . cg_tbl('wa_conversations') . '(id) ON DELETE CASCADE'],
  ] as [$tbl, $name, $fk]) {
    $wpdb->hide_errors();
    $wpdb->query("ALTER TABLE " . cg_tbl($tbl) . " ADD CONSTRAINT $name $fk");
    $wpdb->show_errors();
  }
  update_option('cg_crm_db4', '1');
}, 6);

/* ---- Motor de planilla (Peru) ---- */
function cg_payroll_params() {
  $s = cg_crm_settings();
  return ['rmv' => (float) ($s['rmv'] ?? 1130), 'afp_rate' => (float) ($s['afp_rate'] ?? 12.5),
          'onp_rate' => (float) ($s['onp_rate'] ?? 13), 'essalud_rate' => (float) ($s['essalud_rate'] ?? 9)];
}
function cg_children_u18($staff_id) {
  global $wpdb;
  return (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM " . cg_tbl('staff_children') . " WHERE staff_id=%d AND birthdate > DATE_SUB(CURDATE(), INTERVAL 18 YEAR)", $staff_id));
}
function cg_payslip_calc($staff, $bonuses = 0.0) {
  $p = cg_payroll_params();
  $base = (float) $staff->salary;
  $family = cg_children_u18($staff->id) > 0 ? round($p['rmv'] * 0.10, 2) : 0.0; // asignacion familiar 10% RMV
  $gross = $base + $family + $bonuses;
  $rate = ($staff->pension_type ?? 'afp') === 'onp' ? $p['onp_rate'] : $p['afp_rate'];
  $pension = round($gross * $rate / 100, 2);           // descuento al trabajador
  $net = round($gross - $pension, 2);                  // neto que recibe
  $essalud = round(($base + $family) * $p['essalud_rate'] / 100, 2); // aporte ADICIONAL del hotel
  return ['base' => $base, 'family_allow' => $family, 'bonuses' => $bonuses, 'gross' => $gross,
          'pension_type' => $staff->pension_type ?? 'afp', 'pension_amount' => $pension,
          'net' => $net, 'essalud' => $essalud, 'employer_cost' => $gross + $essalud];
}
function cg_generate_payslips($period) {
  global $wpdb; $tp = cg_tbl('payslips'); $n = 0;
  foreach ($wpdb->get_results("SELECT * FROM " . cg_tbl('staff') . " WHERE active=1") as $s) {
    if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $tp WHERE staff_id=%d AND period=%s", $s->id, $period))) continue;
    $c = cg_payslip_calc($s);
    $wpdb->insert($tp, ['staff_id' => $s->id, 'period' => $period, 'base' => $c['base'],
      'family_allow' => $c['family_allow'], 'bonuses' => 0, 'gross' => $c['gross'],
      'pension_type' => $c['pension_type'], 'pension_amount' => $c['pension_amount'],
      'net' => $c['net'], 'essalud' => $c['essalud'], 'paid' => 0]);
    $n++;
  }
  return $n;
}

/* ---- Reserva POR NUMERO de habitacion ---- */
function cg_room_number_free($number, $ci, $co, $exclude_res = 0) {
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [
      ['key' => 'cg_room_number', 'value' => (string) (int) $number],
      ['key' => 'cg_status', 'value' => 'cancelada', 'compare' => '!='],
    ]]);
  foreach ($q->posts as $rid) {
    if ($exclude_res && $rid == $exclude_res) continue;
    $rin = get_post_meta($rid, 'cg_check_in', true); $rout = get_post_meta($rid, 'cg_check_out', true);
    if ($rin && $rout && cg_ranges_overlap($ci, $co, $rin, $rout)) return false;
  }
  return true;
}
function cg_pick_free_room($type_id, $ci, $co) {
  global $wpdb;
  $nums = $wpdb->get_col($wpdb->prepare("SELECT number FROM " . cg_tbl('rooms') . " WHERE type_id=%d AND active=1 ORDER BY number", $type_id));
  foreach ($nums as $n) if (cg_room_number_free((int) $n, $ci, $co)) return (int) $n;
  return 0;
}
// Al crear una reserva (web/bot/manual) se asigna habitacion fisica automaticamente
add_action('cg_reservation_created', function ($res_id, $room_type_id, $ci, $co) {
  if (!$room_type_id || !$ci || !$co) return;
  if (get_post_meta($res_id, 'cg_room_number', true)) return;
  $num = cg_pick_free_room($room_type_id, $ci, $co);
  if ($num) update_post_meta($res_id, 'cg_room_number', (string) $num);
}, 10, 4);

/* ================= v4: tarifas, mantenimiento, actividad, huespedes ================= */
add_action('init', function () {
  if (get_option('cg_crm_db5') === '1') return;
  global $wpdb; $cs = $wpdb->get_charset_collate();
  require_once ABSPATH . 'wp-admin/includes/upgrade.php';
  dbDelta("CREATE TABLE " . cg_tbl('rates') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_id BIGINT UNSIGNED NOT NULL, label VARCHAR(80) NOT NULL DEFAULT 'Temporada',
    date_from DATE NOT NULL, date_to DATE NOT NULL, price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id), KEY type_id (type_id), KEY dates (date_from, date_to)) $cs;");
  dbDelta("CREATE TABLE " . cg_tbl('maintenance') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    room_number SMALLINT UNSIGNED NOT NULL DEFAULT 0, area VARCHAR(80) DEFAULT '',
    issue VARCHAR(220) NOT NULL, priority VARCHAR(10) NOT NULL DEFAULT 'media',
    status VARCHAR(12) NOT NULL DEFAULT 'abierta', staff_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0, created DATETIME DEFAULT CURRENT_TIMESTAMP, resolved DATETIME NULL,
    PRIMARY KEY (id), KEY status (status)) $cs;");
  dbDelta("CREATE TABLE " . cg_tbl('activity') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user VARCHAR(60) NOT NULL DEFAULT '', action VARCHAR(40) NOT NULL, detail VARCHAR(240) DEFAULT '',
    ts DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY ts (ts)) $cs;");
  dbDelta("CREATE TABLE " . cg_tbl('guest_notes') . " (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    guest_key VARCHAR(120) NOT NULL, note VARCHAR(300) NOT NULL, ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY guest_key (guest_key)) $cs;");
  update_option('cg_crm_db5', '1');
}, 7);

/* ---- Log de actividad (auditoria) ---- */
function cg_log($action, $detail = '') {
  global $wpdb;
  $u = wp_get_current_user();
  $wpdb->insert(cg_tbl('activity'), ['user' => $u && $u->exists() ? $u->user_login : 'sistema',
    'action' => substr($action, 0, 40), 'detail' => substr($detail, 0, 240)]);
}

/* ---- Tarifas por temporada ---- */
function cg_rate_for($type_id, $date) {
  global $wpdb; static $cache = [];
  $k = $type_id . '|' . $date;
  if (!isset($cache[$k])) {
    $p = $wpdb->get_var($wpdb->prepare("SELECT price FROM " . cg_tbl('rates') . " WHERE type_id=%d AND %s BETWEEN date_from AND date_to ORDER BY id DESC LIMIT 1", $type_id, $date));
    $cache[$k] = $p !== null ? (float) $p : null;
  }
  return $cache[$k];
}
// Total de estadia con tarifas por noche (fallback precio base)
function cg_stay_total($type_id, $ci, $co) {
  $base = (float) get_post_meta($type_id, 'cg_price', true);
  $total = 0.0;
  for ($d = $ci; $d < $co; $d = date('Y-m-d', strtotime($d . ' +1 day'))) {
    $r = cg_rate_for($type_id, $d);
    $total += ($r !== null ? $r : $base);
  }
  return $total > 0 ? $total : $base;
}

/* ---- Perfiles de huespedes (derivados de reservas) ---- */
function cg_guest_key($name, $phone, $email) {
  $p = preg_replace('/\D+/', '', (string) $phone);
  if (strlen($p) >= 6) return 'p:' . substr($p, -9);
  if ($email) return 'e:' . strtolower(trim($email));
  return 'n:' . strtolower(trim((string) $name));
}
function cg_guests_index() {
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish']);
  $g = [];
  foreach ($q->posts as $p) {
    $name = get_post_meta($p->ID, 'cg_name', true) ?: trim(explode('-', $p->post_title, 2)[1] ?? '');
    if (!$name || stripos($name, 'consulta') !== false) continue;
    $phone = get_post_meta($p->ID, 'cg_phone', true); $email = get_post_meta($p->ID, 'cg_email', true);
    $k = cg_guest_key($name, $phone, $email);
    if (!isset($g[$k])) $g[$k] = ['key' => $k, 'name' => $name, 'phone' => $phone, 'email' => $email,
      'visits' => 0, 'nights' => 0, 'spent' => 0.0, 'last' => '', 'res' => []];
    $ci = get_post_meta($p->ID, 'cg_check_in', true); $co = get_post_meta($p->ID, 'cg_check_out', true);
    $status = get_post_meta($p->ID, 'cg_status', true);
    if ($status === 'cancelada') continue;
    $g[$k]['visits']++;
    if ($ci && $co && $co > $ci) $g[$k]['nights'] += (int) ((strtotime($co) - strtotime($ci)) / 86400);
    if (get_post_meta($p->ID, 'cg_payment', true) === 'pagado') $g[$k]['spent'] += (float) get_post_meta($p->ID, 'cg_total', true);
    if (function_exists('cg_folio_rows')) foreach (cg_folio_rows($p->ID) as $f) if ($f->settled) $g[$k]['spent'] += (float) $f->total;
    if ($ci > $g[$k]['last']) $g[$k]['last'] = $ci;
    if ($phone && !$g[$k]['phone']) $g[$k]['phone'] = $phone;
    if ($email && !$g[$k]['email']) $g[$k]['email'] = $email;
    $g[$k]['res'][] = $p->ID;
  }
  uasort($g, function ($a, $b) { return $b['spent'] <=> $a['spent']; });
  return $g;
}
