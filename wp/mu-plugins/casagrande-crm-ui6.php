<?php
/**
 * Plugin Name: Casa Grande CRM (operacion total)
 * Description: Nueva reserva walk-in desde el CRM, registro de pagos por reserva con saldo, cierre del dia (night audit) imprimible y hoja de limpieza del dia.
 */
if (!defined('ABSPATH')) exit;

/* ================= NUEVA RESERVA (walk-in) en Front Desk ================= */
add_action('cg_frontdesk_top', function () {
  $types = get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'meta_value_num', 'meta_key' => 'cg_price', 'order' => 'ASC']);
  ?>
  <details class="cg-card" style="margin-bottom:14px;border:2px solid #1a7f37">
    <summary style="cursor:pointer;font-weight:800;color:#155724;font-size:15px">➕ Nueva reserva / Walk-in (crear desde recepcion)</summary>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px">
      <?php wp_nonce_field('cg6_newres', '_n'); ?><input type="hidden" name="action" value="cg6_newres">
      <?php $F = function ($l, $i) { echo '<label style="display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#50575e">' . $l . $i . '</label>'; };
      $F('Nombre del huesped *', '<input name="name" required>');
      $doc_types = '<select name="doc_type"><option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="CE">Cédula Extranjería</option></select>';
      $F('Tipo Documento', $doc_types);
      $F('Número Documento *', '<input name="doc_number" required>');
      $F('Nacionalidad *', '<input name="nationality" value="Peruano" required>');
      $F('Telefono (recibe confirmacion WA)', '<input name="phone" placeholder="+51 9...">');
      $F('Email', '<input name="email" type="email">');
      $ty = '<select name="room_id">';
      foreach ($types as $t) $ty .= '<option value="' . $t->ID . '">' . esc_html($t->post_title) . ' — S/' . number_format((float) get_post_meta($t->ID, 'cg_price', true), 0) . ' base</option>';
      $ty .= '</select>';
      $F('Tipo de habitacion', $ty);
      $F('Llegada', '<input type="date" name="check_in" value="' . esc_attr(current_time('Y-m-d')) . '" required>');
      $F('Salida', '<input type="date" name="check_out" value="' . esc_attr(date('Y-m-d', strtotime('+1 day'))) . '" required>');
      $F('Adultos / Ninos', '<span style="display:flex;gap:6px"><input type="number" name="adults" value="2" min="1" style="width:60px"><input type="number" name="children" value="0" min="0" style="width:60px"></span>');
      $F('Total S/ (vacio = auto con tarifas)', '<input type="number" step="0.01" name="total" placeholder="auto">');
      $F('Adelanto S/ (opcional)', '<input type="number" step="0.01" name="advance" placeholder="0">');
      $met = '<select name="method">'; foreach (['efectivo' => 'Efectivo', 'tarjeta' => 'Tarjeta', 'yape' => 'Yape', 'plin' => 'Plin', 'transferencia' => 'Transferencia'] as $k => $l) $met .= '<option value="' . $k . '">' . $l . '</option>'; $met .= '</select>';
      $F('Metodo del adelanto', $met);
      ?>
      <div style="align-self:end"><button class="button button-primary button-large">Crear reserva</button></div>
    </form>
    <p style="font-size:12px;color:#64748b;margin-top:8px">Asigna habitacion fisica automaticamente, calcula el total con tarifas de temporada, registra el adelanto y envia confirmacion por WhatsApp si hay telefono (modo demo sin credenciales YCloud).</p>
  </details>
  <?php
}, 5);
add_action('admin_post_cg6_newres', function () {
  check_admin_referer('cg6_newres', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $room = get_post((int) $_POST['room_id']);
  $ci = sanitize_text_field($_POST['check_in']); $co = sanitize_text_field($_POST['check_out']);
  if (!$room || !$ci || !$co || $co <= $ci) wp_die('Datos invalidos');
  // disponibilidad fisica
  if (function_exists('cg_pick_free_room') && !cg_pick_free_room($room->ID, $ci, $co))
    wp_die('Sin habitaciones libres de ese tipo para esas fechas.', 'Sin disponibilidad', ['back_link' => true]);
  $code = 'RES-' . strtoupper(substr(md5(uniqid('', true)), 0, 8));
  $name = sanitize_text_field($_POST['name']);
  $id = wp_insert_post(['post_type' => 'reservation', 'post_status' => 'publish', 'post_title' => $code . ' - ' . $name]);
  $total = (float) ($_POST['total'] ?? 0);
  if ($total <= 0) $total = function_exists('cg_stay_total') ? cg_stay_total($room->ID, $ci, $co)
    : max(1, (int) ((strtotime($co) - strtotime($ci)) / 86400)) * (float) get_post_meta($room->ID, 'cg_price', true);
  foreach (['cg_code' => $code, 'cg_name' => $name,
    'cg_doc' => sanitize_text_field($_POST['doc_number'] ?? ''),
    'cg_doc_type' => sanitize_text_field($_POST['doc_type'] ?? 'DNI'),
    'cg_doc_number' => sanitize_text_field($_POST['doc_number'] ?? ''),
    'cg_nationality' => sanitize_text_field($_POST['nationality'] ?? 'Peruano'),
    'cg_phone' => sanitize_text_field($_POST['phone'] ?? ''), 'cg_email' => sanitize_email($_POST['email'] ?? ''),
    'cg_room_id' => $room->ID, 'cg_room' => $room->post_title, 'cg_check_in' => $ci, 'cg_check_out' => $co,
    'cg_adults' => (int) ($_POST['adults'] ?? 2), 'cg_children' => (int) ($_POST['children'] ?? 0),
    'cg_total' => $total, 'cg_status' => 'confirmada', 'cg_payment' => 'por_pagar'] as $k => $v) update_post_meta($id, $k, $v);
  do_action('cg_reservation_created', $id, $room->ID, $ci, $co);
  $adv = (float) ($_POST['advance'] ?? 0);
  if ($adv > 0 && function_exists('cg_res_register_payment')) cg_res_register_payment($id, $adv, $_POST['method'] ?? 'efectivo', 'Adelanto walk-in');
  if (function_exists('cg_log')) cg_log('reserva_walkin', $code . ' ' . $name . ' ' . $ci . '→' . $co . ' S/' . number_format($total, 2));
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-reservas', 'res' => $id, 'done' => 1], admin_url('admin.php'))); exit;
});

/* ================= PAGOS por reserva (en la vista de cuenta) ================= */
add_action('cg_folio_after', function ($res_id) {
  global $wpdb;
  $total = (float) get_post_meta($res_id, 'cg_total', true);
  $paid = function_exists('cg_res_paid_sum') ? cg_res_paid_sum($res_id) : 0;
  $pays = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('payments') . " WHERE res_id=%d ORDER BY ts", $res_id));
  $saldo = max(0, $total - $paid);
  ?>
  <div style="border-top:2px dashed #e3e6ea;margin-top:14px;padding-top:12px">
    <h4 style="margin:0 0 8px">💳 Pagos del alojamiento — Total S/ <?php echo number_format($total, 2); ?> ·
      Pagado <b style="color:#1a7f37">S/ <?php echo number_format($paid, 2); ?></b> ·
      Saldo <b style="color:<?php echo $saldo > 0 ? '#c0392b' : '#1a7f37'; ?>">S/ <?php echo number_format($saldo, 2); ?></b></h4>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:14px">
      <table class="widefat striped" style="font-size:12px"><thead><tr><th>Fecha</th><th>Metodo</th><th>Nota</th><th>Monto</th></tr></thead><tbody>
      <?php foreach ($pays as $py) : ?>
        <tr><td><?php echo esc_html(date('d/m H:i', strtotime($py->ts))); ?></td><td><b><?php echo esc_html(ucfirst($py->method)); ?></b></td>
          <td><?php echo esc_html($py->note); ?></td><td><b>S/ <?php echo number_format((float) $py->amount, 2); ?></b></td></tr>
      <?php endforeach; if (!$pays) echo '<tr><td colspan="4" style="color:#64748b">Sin pagos registrados.</td></tr>'; ?>
      </tbody></table>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;flex-direction:column;gap:8px">
        <?php wp_nonce_field('cg6_pay', '_n'); ?><input type="hidden" name="action" value="cg6_pay"><input type="hidden" name="res" value="<?php echo (int) $res_id; ?>">
        <div style="display:flex;gap:8px">
          <input type="number" step="0.01" name="amount" placeholder="Monto S/" required style="width:110px" <?php echo $saldo > 0 ? 'value="' . esc_attr(number_format($saldo, 2, '.', '')) . '"' : ''; ?>>
          <select name="method"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="transferencia">Transferencia</option></select>
        </div>
        <input name="note" placeholder="Nota (opcional)">
        <button class="button button-primary">Registrar pago</button>
        <span style="font-size:11px;color:#64748b">Al completar el total, la reserva pasa sola a <b>PAGADO</b> y entra a los ingresos.</span>
      </form>
    </div>
  </div>
  <?php
});
add_action('admin_post_cg6_pay', function () {
  check_admin_referer('cg6_pay', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $res = (int) $_POST['res'];
  cg_res_register_payment($res, (float) $_POST['amount'], $_POST['method'] ?? 'efectivo', $_POST['note'] ?? '');
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-reservas', 'res' => $res, 'done' => 1], admin_url('admin.php'))); exit;
});

/* ================= CIERRE DEL DIA (night audit) ================= */
function cg6_render_audit() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $date = sanitize_text_field($_GET['fecha'] ?? current_time('Y-m-d'));
  $a = cg_night_audit($date);
  $ing_total = $a['lodging']; foreach ($a['ing'] as $r) $ing_total += (float) $r->amount;
  $egr_total = 0; foreach ($a['egr'] as $r) $egr_total += (float) $r->amount;
  ?>
  <style>#adminmenumain,#wpadminbar,#wpfooter{display:none!important}#wpcontent{margin-left:0!important}
  .audit{max-width:760px;margin:24px auto;background:#fff;border:2px solid #0c2b3d;padding:26px;font-family:Georgia,serif}
  .audit table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px}.audit td,.audit th{border:1px solid #94a3b8;padding:6px 10px}
  @media print{.no-print{display:none}}</style>
  <div class="audit">
    <h1 style="text-align:center;font-size:19px;margin:0">CIERRE DEL DIA — <?php echo esc_html($date); ?></h1>
    <p style="text-align:center;color:#64748b;font-size:12px;margin:4px 0 16px">Hotel Boutique Casa Grande · Night Audit</p>
    <form method="get" class="no-print" style="text-align:center;margin-bottom:14px">
      <input type="hidden" name="page" value="cg-crm-audit">
      <input type="date" name="fecha" value="<?php echo esc_attr($date); ?>"><button class="button">Ver otro dia</button>
      <button type="button" class="button button-primary" onclick="window.print()">🖨 Imprimir</button>
    </form>
    <table><tr style="background:#eef2f7"><th colspan="4">OPERACION</th></tr>
      <tr><td>Ocupacion</td><td><b><?php echo $a['occ']['rate']; ?>%</b> (<?php echo $a['occ']['occupied']; ?>/<?php echo $a['occ']['units']; ?>)</td>
          <td>Llegadas / Salidas</td><td><?php echo $a['arrivals']; ?> / <?php echo $a['departures']; ?><?php echo $a['pending_in'] ? ' · <b style="color:#c0392b">' . $a['pending_in'] . ' sin check-in</b>' : ''; ?></td></tr></table>
    <table><tr style="background:#dff5e5"><th colspan="2">INGRESOS DEL DIA</th></tr>
      <tr><td>Alojamiento cobrado hoy</td><td style="text-align:right">S/ <?php echo number_format($a['lodging'], 2); ?></td></tr>
      <?php foreach ($a['ing'] as $r) : ?>
        <tr><td><?php echo esc_html($r->category . ' — ' . $r->concept); ?></td><td style="text-align:right">S/ <?php echo number_format((float) $r->amount, 2); ?></td></tr>
      <?php endforeach; ?>
      <tr style="background:#f8fafc"><td><b>TOTAL INGRESOS</b></td><td style="text-align:right"><b>S/ <?php echo number_format($ing_total, 2); ?></b></td></tr></table>
    <?php if ($a['bymethod']) : ?>
    <table><tr style="background:#eef2f7"><th colspan="2">CAJA POR METODO DE PAGO (pagos registrados hoy)</th></tr>
      <?php foreach ($a['bymethod'] as $m => $t) : ?>
        <tr><td><?php echo esc_html(ucfirst($m)); ?></td><td style="text-align:right">S/ <?php echo number_format($t, 2); ?></td></tr>
      <?php endforeach; ?></table>
    <?php endif; ?>
    <table><tr style="background:#fdecea"><th colspan="2">EGRESOS DEL DIA</th></tr>
      <?php foreach ($a['egr'] as $r) : ?>
        <tr><td><?php echo esc_html($r->category . ' — ' . $r->concept); ?></td><td style="text-align:right">S/ <?php echo number_format((float) $r->amount, 2); ?></td></tr>
      <?php endforeach; if (!$a['egr']) echo '<tr><td colspan="2" style="color:#64748b">Sin egresos hoy.</td></tr>'; ?>
      <tr style="background:#f8fafc"><td><b>TOTAL EGRESOS</b></td><td style="text-align:right"><b>S/ <?php echo number_format($egr_total, 2); ?></b></td></tr></table>
    <table><tr style="background:#0c2b3d;color:#fff"><td><b>RESULTADO NETO DEL DIA</b></td><td style="text-align:right;font-size:16px"><b>S/ <?php echo number_format($ing_total - $egr_total, 2); ?></b></td></tr></table>
    <p style="font-size:11px;color:#64748b">Consumos cargados a habitaciones hoy (pendientes de check-out): S/ <?php echo number_format($a['folio'], 2); ?></p>
    <table style="margin-top:22px;border:0"><tr>
      <td style="border:0;text-align:center;padding-top:30px"><div style="border-top:1px solid #333;width:200px;margin:0 auto">Recepcion</div></td>
      <td style="border:0;text-align:center;padding-top:30px"><div style="border-top:1px solid #333;width:200px;margin:0 auto">Administracion</div></td>
    </tr></table>
  </div>
  <?php
}

/* ================= HOJA DE LIMPIEZA del dia (imprimible) ================= */
function cg6_render_hoja_limpieza() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $rows = $wpdb->get_results("SELECT h.*, s.name sname FROM " . cg_tbl('housekeeping') . " h LEFT JOIN " . cg_tbl('staff') . " s ON s.id=h.staff_id WHERE h.status IN ('sucio','en_limpieza','mantenimiento') ORDER BY h.room_name");
  ?>
  <style>#adminmenumain,#wpadminbar,#wpfooter{display:none!important}#wpcontent{margin-left:0!important}
  .hoja{max-width:720px;margin:24px auto;background:#fff;border:2px solid #0c2b3d;padding:26px;font-family:Georgia,serif}
  .hoja table{width:100%;border-collapse:collapse;font-size:13px}.hoja td,.hoja th{border:1px solid #94a3b8;padding:7px 10px}
  @media print{.no-print{display:none}}</style>
  <div class="hoja">
    <h1 style="text-align:center;font-size:18px;margin:0">HOJA DE LIMPIEZA — <?php echo esc_html(current_time('d/m/Y')); ?></h1>
    <p style="text-align:center;color:#64748b;font-size:12px;margin:4px 0 16px">Hotel Boutique Casa Grande · Housekeeping</p>
    <table><thead><tr><th>Habitacion</th><th>Estado</th><th>Asignada a</th><th>Hecho ✓</th><th>Observaciones</th></tr></thead><tbody>
    <?php foreach ($rows as $r) : ?>
      <tr><td><b><?php echo esc_html($r->room_name); ?></b></td>
        <td><?php echo esc_html(str_replace('_', ' ', $r->status)); ?></td>
        <td><?php echo esc_html($r->sname ?: '________'); ?></td>
        <td style="width:60px"></td><td style="width:180px"></td></tr>
    <?php endforeach; if (!$rows) echo '<tr><td colspan="5" style="color:#64748b">Todas las habitaciones estan limpias. 🎉</td></tr>'; ?>
    </tbody></table>
    <p class="no-print" style="text-align:center;margin-top:16px"><button class="button button-primary" onclick="window.print()">🖨 Imprimir hoja</button></p>
  </div>
  <?php
}

add_action('admin_menu', function () {
  add_submenu_page('', 'Cierre del dia', 'Cierre', 'manage_hotel', 'cg-crm-audit', 'cg6_render_audit');
  add_submenu_page('', 'Hoja de limpieza', 'Hoja', 'manage_hotel', 'cg-crm-hoja', 'cg6_render_hoja_limpieza');
}, 21);
