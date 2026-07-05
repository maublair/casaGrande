<?php
/**
 * Plugin Name: Casa Grande CRM (excelencia operativa)
 * Description: No-show, extension de estadia, consumos que descuentan almacen, tape chart navegable, ocupacion 30 dias, guia rapida y backup completo.
 */
if (!defined('ABSPATH')) exit;

/* ================= NO-SHOW: llegadas vencidas sin check-in ================= */
function cg7_noshows() {
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [
      ['key' => 'cg_check_in', 'value' => current_time('Y-m-d'), 'compare' => '<'],
      ['key' => 'cg_status', 'value' => ['pendiente', 'confirmada'], 'compare' => 'IN'],
    ]]);
  $out = [];
  foreach ($q->posts as $rid) if (get_post_meta($rid, 'cg_inhouse', true) !== '1' && get_post_meta($rid, 'cg_check_out', true) >= current_time('Y-m-d')) continue; // en curso ok
  foreach ($q->posts as $rid) {
    if (get_post_meta($rid, 'cg_inhouse', true) === '1') continue;
    if (get_post_meta($rid, 'cg_payment', true) === 'pagado') continue;
    $out[] = $rid;
  }
  return $out;
}
add_action('cg_frontdesk_top', function () {
  $ns = cg7_noshows();
  if (!$ns) return;
  echo '<div class="cg-card" style="margin-bottom:14px;border-left:4px solid #c0392b"><h3>🚫 Posibles no-show (' . count($ns) . ')</h3><table class="widefat striped" style="font-size:12px"><thead><tr><th>Codigo</th><th>Huesped</th><th>Llegada era</th><th>Hab.</th><th></th></tr></thead><tbody>';
  foreach (array_slice($ns, 0, 6) as $rid) {
    echo '<tr><td><b>' . esc_html(get_post_meta($rid, 'cg_code', true)) . '</b></td>'
       . '<td>' . esc_html(get_post_meta($rid, 'cg_name', true) ?: '—') . '</td>'
       . '<td style="color:#c0392b">' . esc_html(get_post_meta($rid, 'cg_check_in', true)) . '</td>'
       . '<td>' . esc_html(get_post_meta($rid, 'cg_room_number', true) ?: '—') . '</td>'
       . '<td><a class="button button-small" onclick="return confirm(\'¿Marcar como NO-SHOW? Libera la habitacion.\')" href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg7_noshow&res=' . $rid), 'cg7_noshow_' . $rid)) . '">Marcar no-show</a></td></tr>';
  }
  echo '</tbody></table><p style="font-size:11px;color:#64748b">Reservas con llegada pasada, sin check-in y sin pago completo. Marcarlas libera la habitacion para venderla.</p></div>';
}, 7);
add_action('admin_post_cg7_noshow', function () {
  $res = (int) ($_GET['res'] ?? 0);
  check_admin_referer('cg7_noshow_' . $res);
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  update_post_meta($res, 'cg_status', 'cancelada');
  update_post_meta($res, 'cg_noshow', '1');
  $num = get_post_meta($res, 'cg_room_number', true);
  if ($num && function_exists('cg2_set_hk')) cg2_set_hk((int) $num, 'limpio');
  if (function_exists('cg_log')) cg_log('no_show', 'res#' . $res . ($num ? ' Hab. ' . $num : ''));
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-reservas', 'done' => 1], admin_url('admin.php'))); exit;
});

/* ================= EXTENDER ESTADIA (desde la cuenta) ================= */
add_action('cg_folio_after', function ($res_id) {
  $co = get_post_meta($res_id, 'cg_check_out', true);
  ?>
  <div style="border-top:2px dashed #e3e6ea;margin-top:14px;padding-top:12px">
    <h4 style="margin:0 0 8px">📅 Extender / acortar estadia (salida actual: <?php echo esc_html($co); ?>)</h4>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:8px;align-items:center">
      <?php wp_nonce_field('cg7_extend', '_n'); ?><input type="hidden" name="action" value="cg7_extend"><input type="hidden" name="res" value="<?php echo (int) $res_id; ?>">
      <input type="date" name="new_out" value="<?php echo esc_attr($co); ?>" required>
      <button class="button">Cambiar fecha de salida</button>
      <span style="font-size:11px;color:#64748b">Valida que la habitacion siga libre y recalcula el total con tarifas.</span>
    </form>
  </div>
  <?php
}, 20);
add_action('admin_post_cg7_extend', function () {
  check_admin_referer('cg7_extend', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $res = (int) $_POST['res'];
  $ci = get_post_meta($res, 'cg_check_in', true);
  $new = sanitize_text_field($_POST['new_out']);
  if (!$ci || $new <= $ci) wp_die('La salida debe ser posterior a la llegada.', '', ['back_link' => true]);
  $num = (int) get_post_meta($res, 'cg_room_number', true);
  if ($num && function_exists('cg_room_number_free') && !cg_room_number_free($num, $ci, $new, $res))
    wp_die('La habitacion ' . $num . ' ya esta reservada en ese rango. Cambia de habitacion primero.', 'Sin disponibilidad', ['back_link' => true]);
  $old = get_post_meta($res, 'cg_check_out', true);
  update_post_meta($res, 'cg_check_out', $new);
  $type = (int) get_post_meta($res, 'cg_room_id', true);
  if ($type && function_exists('cg_stay_total')) update_post_meta($res, 'cg_total', (string) cg_stay_total($type, $ci, $new));
  if (function_exists('cg_log')) cg_log('estadia_cambiada', 'res#' . $res . ' salida ' . $old . '→' . $new);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-reservas', 'res' => $res, 'done' => 1], admin_url('admin.php'))); exit;
});

/* ================= Consumos del folio descuentan ALMACEN ================= */
add_action('cg_folio_charge', function ($res_id, $concept, $qty) {
  global $wpdb; $t = cg_tbl('inventory');
  $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE name LIKE %s AND item_type IN ('alimento','material') LIMIT 1", '%' . $wpdb->esc_like($concept) . '%'));
  if (!$item || (float) $item->stock <= 0) return;
  $num = get_post_meta($res_id, 'cg_room_number', true);
  $wpdb->update($t, ['stock' => max(0, (float) $item->stock - $qty), 'updated' => current_time('mysql')], ['id' => $item->id]);
  $wpdb->insert(cg_tbl('stock_moves'), ['item_id' => $item->id, 'kind' => 'salida', 'qty' => $qty,
    'unit_cost' => $item->cost, 'total' => $qty * (float) $item->cost,
    'destino' => 'Hab. ' . ($num ?: '?'), 'note' => 'Consumo folio']);
  if (function_exists('cg_log')) cg_log('stock_folio', $item->name . ' -' . $qty . ' → Hab. ' . $num);
}, 10, 3);

/* ================= Ocupacion proximos 30 dias (dashboard) ================= */
add_action('cg_dashboard_bottom', function () {
  $units = 0;
  foreach (get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish']) as $rm) $units += cg_room_units($rm->ID);
  if (!$units) return;
  $types = get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids']);
  $pts = [];
  for ($i = 0; $i < 30; $i++) {
    $d = date('Y-m-d', strtotime("+$i day")); $occ = 0;
    foreach ($types as $tid) $occ += cg_reserved_count($tid, $d, date('Y-m-d', strtotime($d . ' +1 day')));
    $pts[] = ['d' => $d, 'pct' => round($occ / $units * 100)];
  }
  $w = 900; $h = 90; $step = $w / 29;
  $path = '';
  foreach ($pts as $i => $p) $path .= ($i ? 'L' : 'M') . round($i * $step, 1) . ',' . round($h - ($p['pct'] / 100 * $h), 1) . ' ';
  echo '<div class="cg-card" style="margin-top:16px"><h3>📈 Ocupacion proyectada — proximos 30 dias</h3>';
  echo '<svg viewBox="0 0 ' . $w . ' ' . ($h + 22) . '" style="width:100%;height:auto">';
  echo '<path d="' . $path . 'L' . $w . ',' . $h . ' L0,' . $h . ' Z" fill="#15456222"></path>';
  echo '<path d="' . $path . '" fill="none" stroke="#154562" stroke-width="2"></path>';
  foreach ([0, 7, 14, 21, 29] as $i)
    echo '<text x="' . round($i * $step) . '" y="' . ($h + 16) . '" font-size="11" fill="#64748b">' . date('d/m', strtotime($pts[$i]['d'])) . '</text>';
  $today = $pts[0]['pct']; $max = max(array_column($pts, 'pct'));
  echo '</svg><p style="font-size:12px;color:#64748b">Hoy: <b>' . $today . '%</b> · Pico proximo mes: <b>' . $max . '%</b>. Sube tarifas en fechas de alta demanda desde <a href="' . esc_url(admin_url('admin.php?page=cg-crm-tarifas')) . '">Tarifas</a>.</p></div>';
}, 5);

/* ================= Tape chart navegable ================= */
// (el tape de ui4 usa hoy; anadimos offset por GET tape_ini)
// -> se implementa alla via filtro de fecha inicial
add_filter('cg_tape_start', function ($start) {
  $ini = sanitize_text_field($_GET['tape_ini'] ?? '');
  return $ini ?: $start;
});

/* ================= GUIA RAPIDA (ayuda para el hotel) ================= */
function cg7_render_guia() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $items = [
    ['🛎 Recibir a un huesped que llega sin reserva', 'Front Desk → "Nueva reserva / Walk-in" → llenar datos → Crear. La habitacion se asigna sola y si pones telefono le llega confirmacion por WhatsApp.'],
    ['✅ Hacer check-in', 'Front Desk → fila de la reserva → elegir habitacion (viene pre-asignada) → boton Check-in. La habitacion pasa a "ocupada".'],
    ['🍽 Cargar un pedido del restaurante a la habitacion', 'Front Desk → boton 🧾 Cuenta de la reserva IN-HOUSE → elegir plato de la carta o servicio (lavanderia, minibar...) → Cargar. Si el consumo existe en almacen, el stock se descuenta solo.'],
    ['💳 Cobrar (adelantos o saldo)', 'En la misma Cuenta → seccion "Pagos del alojamiento" → monto y metodo → Registrar. Al completar el total, la reserva pasa sola a PAGADO y entra a los ingresos.'],
    ['🚪 Hacer check-out', 'Front Desk → boton Check-out. La cuenta pendiente se liquida como ingreso, la habitacion pasa a "sucia" y aparece en la hoja de limpieza.'],
    ['🧹 Organizar la limpieza', 'Limpieza → filtro "Sucias" → asignar una por una o "Asignar TODAS las sucias". Imprime la hoja del dia desde el Dashboard.'],
    ['📅 Cambiar precios por temporada', 'Tarifas → Nueva regla (tipo, fechas, precio). Las reservas nuevas y la web usan ese precio noche por noche.'],
    ['👥 Pagar la planilla', 'Personal → Planilla → Generar boletas del mes → clic en ✗ para marcar pagado (registra el gasto completo con AFP y EsSalud). Clic en ✓ para imprimir la boleta.'],
    ['📦 Controlar el almacen', 'Almacen → Entrada = compra (suma stock y gasto) · Salida = uso con destino. Los vencimientos y stock bajo aparecen en las alertas del Dashboard.'],
    ['🔧 Reportar una averia', 'Mantenimiento → Nueva orden (habitacion o area, problema, prioridad). La habitacion queda en mantenimiento hasta resolver; el costo va a gastos.'],
    ['💬 Responder WhatsApp', 'WhatsApp → elegir conversacion → usar "⚡ Respuesta rapida" o escribir. El bot contesta solo dentro de la ventana gratuita; puedes apagarlo por conversacion.'],
    ['🌙 Cerrar el dia', 'Dashboard → "Cierre del dia": resumen imprimible con ocupacion, ingresos, caja por metodo y gastos. Firmalo con recepcion.'],
    ['🖼 Cambiar fotos, hero, noticias', 'Galeria / Hero-Promos / Entradas. Las imagenes se eligen con el boton de la mediateca (sin escribir rutas) y la web se actualiza sola.'],
  ];
  echo '<div class="wrap"><h1>📖 Guia rapida del hotel</h1><p style="color:#64748b">Como hacer cada tarea del dia a dia en el sistema.</p>';
  echo '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px;margin-top:14px">';
  foreach ($items as [$t, $d])
    echo '<div style="background:#fff;border:1px solid #e3e6ea;border-radius:12px;padding:14px 16px"><b style="color:#0c2b3d;display:block;margin-bottom:6px">' . $t . '</b><span style="font-size:13px;color:#50575e">' . $d . '</span></div>';
  echo '</div></div>';
}
add_action('admin_menu', function () {
  add_submenu_page('cg-crm', 'Guia rapida', '📖 Guia rapida', 'manage_hotel', 'cg-crm-guia', 'cg7_render_guia');
}, 12);

/* ================= BACKUP completo (JSON de todas las tablas cg_*) ================= */
add_action('admin_post_cg7_backup', function () {
  check_admin_referer('cg7_backup');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $tables = ['staff', 'shifts', 'housekeeping', 'inventory', 'stock_moves', 'ledger', 'wa_conversations',
    'wa_messages', 'rooms', 'staff_payments', 'suppliers', 'payslips', 'staff_children', 'attendance',
    'folio', 'rates', 'maintenance', 'activity', 'guest_notes', 'payments'];
  $dump = ['exported' => current_time('mysql'), 'site' => home_url(), 'tables' => []];
  foreach ($tables as $t) {
    $full = cg_tbl($t);
    if ($wpdb->get_var("SHOW TABLES LIKE '$full'")) $dump['tables'][$t] = $wpdb->get_results("SELECT * FROM $full", ARRAY_A);
  }
  // reservas + tipos (posts) tambien
  foreach (['reservation', 'room', 'cg_slide', 'cg_gallery'] as $pt) {
    $rows = [];
    foreach (get_posts(['post_type' => $pt, 'posts_per_page' => -1, 'post_status' => 'any']) as $p)
      $rows[] = ['ID' => $p->ID, 'title' => $p->post_title, 'status' => $p->post_status, 'meta' => get_post_meta($p->ID)];
    $dump['posts'][$pt] = $rows;
  }
  if (function_exists('cg_log')) cg_log('backup', 'export completo JSON');
  header('Content-Type: application/json; charset=utf-8');
  header('Content-Disposition: attachment; filename="casagrande-backup-' . current_time('Ymd-His') . '.json"');
  echo wp_json_encode($dump, JSON_UNESCAPED_UNICODE);
  exit;
});
add_action('cg_dashboard_bottom', function () {
  echo '<p style="margin-top:12px"><a class="button" href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg7_backup'), 'cg7_backup')) . '">💾 Descargar backup completo (JSON)</a> <span style="font-size:11px;color:#64748b">Todos los datos del CRM en un archivo — portabilidad total.</span></p>';
}, 20);
