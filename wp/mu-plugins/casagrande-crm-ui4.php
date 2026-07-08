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
  $start = apply_filters('cg_tape_start', current_time('Y-m-d'));
  $days = []; for ($i = 0; $i < 14; $i++) $days[] = date('Y-m-d', strtotime($start . " +$i day"));
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
    <div style="display:flex;gap:6px;margin:8px 0 12px;align-items:center">
      <a class="button button-small" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-reservas', 'tape_piso' => $piso, 'tape_ini' => date('Y-m-d', strtotime($start . ' -14 day'))], admin_url('admin.php'))); ?>">← 2 sem</a>
      <a class="button button-small" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-reservas', 'tape_piso' => $piso, 'tape_ini' => date('Y-m-d', strtotime($start . ' +14 day'))], admin_url('admin.php'))); ?>">2 sem →</a>
      <b style="font-size:12px;color:#64748b"><?php echo esc_html(date('d/m', strtotime($days[0])) . ' — ' . date('d/m', strtotime($days[13]))); ?></b>
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
  global $wpdb;
  $floors = cg_rack_floors();
  
  // in-house por numero
  $inhouse = [];
  $q = new WP_Query(['post_type' => 'reservation', 'posts_per_page' => -1, 'post_status' => 'publish', 'fields' => 'ids',
    'meta_query' => [['key' => 'cg_inhouse', 'value' => '1']]]);
  foreach ($q->posts as $rid) { $n = get_post_meta($rid, 'cg_room_number', true); if ($n) $inhouse[(int) $n] = 1; }

  // Query rooms database
  $t_rooms = cg_tbl('rooms');
  $t_hk = cg_tbl('housekeeping');
  $t_maint = cg_tbl('maintenance');
  $t_staff = cg_tbl('staff');

  // Query housekeeping row map
  $hk_by_room = [];
  foreach ($wpdb->get_results("SELECT h.*, s.name as staff_name FROM $t_hk h LEFT JOIN $t_staff s ON s.id = h.staff_id") as $h) {
    if (preg_match('/Hab\. (\d+)/', $h->room_name, $m)) {
      $hk_by_room[(int) $m[1]] = $h;
    }
  }

  // Query staff list for maintenance assignment
  $staff_maint = $wpdb->get_results("SELECT id, name FROM $t_staff WHERE active=1 ORDER BY name");
  $staff_options_html = '<option value="0">— sin asignar —</option>';
  foreach ($staff_maint as $st) {
    $staff_options_html .= '<option value="' . $st->id . '">' . esc_html($st->name) . '</option>';
  }

  // Compile room types
  $types_arr = [];
  foreach (get_posts(['post_type'=>'room','posts_per_page'=>-1,'post_status'=>'publish']) as $type_post) {
    $types_arr[$type_post->ID] = $type_post->post_title;
  }

  // Compile all reservations for histories
  $res_query = new WP_Query([
    'post_type' => 'reservation',
    'posts_per_page' => -1,
    'post_status' => 'publish'
  ]);
  $res_by_room = [];
  foreach ($res_query->posts as $post) {
    $rid = $post->ID;
    $rnum = (int) get_post_meta($rid, 'cg_room_number', true);
    if ($rnum) {
      $res_by_room[$rnum][] = [
        'id' => $rid,
        'code' => get_post_meta($rid, 'cg_code', true) ?: $post->post_title,
        'name' => get_post_meta($rid, 'cg_name', true) ?: trim(explode('-', $post->post_title)[1] ?? ''),
        'doc_type' => get_post_meta($rid, 'cg_doc_type', true) ?: 'DNI',
        'doc_number' => get_post_meta($rid, 'cg_doc_number', true) ?: (get_post_meta($rid, 'cg_doc', true) ?: '—'),
        'nationality' => get_post_meta($rid, 'cg_nationality', true) ?: 'Peruano',
        'check_in' => get_post_meta($rid, 'cg_check_in', true),
        'check_out' => get_post_meta($rid, 'cg_check_out', true),
        'total' => (float) get_post_meta($rid, 'cg_total', true),
        'payment' => get_post_meta($rid, 'cg_payment', true) ?: 'por_pagar',
        'status' => get_post_meta($rid, 'cg_status', true) ?: 'confirmada',
        'inhouse' => get_post_meta($rid, 'cg_inhouse', true) === '1',
        'adults' => get_post_meta($rid, 'cg_adults', true) ?: '2',
        'children' => get_post_meta($rid, 'cg_children', true) ?: '0',
        'special' => get_post_meta($rid, 'cg_special_requests', true) ?: '',
        'folio_total' => cg_folio_total($rid),
      ];
    }
  }

  // Compile maintenance history
  $maint_rows = $wpdb->get_results("SELECT m.*, s.name as staff_name FROM $t_maint m LEFT JOIN $t_staff s ON s.id = m.staff_id ORDER BY m.created DESC");
  $maint_by_room = [];
  foreach ($maint_rows as $m) {
    if ($m->room_number) {
      $maint_by_room[(int) $m->room_number][] = [
        'id' => $m->id,
        'issue' => $m->issue,
        'priority' => $m->priority,
        'status' => $m->status,
        'staff_name' => $m->staff_name ?: '—',
        'cost' => (float) $m->cost,
        'created' => $m->created,
        'resolved' => $m->resolved,
      ];
    }
  }

  // Build JSON maps of rooms
  $rooms_data = [];
  foreach ($floors as $f) {
    foreach (cg_rack_rows($f) as $r) {
      $num = (int) $r->number;
      $hk = $hk_by_room[$num] ?? null;
      $hk_status = $hk ? $hk->status : 'limpio';
      $hk_updated = $hk ? $hk->updated : '—';
      $hk_id = $hk ? $hk->id : 0;
      $hk_note = $hk ? $hk->note : '';
      $hk_staff = $hk ? $hk->staff_name : '—';
      $occupied = !empty($inhouse[$num]);
      $type_name = $types_arr[$r->type_id] ?? '—';
      
      $active_res = null;
      $room_res_history = $res_by_room[$num] ?? [];
      foreach ($room_res_history as $res) {
        if ($res['inhouse']) {
          $active_res = $res;
          break;
        }
      }
      
      // Dynamic features structure
      $beds = "1 Cama Queen";
      $tv = "Smart TV 50\"";
      $channels = "TV Cable HD (60 canales)";
      $streaming = "YouTube, Netflix (cuenta propia)";
      $bath = "Ducha de lluvia española, agua caliente";
      if ($num % 10 == 8 || in_array($num, [108, 208, 308, 408, 508])) {
        $beds = "1 Cama King Premium";
        $tv = "Smart TV 55\" 4K Ultra HD";
        $channels = "TV Cable Premium (120 canales)";
        $streaming = "Netflix (cuenta hotel), Disney+, Prime Video";
        $bath = "Tina de hidromasaje (Jacuzzi), ducha y tocador doble";
      } elseif ($num % 2 == 0) {
        $beds = "2 Camas Twin";
        $bath = "Tina de baño y ducha, agua caliente";
      }
      $structured_features = [
        'beds' => $beds,
        'tv' => $tv,
        'channels' => $channels,
        'streaming' => $streaming,
        'bath' => $bath,
        'custom' => $r->features ?: ''
      ];

      // Next cleaning schedule
      $next_cleaning = "Al próximo Check-in";
      if ($occupied) {
        $next_cleaning = "Hoy a las 11:30 AM (Limpieza diaria)";
      } elseif ($hk_status === 'sucio') {
        $next_cleaning = "Inmediata (Prioridad Alta)";
      } elseif ($hk_status === 'en_limpieza') {
        $next_cleaning = "En progreso en este momento";
      }

      // Fetch Room Inventory
      $inventory = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('room_inventory') . " WHERE room_number=%d ORDER BY id ASC", $num));
      foreach ($inventory as $item) {
        $item->damage_log_parsed = json_decode($item->damage_log ?: '[]', true) ?: [];
      }

      $rooms_data[$num] = [
        'number' => $num,
        'floor' => (int) $r->floor,
        'type_name' => $type_name,
        'capacity' => (int) $r->cap_adults . ' Ad. + ' . (int) $r->cap_children . ' Ni.',
        'features' => $r->features ?: 'Básico',
        'structured_features' => $structured_features,
        'next_cleaning' => $next_cleaning,
        'inventory' => $inventory,
        'active' => (bool) $r->active,
        'hk_status' => $hk_status,
        'hk_updated' => $hk_updated,
        'hk_id' => $hk_id,
        'hk_note' => $hk_note,
        'hk_staff' => $hk_staff,
        'occupied' => $occupied,
        'active_res' => $active_res,
        'history' => $room_res_history,
        'maintenance' => $maint_by_room[$num] ?? [],
      ];
    }
  }

  echo '<div class="cg-card" style="margin-bottom:14px; padding: 20px;">
    <h3 style="margin-top:0; margin-bottom:16px;">🏨 Mapa del hotel (estado en vivo)</h3>
    <div class="cg-rack-container" style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-start;">
      <!-- Columna Izquierda: Mapa -->
      <div class="cg-rack-map" style="flex:1 1 450px; min-width:300px;">';
        foreach ($floors as $f) {
          echo '<div style="display:flex;gap:5px;align-items:center;margin:8px 0"><b style="width:55px;color:#0c2b3d;font-size:12px;">Piso ' . $f . '</b><div style="display:flex;gap:5px;flex-wrap:wrap">';
          foreach (cg_rack_rows($f) as $r) {
            $hk = cg2_hk_status_of($r->number);
            if (!$r->active) { $bg = '#e5e7eb'; $fg = '#9ca3af'; $lbl = 'fuera de servicio'; }
            elseif (!empty($inhouse[(int) $r->number])) { $bg = '#0c2b3d'; $fg = '#8fd3ff'; $lbl = 'ocupada (in-house)'; }
            elseif ($hk === 'sucio') { $bg = '#fdecea'; $fg = '#c0392b'; $lbl = 'sucia'; }
            elseif ($hk === 'en_limpieza') { $bg = '#fef6e0'; $fg = '#bd8b00'; $lbl = 'en limpieza'; }
            elseif ($hk === 'mantenimiento') { $bg = '#f3e8fb'; $fg = '#7b3fa0'; $lbl = 'mantenimiento'; }
            else { $bg = '#dff5e5'; $fg = '#155724'; $lbl = 'limpia y disponible'; }
            
            echo '<button type="button" class="cg-room-btn" data-room="' . (int) $r->number . '" title="Hab. ' . $r->number . ' — ' . esc_attr($lbl) . '" style="width:42px;height:32px;display:flex;align-items:center;justify-content:center;background:' . $bg . ';color:' . $fg . ';border-radius:8px;font-size:12px;font-weight:800;border:none;cursor:pointer;transition:transform 0.15s ease, box-shadow 0.15s ease;" onmouseover="this.style.transform=\'scale(1.08)\';this.style.boxShadow=\'0 4px 6px rgba(0,0,0,0.1)\'" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'none\'">' . (int) $r->number . '</button>';
          }
          echo '</div></div>';
        }
  echo '</div>
      <!-- Columna Derecha: Leyenda e Índice -->
      <div class="cg-rack-legend" style="flex:0 0 240px; min-width:200px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:15px; font-size:12px; color:#475569;">
        <h4 style="margin:0 0 10px; color:#0c2b3d; font-size:13px; font-weight:700;">📌 Estado de Habitaciones</h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#dff5e5; display:inline-block; border:1px solid #b2f0c2;"></span> <b>Limpia y Disponible</b></div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#0c2b3d; display:inline-block; border:1px solid #061621;"></span> <b style="color:#0c2b3d">Ocupada (In-house)</b></div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#fdecea; display:inline-block; border:1px solid #f8b4b4;"></span> <b style="color:#c0392b">Sucia</b></div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#fef6e0; display:inline-block; border:1px solid #fde68a;"></span> <b style="color:#bd8b00">En Limpieza</b></div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#f3e8fb; display:inline-block; border:1px solid #ddd6fe;"></span> <b style="color:#7b3fa0">Mantenimiento</b></div>
          <div style="display:flex; align-items:center; gap:8px;"><span style="width:16px; height:16px; border-radius:4px; background:#e5e7eb; display:inline-block; border:1px solid #cbd5e1;"></span> <b>Fuera de Servicio</b></div>
        </div>
        <p style="margin-top:12px; margin-bottom:0; font-size:10.5px; color:#64748b; line-height:1.4;">Haz clic en cualquier habitación para ver su ficha técnica, historial, inventario de baño/muebles y registrar mantenimientos.</p>
      </div>
    </div>
  </div>';

  // Output JSON Map
  echo '<script>window.cgRoomsData = ' . json_encode($rooms_data) . ';</script>';
  
  // Output Modal HTML
  ?>
  <div id="cg-room-modal" style="display:none; position:fixed; inset:0; z-index:99999; align-items:center; justify-content:center; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
    <!-- Backdrop -->
    <div id="cg-modal-backdrop" style="position:absolute; inset:0; background:rgba(15, 23, 42, 0.65); backdrop-filter:blur(4px);"></div>
    
    <!-- Modal Card -->
    <div style="position:relative; width:92%; max-width:760px; background:#fff; border-radius:16px; box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow:hidden; display:flex; flex-direction:column; max-height:85vh; border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="padding:18px 24px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; background:#0c2b3d; color:#fff;">
        <div>
          <h3 id="cg-modal-title" style="margin:0; font-size:18px; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">Habitación</h3>
          <p id="cg-modal-subtitle" style="margin:4px 0 0; font-size:12px; color:#94a3b8;">—</p>
        </div>
        <button type="button" id="cg-modal-close" style="background:none; border:none; color:#cbd5e1; font-size:26px; cursor:pointer; line-height:1; padding:4px;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#cbd5e1'">×</button>
      </div>
      
      <!-- Navigation Tabs -->
      <div style="display:flex; background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:0 16px; flex-wrap:wrap;">
        <button type="button" class="cg-tab-btn active" data-tab="general" style="padding:12px 14px; border:none; background:none; font-size:12.5px; font-weight:600; color:#0c2b3d; border-bottom:2px solid #0c2b3d; cursor:pointer; outline:none;">Ficha y Huésped</button>
        <button type="button" class="cg-tab-btn" data-tab="reservas" style="padding:12px 14px; border:none; background:none; font-size:12.5px; font-weight:500; color:#64748b; border-bottom:2px solid transparent; cursor:pointer; outline:none;">Historial Huéspedes</button>
        <button type="button" class="cg-tab-btn" data-tab="inventario" style="padding:12px 14px; border:none; background:none; font-size:12.5px; font-weight:500; color:#64748b; border-bottom:2px solid transparent; cursor:pointer; outline:none;">📋 Inventario Habitación</button>
        <button type="button" class="cg-tab-btn" data-tab="mantenimiento" style="padding:12px 14px; border:none; background:none; font-size:12.5px; font-weight:500; color:#64748b; border-bottom:2px solid transparent; cursor:pointer; outline:none;">🔧 Mantenimiento</button>
      </div>
      
      <!-- Body Scrollable -->
      <div id="cg-modal-body" style="padding:24px; overflow-y:auto; flex:1; font-size:13px; color:#334155; line-height:1.5; background:#fff;">
         <!-- Content injected by JS -->
      </div>
    </div>
  </div>

  <style>
  .cg-tab-btn:hover { color: #0c2b3d !important; }
  .cg-tab-btn.active { color: #0c2b3d !important; border-bottom-color: #0c2b3d !important; font-weight: 600 !important; }
  .cg-modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cg-modal-card-sub { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:16px; }
  @media (max-width: 600px) { .cg-modal-info-grid { grid-template-columns: 1fr; } }
  </style>

  <script>
  jQuery(function($){
    var currentRoom = null;
    
    // Tab switching
    $(document).on('click', '.cg-tab-btn', function(){
      $('.cg-tab-btn').removeClass('active').css('border-bottom-color', 'transparent').css('color', '#64748b');
      $(this).addClass('active').css('border-bottom-color', '#0c2b3d').css('color', '#0c2b3d');
      renderTab($(this).data('tab'));
    });
    
    // Open modal
    $('.cg-room-btn').on('click', function(e){
      e.preventDefault();
      var rNum = $(this).data('room');
      currentRoom = window.cgRoomsData[rNum];
      if (!currentRoom) return;
      
      $('#cg-modal-title').html('🏨 Habitación ' + currentRoom.number);
      $('#cg-modal-subtitle').text(currentRoom.type_name + ' · Piso ' + currentRoom.floor + ' · Capacidad: ' + currentRoom.capacity);
      
      $('.cg-tab-btn[data-tab="general"]').trigger('click');
      $('#cg-room-modal').css('display', 'flex');
    });
    
    // Close modal
    $('#cg-modal-close, #cg-modal-backdrop').on('click', function(){
      $('#cg-room-modal').css('display', 'none');
    });
    
    // Render Tab Content
    function renderTab(tab) {
      if (!currentRoom) return;
      var html = '';
      
      if (tab === 'general') {
        html += '<div class="cg-modal-info-grid">';
        
        // Col 1: Room Specs and Cleaning Info
        html += '<div>';
        html += '<h4 style="margin:0 0 10px; color:#0c2b3d; font-size:14px; font-weight:700;">📋 Ficha Técnica de Habitación</h4>';
        html += '<div class="cg-modal-card-sub" style="font-size:12.5px;">';
        var sf = currentRoom.structured_features;
        html += '<p style="margin:4px 0;">🛏️ <strong>Camas:</strong> ' + sf.beds + '</p>';
        html += '<p style="margin:4px 0;">📺 <strong>Televisión:</strong> ' + sf.tv + '</p>';
        html += '<p style="margin:4px 0;">📡 <strong>Canales:</strong> ' + sf.channels + '</p>';
        html += '<p style="margin:4px 0;">🎬 <strong>Streaming:</strong> ' + sf.streaming + '</p>';
        html += '<p style="margin:4px 0;">🚿 <strong>Baño:</strong> ' + sf.bath + '</p>';
        if (sf.custom) {
          html += '<p style="margin:8px 0 4px; padding-top:6px; border-top:1px solid #e2e8f0;">⭐ <strong>Adicionales:</strong> ' + sf.custom + '</p>';
        }
        html += '</div>';

        html += '<h4 style="margin:14px 0 8px; color:#0c2b3d; font-size:13px; font-weight:700;">🧹 Programación de Limpieza</h4>';
        html += '<div class="cg-modal-card-sub" style="font-size:12px;">';
        html += '<p><strong>Siguiente Limpieza:</strong> <span style="color:#2563eb; font-weight:700;">' + currentRoom.next_cleaning + '</span></p>';
        
        var hkBadges = {
          'limpio': '<span style="background:#dff5e5; color:#1a7f37; padding:2px 8px; border-radius:12px; font-weight:700; font-size:11px;">Limpio</span>',
          'sucio': '<span style="background:#fdecea; color:#c0392b; padding:2px 8px; border-radius:12px; font-weight:700; font-size:11px;">Sucio</span>',
          'en_limpieza': '<span style="background:#fef6e0; color:#bd8b00; padding:2px 8px; border-radius:12px; font-weight:700; font-size:11px;">En Limpieza</span>',
          'mantenimiento': '<span style="background:#f3e8fb; color:#7b3fa0; padding:2px 8px; border-radius:12px; font-weight:700; font-size:11px;">Mantenimiento</span>'
        };
        html += '<p style="margin-top:8px;"><strong>Estado Actual:</strong> ' + (hkBadges[currentRoom.hk_status] || currentRoom.hk_status) + '</p>';
        html += '<p style="font-size:11px; color:#64748b; margin-top:4px;">Última actualización: ' + currentRoom.hk_updated + '</p>';
        if (currentRoom.hk_staff && currentRoom.hk_staff !== '—') {
          html += '<p style="font-size:11px; color:#64748b;">Personal asignado: ' + currentRoom.hk_staff + '</p>';
        }
        if (currentRoom.hk_note) {
          html += '<p style="font-size:11px; color:#64748b;">Nota: <em>' + currentRoom.hk_note + '</em></p>';
        }
        html += '</div>';
        
        // Actions
        html += '<h4 style="margin:14px 0 8px; color:#0c2b3d; font-size:13px; font-weight:700;">🧹 Cambiar Estado de Limpieza</h4>';
        html += '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">';
        
        if (currentRoom.hk_status === 'sucio') {
          html += '<a class="button button-primary button-small" href="<?php echo esc_url(admin_url("admin-post.php?action=cg5_hkq&f=all&st=en_limpieza&id=")); ?>' + currentRoom.hk_id + '">▶ Iniciar Limpieza</a>';
        } else if (currentRoom.hk_status === 'en_limpieza') {
          html += '<a class="button button-primary button-small" href="<?php echo esc_url(admin_url("admin-post.php?action=cg5_hkq&f=all&st=limpio&id=")); ?>' + currentRoom.hk_id + '">✔ Marcar Limpia</a>';
        } else {
          html += '<a class="button button-small" href="<?php echo esc_url(admin_url("admin-post.php?action=cg5_hkq&f=all&st=sucio&id=")); ?>' + currentRoom.hk_id + '">Marcar Sucia</a>';
        }
        html += '</div>';
        html += '</div>';
        
        // Col 2: Active Occupant / Reservation
        html += '<div>';
        html += '<h4 style="margin:0 0 10px; color:#0c2b3d; font-size:14px; font-weight:700;">🛎️ Huésped Actual (En Casa)</h4>';
        if (currentRoom.active_res) {
          var res = currentRoom.active_res;
          html += '<div class="cg-modal-card-sub" style="border-left:4px solid #0c2b3d; font-size:12.5px;">';
          html += '<p style="font-size:15px; margin:0 0 8px; color:#0c2b3d;"><strong>' + res.name + '</strong></p>';
          html += '<p><strong>Documento:</strong> ' + res.doc_type + ' - ' + res.doc_number + '</p>';
          html += '<p><strong>Nacionalidad:</strong> ' + res.nationality + '</p>';
          html += '<p><strong>Código Reserva:</strong> <code style="background:#eef2f6; padding:2px 6px; border-radius:4px; font-size:11px;">' + res.code + '</code></p>';
          html += '<p><strong>Estadía:</strong> ' + res.check_in + ' ➔ ' + res.check_out + '</p>';
          html += '<p><strong>Huéspedes:</strong> ' + res.adults + ' adultos, ' + res.children + ' niños</p>';
          if (res.special) {
            html += '<p style="color:#d97706; font-size:11px; margin-top:6px; background:#fffbeb; border:1px solid #fef3c7; border-radius:6px; padding:6px 10px;">⚠️ <em>' + res.special + '</em></p>';
          }
          
          html += '<div style="margin-top:14px; border-top:1px dashed #cbd5e1; padding-top:12px;">';
          html += '<p><strong>Alojamiento:</strong> S/ ' + res.total.toFixed(0) + ' (' + (res.payment === 'pagado' ? '<span style="color:#1a7f37; font-weight:700;">Pagado</span>' : '<span style="color:#c0392b; font-weight:700;">Por pagar</span>') + ')</p>';
          if (res.folio_total > 0) {
            html += '<p><strong>Consumos Extras:</strong> <span style="color:#a87214; font-weight:700;">S/ ' + res.folio_total.toFixed(2) + '</span></p>';
          }
          html += '</div>';
          
          html += '<div style="margin-top:14px; display:flex; gap:6px;">';
          html += '<a class="button button-small" href="<?php echo esc_url(admin_url("admin.php?page=cg-crm-reservas&res=")); ?>' + res.id + '#cuenta">🧾 Cuenta</a>';
          html += '<a class="button button-small" style="color:#c0392b;" onclick="return confirm(\'¿Hacer check-out? La cuenta pendiente se liquida como ingreso.\')" href="<?php echo esc_url(admin_url("admin-post.php?action=cg2_checkout&res=")); ?>' + res.id + '">Salida</a>';
          html += '</div>';
          
          html += '</div>';
        } else {
          html += '<div class="cg-modal-card-sub" style="color:#64748b; text-align:center; padding:30px 10px;">';
          html += '<span style="font-size:24px; display:block; margin-bottom:8px;">🍃</span>';
          html += 'Habitación libre y disponible.<br>No hay reserva activa actualmente.';
          html += '</div>';
        }
        html += '</div>';
        
        html += '</div>';
      }
      
      else if (tab === 'reservas') {
        html += '<h4 style="margin:0 0 12px; color:#0c2b3d; font-size:14px; font-weight:700;">📅 Historial de Reservas Asignadas</h4>';
        if (currentRoom.history && currentRoom.history.length > 0) {
          html += '<table class="widefat striped" style="font-size:11px;">';
          html += '<thead><tr><th>Código</th><th>Huésped</th><th>Documento</th><th>Nacionalidad</th><th>Fechas</th><th>Monto</th><th>Estado</th></tr></thead><tbody>';
          $.each(currentRoom.history, function(i, r) {
            html += '<tr>';
            html += '<td><b>' + r.code + '</b></td>';
            html += '<td>' + r.name + '</td>';
            html += '<td>' + r.doc_type + ': ' + r.doc_number + '</td>';
            html += '<td>' + r.nationality + '</td>';
            html += '<td>' + r.check_in + ' ➔ ' + r.check_out + '</td>';
            html += '<td>S/ ' + r.total.toFixed(0) + '</td>';
            html += '<td>' + (r.inhouse ? '<span style="color:#154562; font-weight:700;">En Casa</span>' : r.status) + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table>';
        } else {
          html += '<p style="color:#64748b; text-align:center; padding:20px 0;">No hay historial de reservas registradas para esta habitación.</p>';
        }
      }
      
      else if (tab === 'inventario') {
        html += '<h4 style="margin:0 0 12px; color:#0c2b3d; font-size:14px; font-weight:700;">📋 Inventario Físico Completo y Estado de Activos</h4>';
        if (currentRoom.inventory && currentRoom.inventory.length > 0) {
          html += '<table class="widefat striped" style="font-size:11.5px; margin-bottom:20px;">';
          html += '<thead><tr><th>Activo / Accisorio</th><th>Tipo</th><th>Marca</th><th>Serie</th><th>Año Adq.</th><th>Estado</th><th>Documento</th></tr></thead><tbody>';
          $.each(currentRoom.inventory, function(i, item) {
            var stBadge = '';
            if (item.status === 'ok') stBadge = '<span style="background:#dff5e5; color:#155724; padding:2px 6px; border-radius:6px; font-weight:bold;">OK</span>';
            else if (item.status === 'danado') stBadge = '<span style="background:#fdecea; color:#c0392b; padding:2px 6px; border-radius:6px; font-weight:bold;">Dañado</span>';
            else if (item.status === 'necesita_mantenimiento') stBadge = '<span style="background:#fef6e0; color:#bd8b00; padding:2px 6px; border-radius:6px; font-weight:bold;">Mantenimiento</span>';
            else if (item.status === 'cambio') stBadge = '<span style="background:#f3e8fb; color:#7b3fa0; padding:2px 6px; border-radius:6px; font-weight:bold;">Cambio</span>';

            html += '<tr style="vertical-align:top;">';
            html += '<td><b>' + item.item_name + '</b><br><span style="color:#64748b; font-size:10px;">' + item.description + '</span>';
            
            // Damage history log
            if (item.damage_log_parsed && item.damage_log_parsed.length > 0) {
              html += '<div style="margin-top:6px; font-size:9.5px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:4px;">';
              html += '<strong>Historial de daños:</strong>';
              $.each(item.damage_log_parsed, function(idx, log) {
                html += '<br>• ' + log.ts.substring(0,10) + ' (' + log.status + ') - ' + log.note + ' <small>by ' + log.user + '</small>';
              });
              html += '</div>';
            }
            
            // Inline update status form
            html += '<form method="post" action="<?php echo esc_url(admin_url("admin-post.php")); ?>" style="margin-top:6px; display:flex; gap:4px; align-items:center;">';
            html += '<input type="hidden" name="action" value="cg4_update_inv">';
            html += '<input type="hidden" name="item_id" value="' + item.id + '">';
            html += '<input type="hidden" name="room_number" value="' + currentRoom.number + '">';
            html += '<select name="status" style="font-size:9.5px; height:20px; padding:0 2px;"><option value="ok">OK</option><option value="danado">Dañado</option><option value="necesita_mantenimiento">Mantenimiento</option><option value="cambio">Cambio</option></select>';
            html += '<input name="damage_note" placeholder="Nota de daño..." style="font-size:9.5px; height:20px; width:90px; padding:2px 4px;">';
            html += '<button type="submit" class="button button-small" style="font-size:9.5px; height:20px; line-height:20px; padding:0 6px;">Actualizar</button>';
            html += '</form>';
            
            html += '</td>';
            html += '<td>' + item.item_type + '</td>';
            html += '<td>' + (item.brand || '—') + '</td>';
            html += '<td><code>' + (item.serial_number || '—') + '</code></td>';
            html += '<td>' + (item.acq_year || '—') + '</td>';
            html += '<td>' + stBadge + '</td>';
            html += '<td>';
            if (item.docs) {
              html += '<a href="' + item.docs + '" target="_blank" style="text-decoration:underline;">Ver Doc 📄</a>';
            } else {
              // Option to paste URL or upload
              html += '<form method="post" action="<?php echo esc_url(admin_url("admin-post.php")); ?>" style="display:flex; gap:4px;">';
              html += '<input type="hidden" name="action" value="cg4_update_docs">';
              html += '<input type="hidden" name="item_id" value="' + item.id + '">';
              html += '<input name="docs" placeholder="Link doc..." style="font-size:9px; height:18px; width:60px; padding:2px;">';
              html += '<button class="button button-small" style="font-size:9px; height:18px; padding:0 4px; line-height:18px;">+</button>';
              html += '</form>';
            }
            html += '</td>';
            html += '</tr>';
          });
          html += '</tbody></table>';
        } else {
          html += '<p style="color:#64748b; text-align:center; padding:10px 0 20px;">No hay activos registrados en esta habitación.</p>';
        }
        
        // Add new asset form
        html += '<div style="border-top: 1px solid #e2e8f0; padding-top:16px; background: #fafafa; padding: 15px; border-radius: 8px;">';
        html += '<h4 style="margin:0 0 10px; color:#0c2b3d; font-size:13px; font-weight:700;">➕ Agregar Activo / Accesorio al Cuarto</h4>';
        html += '<form method="post" action="<?php echo esc_url(admin_url("admin-post.php")); ?>" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
        html += '<input type="hidden" name="action" value="cg4_add_inv">';
        html += '<input type="hidden" name="room_number" value="' + currentRoom.number + '">';
        
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Nombre del Activo *<input name="item_name" required placeholder="Ej: Inodoro, Grifería, Ducha..." style="width:100%; margin-top:3px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Tipo de Activo<select name="item_type" style="width:100%; margin-top:3px; font-size:12px;"><option value="baño">🚿 Accesorio de Baño</option><option value="mobiliario">🛏️ Mobiliario</option><option value="entretenimiento">📺 Entretenimiento</option><option value="seguridad">🔒 Seguridad</option><option value="otros">General</option></select></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Marca<input name="brand" placeholder="Ej: Vainsa, Sole, Samsung..." style="width:100%; margin-top:3px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">N° de Serie / Modelo<input name="serial_number" placeholder="Ej: SN-492931" style="width:100%; margin-top:3px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Descripción breve<input name="description" placeholder="Ubicación o especificación..." style="width:100%; margin-top:3px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Año de Adquisición<input type="number" name="acq_year" value="2024" style="width:100%; margin-top:3px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e; grid-column: span 2;">Link de Documentos Adicionales (Factura / Garantía)<input name="docs" placeholder="http://... o URL del archivo" style="width:100%; margin-top:3px; font-size:12px;"></label>';
        
        html += '<div style="grid-column: span 2; text-align:right; margin-top:8px;">';
        html += '<button type="submit" class="button button-primary">Agregar al Inventario</button>';
        html += '</div>';
        html += '</form>';
        html += '</div>';
      }
      
      else if (tab === 'mantenimiento') {
        html += '<h4 style="margin:0 0 12px; color:#0c2b3d; font-size:14px; font-weight:700;">🔧 Historial de Mantenimiento</h4>';
        if (currentRoom.maintenance && currentRoom.maintenance.length > 0) {
          html += '<table class="widefat striped" style="font-size:11px; margin-bottom:20px;">';
          html += '<thead><tr><th>Avería / Incidencia</th><th>Prioridad</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th>Costo</th></tr></thead><tbody>';
          $.each(currentRoom.maintenance, function(i, m) {
            var stLabel = m.status === 'resuelta' ? '<span style="color:#1a7f37; font-weight:700;">Resuelta</span>' : '<span style="color:#c0392b; font-weight:700;">Abierta</span>';
            html += '<tr>';
            html += '<td>' + m.issue + '</td>';
            html += '<td>' + m.priority + '</td>';
            html += '<td>' + m.staff_name + '</td>';
            html += '<td>' + m.created.substring(0, 16) + '</td>';
            html += '<td>' + stLabel + '</td>';
            html += '<td>' + (m.cost > 0 ? 'S/ ' + m.cost.toFixed(2) : '—') + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table>';
        } else {
          html += '<p style="color:#64748b; text-align:center; padding:10px 0 20px;">No se registran incidencias de mantenimiento en esta habitación.</p>';
        }
        
        // Report issue form
        html += '<div style="border-top: 1px solid #e2e8f0; padding-top:16px;">';
        html += '<h4 style="margin:0 0 12px; color:#0c2b3d; font-size:13px; font-weight:700;">🔧 Reportar nueva avería/mantenimiento</h4>';
        html += '<form method="post" action="<?php echo esc_url(admin_url("admin-post.php")); ?>" style="display:flex; flex-direction:column; gap:10px;">';
        html += '<?php wp_nonce_field("cg5_mant", "_n"); ?><input type="hidden" name="action" value="cg5_mant">';
        html += '<input type="hidden" name="room_number" value="' + currentRoom.number + '">';
        
        html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Problema / Falla *<input name="issue" required placeholder="Ej: Fuga de agua, TV no enciende..." style="width:100%; margin-top:4px; padding:5px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;"></label>';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Prioridad<select name="priority" style="width:100%; margin-top:4px; font-size:12px;"><option value="alta">🔴 Alta</option><option value="media" selected>🟡 Media</option><option value="baja">⚪ Baja</option></select></label>';
        html += '</div>';
        
        html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; align-items:end;">';
        html += '<label style="font-size:11px; font-weight:600; color:#50575e;">Asignar técnico<select name="staff_id" style="width:100%; margin-top:4px; font-size:12px;"><?php echo $staff_options_html; ?></select></label>';
        html += '<button type="submit" class="button button-primary" style="height:32px;">Reportar y Bloquear</button>';
        html += '</div>';
        
        html += '</form>';
        html += '</div>';
      }
      
      $('#cg-modal-body').html(html);
    }
  });
  </script>
  <?php
}
add_action('cg_cuartos_top', 'cg4_rack_grid');

/* ================= ACCIONES DE INVENTARIO DE HABITACIONES ================= */
add_action('admin_post_cg4_update_inv', function () {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $id = (int) $_POST['item_id'];
  $status = sanitize_text_field($_POST['status'] ?? 'ok');
  $note = sanitize_text_field($_POST['damage_note'] ?? '');
  
  $tbl_inv = cg_tbl('room_inventory');
  $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tbl_inv WHERE id=%d", $id));
  if ($item) {
    $log = json_decode($item->damage_log ?: '[]', true) ?: [];
    if (!empty($note)) {
      $log[] = [
        'ts' => current_time('mysql'),
        'user' => wp_get_current_user()->display_name,
        'status' => $status,
        'note' => $note
      ];
    }
    $wpdb->update($tbl_inv, [
      'status' => $status,
      'damage_log' => json_encode($log)
    ], ['id' => $id]);
  }
  wp_safe_redirect(wp_get_referer()); exit;
});

add_action('admin_post_cg4_update_docs', function () {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $id = (int) $_POST['item_id'];
  $docs = esc_url_raw($_POST['docs'] ?? '');
  $wpdb->update(cg_tbl('room_inventory'), ['docs' => $docs], ['id' => $id]);
  wp_safe_redirect(wp_get_referer()); exit;
});

add_action('admin_post_cg4_add_inv', function () {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $room_number = (int) $_POST['room_number'];
  $name = sanitize_text_field($_POST['item_name']);
  $type = sanitize_text_field($_POST['item_type']);
  $brand = sanitize_text_field($_POST['brand'] ?? '');
  $serial = sanitize_text_field($_POST['serial_number'] ?? '');
  $desc = sanitize_text_field($_POST['description'] ?? '');
  $year = (int) $_POST['acq_year'];
  $docs = esc_url_raw($_POST['docs'] ?? '');
  
  $wpdb->insert(cg_tbl('room_inventory'), [
    'room_number' => $room_number,
    'item_name' => $name,
    'item_type' => $type,
    'brand' => $brand,
    'serial_number' => $serial,
    'description' => $desc,
    'acq_year' => $year,
    'docs' => $docs,
    'status' => 'ok',
    'damage_log' => '[]',
    'tags' => ''
  ]);
  wp_safe_redirect(wp_get_referer()); exit;
});

