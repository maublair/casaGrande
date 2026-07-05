<?php
/**
 * Plugin Name: Casa Grande CRM (gestion completa)
 * Description: Rack de cuartos 101-515, front desk (check-in/out, asignacion, cuenta del cuarto con restaurante), personal con contratos PDF y pagos de ley, almacen con usos y proveedores, finanzas con formularios, proveedores/terceros, calendario de ocupacion.
 */
if (!defined('ABSPATH')) exit;

add_action('admin_enqueue_scripts', function ($hook) {
  if (strpos($hook, 'cg-crm') !== false) wp_enqueue_media();
});
add_action('admin_footer', function () {
  $s = function_exists('get_current_screen') ? get_current_screen() : null;
  if (!$s || strpos((string) $s->id, 'cg-crm') === false) return; ?>
  <script>
  jQuery(function($){
    $(document).on('click','.cg-pick-pdf',function(e){e.preventDefault();
      var t=$($(this).data('target')),l=$($(this).data('label'));
      var f=wp.media({title:'Contrato (PDF)',button:{text:'Usar'},multiple:false,library:{type:'application/pdf'}});
      f.on('select',function(){var a=f.state().get('selection').first().toJSON();t.val(a.id);l.text(a.filename||a.title);});
      f.open();});
  });
  </script><?php
});

function cg2_field($label, $inner) {
  return '<label style="display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#50575e">' . esc_html($label) . $inner . '</label>';
}
function cg2_pay_concepts() { return ['sueldo'=>'Sueldo','essalud'=>'EsSalud 9%','cts'=>'CTS','gratificacion'=>'Gratificacion','vacaciones'=>'Vacaciones']; }
function cg2_pay_methods() { return ['efectivo'=>'Efectivo','tarjeta'=>'Tarjeta','yape'=>'Yape','plin'=>'Plin','transferencia'=>'Transferencia']; }
function cg2_hk_status_of($number) {
  global $wpdb; static $map = null;
  if ($map === null) { $map = [];
    foreach ($wpdb->get_results("SELECT room_name,status FROM " . cg_tbl('housekeeping')) as $r)
      if (preg_match('/Hab\. (\d+)/', $r->room_name, $m)) $map[(int) $m[1]] = $r->status; }
  return $map[(int) $number] ?? 'limpio';
}
function cg2_set_hk($number, $status) {
  global $wpdb;
  $wpdb->query($wpdb->prepare("UPDATE " . cg_tbl('housekeeping') . " SET status=%s, updated=NOW() WHERE room_name LIKE %s", $status, 'Hab. ' . (int) $number . ' %'));
}
function cg2_badge($st) {
  $m = ['limpio'=>['#1a7f37','Limpio'],'ocupado'=>['#154562','Ocupado'],'sucio'=>['#c0392b','Sucio'],
    'en_limpieza'=>['#bd8b00','En limpieza'],'mantenimiento'=>['#7b3fa0','Mantenim.']][$st] ?? ['#666', ucfirst($st)];
  return '<span style="background:' . $m[0] . '22;color:' . $m[0] . ';padding:1px 8px;border-radius:12px;font-size:11px;font-weight:700">' . $m[1] . '</span>';
}
function cg2_redir($page, $extra = []) { wp_safe_redirect(add_query_arg(array_merge(['page' => $page, 'done' => 1], $extra), admin_url('admin.php'))); exit; }
function cg2_can() { if (!current_user_can('manage_hotel')) wp_die('Sin permiso'); }

/* ================= CUARTOS: rack por piso ================= */
function cg_crm2_render_cuartos() {
  $types = get_posts(['post_type'=>'room','posts_per_page'=>-1,'post_status'=>'publish','orderby'=>'meta_value_num','meta_key'=>'cg_price','order'=>'ASC']);
  $floors = cg_rack_floors(); $cur = (int) ($_GET['piso'] ?? ($floors[0] ?? 1));
  ?>
  <div class="cg-card" style="margin-bottom:14px"><h3>Inventario por tipo (alimenta la web y reservas)</h3>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
    <?php foreach ($types as $t) : ?>
      <div style="background:#f6f7f9;border-radius:10px;padding:10px 16px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#0c2b3d"><?php echo cg_room_units_physical($t->ID); ?></div>
        <div style="font-size:12px;color:#64748b"><?php echo esc_html($t->post_title); ?></div></div>
    <?php endforeach; ?>
    <div style="align-self:center;font-size:12px;color:#64748b;max-width:320px">Cambia el tipo de un cuarto y la disponibilidad de la web se recalcula sola.</div></div></div>
  <div class="cg-card"><h3>Rack — piso <?php echo $cur; ?></h3>
    <div style="display:flex;gap:6px;margin:10px 0 14px">
    <?php foreach ($floors as $f) : ?>
      <a href="<?php echo esc_url(add_query_arg(['page'=>'cg-crm-cuartos','piso'=>$f], admin_url('admin.php'))); ?>" style="padding:6px 14px;border-radius:8px;text-decoration:none;font-weight:700;<?php echo $f===$cur?'background:#0c2b3d;color:#fff':'background:#eef0f2;color:#50575e'; ?>">Piso <?php echo $f; ?></a>
    <?php endforeach; ?></div>
    <table class="widefat striped" style="max-width:1100px">
      <thead><tr><th>N°</th><th>Tipo</th><th>Adultos</th><th>Niños</th><th>Limpieza</th><th>Activa</th><th></th></tr></thead><tbody>
      <?php foreach (cg_rack_rows($cur) as $r) : ?>
        <tr><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
          <?php wp_nonce_field('cg2_room','_n'); ?><input type="hidden" name="action" value="cg2_room"><input type="hidden" name="id" value="<?php echo (int) $r->id; ?>"><input type="hidden" name="piso" value="<?php echo $cur; ?>">
          <td><strong style="font-size:15px"><?php echo (int) $r->number; ?></strong></td>
          <td><select name="type_id"><?php foreach ($types as $t) echo '<option value="'.$t->ID.'"'.selected($r->type_id,$t->ID,false).'>'.esc_html($t->post_title).'</option>'; ?></select></td>
          <td><input type="number" name="cap_adults" value="<?php echo (int) $r->cap_adults; ?>" min="1" max="6" style="width:58px"></td>
          <td><input type="number" name="cap_children" value="<?php echo (int) $r->cap_children; ?>" min="0" max="4" style="width:58px"></td>
          <td><?php echo cg2_badge(cg2_hk_status_of($r->number)); ?></td>
          <td><label><input type="checkbox" name="active" value="1" <?php checked($r->active,1); ?>> si</label></td>
          <td><button class="button button-small button-primary">Guardar</button></td>
        </form></tr>
      <?php endforeach; ?></tbody></table></div>
  <?php
}
add_action('admin_post_cg2_room', function () {
  check_admin_referer('cg2_room','_n'); cg2_can(); global $wpdb;
  $wpdb->update(cg_tbl('rooms'), ['type_id'=>(int)$_POST['type_id'],'cap_adults'=>max(1,(int)$_POST['cap_adults']),
    'cap_children'=>max(0,(int)$_POST['cap_children']),'active'=>isset($_POST['active'])?1:0], ['id'=>(int)$_POST['id']]);
  cg2_redir('cg-crm-cuartos', ['piso'=>(int)$_POST['piso']]);
});

/* ================= RESERVAS v2: front desk + folio + calendario ================= */
function cg2_free_rooms_of_type($type_id) {
  global $wpdb;
  $busy = [];
  $q = new WP_Query(['post_type'=>'reservation','posts_per_page'=>-1,'post_status'=>'publish','fields'=>'ids',
    'meta_query'=>[['key'=>'cg_inhouse','value'=>'1']]]);
  foreach ($q->posts as $rid) { $n = get_post_meta($rid, 'cg_room_number', true); if ($n) $busy[(int)$n] = 1; }
  $out = [];
  foreach ($wpdb->get_results($wpdb->prepare("SELECT number FROM " . cg_tbl('rooms') . " WHERE type_id=%d AND active=1 ORDER BY number", $type_id)) as $r)
    if (empty($busy[(int)$r->number])) $out[] = (int) $r->number;
  return $out;
}
function cg_crm2_render_reservas() {
  global $wpdb;
  $sel = (int) ($_GET['res'] ?? 0);
  $q = new WP_Query(['post_type'=>'reservation','posts_per_page'=>30,'post_status'=>'publish','orderby'=>'date','order'=>'DESC']);
  $dishes = get_posts(['post_type'=>'dish','posts_per_page'=>-1,'post_status'=>'publish','orderby'=>'title','order'=>'ASC']);
  // --- Calendario de ocupacion 14 dias por tipo ---
  $types = get_posts(['post_type'=>'room','posts_per_page'=>-1,'post_status'=>'publish','orderby'=>'meta_value_num','meta_key'=>'cg_price','order'=>'ASC']);
  $days = []; for ($i=0;$i<14;$i++) $days[] = date('Y-m-d', strtotime("+$i day"));
  ?>
  <div class="cg-card" style="margin-bottom:14px"><h3>Calendario de ocupacion — proximos 14 dias</h3>
    <div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:11px;min-width:860px">
      <tr><th style="text-align:left;padding:4px 8px">Tipo</th>
      <?php foreach ($days as $d) : ?><th style="padding:4px;color:#64748b"><?php echo date('d/m', strtotime($d)); ?></th><?php endforeach; ?></tr>
      <?php foreach ($types as $t) : $units = cg_room_units($t->ID); ?>
        <tr><td style="padding:4px 8px;font-weight:700;white-space:nowrap"><?php echo esc_html($t->post_title); ?> <span style="color:#94a3b8">(<?php echo $units; ?>)</span></td>
        <?php foreach ($days as $d) :
          $free = max(0, $units - cg_reserved_count($t->ID, $d, date('Y-m-d', strtotime($d . ' +1 day'))));
          $pct = $units ? $free / $units : 1;
          $bg = $pct == 0 ? '#c0392b' : ($pct < 0.4 ? '#e8a33d' : '#dff5e5');
          $fg = $pct == 0 ? '#fff' : ($pct < 0.4 ? '#fff' : '#155724'); ?>
          <td style="padding:4px;text-align:center;background:<?php echo $bg; ?>;color:<?php echo $fg; ?>;border:1px solid #fff;border-radius:3px;font-weight:700"><?php echo $free; ?></td>
        <?php endforeach; ?></tr>
      <?php endforeach; ?></table></div>
    <p style="font-size:11px;color:#64748b">Numero = habitaciones libres ese dia. Verde: disponible · Ambar: pocas · Rojo: completo.</p></div>

  <div class="cg-card"><h3>Front desk — reservas</h3>
    <table class="widefat striped"><thead><tr><th>Codigo / huesped</th><th>Tipo</th><th>Hab.</th><th>Fechas</th><th>Aloj.</th><th>Cuenta</th><th>Pago</th><th>Estado</th><th style="min-width:230px">Acciones</th></tr></thead><tbody>
    <?php foreach ($q->posts as $p) :
      $id = $p->ID;
      $inhouse = get_post_meta($id, 'cg_inhouse', true) === '1';
      $num = get_post_meta($id, 'cg_room_number', true);
      $status = get_post_meta($id, 'cg_status', true) ?: 'pendiente';
      $pay = get_post_meta($id, 'cg_payment', true) ?: 'por_pagar';
      $type_id = (int) get_post_meta($id, 'cg_room_id', true);
      $folio = cg_folio_total($id);
    ?>
      <tr style="<?php echo $inhouse ? 'background:#eaf6ff' : ''; ?>">
        <td><strong><?php echo esc_html(get_post_meta($id,'cg_code',true) ?: $p->post_title); ?></strong><br><span style="font-size:11px;color:#64748b"><?php echo esc_html(get_post_meta($id,'cg_name',true) ?: trim(explode('-',$p->post_title)[1] ?? '')); ?></span></td>
        <td style="font-size:12px"><?php echo esc_html(get_post_meta($id,'cg_room',true) ?: '—'); ?></td>
        <td><?php echo $num ? '<strong style="font-size:15px">' . esc_html($num) . '</strong>' : '<span style="color:#94a3b8">—</span>'; ?></td>
        <td style="font-size:12px"><?php echo esc_html(get_post_meta($id,'cg_check_in',true) . ' → ' . get_post_meta($id,'cg_check_out',true)); ?></td>
        <td>S/ <?php echo number_format((float) get_post_meta($id,'cg_total',true), 0); ?></td>
        <td><?php echo $folio > 0 ? '<strong style="color:#a87214">S/ ' . number_format($folio, 2) . '</strong>' : '—'; ?></td>
        <td><?php echo $pay === 'pagado' ? '<span style="color:#1a7f37;font-weight:700">Pagado</span>' : ($pay === 'parcial' ? '<span style="color:#bd8b00;font-weight:700">Parcial</span>' : '<span style="color:#c0392b;font-weight:700">Por pagar</span>'); ?></td>
        <td><?php echo $inhouse ? '<span style="color:#154562;font-weight:800">IN-HOUSE</span>' : cg2_badge($status === 'confirmada' ? 'limpio' : $status); echo !$inhouse ? '<span style="font-size:11px;color:#64748b"> ' . esc_html($status) . '</span>' : ''; ?></td>
        <td>
          <?php if (!$inhouse && $status !== 'cancelada') : $frees = cg2_free_rooms_of_type($type_id); ?>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:4px;align-items:center">
              <?php wp_nonce_field('cg2_checkin','_n'); ?><input type="hidden" name="action" value="cg2_checkin"><input type="hidden" name="res" value="<?php echo $id; ?>">
              <select name="room_number" style="width:76px"><option value="">Hab...</option>
                <?php foreach ($frees as $n) echo '<option value="' . $n . '"' . selected($num, (string) $n, false) . '>' . $n . '</option>'; ?></select>
              <button class="button button-small button-primary">Check-in</button>
            </form>
          <?php elseif ($inhouse) : ?>
            <a class="button button-small" href="<?php echo esc_url(add_query_arg(['page'=>'cg-crm-reservas','res'=>$id], admin_url('admin.php'))); ?>#cuenta">🧾 Cuenta</a>
            <a class="button button-small" style="color:#c0392b" onclick="return confirm('¿Hacer check-out? La cuenta pendiente se liquida como ingreso.')"
               href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg2_checkout&res=' . $id), 'cg2_checkout_' . $id)); ?>">Check-out</a>
          <?php endif; ?>
          <a class="button button-small" href="<?php echo esc_url(get_edit_post_link($id)); ?>">Editar</a>
        </td>
      </tr>
    <?php endforeach; ?></tbody></table></div>

  <?php if ($sel) :
    $rows = cg_folio_rows($sel); $tot = cg_folio_total($sel);
    $code = get_post_meta($sel, 'cg_code', true); $num = get_post_meta($sel, 'cg_room_number', true); ?>
    <div class="cg-card" id="cuenta" style="margin-top:14px;border:2px solid #c9a84c">
      <h3>🧾 Cuenta del cuarto — Hab. <?php echo esc_html($num ?: '—'); ?> (<?php echo esc_html($code); ?>)</h3>
      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px">
        <div>
          <table class="widefat striped"><thead><tr><th>Fecha</th><th>Consumo</th><th>Cant.</th><th>P.U.</th><th>Total</th><th></th></tr></thead><tbody>
          <?php foreach ($rows as $f) : ?>
            <tr <?php echo $f->settled ? 'style="opacity:.5"' : ''; ?>>
              <td><?php echo esc_html(date('d/m H:i', strtotime($f->ts))); ?></td>
              <td><?php echo esc_html($f->concept); ?></td>
              <td><?php echo rtrim(rtrim(number_format((float) $f->qty, 2), '0'), '.'); ?></td>
              <td>S/ <?php echo number_format((float) $f->unit_price, 2); ?></td>
              <td>S/ <?php echo number_format((float) $f->total, 2); ?></td>
              <td><?php if (!$f->settled) : ?><a style="color:#c0392b" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg2_folio_del&id=' . $f->id . '&res=' . $sel), 'cg2_foliodel_' . $f->id)); ?>">✕</a><?php endif; ?></td>
            </tr>
          <?php endforeach; if (!$rows) echo '<tr><td colspan="6" style="color:#64748b">Sin consumos aun.</td></tr>'; ?>
          </tbody></table>
          <p style="text-align:right;font-size:16px;margin-top:8px">Pendiente: <strong style="color:#a87214">S/ <?php echo number_format($tot, 2); ?></strong></p>
        </div>
        <div>
          <h4 style="margin:0 0 8px">Agregar pedido del restaurante</h4>
          <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;flex-direction:column;gap:8px">
            <?php wp_nonce_field('cg2_folio','_n'); ?><input type="hidden" name="action" value="cg2_folio"><input type="hidden" name="res" value="<?php echo $sel; ?>">
            <select name="dish_id"><option value="">— plato de la carta —</option>
              <?php foreach ($dishes as $d) echo '<option value="' . $d->ID . '">' . esc_html($d->post_title) . ' (S/ ' . number_format((float) get_post_meta($d->ID, 'cg_price', true), 2) . ')</option>'; ?>
            </select>
            <div style="display:flex;gap:8px">
              <?php echo cg2_field('Cantidad', '<input type="number" step="1" min="1" name="qty" value="1" style="width:80px">'); ?>
            </div>
            <div style="border-top:1px dashed #e3e6ea;padding-top:8px;font-size:12px;color:#64748b">…o un consumo libre:</div>
            <div style="display:flex;gap:8px">
              <?php echo cg2_field('Concepto', '<input name="concept" placeholder="Ej: Lavanderia">');
                    echo cg2_field('Monto (S/)', '<input type="number" step="0.01" name="amount" style="width:100px">'); ?>
            </div>
            <button class="button button-primary">Cargar a la habitacion</button>
          </form>
          <p style="font-size:11px;color:#64748b;margin-top:10px">Al hacer <strong>check-out</strong>, la cuenta pendiente se liquida y entra sola como ingreso de Restaurante/Consumos en Finanzas.</p>
        </div>
      </div>
    </div>
  <?php endif;
}
add_action('admin_post_cg2_checkin', function () {
  check_admin_referer('cg2_checkin','_n'); cg2_can();
  $res = (int) $_POST['res']; $num = (int) ($_POST['room_number'] ?? 0);
  if ($res && $num) {
    update_post_meta($res, 'cg_room_number', (string) $num);
    update_post_meta($res, 'cg_inhouse', '1');
    update_post_meta($res, 'cg_status', 'confirmada');
    cg2_set_hk($num, 'ocupado');
  }
  cg2_redir('cg-crm-reservas');
});
add_action('admin_post_cg2_checkout', function () {
  $res = (int) ($_GET['res'] ?? 0);
  check_admin_referer('cg2_checkout_' . $res); cg2_can(); global $wpdb;
  $tot = cg_folio_total($res);
  if ($tot > 0) {
    $code = get_post_meta($res, 'cg_code', true); $num = get_post_meta($res, 'cg_room_number', true);
    $wpdb->insert(cg_tbl('ledger'), ['kind'=>'ingreso','category'=>'Restaurante / Consumos',
      'concept'=>'Cuenta Hab. ' . $num . ' — ' . $code, 'amount'=>$tot, 'taxable'=>1,
      'ref_type'=>'folio', 'ref_id'=>(string) $res]);
    $wpdb->query($wpdb->prepare("UPDATE " . cg_tbl('folio') . " SET settled=1 WHERE res_id=%d", $res));
  }
  $num = get_post_meta($res, 'cg_room_number', true);
  if ($num) cg2_set_hk((int) $num, 'sucio');
  update_post_meta($res, 'cg_inhouse', '0');
  cg2_redir('cg-crm-reservas');
});
add_action('admin_post_cg2_folio', function () {
  check_admin_referer('cg2_folio','_n'); cg2_can(); global $wpdb;
  $res = (int) $_POST['res']; $qty = max(1, (float) ($_POST['qty'] ?? 1));
  $dish = (int) ($_POST['dish_id'] ?? 0);
  if ($dish) {
    $price = (float) get_post_meta($dish, 'cg_price', true);
    $wpdb->insert(cg_tbl('folio'), ['res_id'=>$res,'concept'=>get_the_title($dish),'qty'=>$qty,'unit_price'=>$price,'total'=>$qty*$price]);
  } elseif (!empty($_POST['concept']) && (float) $_POST['amount'] > 0) {
    $amt = (float) $_POST['amount'];
    $wpdb->insert(cg_tbl('folio'), ['res_id'=>$res,'concept'=>sanitize_text_field($_POST['concept']),'qty'=>1,'unit_price'=>$amt,'total'=>$amt]);
  }
  cg2_redir('cg-crm-reservas', ['res'=>$res]);
});
add_action('admin_post_cg2_folio_del', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg2_foliodel_' . $id); cg2_can(); global $wpdb;
  $wpdb->delete(cg_tbl('folio'), ['id'=>$id, 'settled'=>0]);
  cg2_redir('cg-crm-reservas', ['res'=>(int) ($_GET['res'] ?? 0)]);
});

/* ================= PERSONAL completo ================= */
function cg_crm2_render_personal() {
  global $wpdb; $t = cg_tbl('staff'); $tp = cg_tbl('staff_payments');
  $staff = $wpdb->get_results("SELECT * FROM $t ORDER BY active DESC, name ASC");
  $period = sanitize_text_field($_GET['period'] ?? date('Y-m'));
  $pays = [];
  foreach ($wpdb->get_results($wpdb->prepare("SELECT * FROM $tp WHERE period=%s", $period)) as $p) $pays[$p->staff_id][$p->concept] = $p;
  $edit_id = (int) ($_GET['edit'] ?? 0);
  $edit = $edit_id ? $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id=%d", $edit_id)) : null;
  ?>
  <div class="cg-card" style="margin-bottom:14px"><h3>Equipo</h3>
    <table class="widefat striped"><thead><tr><th>Nombre</th><th>Rol</th><th>DNI</th><th>Sueldo</th><th>Ingreso</th><th>Fin contrato</th><th>Contrato</th><th>Estado</th><th></th></tr></thead><tbody>
    <?php foreach ($staff as $s) : $warn = $s->contract_end && strtotime($s->contract_end) < strtotime('+30 days'); ?>
      <tr><td><strong><?php echo esc_html($s->name); ?></strong><br><span style="color:#64748b;font-size:11px"><?php echo esc_html($s->phone); ?></span></td>
        <td><?php echo esc_html($s->role); ?></td><td><?php echo esc_html($s->doc_id ?: '—'); ?></td>
        <td>S/ <?php echo number_format((float) $s->salary, 0); ?></td>
        <td><?php echo esc_html($s->hire_date ?: '—'); ?></td>
        <td style="<?php echo $warn ? 'color:#c0392b;font-weight:700' : ''; ?>"><?php echo esc_html($s->contract_end ?: '—'); echo $warn ? ' ⚠' : ''; ?></td>
        <td><?php echo $s->contract_att ? '<a class="button button-small" target="_blank" href="' . esc_url(wp_get_attachment_url($s->contract_att)) . '">📄 PDF</a>' : '<span style="color:#c0392b;font-size:11px">falta</span>'; ?></td>
        <td><?php echo $s->active ? '<span style="color:#1a7f37;font-weight:700">Activo</span>' : '<span style="color:#888">Inactivo</span>'; ?></td>
        <td><a class="button button-small" href="<?php echo esc_url(add_query_arg(['page'=>'cg-crm-personal','edit'=>$s->id], admin_url('admin.php'))); ?>">Editar</a></td></tr>
    <?php endforeach; ?></tbody></table></div>

  <div class="cg-grid two">
    <div class="cg-card"><h3><?php echo $edit ? 'Editar: ' . esc_html($edit->name) : 'Agregar personal'; ?></h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg2_staff','_n'); ?><input type="hidden" name="action" value="cg2_staff"><input type="hidden" name="id" value="<?php echo $edit ? (int) $edit->id : 0; ?>">
        <?php $v = function ($k, $d = '') use ($edit) { return esc_attr($edit->$k ?? $d); };
        echo cg2_field('Nombre completo', '<input name="name" required value="' . $v('name') . '">');
        echo cg2_field('DNI / CE', '<input name="doc_id" value="' . $v('doc_id') . '">');
        $ro = '<select name="role">'; foreach (['Recepcion','Limpieza','Cocina','Catering','Administracion','Mantenimiento','Seguridad'] as $r) $ro .= '<option' . selected($edit->role ?? '', $r, false) . '>' . $r . '</option>'; $ro .= '</select>';
        echo cg2_field('Rol', $ro);
        echo cg2_field('Telefono', '<input name="phone" value="' . $v('phone') . '">');
        echo cg2_field('Sueldo (S/)', '<input type="number" step="0.01" name="salary" value="' . $v('salary', '1300') . '">');
        echo cg2_field('Fecha de ingreso', '<input type="date" name="hire_date" value="' . $v('hire_date') . '">');
        echo cg2_field('Fin de contrato', '<input type="date" name="contract_end" value="' . $v('contract_end') . '">');
        $att = (int) ($edit->contract_att ?? 0);
        echo cg2_field('Contrato (PDF)', '<input type="hidden" name="contract_att" id="cg2-contract" value="' . $att . '"><span style="display:flex;gap:6px;align-items:center"><button type="button" class="button cg-pick-pdf" data-target="#cg2-contract" data-label="#cg2-contract-name">📄 Subir/elegir</button><em id="cg2-contract-name" style="font-size:11px;color:#64748b">' . ($att ? esc_html(basename((string) wp_get_attachment_url($att))) : 'ninguno') . '</em></span>'); ?>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600"><input type="checkbox" name="active" value="1" <?php checked((int) ($edit->active ?? 1), 1); ?>> Activo</label>
        <div style="grid-column:1/-1;display:flex;gap:8px"><button class="button button-primary"><?php echo $edit ? 'Guardar' : 'Agregar'; ?></button>
        <?php if ($edit) : ?><a class="button" href="<?php echo esc_url(cg_crm_url('cg-crm-personal')); ?>">Cancelar</a><?php endif; ?></div>
      </form></div>

    <div class="cg-card"><h3>Pagos por ley — <?php echo esc_html($period); ?></h3>
      <form method="get" style="display:flex;gap:8px;margin-bottom:10px">
        <input type="hidden" name="page" value="cg-crm-personal"><input type="month" name="period" value="<?php echo esc_attr($period); ?>"><button class="button">Ver mes</button>
      </form>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-bottom:10px">
        <?php wp_nonce_field('cg2_paygen','_n'); ?><input type="hidden" name="action" value="cg2_paygen"><input type="hidden" name="period" value="<?php echo esc_attr($period); ?>">
        <button class="button">Generar planilla del mes (sueldo + EsSalud)</button>
      </form>
      <table class="widefat striped"><thead><tr><th>Trabajador</th><th>Concepto</th><th>Monto</th><th>Estado</th><th></th></tr></thead><tbody>
      <?php foreach ($staff as $s) { if (!$s->active) continue;
        foreach (cg2_pay_concepts() as $ck => $cl) {
          $p = $pays[$s->id][$ck] ?? null;
          if (!$p && !in_array($ck, ['sueldo','essalud'], true)) continue; ?>
          <tr><td><?php echo esc_html($s->name); ?></td><td><?php echo esc_html($cl); ?></td>
            <td><?php echo $p ? 'S/ ' . number_format((float) $p->amount, 2) : '—'; ?></td>
            <td><?php echo $p ? ($p->paid ? '<span style="color:#1a7f37;font-weight:700">Pagado ' . esc_html($p->paid_date) . '</span>' : '<span style="color:#c0392b;font-weight:700">Pendiente</span>') : '<span style="color:#888">no generado</span>'; ?></td>
            <td><?php if ($p) : ?><a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg2_paytoggle&id=' . $p->id . '&period=' . $period), 'cg2_pay_' . $p->id)); ?>"><?php echo $p->paid ? 'Deshacer' : 'Marcar pagado'; ?></a><?php endif; ?></td></tr>
      <?php } } ?></tbody></table>
      <p style="font-size:12px;color:#64748b">Lo pagado se registra solo como egreso de Personal en Finanzas.</p></div>
  </div>
  <?php
}
add_action('admin_post_cg2_staff', function () {
  check_admin_referer('cg2_staff','_n'); cg2_can(); global $wpdb;
  $data = ['name'=>sanitize_text_field($_POST['name']),'doc_id'=>sanitize_text_field($_POST['doc_id'] ?? ''),
    'role'=>sanitize_text_field($_POST['role']),'phone'=>sanitize_text_field($_POST['phone'] ?? ''),
    'salary'=>(float) $_POST['salary'],'hire_date'=>(sanitize_text_field($_POST['hire_date'] ?? '') ?: null),
    'contract_end'=>(sanitize_text_field($_POST['contract_end'] ?? '') ?: null),
    'contract_att'=>(int) ($_POST['contract_att'] ?? 0),'active'=>isset($_POST['active']) ? 1 : 0];
  $id = (int) ($_POST['id'] ?? 0);
  if ($id) $wpdb->update(cg_tbl('staff'), $data, ['id'=>$id]); else $wpdb->insert(cg_tbl('staff'), $data);
  cg2_redir('cg-crm-personal');
});
add_action('admin_post_cg2_paygen', function () {
  check_admin_referer('cg2_paygen','_n'); cg2_can(); global $wpdb; $tp = cg_tbl('staff_payments');
  $period = sanitize_text_field($_POST['period'] ?? date('Y-m'));
  foreach ($wpdb->get_results("SELECT id, salary FROM " . cg_tbl('staff') . " WHERE active=1") as $s)
    foreach (['sueldo'=>(float) $s->salary,'essalud'=>round($s->salary * 0.09, 2)] as $c => $amt)
      if (!$wpdb->get_var($wpdb->prepare("SELECT id FROM $tp WHERE staff_id=%d AND period=%s AND concept=%s", $s->id, $period, $c)))
        $wpdb->insert($tp, ['staff_id'=>$s->id,'period'=>$period,'concept'=>$c,'amount'=>$amt,'paid'=>0]);
  cg2_redir('cg-crm-personal', ['period'=>$period]);
});
add_action('admin_post_cg2_paytoggle', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg2_pay_' . $id); cg2_can(); global $wpdb; $tp = cg_tbl('staff_payments');
  $p = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tp WHERE id=%d", $id));
  if ($p) {
    $new = $p->paid ? 0 : 1;
    $wpdb->update($tp, ['paid'=>$new, 'paid_date'=>$new ? current_time('Y-m-d') : null], ['id'=>$id]);
    if ($new) {
      $name = $wpdb->get_var($wpdb->prepare("SELECT name FROM " . cg_tbl('staff') . " WHERE id=%d", $p->staff_id));
      $wpdb->insert(cg_tbl('ledger'), ['kind'=>'egreso','category'=>'Personal','concept'=>ucfirst($p->concept) . ' ' . $p->period . ' — ' . $name,
        'amount'=>(float) $p->amount,'taxable'=>0,'ref_type'=>'staff_payment','ref_id'=>(string) $p->id]);
    } else $wpdb->delete(cg_tbl('ledger'), ['ref_type'=>'staff_payment','ref_id'=>(string) $p->id]);
  }
  cg2_redir('cg-crm-personal', ['period'=>sanitize_text_field($_GET['period'] ?? date('Y-m'))]);
});

/* ================= ALMACEN completo ================= */
function cg_crm2_render_almacen() {
  global $wpdb; $t = cg_tbl('inventory'); $sp = cg_tbl('suppliers');
  $rows = $wpdb->get_results("SELECT i.*, s.name sname FROM $t i LEFT JOIN $sp s ON s.id=i.supplier_id ORDER BY i.area, i.name");
  $sups = $wpdb->get_results("SELECT id,name FROM $sp WHERE active=1 ORDER BY name");
  $edit_id = (int) ($_GET['edit'] ?? 0);
  $edit = $edit_id ? $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id=%d", $edit_id)) : null;
  $moves = $wpdb->get_results("SELECT m.*, i.name iname, i.unit FROM " . cg_tbl('stock_moves') . " m LEFT JOIN $t i ON i.id=m.item_id ORDER BY m.ts DESC LIMIT 25");
  ?>
  <div class="cg-card" style="margin-bottom:14px"><h3>Inventario y logistica de TODO el inmueble — insumos, herramientas, equipos y activos</h3>
    <table class="widefat striped"><thead><tr><th>Insumo</th><th>Tipo</th><th>Ubicacion</th><th>Area</th><th>Proveedor</th><th>Stock</th><th>Vence</th><th>Costo</th><th>Valor</th><th>Movimiento rapido</th><th></th></tr></thead><tbody>
    <?php foreach ($rows as $r) : $low = (float) $r->stock <= (float) $r->min_stock; ?>
      <tr <?php echo $low ? 'style="background:#fdecea"' : ''; ?>>
        <td><strong><?php echo esc_html($r->name); ?></strong> <span style="color:#94a3b8;font-size:11px"><?php echo esc_html($r->sku); ?></span><br><span style="font-size:10px;color:#94a3b8">adq: <?php echo esc_html($r->acquired_date ?: '—'); ?> · min <?php echo rtrim(rtrim(number_format((float) $r->min_stock, 2), '0'), '.'); ?></span></td>
        <td><?php $tt=['alimento'=>['#1a7f37','Alimento'],'material'=>['#154562','Material'],'herramienta'=>['#7b3fa0','Herramienta'],'equipo'=>['#bd8b00','Equipo'],'activo'=>['#0c2b3d','Activo/Mueble']][$r->item_type ?? 'material'] ?? ['#666', ucfirst($r->item_type ?? '')]; echo '<span style="background:' . $tt[0] . '22;color:' . $tt[0] . ';padding:1px 8px;border-radius:12px;font-size:11px;font-weight:700">' . $tt[1] . '</span>'; ?></td>
        <td style="font-size:12px"><?php echo esc_html($r->location ?: 'Almacen general'); ?></td>
        <td><?php echo esc_html(ucfirst($r->area)); ?></td><td><?php echo esc_html($r->sname ?: '—'); ?></td>
        <td><?php echo rtrim(rtrim(number_format((float) $r->stock, 2), '0'), '.') . ' ' . esc_html($r->unit); echo $low ? ' ⚠️' : ''; ?></td>
        <td><?php if ($r->expiry_date) { $dv = (strtotime($r->expiry_date) - time()) / 86400;
          if ($dv < 0) echo '<b style="color:#c0392b">VENCIDO<br>' . esc_html($r->expiry_date) . '</b>';
          elseif ($dv <= 15) echo '<b style="color:#bd8b00">' . esc_html($r->expiry_date) . ' ⚠</b>';
          else echo '<span style="font-size:12px">' . esc_html($r->expiry_date) . '</span>'; } else echo '<span style="color:#cbd5e1">n/a</span>'; ?></td>
        <td>S/ <?php echo number_format((float) $r->cost, 2); ?></td>
        <td>S/ <?php echo number_format((float) $r->stock * (float) $r->cost, 2); ?></td>
        <td><form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:4px;align-items:center">
          <?php wp_nonce_field('cg2_mov','_n'); ?><input type="hidden" name="action" value="cg2_mov"><input type="hidden" name="item_id" value="<?php echo (int) $r->id; ?>">
          <select name="kind"><option value="entrada">Entrada</option><option value="salida">Salida (uso)</option></select>
          <input type="number" step="0.01" name="qty" value="1" style="width:60px"><input name="destino" placeholder="destino/uso" style="width:100px">
          <button class="button button-small">OK</button></form></td>
        <td style="white-space:nowrap"><a class="button button-small" href="<?php echo esc_url(add_query_arg(['page'=>'cg-crm-almacen','edit'=>$r->id], admin_url('admin.php'))); ?>">Editar</a>
          <a class="button button-small" style="color:#c0392b" onclick="return confirm('¿Eliminar insumo?')" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg2_itemdel&id=' . $r->id), 'cg2_itemdel_' . $r->id)); ?>">✕</a></td></tr>
    <?php endforeach; ?></tbody></table>
    <p style="font-size:12px;color:#64748b">Entrada = compra (suma stock, genera egreso automatico con proveedor). Salida = uso/consumo con destino (cocina, housekeeping, evento…).</p></div>
  <div class="cg-grid two">
    <div class="cg-card"><h3><?php echo $edit ? 'Editar: ' . esc_html($edit->name) : 'Agregar insumo'; ?></h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg2_item','_n'); ?><input type="hidden" name="action" value="cg2_item"><input type="hidden" name="id" value="<?php echo $edit ? (int) $edit->id : 0; ?>">
        <?php $v = function ($k, $d = '') use ($edit) { return esc_attr($edit->$k ?? $d); };
        echo cg2_field('Nombre', '<input name="name" required value="' . $v('name') . '">');
        echo cg2_field('SKU', '<input name="sku" value="' . $v('sku') . '">');
        $ar = '<select name="area">'; foreach (['hotel'=>'Hotel','restaurante'=>'Restaurante','catering'=>'Catering'] as $k => $l) $ar .= '<option value="' . $k . '"' . selected($edit->area ?? 'hotel', $k, false) . '>' . $l . '</option>'; $ar .= '</select>';
        echo cg2_field('Area', $ar);
        echo cg2_field('Unidad', '<input name="unit" value="' . $v('unit', 'und') . '">');
        echo cg2_field('Stock', '<input type="number" step="0.01" name="stock" value="' . $v('stock', '0') . '">');
        echo cg2_field('Minimo (alerta)', '<input type="number" step="0.01" name="min_stock" value="' . $v('min_stock', '0') . '">');
        echo cg2_field('Costo (S/)', '<input type="number" step="0.01" name="cost" value="' . $v('cost', '0') . '">');
        $su = '<select name="supplier_id"><option value="0">— sin proveedor —</option>';
        foreach ($sups as $s) $su .= '<option value="' . $s->id . '"' . selected((int) ($edit->supplier_id ?? 0), (int) $s->id, false) . '>' . esc_html($s->name) . '</option>'; $su .= '</select>';
        echo cg2_field('Proveedor', $su);
        $ty = '<select name="item_type">'; foreach (['alimento'=>'Alimento','material'=>'Material','herramienta'=>'Herramienta','equipo'=>'Equipo','activo'=>'Activo / Mueble'] as $k => $l) $ty .= '<option value="' . $k . '"' . selected($edit->item_type ?? 'material', $k, false) . '>' . $l . '</option>'; $ty .= '</select>';
        echo cg2_field('Tipo de item', $ty);
        echo cg2_field('Ubicacion en el inmueble', '<input name="location" value="' . $v('location', 'Almacen general') . '" placeholder="Almacen, Cocina, Hab. 101, Lobby...">');
        echo cg2_field('Fecha de adquisicion', '<input type="date" name="acquired_date" value="' . $v('acquired_date') . '">');
        echo cg2_field('Fecha de vencimiento', '<input type="date" name="expiry_date" value="' . $v('expiry_date') . '">'); ?>
        <div style="grid-column:1/-1;display:flex;gap:8px"><button class="button button-primary"><?php echo $edit ? 'Guardar' : 'Agregar'; ?></button>
        <?php if ($edit) : ?><a class="button" href="<?php echo esc_url(cg_crm_url('cg-crm-almacen')); ?>">Cancelar</a><?php endif; ?></div>
      </form></div>
    <div class="cg-card"><h3>Historial de movimientos</h3>
      <table class="widefat striped"><thead><tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cant.</th><th>Destino/nota</th><th>Total</th></tr></thead><tbody>
      <?php foreach ($moves as $m) : ?>
        <tr><td><?php echo esc_html(date('d/m H:i', strtotime($m->ts))); ?></td><td><?php echo esc_html($m->iname ?: '#' . $m->item_id); ?></td>
          <td><?php echo $m->kind === 'entrada' ? '<span style="color:#1a7f37;font-weight:700">Entrada</span>' : '<span style="color:#c0392b;font-weight:700">Salida</span>'; ?></td>
          <td><?php echo rtrim(rtrim(number_format((float) $m->qty, 2), '0'), '.') . ' ' . esc_html($m->unit); ?></td>
          <td><?php echo esc_html($m->destino ?: $m->note); ?></td><td>S/ <?php echo number_format((float) $m->total, 2); ?></td></tr>
      <?php endforeach; ?></tbody></table></div>
  </div>
  <?php
}
add_action('admin_post_cg2_item', function () {
  check_admin_referer('cg2_item','_n'); cg2_can(); global $wpdb;
  $data = ['name'=>sanitize_text_field($_POST['name']),'sku'=>sanitize_text_field($_POST['sku'] ?? ''),
    'area'=>sanitize_key($_POST['area']),'unit'=>sanitize_text_field($_POST['unit'] ?: 'und'),
    'stock'=>(float) $_POST['stock'],'min_stock'=>(float) $_POST['min_stock'],'cost'=>(float) $_POST['cost'],
    'supplier_id'=>(int) ($_POST['supplier_id'] ?? 0),
    'item_type'=>sanitize_key($_POST['item_type'] ?? 'material'),
    'location'=>sanitize_text_field($_POST['location'] ?? 'Almacen general'),
    'acquired_date'=>(sanitize_text_field($_POST['acquired_date'] ?? '') ?: null),
    'expiry_date'=>(sanitize_text_field($_POST['expiry_date'] ?? '') ?: null),
    'updated'=>current_time('mysql')];
  $id = (int) ($_POST['id'] ?? 0);
  if ($id) $wpdb->update(cg_tbl('inventory'), $data, ['id'=>$id]); else $wpdb->insert(cg_tbl('inventory'), $data);
  cg2_redir('cg-crm-almacen');
});
add_action('admin_post_cg2_itemdel', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg2_itemdel_' . $id); cg2_can(); global $wpdb;
  $wpdb->delete(cg_tbl('inventory'), ['id'=>$id]); $wpdb->delete(cg_tbl('stock_moves'), ['item_id'=>$id]);
  cg2_redir('cg-crm-almacen');
});
add_action('admin_post_cg2_mov', function () {
  check_admin_referer('cg2_mov','_n'); cg2_can(); global $wpdb; $t = cg_tbl('inventory');
  $iid = (int) $_POST['item_id']; $kind = $_POST['kind'] === 'salida' ? 'salida' : 'entrada';
  $qty = (float) $_POST['qty']; $destino = sanitize_text_field($_POST['destino'] ?? '');
  $item = $wpdb->get_row($wpdb->prepare("SELECT i.*, s.name sname FROM $t i LEFT JOIN " . cg_tbl('suppliers') . " s ON s.id=i.supplier_id WHERE i.id=%d", $iid));
  if ($item && $qty > 0) {
    $delta = $kind === 'entrada' ? $qty : -$qty;
    $wpdb->update($t, ['stock'=>max(0, (float) $item->stock + $delta), 'updated'=>current_time('mysql')], ['id'=>$iid]);
    $wpdb->insert(cg_tbl('stock_moves'), ['item_id'=>$iid,'kind'=>$kind,'qty'=>$qty,'unit_cost'=>$item->cost,
      'total'=>$qty * (float) $item->cost,'destino'=>$destino,
      'note'=>$kind === 'entrada' ? ('Compra' . ($item->sname ? ' a ' . $item->sname : '')) : 'Consumo']);
  }
  cg2_redir('cg-crm-almacen');
});

/* ================= FINANZAS con formularios ================= */
function cg_crm2_render_finanzas() {
  $from = sanitize_text_field($_GET['from'] ?? date('Y-m-01'));
  $to = sanitize_text_field($_GET['to'] ?? date('Y-m-t'));
  $fin = cg_finance_summary($from, $to);
  global $wpdb;
  ?>
  <form method="get" style="display:flex;gap:10px;align-items:flex-end;margin-bottom:14px">
    <input type="hidden" name="page" value="cg-crm-finanzas">
    <?php echo cg2_field('Desde', '<input type="date" name="from" value="' . esc_attr($from) . '">');
          echo cg2_field('Hasta', '<input type="date" name="to" value="' . esc_attr($to) . '">'); ?>
    <button class="button">Ver periodo</button>
  </form>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:14px">
    <?php foreach ([['Ingresos', $fin['ingresos'], '#1a7f37'],['Egresos', $fin['egresos'], '#c0392b'],
      ['Utilidad', $fin['utilidad'], '#0c2b3d'],['IGV por pagar (est.)', $fin['igv'], '#a87214']] as [$l, $vv, $c]) : ?>
      <div class="cg-card" style="border-left:4px solid <?php echo $c; ?>"><div style="font-size:11px;text-transform:uppercase;color:#64748b"><?php echo $l; ?></div>
      <div style="font-size:24px;font-weight:800;color:<?php echo $c; ?>">S/ <?php echo number_format($vv, 2); ?></div></div>
    <?php endforeach; ?>
  </div>
  <div class="cg-grid two" style="margin-bottom:14px">
    <div class="cg-card"><h3>Registrar ingreso</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg2_led','_n'); ?><input type="hidden" name="action" value="cg2_led"><input type="hidden" name="kind" value="ingreso">
        <?php echo cg2_field('Fecha', '<input type="date" name="fecha" value="' . esc_attr(current_time('Y-m-d')) . '" required>');
        $cat = '<select name="category">'; foreach (['Restaurante','Catering','Eventos','Lavanderia','Otros'] as $c) $cat .= '<option>' . $c . '</option>'; $cat .= '</select>';
        echo cg2_field('Categoria', $cat);
        echo cg2_field('Concepto', '<input name="concept" required placeholder="Ej: Almuerzo grupo 12">');
        echo cg2_field('Monto (S/)', '<input type="number" step="0.01" name="amount" required>');
        $met = '<select name="method">'; foreach (cg2_pay_methods() as $k => $l) $met .= '<option value="' . $k . '">' . $l . '</option>'; $met .= '</select>';
        echo cg2_field('Metodo de pago', $met);
        echo cg2_field('Nota', '<input name="nota">'); ?>
        <div style="grid-column:1/-1"><button class="button button-primary">Registrar ingreso</button></div>
      </form>
      <p style="font-size:12px;color:#64748b">Alojamiento entra solo desde reservas pagadas; la cuenta del cuarto entra sola al check-out.</p></div>
    <div class="cg-card"><h3>Registrar egreso / gasto</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg2_led','_n'); ?><input type="hidden" name="action" value="cg2_led"><input type="hidden" name="kind" value="egreso">
        <?php echo cg2_field('Fecha', '<input type="date" name="fecha" value="' . esc_attr(current_time('Y-m-d')) . '" required>');
        $cat = '<select name="category">'; foreach (['Servicios (luz/agua/internet)','Mantenimiento','Marketing','Impuestos','Terceros','Otros'] as $c) $cat .= '<option>' . $c . '</option>'; $cat .= '</select>';
        echo cg2_field('Categoria', $cat);
        echo cg2_field('Concepto', '<input name="concept" required>');
        echo cg2_field('Monto (S/)', '<input type="number" step="0.01" name="amount" required>');
        $su = '<select name="supplier_id"><option value="0">— sin proveedor —</option>';
        foreach ($wpdb->get_results("SELECT id,name FROM " . cg_tbl('suppliers') . " WHERE active=1 ORDER BY name") as $s) $su .= '<option value="' . $s->id . '">' . esc_html($s->name) . '</option>'; $su .= '</select>';
        echo cg2_field('Proveedor (opcional)', $su);
        echo cg2_field('Nota', '<input name="nota">'); ?>
        <div style="grid-column:1/-1"><button class="button button-primary">Registrar egreso</button></div>
      </form>
      <p style="font-size:12px;color:#64748b">Compras de almacen y planilla pagada generan egresos automaticos.</p></div>
  </div>
  <div class="cg-grid two">
    <div class="cg-card"><h3>Ingresos del periodo</h3>
      <table class="widefat striped"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoria</th><th>Monto</th></tr></thead><tbody>
      <?php foreach ($fin['ing_rows'] as $r) echo '<tr><td>' . esc_html($r['date']) . '</td><td>' . esc_html($r['concept']) . '</td><td>' . esc_html($r['category']) . '</td><td>S/ ' . number_format($r['amount'], 2) . '</td></tr>'; ?>
      </tbody></table></div>
    <div class="cg-card"><h3>Egresos del periodo</h3>
      <table class="widefat striped"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoria</th><th>Monto</th></tr></thead><tbody>
      <?php foreach ($fin['egr_rows'] as $r) echo '<tr><td>' . esc_html($r['date']) . '</td><td>' . esc_html($r['concept']) . '</td><td>' . esc_html($r['category']) . '</td><td>S/ ' . number_format($r['amount'], 2) . '</td></tr>'; ?>
      </tbody></table></div>
  </div>
  <?php
}
add_action('admin_post_cg2_led', function () {
  check_admin_referer('cg2_led','_n'); cg2_can(); global $wpdb;
  $fecha = sanitize_text_field($_POST['fecha'] ?? current_time('Y-m-d'));
  $concept = sanitize_text_field($_POST['concept']);
  if (!empty($_POST['method'])) $concept .= ' [' . sanitize_text_field($_POST['method']) . ']';
  if (!empty($_POST['nota'])) $concept .= ' — ' . sanitize_text_field($_POST['nota']);
  $sup = (int) ($_POST['supplier_id'] ?? 0);
  if ($sup) { $sn = $wpdb->get_var($wpdb->prepare("SELECT name FROM " . cg_tbl('suppliers') . " WHERE id=%d", $sup)); if ($sn) $concept .= ' · ' . $sn; }
  $wpdb->insert(cg_tbl('ledger'), ['kind'=>$_POST['kind'] === 'egreso' ? 'egreso' : 'ingreso',
    'category'=>sanitize_text_field($_POST['category'] ?: 'General'),'concept'=>$concept,
    'amount'=>(float) $_POST['amount'],'taxable'=>1,'ref_type'=>$sup ? 'supplier' : '','ref_id'=>$sup ? (string) $sup : '',
    'ts'=>$fecha . ' 12:00:00']);
  cg2_redir('cg-crm-finanzas');
});

/* ================= PROVEEDORES / terceros ================= */
function cg_crm2_render_proveedores() {
  global $wpdb; $sp = cg_tbl('suppliers');
  $rows = $wpdb->get_results("SELECT * FROM $sp ORDER BY active DESC, is_service, name");
  $edit_id = (int) ($_GET['edit'] ?? 0);
  $edit = $edit_id ? $wpdb->get_row($wpdb->prepare("SELECT * FROM $sp WHERE id=%d", $edit_id)) : null;
  $gastos = $wpdb->get_results("SELECT * FROM " . cg_tbl('ledger') . " WHERE ref_type='supplier' ORDER BY ts DESC LIMIT 15");
  ?>
  <div class="cg-card" style="margin-bottom:14px"><h3>Proveedores y servicios de terceros</h3>
    <table class="widefat striped"><thead><tr><th>Nombre</th><th>RUC</th><th>Contacto</th><th>Rubro</th><th>Tipo</th><th>Estado</th><th></th></tr></thead><tbody>
    <?php foreach ($rows as $s) : ?>
      <tr><td><strong><?php echo esc_html($s->name); ?></strong><?php echo $s->note ? '<br><span style="font-size:11px;color:#64748b">' . esc_html($s->note) . '</span>' : ''; ?></td>
        <td><?php echo esc_html($s->ruc ?: '—'); ?></td>
        <td><?php echo esc_html($s->contact); ?><br><span style="font-size:11px;color:#64748b"><?php echo esc_html($s->phone); ?></span></td>
        <td><?php echo esc_html($s->category); ?></td>
        <td><?php echo $s->is_service ? '<span style="color:#7b3fa0;font-weight:700">Servicio tercero</span>' : 'Insumos'; ?></td>
        <td><?php echo $s->active ? '<span style="color:#1a7f37;font-weight:700">Activo</span>' : '<span style="color:#888">Inactivo</span>'; ?></td>
        <td><a class="button button-small" href="<?php echo esc_url(add_query_arg(['page'=>'cg-crm-proveedores','edit'=>$s->id], admin_url('admin.php'))); ?>">Editar</a></td></tr>
    <?php endforeach; ?></tbody></table></div>
  <div class="cg-grid two">
    <div class="cg-card"><h3><?php echo $edit ? 'Editar: ' . esc_html($edit->name) : 'Agregar proveedor / servicio'; ?></h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg2_sup','_n'); ?><input type="hidden" name="action" value="cg2_sup"><input type="hidden" name="id" value="<?php echo $edit ? (int) $edit->id : 0; ?>">
        <?php $v = function ($k, $d = '') use ($edit) { return esc_attr($edit->$k ?? $d); };
        echo cg2_field('Nombre / razon social', '<input name="name" required value="' . $v('name') . '">');
        echo cg2_field('RUC', '<input name="ruc" value="' . $v('ruc') . '">');
        echo cg2_field('Contacto', '<input name="contact" value="' . $v('contact') . '">');
        echo cg2_field('Telefono', '<input name="phone" value="' . $v('phone') . '">');
        echo cg2_field('Rubro', '<input name="category" value="' . $v('category', 'General') . '">');
        $ty = '<select name="is_service"><option value="0"' . selected((int) ($edit->is_service ?? 0), 0, false) . '>Proveedor de insumos</option><option value="1"' . selected((int) ($edit->is_service ?? 0), 1, false) . '>Servicio de terceros</option></select>';
        echo cg2_field('Tipo', $ty);
        echo cg2_field('Nota', '<input name="note" value="' . $v('note') . '">'); ?>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600"><input type="checkbox" name="active" value="1" <?php checked((int) ($edit->active ?? 1), 1); ?>> Activo</label>
        <div style="grid-column:1/-1;display:flex;gap:8px"><button class="button button-primary"><?php echo $edit ? 'Guardar' : 'Agregar'; ?></button>
        <?php if ($edit) : ?><a class="button" href="<?php echo esc_url(cg_crm_url('cg-crm-proveedores')); ?>">Cancelar</a><?php endif; ?></div>
      </form></div>
    <div class="cg-card"><h3>Pagos a proveedores/terceros</h3>
      <table class="widefat striped"><thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th></tr></thead><tbody>
      <?php foreach ($gastos as $g) echo '<tr><td>' . esc_html(substr($g->ts, 0, 10)) . '</td><td>' . esc_html($g->concept) . '</td><td>S/ ' . number_format((float) $g->amount, 2) . '</td></tr>';
      if (!$gastos) echo '<tr><td colspan="3" style="color:#64748b">Registra un egreso en Finanzas eligiendo el proveedor.</td></tr>'; ?>
      </tbody></table></div>
  </div>
  <?php
}
add_action('admin_post_cg2_sup', function () {
  check_admin_referer('cg2_sup','_n'); cg2_can(); global $wpdb;
  $data = ['name'=>sanitize_text_field($_POST['name']),'ruc'=>sanitize_text_field($_POST['ruc'] ?? ''),
    'contact'=>sanitize_text_field($_POST['contact'] ?? ''),'phone'=>sanitize_text_field($_POST['phone'] ?? ''),
    'category'=>sanitize_text_field($_POST['category'] ?: 'General'),'is_service'=>(int) ($_POST['is_service'] ?? 0),
    'note'=>sanitize_text_field($_POST['note'] ?? ''),'active'=>isset($_POST['active']) ? 1 : 0];
  $id = (int) ($_POST['id'] ?? 0);
  if ($id) $wpdb->update(cg_tbl('suppliers'), $data, ['id'=>$id]); else $wpdb->insert(cg_tbl('suppliers'), $data);
  cg2_redir('cg-crm-proveedores');
});
