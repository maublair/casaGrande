<?php
/**
 * Plugin Name: Casa Grande CRM (pro)
 * Description: Centro de alertas operativas, tape chart por habitacion, voucher de reserva imprimible, export CSV y rack visual.
 */
if (!defined('ABSPATH')) exit;

/* ================= Centro de alertas operativas ================= */
function cg4_alerts() {
  global $wpdb; $out = [];
  // 1) Almacen: vencidos y por vencer (<=15d)
  $t = cg_tbl('inventory');
  foreach ($wpdb->get_results("SELECT name, expiry_date FROM $t WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 15 DAY) ORDER BY expiry_date LIMIT 6") as $r) {
    $venc = strtotime($r->expiry_date) < time();
    $out[] = ['sev' => $venc ? 'alta' : 'media', 'icon' => '🥫',
      'txt' => $r->name . ($venc ? ' VENCIDO (' : ' vence pronto (') . $r->expiry_date . ')',
      'url' => admin_url('admin.php?page=cg-crm-almacen')];
  }
  // 2) Stock bajo
  $n = (int) $wpdb->get_var("SELECT COUNT(*) FROM $t WHERE stock <= min_stock");
  if ($n) $out[] = ['sev' => 'media', 'icon' => '📦', 'txt' => "$n items en o bajo stock minimo", 'url' => admin_url('admin.php?page=cg-crm-almacen')];
  // 3) Contratos por vencer (<=30d)
  foreach ($wpdb->get_results("SELECT name, contract_end FROM " . cg_tbl('staff') . " WHERE active=1 AND contract_end IS NOT NULL AND contract_end <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY contract_end LIMIT 4") as $r)
    $out[] = ['sev' => 'media', 'icon' => '📄', 'txt' => 'Contrato de ' . $r->name . ' vence ' . $r->contract_end, 'url' => admin_url('admin.php?page=cg-crm-personal')];
  // 4) Boletas pendientes del mes
  $n = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM " . cg_tbl('payslips') . " WHERE period=%s AND paid=0", date('Y-m')));
  if ($n) $out[] = ['sev' => 'alta', 'icon' => '💰', 'txt' => "$n boletas de planilla pendientes de pago este mes", 'url' => admin_url('admin.php?page=cg-crm-personal&vista=planilla')];
  // 5) Cuartos sucios / mantenimiento
  $hk = cg_hk_counts();
  if (($hk['sucio'] ?? 0) > 0) $out[] = ['sev' => 'media', 'icon' => '🧹', 'txt' => $hk['sucio'] . ' habitaciones sucias por limpiar', 'url' => admin_url('admin.php?page=cg-crm-limpieza')];
  if (($hk['mantenimiento'] ?? 0) > 0) $out[] = ['sev' => 'baja', 'icon' => '🔧', 'txt' => $hk['mantenimiento'] . ' habitaciones en mantenimiento', 'url' => admin_url('admin.php?page=cg-crm-limpieza')];
  // 6) WhatsApp sin responder con ventana abierta
  $rows = $wpdb->get_results("SELECT name, phone, last_ts FROM " . cg_tbl('wa_conversations') . " WHERE unread > 0 ORDER BY last_ts DESC LIMIT 4");
  foreach ($rows as $r) {
    $open = (time() - strtotime($r->last_ts)) < 86400;
    $out[] = ['sev' => $open ? 'alta' : 'media', 'icon' => '💬',
      'txt' => 'WhatsApp sin responder: ' . ($r->name ?: $r->phone) . ($open ? ' (ventana gratis ABIERTA)' : ' (ventana cerrada)'),
      'url' => admin_url('admin.php?page=cg-crm-whatsapp')];
  }
  // 6b) Ordenes de mantenimiento abiertas de prioridad alta
  if ($wpdb->get_var("SHOW TABLES LIKE '" . cg_tbl('maintenance') . "'")) {
    $n = (int) $wpdb->get_var("SELECT COUNT(*) FROM " . cg_tbl('maintenance') . " WHERE status != 'resuelta' AND priority='alta'");
    if ($n) $out[] = ['sev' => 'alta', 'icon' => '🔧', 'txt' => "$n orden(es) de mantenimiento de prioridad ALTA sin resolver", 'url' => admin_url('admin.php?page=cg-crm-mantenimiento')];
  }
  // 7) Llegadas de hoy sin check-in
  $today = current_time('Y-m-d');
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_check_in', 'value' => $today], ['key' => 'cg_status', 'value' => 'cancelada', 'compare' => '!=']]]);
  $sin = 0; foreach ($q->posts as $rid) if (get_post_meta($rid, 'cg_inhouse', true) !== '1') $sin++;
  if ($sin) $out[] = ['sev' => 'alta', 'icon' => '🛎', 'txt' => "$sin llegadas de hoy sin check-in", 'url' => admin_url('admin.php?page=cg-crm-reservas')];
  return $out;
}
function cg4_alerts_render() {
  $alerts = cg4_alerts();
  $col = ['alta' => '#c0392b', 'media' => '#bd8b00', 'baja' => '#64748b'];
  echo '<div class="cg-card" style="margin-bottom:16px;border-left:4px solid ' . (count($alerts) ? '#c0392b' : '#1a7f37') . '">';
  echo '<h3 style="margin-top:0">🔔 Centro de alertas operativas' . (count($alerts) ? ' (' . count($alerts) . ')' : '') . '</h3>';
  if (!$alerts) { echo '<p style="color:#1a7f37;font-weight:700">Todo en orden: sin alertas pendientes ✔</p></div>'; return; }
  echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:8px">';
  foreach ($alerts as $a) {
    echo '<a href="' . esc_url($a['url']) . '" style="display:flex;gap:8px;align-items:center;background:#f8fafc;border:1px solid #e3e6ea;border-left:3px solid ' . $col[$a['sev']] . ';border-radius:8px;padding:8px 10px;text-decoration:none;color:#0c2b3d;font-size:13px">'
       . '<span>' . $a['icon'] . '</span><span>' . esc_html($a['txt']) . '</span></a>';
  }
  echo '</div></div>';
}

/* ================= Tape chart por habitacion (14 dias) ================= */
function cg4_tape_chart() {
  global $wpdb;
  $floors = cg_rack_floors();
  $piso = (int) ($_GET['tape_piso'] ?? ($floors[0] ?? 1));
  $days = []; for ($i = 0; $i < 14; $i++) $days[] = date('Y-m-d', strtotime("+$i day"));
  $end = date('Y-m-d', strtotime('+14 day'));
  // reservas con numero asignado que tocan la ventana
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_room_number', 'compare' => 'EXISTS'], ['key' => 'cg_status', 'value' => 'cancelada', 'compare' => '!=']]]);
  $occ = []; // occ[numero][fecha] = code
  foreach ($q->posts as $rid) {
    $n = (int) get_post_meta($rid, 'cg_room_number', true); if (!$n) continue;
    $ci = get_post_meta($rid, 'cg_check_in', true); $co = get_post_meta($rid, 'cg_check_out', true);
    if (!$ci || !$co || $co < $days[0] || $ci > $end) continue;
    $code = get_post_meta($rid, 'cg_code', true) ?: ('#' . $rid);
    for ($d = max($ci, $days[0]); $d < min($co, $end); $d = date('Y-m-d', strtotime($d . ' +1 day')))
      $occ[$n][$d] = $code;
  }
  ?>
  <div class="cg-card" style="margin-bottom:14px">
    <h3>🗓 Tape chart — habitaciones del piso <?php echo $piso; ?> (14 dias)</h3>
    <div style="display:flex;gap:6px;margin:8px 0 12px">
      <?php foreach ($floors as $f) : ?>
        <a href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-reservas', 'tape_piso' => $f], admin_url('admin.php'))); ?>"
           style="padding:5px 12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;<?php echo $f === $piso ? 'background:#0c2b3d;color:#fff' : 'background:#eef0f2;color:#50575e'; ?>">P<?php echo $f; ?></a>
      <?php endforeach; ?>
    </div>
    <div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:10px;min-width:900px">
      <tr><th style="text-align:left;padding:3px 8px;position:sticky;left:0;background:#fff">Hab.</th>
      <?php foreach ($days as $d) : $we = in_array(date('N', strtotime($d)), ['6','7']); ?>
        <th style="padding:3px 4px;color:<?php echo $we ? '#c0392b' : '#64748b'; ?>"><?php echo date('D d', strtotime($d)); ?></th>
      <?php endforeach; ?></tr>
      <?php foreach (cg_rack_rows($piso) as $r) : ?>
        <tr><td style="padding:3px 8px;font-weight:800;position:sticky;left:0;background:#fff;color:#0c2b3d"><?php echo (int) $r->number; ?><?php echo $r->active ? '' : ' <span style="color:#c0392b">✕</span>'; ?></td>
        <?php foreach ($days as $d) : $code = $occ[$r->number][$d] ?? null; ?>
          <td title="<?php echo esc_attr($code ? $code : 'libre'); ?>" style="width:52px;padding:3px 2px;text-align:center;border:1px solid #fff;border-radius:2px;<?php
            if (!$r->active) echo 'background:#e5e7eb;color:#9ca3af';
            elseif ($code) echo 'background:#0c2b3d;color:#8fd3ff;font-weight:700';
            else echo 'background:#dff5e5;color:#9fc5a8'; ?>"><?php echo $code ? esc_html(substr($code, -4)) : '·'; ?></td>
        <?php endforeach; ?></tr>
      <?php endforeach; ?>
    </table></div>
    <p style="font-size:11px;color:#64748b">Azul = reservado/ocupado (ultimos 4 del codigo; hover = codigo completo) · Verde = libre · Gris = fuera de servicio.</p>
  </div>
  <?php
}
// insertar el tape chart al inicio del front desk
add_action('cg_frontdesk_top', 'cg4_tape_chart');

/* ================= Voucher de reserva imprimible ================= */
function cg4_render_voucher() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $id = (int) ($_GET['id'] ?? 0);
  $p = get_post($id);
  if (!$p || $p->post_type !== 'reservation') { echo 'Reserva no encontrada'; return; }
  $g = function ($k) use ($id) { return get_post_meta($id, 'cg_' . $k, true); };
  $folio = function_exists('cg_folio_rows') ? cg_folio_rows($id) : [];
  $nights = max(1, (int) ((strtotime($g('check_out')) - strtotime($g('check_in'))) / 86400));
  ?>
  <style>#adminmenumain,#wpadminbar,#wpfooter{display:none!important}#wpcontent{margin-left:0!important}
  .vch{max-width:680px;margin:24px auto;background:#fff;border:2px solid #0c2b3d;padding:26px;font-family:Georgia,serif}
  .vch table{width:100%;border-collapse:collapse;font-size:13px}.vch td,.vch th{border:1px solid #94a3b8;padding:7px 10px}
  @media print{.no-print{display:none}}</style>
  <div class="vch">
    <h1 style="text-align:center;font-size:19px;margin:0">CONFIRMACION DE RESERVA</h1>
    <p style="text-align:center;color:#64748b;font-size:12px;margin:4px 0 16px">Hotel Boutique Casa Grande · Av. Luna Pizarro 202, Vallecito, Arequipa · (054) 214000</p>
    <table style="margin-bottom:12px">
      <tr><td><b>Codigo</b></td><td style="font-size:16px"><b><?php echo esc_html($g('code')); ?></b></td><td><b>Habitacion</b></td><td style="font-size:16px"><b>N° <?php echo esc_html($g('room_number') ?: 'por asignar'); ?></b></td></tr>
      <tr><td><b>Huesped</b></td><td><?php echo esc_html($g('name') ?: trim(explode('-', $p->post_title)[1] ?? '')); ?></td><td><b>Tipo</b></td><td><?php echo esc_html($g('room')); ?></td></tr>
      <tr><td><b>Check-in</b></td><td><?php echo esc_html($g('check_in')); ?> (desde 2:00 pm)</td><td><b>Check-out</b></td><td><?php echo esc_html($g('check_out')); ?> (hasta 12:00 pm)</td></tr>
      <tr><td><b>Noches</b></td><td><?php echo $nights; ?></td><td><b>Huespedes</b></td><td><?php echo esc_html($g('adults') ?: '2'); ?> adulto(s)<?php echo $g('children') ? ' + ' . esc_html($g('children')) . ' nino(s)' : ''; ?></td></tr>
      <tr style="background:#eef2f7"><td><b>Alojamiento</b></td><td><b>S/ <?php echo number_format((float) $g('total'), 2); ?></b></td><td><b>Estado de pago</b></td><td><b><?php echo esc_html(ucwords(str_replace('_', ' ', $g('payment') ?: 'por pagar'))); ?></b></td></tr>
    </table>
    <?php if ($folio) : $ft = 0; ?>
      <table><tr style="background:#eef2f7"><th colspan="3">Consumos cargados a la habitacion</th></tr>
      <?php foreach ($folio as $f) : $ft += (float) $f->total; ?>
        <tr><td><?php echo esc_html(date('d/m', strtotime($f->ts))); ?></td><td><?php echo esc_html($f->concept); ?> × <?php echo rtrim(rtrim(number_format((float) $f->qty, 2), '0'), '.'); ?></td><td style="text-align:right">S/ <?php echo number_format((float) $f->total, 2); ?></td></tr>
      <?php endforeach; ?>
      <tr><td colspan="2"><b>Total consumos</b></td><td style="text-align:right"><b>S/ <?php echo number_format($ft, 2); ?></b></td></tr></table>
    <?php endif; ?>
    <?php if (function_exists('cg_res_paid_sum')) :
      $paid = cg_res_paid_sum($id); $tot = (float) $g('total');
      if ($paid > 0) : ?>
      <table style="margin-top:10px"><tr style="background:#dff5e5"><td><b>Pagado</b></td><td style="text-align:right"><b>S/ <?php echo number_format($paid, 2); ?></b></td>
        <td><b>Saldo</b></td><td style="text-align:right"><b>S/ <?php echo number_format(max(0, $tot - $paid), 2); ?></b></td></tr></table>
    <?php endif; endif; ?>
    <p style="font-size:11px;color:#64748b;margin-top:14px">Desayuno buffet incluido (7:00–10:00 am) · WiFi gratuito · Presentar documento de identidad al check-in.</p>
    <p class="no-print" style="text-align:center;margin-top:14px"><button class="button button-primary" onclick="window.print()">🖨 Imprimir voucher</button></p>
  </div>
  <?php
}
add_action('admin_menu', function () {
  add_submenu_page('', 'Voucher', 'Voucher', 'manage_hotel', 'cg-crm-voucher', 'cg4_render_voucher');
}, 20);

/* ================= Export CSV ================= */
function cg4_csv_out($filename, $header, $rows) {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="' . $filename . '"');
  $fp = fopen('php://output', 'w');
  fputs($fp, "\xEF\xBB\xBF"); // BOM para Excel
  fputcsv($fp, $header);
  foreach ($rows as $r) fputcsv($fp, $r);
  exit;
}
add_action('admin_post_cg4_csv_fin', function () {
  check_admin_referer('cg4_csv');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $from = sanitize_text_field($_GET['from'] ?? date('Y-m-01'));
  $to = sanitize_text_field($_GET['to'] ?? date('Y-m-t'));
  $fin = cg_finance_summary($from, $to);
  $rows = [];
  foreach ($fin['ing_rows'] as $r) $rows[] = ['INGRESO', $r['date'], $r['category'], $r['concept'], number_format($r['amount'], 2, '.', '')];
  foreach ($fin['egr_rows'] as $r) $rows[] = ['EGRESO', $r['date'], $r['category'], $r['concept'], number_format($r['amount'], 2, '.', '')];
  $rows[] = []; $rows[] = ['RESUMEN', '', '', 'Ingresos', number_format($fin['ingresos'], 2, '.', '')];
  $rows[] = ['', '', '', 'Egresos', number_format($fin['egresos'], 2, '.', '')];
  $rows[] = ['', '', '', 'Utilidad', number_format($fin['utilidad'], 2, '.', '')];
  $rows[] = ['', '', '', 'IGV estimado', number_format($fin['igv'], 2, '.', '')];
  cg4_csv_out("finanzas_{$from}_{$to}.csv", ['Tipo', 'Fecha', 'Categoria', 'Concepto', 'Monto S/'], $rows);
});
add_action('admin_post_cg4_csv_planilla', function () {
  check_admin_referer('cg4_csv');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $period = sanitize_text_field($_GET['period'] ?? date('Y-m'));
  $rows = [];
  foreach ($wpdb->get_results($wpdb->prepare("SELECT p.*, s.name, s.doc_id, s.role FROM " . cg_tbl('payslips') . " p JOIN " . cg_tbl('staff') . " s ON s.id=p.staff_id WHERE p.period=%s ORDER BY s.name", $period)) as $p)
    $rows[] = [$p->name, $p->doc_id, $p->role, $p->base, $p->family_allow, $p->bonuses, $p->gross,
      strtoupper($p->pension_type), $p->pension_amount, $p->net, $p->essalud,
      number_format((float) $p->gross + (float) $p->essalud, 2, '.', ''), $p->paid ? 'PAGADO' : 'PENDIENTE'];
  cg4_csv_out("planilla_{$period}.csv",
    ['Trabajador', 'DNI', 'Cargo', 'Basico', 'Asig.Familiar', 'Bonos', 'Bruto', 'Pension', 'Dscto.Pension', 'NETO', 'EsSalud', 'Costo Hotel', 'Estado'], $rows);
});
add_action('admin_post_cg4_csv_reservas', function () {
  check_admin_referer('cg4_csv');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $rows = [];
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'date', 'order' => 'DESC']);
  foreach ($q->posts as $p) {
    $g = function ($k) use ($p) { return get_post_meta($p->ID, 'cg_' . $k, true); };
    $rows[] = [$g('code'), $g('name') ?: trim(explode('-', $p->post_title)[1] ?? ''), $g('room'), $g('room_number'),
      $g('check_in'), $g('check_out'), $g('total'), $g('payment'), $g('status'), $g('inhouse') === '1' ? 'IN-HOUSE' : ''];
  }
  cg4_csv_out('reservas.csv', ['Codigo', 'Huesped', 'Tipo', 'Hab.', 'Check-in', 'Check-out', 'Total S/', 'Pago', 'Estado', 'En casa'], $rows);
});

/* ================= Rack visual (grid de colores) ================= */
function cg4_rack_grid() {
  $floors = cg_rack_floors();
  // in-house por numero
  $inhouse = [];
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_inhouse', 'value' => '1']]]);
  foreach ($q->posts as $rid) { $n = get_post_meta($rid, 'cg_room_number', true); if ($n) $inhouse[(int) $n] = 1; }
  echo '<div class="cg-card" style="margin-bottom:14px"><h3>🏨 Mapa del hotel (estado en vivo)</h3>';
  foreach ($floors as $f) {
    echo '<div style="display:flex;gap:5px;align-items:center;margin:7px 0"><b style="width:52px;color:#0c2b3d">Piso ' . $f . '</b><div style="display:flex;gap:4px;flex-wrap:wrap">';
    foreach (cg_rack_rows($f) as $r) {
      $hk = cg2_hk_status_of($r->number);
      if (!$r->active) { $bg = '#e5e7eb'; $fg = '#9ca3af'; $lbl = 'fuera de servicio'; }
      elseif (!empty($inhouse[(int) $r->number])) { $bg = '#0c2b3d'; $fg = '#8fd3ff'; $lbl = 'ocupada (in-house)'; }
      elseif ($hk === 'sucio') { $bg = '#fdecea'; $fg = '#c0392b'; $lbl = 'sucia'; }
      elseif ($hk === 'en_limpieza') { $bg = '#fef6e0'; $fg = '#bd8b00'; $lbl = 'en limpieza'; }
      elseif ($hk === 'mantenimiento') { $bg = '#f3e8fb'; $fg = '#7b3fa0'; $lbl = 'mantenimiento'; }
      else { $bg = '#dff5e5'; $fg = '#155724'; $lbl = 'limpia y disponible'; }
      echo '<span title="Hab. ' . $r->number . ' — ' . esc_attr($lbl) . '" style="width:40px;height:30px;display:flex;align-items:center;justify-content:center;background:' . $bg . ';color:' . $fg . ';border-radius:6px;font-size:11px;font-weight:800">' . (int) $r->number . '</span>';
    }
    echo '</div></div>';
  }
  echo '<p style="font-size:11px;color:#64748b">Azul: ocupada · Verde: disponible · Rojo: sucia · Ambar: en limpieza · Morado: mantenimiento · Gris: fuera de servicio.</p></div>';
}
add_action('cg_cuartos_top', 'cg4_rack_grid');
