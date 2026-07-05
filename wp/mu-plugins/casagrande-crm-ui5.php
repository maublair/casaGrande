<?php
/**
 * Plugin Name: Casa Grande CRM (expansion)
 * Description: Huespedes (CRM de clientes), tarifas por temporada, mantenimiento (ordenes de trabajo), reportes con graficos, turnos semanales, limpieza extendida y log de actividad.
 */
if (!defined('ABSPATH')) exit;

function cg5_canned_replies() {
  $saved = get_option('cg_wa_canned');
  if (is_array($saved) && $saved) return $saved;
  return [
    ['Tarifas y disponibilidad', 'Con gusto! Nuestras tarifas por noche (desayuno incluido): Simple S/180, Doble S/260, Matrimonial Ejecutiva S/380 y Suite S/520. ¿Para que fechas y cuantas personas? Te confirmo disponibilidad con numero de habitacion. 🗓️'],
    ['Como llegar', 'Estamos en Av. Luna Pizarro 202, Vallecito, Arequipa, a 10 min del centro historico. 📍 maps.app.goo.gl/SnxbM6dird9A5Y2fA'],
    ['Check-in / Check-out', 'El check-in es desde las 2:00 pm y el check-out hasta las 12:00 pm. Si llegas antes guardamos tu equipaje sin costo. 🧳'],
    ['Confirmar reserva', 'Tu reserva quedo confirmada. ✅ Te esperamos! Cualquier cambio escribenos por aqui. Desayuno buffet de 7 a 10 am incluido.'],
    ['Catering / eventos', 'Hacemos catering y eventos: coffee breaks, almuerzos corporativos y banquetes. ¿Para cuantas personas y que fecha? Te preparo una cotizacion. 🍽️'],
    ['Agradecimiento', 'Muchas gracias por tu preferencia! Fue un gusto atenderte. Te esperamos pronto en Casa Grande. 🙌'],
  ];
}

function cg5_can() { if (!current_user_can('manage_hotel')) wp_die('Sin permiso'); }
function cg5_redir($page, $extra = []) { wp_safe_redirect(add_query_arg(array_merge(['page' => $page, 'done' => 1], $extra), admin_url('admin.php'))); exit; }

/* ================= HUESPEDES (CRM de clientes) ================= */
function cg5_render_huespedes() {
  global $wpdb;
  $guests = cg_guests_index();
  $sel = sanitize_text_field($_GET['g'] ?? '');
  $q = mb_strtolower(sanitize_text_field($_GET['q'] ?? ''));
  ?>
  <div class="cg-card">
    <form method="get" style="display:flex;gap:8px;margin-bottom:12px">
      <input type="hidden" name="page" value="cg-crm-huespedes">
      <input name="q" value="<?php echo esc_attr($q); ?>" placeholder="Buscar por nombre, telefono o email..." style="width:300px">
      <button class="button">Buscar</button>
    </form>
    <table class="widefat striped">
      <thead><tr><th>Huesped</th><th>Contacto</th><th>Visitas</th><th>Noches</th><th>Gasto total</th><th>Ultima visita</th><th>Categoria</th><th></th></tr></thead><tbody>
      <?php $n = 0; foreach ($guests as $g) :
        if ($q && stripos($g['name'] . $g['phone'] . $g['email'], $q) === false) continue;
        if (++$n > 40) break;
        $vip = $g['spent'] >= 1500 || $g['visits'] >= 3; ?>
        <tr>
          <td><strong><?php echo esc_html($g['name']); ?></strong></td>
          <td style="font-size:12px"><?php echo esc_html($g['phone'] ?: '—'); ?><br><?php echo esc_html($g['email'] ?: ''); ?></td>
          <td><?php echo (int) $g['visits']; ?></td><td><?php echo (int) $g['nights']; ?></td>
          <td><b>S/ <?php echo number_format($g['spent'], 2); ?></b></td>
          <td><?php echo esc_html($g['last'] ?: '—'); ?></td>
          <td><?php echo $vip ? '<span style="background:#fdf3d7;color:#a87214;padding:2px 10px;border-radius:12px;font-weight:800;font-size:11px">⭐ VIP</span>' : ($g['visits'] > 1 ? '<span style="background:#eaf2f8;color:#154562;padding:2px 10px;border-radius:12px;font-weight:700;font-size:11px">Recurrente</span>' : '<span style="color:#94a3b8;font-size:11px">Nuevo</span>'); ?></td>
          <td><a class="button button-small" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-huespedes', 'g' => $g['key']], admin_url('admin.php'))); ?>#perfil">Perfil</a></td>
        </tr>
      <?php endforeach; ?>
      </tbody></table>
  </div>
  <?php
  if (!$sel || !isset($guests[$sel])) return;
  $g = $guests[$sel];
  $notes = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('guest_notes') . " WHERE guest_key=%s ORDER BY ts DESC", $sel));
  ?>
  <div id="perfil" class="cg-card" style="margin-top:14px;border:2px solid #c9a84c">
    <h3>👤 <?php echo esc_html($g['name']); ?> — historial completo</h3>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px">
      <div>
        <table class="widefat striped" style="font-size:12px">
          <thead><tr><th>Codigo</th><th>Hab.</th><th>Fechas</th><th>Aloj.</th><th>Consumos</th><th>Estado</th><th></th></tr></thead><tbody>
          <?php foreach ($g['res'] as $rid) :
            $folio = function_exists('cg_folio_rows') ? array_sum(array_map(function ($f) { return (float) $f->total; }, cg_folio_rows($rid))) : 0; ?>
            <tr><td><b><?php echo esc_html(get_post_meta($rid, 'cg_code', true)); ?></b></td>
              <td><?php echo esc_html(get_post_meta($rid, 'cg_room_number', true) ?: '—'); ?></td>
              <td><?php echo esc_html(get_post_meta($rid, 'cg_check_in', true) . '→' . get_post_meta($rid, 'cg_check_out', true)); ?></td>
              <td>S/ <?php echo number_format((float) get_post_meta($rid, 'cg_total', true), 0); ?></td>
              <td><?php echo $folio ? 'S/ ' . number_format($folio, 2) : '—'; ?></td>
              <td><?php echo esc_html(get_post_meta($rid, 'cg_status', true)); ?></td>
              <td><a class="button button-small" target="_blank" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-voucher', 'id' => $rid], admin_url('admin.php'))); ?>">🎫</a></td></tr>
          <?php endforeach; ?>
          </tbody></table>
      </div>
      <div>
        <h4 style="margin:0 0 8px">Notas del huesped (preferencias, incidencias)</h4>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:6px;margin-bottom:10px">
          <?php wp_nonce_field('cg5_gnote', '_n'); ?><input type="hidden" name="action" value="cg5_gnote"><input type="hidden" name="g" value="<?php echo esc_attr($sel); ?>">
          <input name="note" placeholder="Ej: prefiere piso alto, alergia al mani..." required style="flex:1">
          <button class="button button-primary">Guardar</button>
        </form>
        <?php foreach ($notes as $nt) : ?>
          <div style="background:#f8fafc;border-left:3px solid #c9a84c;border-radius:6px;padding:8px 10px;margin-bottom:6px;font-size:12px">
            <?php echo esc_html($nt->note); ?><br><span style="color:#94a3b8;font-size:10px"><?php echo esc_html(date('d/m/Y H:i', strtotime($nt->ts))); ?></span></div>
        <?php endforeach; if (!$notes) echo '<p style="font-size:12px;color:#64748b">Sin notas aun.</p>'; ?>
      </div>
    </div>
  </div>
  <?php
}
add_action('admin_post_cg5_gnote', function () {
  check_admin_referer('cg5_gnote', '_n'); cg5_can(); global $wpdb;
  $g = sanitize_text_field($_POST['g']);
  $wpdb->insert(cg_tbl('guest_notes'), ['guest_key' => $g, 'note' => sanitize_text_field($_POST['note'])]);
  cg_log('nota_huesped', $g);
  cg5_redir('cg-crm-huespedes', ['g' => $g]);
});

/* ================= TARIFAS por temporada ================= */
function cg5_render_tarifas() {
  global $wpdb;
  $types = get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'meta_value_num', 'meta_key' => 'cg_price', 'order' => 'ASC']);
  $rates = $wpdb->get_results("SELECT * FROM " . cg_tbl('rates') . " ORDER BY date_from DESC");
  $tnames = []; foreach ($types as $t) $tnames[$t->ID] = $t->post_title;
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Tarifas base (editables en Habitaciones)</h3>
      <table class="widefat striped"><thead><tr><th>Tipo</th><th>Base/noche</th><th>Hoy</th><th>En 30 dias</th></tr></thead><tbody>
      <?php foreach ($types as $t) :
        $base = (float) get_post_meta($t->ID, 'cg_price', true);
        $hoy = cg_rate_for($t->ID, current_time('Y-m-d')); $f30 = cg_rate_for($t->ID, date('Y-m-d', strtotime('+30 day'))); ?>
        <tr><td><b><?php echo esc_html($t->post_title); ?></b></td><td>S/ <?php echo number_format($base, 0); ?></td>
          <td><?php echo $hoy !== null ? '<b style="color:#a87214">S/ ' . number_format($hoy, 0) . '</b>' : 'S/ ' . number_format($base, 0); ?></td>
          <td><?php echo $f30 !== null ? '<b style="color:#a87214">S/ ' . number_format($f30, 0) . '</b>' : 'S/ ' . number_format($base, 0); ?></td></tr>
      <?php endforeach; ?></tbody></table>
      <p style="font-size:12px;color:#64748b">Las reservas nuevas calculan su total <b>noche por noche</b> con estas reglas; sin regla aplica la tarifa base.</p>
    </div>
    <div class="cg-card">
      <h3>Nueva regla de temporada</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg5_rate', '_n'); ?><input type="hidden" name="action" value="cg5_rate">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Tipo de habitacion
          <select name="type_id"><?php foreach ($types as $t) echo '<option value="' . $t->ID . '">' . esc_html($t->post_title) . '</option>'; ?></select></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Nombre<input name="label" placeholder="Temporada alta, Fiestas Patrias..." required></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Desde<input type="date" name="date_from" required></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Hasta<input type="date" name="date_to" required></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Precio/noche (S/)<input type="number" step="0.01" name="price" required></label>
        <div style="align-self:end"><button class="button button-primary">Crear regla</button></div>
      </form>
    </div>
  </div>
  <div class="cg-card" style="margin-top:14px">
    <h3>Reglas activas</h3>
    <table class="widefat striped"><thead><tr><th>Tipo</th><th>Nombre</th><th>Desde</th><th>Hasta</th><th>Precio</th><th></th></tr></thead><tbody>
    <?php foreach ($rates as $r) : ?>
      <tr><td><?php echo esc_html($tnames[$r->type_id] ?? '#' . $r->type_id); ?></td><td><b><?php echo esc_html($r->label); ?></b></td>
        <td><?php echo esc_html($r->date_from); ?></td><td><?php echo esc_html($r->date_to); ?></td>
        <td><b>S/ <?php echo number_format((float) $r->price, 0); ?></b></td>
        <td><a style="color:#c0392b" onclick="return confirm('¿Eliminar regla?')" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg5_ratedel&id=' . $r->id), 'cg5_ratedel_' . $r->id)); ?>">Eliminar</a></td></tr>
    <?php endforeach; if (!$rates) echo '<tr><td colspan="6" style="color:#64748b">Sin reglas: se cobra siempre la tarifa base.</td></tr>'; ?>
    </tbody></table>
  </div>
  <?php
}
add_action('admin_post_cg5_rate', function () {
  check_admin_referer('cg5_rate', '_n'); cg5_can(); global $wpdb;
  $wpdb->insert(cg_tbl('rates'), ['type_id' => (int) $_POST['type_id'], 'label' => sanitize_text_field($_POST['label']),
    'date_from' => sanitize_text_field($_POST['date_from']), 'date_to' => sanitize_text_field($_POST['date_to']),
    'price' => (float) $_POST['price']]);
  cg_log('tarifa_creada', $_POST['label'] . ' S/' . $_POST['price']);
  cg5_redir('cg-crm-tarifas');
});
add_action('admin_post_cg5_ratedel', function () {
  $id = (int) ($_GET['id'] ?? 0); check_admin_referer('cg5_ratedel_' . $id); cg5_can(); global $wpdb;
  $wpdb->delete(cg_tbl('rates'), ['id' => $id]); cg5_redir('cg-crm-tarifas');
});

/* ================= MANTENIMIENTO (ordenes de trabajo) ================= */
function cg5_render_mantenimiento() {
  global $wpdb; $t = cg_tbl('maintenance');
  $rows = $wpdb->get_results("SELECT m.*, s.name sname FROM $t m LEFT JOIN " . cg_tbl('staff') . " s ON s.id=m.staff_id ORDER BY FIELD(m.status,'abierta','en_curso','resuelta'), FIELD(m.priority,'alta','media','baja'), m.created DESC");
  $staff = $wpdb->get_results("SELECT id,name FROM " . cg_tbl('staff') . " WHERE active=1 AND role IN ('Mantenimiento','Administracion') ORDER BY name");
  if (!$staff) $staff = $wpdb->get_results("SELECT id,name FROM " . cg_tbl('staff') . " WHERE active=1 ORDER BY name");
  ?>
  <div class="cg-card" style="margin-bottom:14px">
    <h3>Nueva orden de trabajo</h3>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <?php wp_nonce_field('cg5_mant', '_n'); ?><input type="hidden" name="action" value="cg5_mant">
      <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Habitacion (o vacio)<input type="number" name="room_number" placeholder="101-515" style="width:100px"></label>
      <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Area (si no es cuarto)<input name="area" placeholder="Cocina, Lobby, Piscina..."></label>
      <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px;flex:1;min-width:220px">Problema<input name="issue" required placeholder="Ej: fuga en ducha, foco quemado..."></label>
      <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Prioridad<select name="priority"><option value="alta">🔴 Alta</option><option value="media" selected>🟡 Media</option><option value="baja">⚪ Baja</option></select></label>
      <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Asignar a<select name="staff_id"><option value="0">—</option><?php foreach ($staff as $s) echo '<option value="' . $s->id . '">' . esc_html($s->name) . '</option>'; ?></select></label>
      <button class="button button-primary">Crear orden</button>
    </form>
    <p style="font-size:12px;color:#64748b">Si indicas habitacion, pasa automaticamente a estado <b>mantenimiento</b>; al resolver la orden pasa a <b>sucia</b> para limpieza final.</p>
  </div>
  <div class="cg-card">
    <h3>Ordenes de trabajo</h3>
    <table class="widefat striped"><thead><tr><th>#</th><th>Lugar</th><th>Problema</th><th>Prioridad</th><th>Asignado</th><th>Estado</th><th>Costo</th><th>Creada</th><th>Acciones</th></tr></thead><tbody>
    <?php foreach ($rows as $r) :
      $pc = ['alta' => '🔴', 'media' => '🟡', 'baja' => '⚪'][$r->priority] ?? '';
      $sc = ['abierta' => ['#c0392b', 'ABIERTA'], 'en_curso' => ['#bd8b00', 'EN CURSO'], 'resuelta' => ['#1a7f37', 'RESUELTA']][$r->status] ?? ['#666', $r->status]; ?>
      <tr <?php echo $r->status === 'resuelta' ? 'style="opacity:.55"' : ''; ?>>
        <td><?php echo (int) $r->id; ?></td>
        <td><b><?php echo $r->room_number ? 'Hab. ' . (int) $r->room_number : esc_html($r->area ?: '—'); ?></b></td>
        <td><?php echo esc_html($r->issue); ?></td>
        <td><?php echo $pc . ' ' . esc_html(ucfirst($r->priority)); ?></td>
        <td><?php echo esc_html($r->sname ?: '—'); ?></td>
        <td><b style="color:<?php echo $sc[0]; ?>"><?php echo $sc[1]; ?></b></td>
        <td><?php echo $r->cost > 0 ? 'S/ ' . number_format((float) $r->cost, 2) : '—'; ?></td>
        <td style="font-size:11px"><?php echo esc_html(date('d/m H:i', strtotime($r->created))); ?></td>
        <td>
          <?php if ($r->status === 'abierta') : ?>
            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg5_mantst&id=' . $r->id . '&st=en_curso'), 'cg5_mantst_' . $r->id)); ?>">▶ Iniciar</a>
          <?php endif; if ($r->status !== 'resuelta') : ?>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-flex;gap:4px">
              <?php wp_nonce_field('cg5_mantres', '_n'); ?><input type="hidden" name="action" value="cg5_mantres"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>">
              <input type="number" step="0.01" name="cost" placeholder="costo S/" style="width:80px">
              <button class="button button-small">✔ Resolver</button>
            </form>
          <?php endif; ?>
        </td></tr>
    <?php endforeach; if (!$rows) echo '<tr><td colspan="9" style="color:#64748b">Sin ordenes de trabajo.</td></tr>'; ?>
    </tbody></table>
  </div>
  <?php
}
add_action('admin_post_cg5_mant', function () {
  check_admin_referer('cg5_mant', '_n'); cg5_can(); global $wpdb;
  $num = (int) ($_POST['room_number'] ?? 0);
  $wpdb->insert(cg_tbl('maintenance'), ['room_number' => $num, 'area' => sanitize_text_field($_POST['area'] ?? ''),
    'issue' => sanitize_text_field($_POST['issue']), 'priority' => sanitize_key($_POST['priority']),
    'staff_id' => (int) ($_POST['staff_id'] ?? 0)]);
  if ($num && function_exists('cg2_set_hk')) cg2_set_hk($num, 'mantenimiento');
  cg_log('orden_mant', ($num ? 'Hab. ' . $num : $_POST['area']) . ': ' . $_POST['issue']);
  cg5_redir('cg-crm-mantenimiento');
});
add_action('admin_post_cg5_mantst', function () {
  $id = (int) ($_GET['id'] ?? 0); check_admin_referer('cg5_mantst_' . $id); cg5_can(); global $wpdb;
  $wpdb->update(cg_tbl('maintenance'), ['status' => sanitize_key($_GET['st'] ?? 'en_curso')], ['id' => $id]);
  cg5_redir('cg-crm-mantenimiento');
});
add_action('admin_post_cg5_mantres', function () {
  check_admin_referer('cg5_mantres', '_n'); cg5_can(); global $wpdb;
  $id = (int) $_POST['id']; $cost = (float) ($_POST['cost'] ?? 0);
  $r = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . cg_tbl('maintenance') . " WHERE id=%d", $id));
  if ($r) {
    $wpdb->update(cg_tbl('maintenance'), ['status' => 'resuelta', 'cost' => $cost, 'resolved' => current_time('mysql')], ['id' => $id]);
    if ($r->room_number && function_exists('cg2_set_hk')) cg2_set_hk((int) $r->room_number, 'sucio');
    if ($cost > 0) $wpdb->insert(cg_tbl('ledger'), ['kind' => 'egreso', 'category' => 'Mantenimiento',
      'concept' => 'OT#' . $id . ' ' . ($r->room_number ? 'Hab. ' . $r->room_number : $r->area) . ': ' . $r->issue,
      'amount' => $cost, 'taxable' => 1, 'ref_type' => 'maintenance', 'ref_id' => (string) $id]);
    cg_log('orden_resuelta', 'OT#' . $id . ($cost ? ' S/' . $cost : ''));
  }
  cg5_redir('cg-crm-mantenimiento');
});

/* ================= REPORTES ================= */
function cg5_render_reportes() {
  global $wpdb;
  // ocupacion + ADR/RevPAR por mes (4 atras, actual, 2 adelante)
  $months = [];
  for ($k = -4; $k <= 2; $k++) {
    $from = date('Y-m-01', strtotime("$k month")); $to = date('Y-m-t', strtotime("$k month"));
    $kpi = cg_hotel_kpis($from, $to);
    // ocupacion: noches vendidas / (units * dias)
    $units = 0; foreach (get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish']) as $rm) $units += cg_room_units($rm->ID);
    $days = (int) date('t', strtotime($from));
    $occ = $units ? round($kpi['nights'] / ($units * $days) * 100, 1) : 0;
    $months[] = ['m' => date('M y', strtotime($from)), 'occ' => $occ, 'adr' => $kpi['adr'], 'revpar' => $kpi['revpar'], 'rev' => $kpi['revenue'], 'fut' => $k > 0];
  }
  // ingresos por categoria (mes actual)
  $fin = cg_finance_summary(date('Y-m-01'), date('Y-m-t'));
  $bycat = [];
  foreach ($fin['ing_rows'] as $r) $bycat[$r['category']] = ($bycat[$r['category']] ?? 0) + $r['amount'];
  arsort($bycat);
  // top consumos folio
  $top = $wpdb->get_results("SELECT concept, SUM(qty) q, SUM(total) t FROM " . cg_tbl('folio') . " GROUP BY concept ORDER BY t DESC LIMIT 8");
  // top huespedes
  $guests = array_slice(cg_guests_index(), 0, 6, true);
  $maxrev = 1; foreach ($months as $m) $maxrev = max($maxrev, $m['rev']);
  ?>
  <div class="cg-card" style="margin-bottom:14px">
    <h3>📊 Ocupacion, ADR y RevPAR por mes (incluye proyeccion)</h3>
    <table class="widefat striped"><thead><tr><th>Mes</th><th>Ingresos alojamiento</th><th></th><th>Ocupacion</th><th>ADR</th><th>RevPAR</th></tr></thead><tbody>
    <?php foreach ($months as $m) : ?>
      <tr <?php echo $m['fut'] ? 'style="background:#f0f7ff"' : ''; ?>>
        <td><b><?php echo esc_html($m['m']); ?></b><?php echo $m['fut'] ? ' <span style="font-size:10px;color:#154562">(proyectado)</span>' : ''; ?></td>
        <td>S/ <?php echo number_format($m['rev'], 0); ?></td>
        <td style="width:32%"><span style="display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,#154562,#3d87ba);width:<?php echo max(2, round($m['rev'] / $maxrev * 100)); ?>%"></span></td>
        <td><b><?php echo $m['occ']; ?>%</b></td>
        <td>S/ <?php echo number_format($m['adr'], 0); ?></td>
        <td>S/ <?php echo number_format($m['revpar'], 2); ?></td></tr>
    <?php endforeach; ?></tbody></table>
  </div>
  <div class="cg-grid two">
    <div class="cg-card"><h3>Ingresos por categoria (mes actual)</h3>
      <?php $maxc = max(1, max($bycat ?: [1]));
      foreach ($bycat as $cat => $amt) : ?>
        <div style="display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px">
          <span style="width:150px;color:#50575e"><?php echo esc_html($cat); ?></span>
          <span style="flex:1;background:#eef0f2;border-radius:6px;height:14px;overflow:hidden"><span style="display:block;height:100%;border-radius:6px;background:#1a7f37;width:<?php echo round($amt / $maxc * 100); ?>%"></span></span>
          <b style="width:90px;text-align:right">S/ <?php echo number_format($amt, 0); ?></b></div>
      <?php endforeach; if (!$bycat) echo '<p style="color:#64748b">Sin ingresos este mes.</p>'; ?>
    </div>
    <div class="cg-card"><h3>Top consumos cargados a habitaciones</h3>
      <table class="widefat striped" style="font-size:12px"><thead><tr><th>Consumo</th><th>Cant.</th><th>Total</th></tr></thead><tbody>
      <?php foreach ($top as $r) echo '<tr><td>' . esc_html($r->concept) . '</td><td>' . rtrim(rtrim(number_format((float) $r->q, 2), '0'), '.') . '</td><td><b>S/ ' . number_format((float) $r->t, 2) . '</b></td></tr>';
      if (!$top) echo '<tr><td colspan="3" style="color:#64748b">Aun sin consumos.</td></tr>'; ?></tbody></table>
      <h3 style="margin-top:14px">Mejores huespedes</h3>
      <table class="widefat striped" style="font-size:12px"><thead><tr><th>Huesped</th><th>Visitas</th><th>Gasto</th></tr></thead><tbody>
      <?php foreach ($guests as $g) echo '<tr><td><b>' . esc_html($g['name']) . '</b></td><td>' . $g['visits'] . '</td><td><b>S/ ' . number_format($g['spent'], 0) . '</b></td></tr>'; ?></tbody></table>
    </div>
  </div>
  <?php
}

/* ================= TURNOS semanales (reemplaza vista simple) ================= */
function cg5_render_turnos() {
  global $wpdb; $ts = cg_tbl('shifts'); $tst = cg_tbl('staff');
  $start = sanitize_text_field($_GET['sem'] ?? '');
  $monday = $start ?: date('Y-m-d', strtotime('monday this week'));
  $days = []; for ($i = 0; $i < 7; $i++) $days[] = date('Y-m-d', strtotime($monday . " +$i day"));
  $staff = $wpdb->get_results("SELECT * FROM $tst WHERE active=1 ORDER BY role, name");
  $shifts = [];
  foreach ($wpdb->get_results($wpdb->prepare("SELECT * FROM $ts WHERE work_date BETWEEN %s AND %s", $days[0], $days[6])) as $sh)
    $shifts[$sh->staff_id][$sh->work_date] = $sh->shift;
  $opts = ['' => '—', 'manana' => '🌅 Man', 'tarde' => '🌇 Tar', 'noche' => '🌙 Noc', 'descanso' => '💤 Desc'];
  ?>
  <div class="cg-card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
      <a class="button" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-turnos', 'sem' => date('Y-m-d', strtotime($monday . ' -7 day'))], admin_url('admin.php'))); ?>">← Semana anterior</a>
      <b>Semana del <?php echo esc_html(date('d/m', strtotime($days[0])) . ' al ' . date('d/m/Y', strtotime($days[6]))); ?></b>
      <a class="button" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-turnos', 'sem' => date('Y-m-d', strtotime($monday . ' +7 day'))], admin_url('admin.php'))); ?>">Semana siguiente →</a>
    </div>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
      <?php wp_nonce_field('cg5_shifts', '_n'); ?><input type="hidden" name="action" value="cg5_shifts"><input type="hidden" name="sem" value="<?php echo esc_attr($monday); ?>">
      <div style="overflow-x:auto"><table class="widefat" style="min-width:900px">
        <thead><tr><th>Trabajador</th><?php foreach ($days as $d) : $we = in_array(date('N', strtotime($d)), ['6', '7']); ?>
          <th style="text-align:center;<?php echo $we ? 'color:#c0392b' : ''; ?>"><?php echo date('D d/m', strtotime($d)); ?></th><?php endforeach; ?></tr></thead>
        <tbody>
        <?php foreach ($staff as $s) : ?>
          <tr><td><b><?php echo esc_html($s->name); ?></b><br><span style="font-size:11px;color:#64748b"><?php echo esc_html($s->role); ?></span></td>
          <?php foreach ($days as $d) : $cur = $shifts[$s->id][$d] ?? ''; ?>
            <td style="text-align:center"><select name="t[<?php echo (int) $s->id; ?>][<?php echo esc_attr($d); ?>]" style="font-size:11px">
              <?php foreach ($opts as $k => $l) echo '<option value="' . $k . '"' . selected($cur, $k, false) . '>' . $l . '</option>'; ?>
            </select></td>
          <?php endforeach; ?></tr>
        <?php endforeach; ?>
        </tbody></table></div>
      <p><button class="button button-primary">💾 Guardar semana completa</button></p>
    </form>
  </div>
  <?php
}
add_action('admin_post_cg5_shifts', function () {
  check_admin_referer('cg5_shifts', '_n'); cg5_can(); global $wpdb; $ts = cg_tbl('shifts');
  foreach ((array) ($_POST['t'] ?? []) as $sid => $daymap) {
    foreach ((array) $daymap as $date => $shift) {
      $sid = (int) $sid; $date = sanitize_text_field($date); $shift = sanitize_key($shift);
      $wpdb->delete($ts, ['staff_id' => $sid, 'work_date' => $date]);
      if ($shift) $wpdb->insert($ts, ['staff_id' => $sid, 'work_date' => $date, 'shift' => $shift]);
    }
  }
  cg_log('turnos_semana', $_POST['sem'] ?? '');
  cg5_redir('cg-crm-turnos', ['sem' => sanitize_text_field($_POST['sem'] ?? '')]);
});

/* ================= LIMPIEZA extendida ================= */
function cg5_render_limpieza() {
  global $wpdb; $t = cg_tbl('housekeeping'); $tst = cg_tbl('staff');
  $fil = sanitize_key($_GET['estado'] ?? '');
  $staff = $wpdb->get_results("SELECT id,name FROM $tst WHERE active=1 AND role='Limpieza'");
  if (!$staff) $staff = $wpdb->get_results("SELECT id,name FROM $tst WHERE active=1 ORDER BY name");
  $counts = cg_hk_counts();
  $states = ['sucio' => 'Sucias', 'en_limpieza' => 'En limpieza', 'ocupado' => 'Ocupadas', 'mantenimiento' => 'Mantenimiento', 'limpio' => 'Limpias'];
  ?>
  <div class="cg-card">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <a href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-limpieza'], admin_url('admin.php'))); ?>" class="button <?php echo !$fil ? 'button-primary' : ''; ?>">Todas</a>
      <?php foreach ($states as $k => $l) : ?>
        <a href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-limpieza', 'estado' => $k], admin_url('admin.php'))); ?>" class="button <?php echo $fil === $k ? 'button-primary' : ''; ?>"><?php echo $l; ?> (<?php echo (int) ($counts[$k] ?? 0); ?>)</a>
      <?php endforeach; ?>
      <?php if (($counts['sucio'] ?? 0) > 0 && $staff) : ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline-flex;gap:4px;margin-left:auto">
          <?php wp_nonce_field('cg5_hkmass', '_n'); ?><input type="hidden" name="action" value="cg5_hkmass">
          <select name="staff_id"><?php foreach ($staff as $s) echo '<option value="' . $s->id . '">' . esc_html($s->name) . '</option>'; ?></select>
          <button class="button">🧹 Asignar TODAS las sucias</button>
        </form>
      <?php endif; ?>
    </div>
    <?php $where = $fil ? $wpdb->prepare('WHERE h.status=%s', $fil) : '';
    $rows = $wpdb->get_results("SELECT h.*, s.name sname FROM $t h LEFT JOIN $tst s ON s.id=h.staff_id $where ORDER BY FIELD(h.status,'sucio','en_limpieza','mantenimiento','ocupado','limpio'), h.room_name"); ?>
    <table class="widefat striped"><thead><tr><th>Habitacion</th><th>Estado</th><th>Asignada a</th><th>Actualizado</th><th>Accion rapida</th></tr></thead><tbody>
    <?php foreach ($rows as $r) : ?>
      <tr><td><b><?php echo esc_html($r->room_name); ?></b></td>
        <td><?php echo function_exists('cg2_badge') ? cg2_badge($r->status) : esc_html($r->status); ?></td>
        <td><?php echo esc_html($r->sname ?: '—'); ?></td>
        <td style="font-size:11px;color:#64748b"><?php echo esc_html(date('d/m H:i', strtotime($r->updated))); ?></td>
        <td>
          <?php if ($r->status === 'sucio') : ?>
            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg5_hkq&id=' . $r->id . '&st=en_limpieza&f=' . $fil), 'cg5_hkq_' . $r->id)); ?>">▶ Iniciar limpieza</a>
          <?php elseif ($r->status === 'en_limpieza') : ?>
            <a class="button button-small button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg5_hkq&id=' . $r->id . '&st=limpio&f=' . $fil), 'cg5_hkq_' . $r->id)); ?>">✔ Marcar limpia</a>
          <?php elseif ($r->status === 'limpio') : ?>
            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg5_hkq&id=' . $r->id . '&st=sucio&f=' . $fil), 'cg5_hkq_' . $r->id)); ?>">Marcar sucia</a>
          <?php endif; ?>
        </td></tr>
    <?php endforeach; ?></tbody></table>
  </div>
  <?php
}
add_action('admin_post_cg5_hkq', function () {
  $id = (int) ($_GET['id'] ?? 0); check_admin_referer('cg5_hkq_' . $id); cg5_can(); global $wpdb;
  $wpdb->update(cg_tbl('housekeeping'), ['status' => sanitize_key($_GET['st']), 'updated' => current_time('mysql')], ['id' => $id]);
  cg5_redir('cg-crm-limpieza', ['estado' => sanitize_key($_GET['f'] ?? '')]);
});
add_action('admin_post_cg5_hkmass', function () {
  check_admin_referer('cg5_hkmass', '_n'); cg5_can(); global $wpdb;
  $sid = (int) $_POST['staff_id'];
  $wpdb->query($wpdb->prepare("UPDATE " . cg_tbl('housekeeping') . " SET status='en_limpieza', staff_id=%d, updated=NOW() WHERE status='sucio'", $sid));
  cg_log('limpieza_masiva', 'asignada a staff#' . $sid);
  cg5_redir('cg-crm-limpieza');
});

/* ================= Actividad reciente en dashboard ================= */
add_action('cg_dashboard_bottom', function () {
  global $wpdb;
  $rows = $wpdb->get_results("SELECT * FROM " . cg_tbl('activity') . " ORDER BY ts DESC LIMIT 10");
  echo '<div style="display:flex;gap:8px;margin-top:16px">'
     . '<a class="button button-primary" target="_blank" href="' . esc_url(admin_url('admin.php?page=cg-crm-audit')) . '">🌙 Cierre del dia (night audit)</a>'
     . '<a class="button" target="_blank" href="' . esc_url(admin_url('admin.php?page=cg-crm-hoja')) . '">🧹 Hoja de limpieza imprimible</a>'
     . '</div>';
  echo '<div class="cg-card" style="margin-top:16px"><h3>🕘 Actividad reciente (auditoria)</h3><table class="widefat striped" style="font-size:12px">';
  foreach ($rows as $r)
    echo '<tr><td style="width:120px;color:#64748b">' . esc_html(date('d/m H:i', strtotime($r->ts))) . '</td><td><b>' . esc_html($r->user) . '</b></td><td>' . esc_html($r->action) . '</td><td>' . esc_html($r->detail) . '</td></tr>';
  if (!$rows) echo '<tr><td style="color:#64748b">Sin actividad registrada aun.</td></tr>';
  echo '</table></div>';
});

/* ================= Menu + secciones nuevas ================= */
add_action('admin_menu', function () {
  $cap = 'manage_hotel';
  add_submenu_page('cg-crm', 'Huespedes', 'Huespedes', $cap, 'cg-crm-huespedes', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Tarifas', 'Tarifas', $cap, 'cg-crm-tarifas', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Mantenimiento', 'Mantenimiento', $cap, 'cg-crm-mantenimiento', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Reportes', 'Reportes', $cap, 'cg-crm-reportes', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Chatbot & Canales', '🤖 Chatbot & Canales', $cap, 'cg-crm-canales', 'cg_crm_render_router');
}, 11);
