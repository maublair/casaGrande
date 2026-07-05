<?php
/**
 * Plugin Name: Casa Grande CRM (personal v3 + almacen total)
 * Description: Fichas de trabajador (cards con detalle completo), matriz de pagos mensual con boletas de pago peruanas imprimibles, y almacen/logistica con tipos, ubicaciones y vencimientos.
 */
if (!defined('ABSPATH')) exit;

/* ================= PERSONAL v3: fichas + matriz + boletas ================= */
function cg_crm3_render_personal() {
  global $wpdb; $t = cg_tbl('staff');
  $view = sanitize_key($_GET['vista'] ?? 'fichas');
  $tabs = ['fichas' => '👤 Fichas del personal', 'planilla' => '📅 Planilla / pagos por mes'];
  echo '<div style="display:flex;gap:6px;margin-bottom:14px">';
  foreach ($tabs as $k => $l)
    echo '<a href="' . esc_url(add_query_arg(['page' => 'cg-crm-personal', 'vista' => $k], admin_url('admin.php'))) . '" style="padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:700;' . ($view === $k ? 'background:#0c2b3d;color:#fff' : 'background:#eef0f2;color:#50575e') . '">' . $l . '</a>';
  echo '</div>';
  if ($view === 'planilla') cg_crm3_planilla(); else cg_crm3_fichas();
}

/* ---------- Vista FICHAS (cards -> detalle) ---------- */
function cg_crm3_fichas() {
  global $wpdb; $t = cg_tbl('staff');
  $sel = (int) ($_GET['ficha'] ?? 0);
  $staff = $wpdb->get_results("SELECT * FROM $t ORDER BY active DESC, name ASC");
  ?>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:16px">
    <?php foreach ($staff as $s) :
      $ini = strtoupper(mb_substr($s->name, 0, 1));
      $open = $sel === (int) $s->id; ?>
      <a href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => $open ? 0 : $s->id], admin_url('admin.php'))); ?>#detalle"
         style="display:flex;gap:12px;align-items:center;background:#fff;border:2px solid <?php echo $open ? '#c9a84c' : '#e3e6ea'; ?>;border-radius:14px;padding:14px;text-decoration:none">
        <span style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0c2b3d,#154562);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px"><?php echo esc_html($ini); ?></span>
        <span>
          <strong style="color:#0c2b3d;display:block"><?php echo esc_html($s->name); ?></strong>
          <span style="font-size:12px;color:#64748b"><?php echo esc_html($s->role); ?> · <?php echo $s->active ? '<b style="color:#1a7f37">DE ALTA</b>' : '<b style="color:#c0392b">DE BAJA</b>'; ?></span>
        </span>
      </a>
    <?php endforeach; ?>
  </div>
  <?php
  if (!$sel) { echo '<p style="color:#64748b">Haz clic en una ficha para abrir todo el detalle del trabajador.</p>'; return; }
  $s = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id=%d", $sel));
  if (!$s) return;
  $children = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('staff_children') . " WHERE staff_id=%d ORDER BY birthdate", $sel));
  $month = date('Y-m');
  $att = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('attendance') . " WHERE staff_id=%d AND work_date LIKE %s ORDER BY work_date DESC", $sel, $month . '%'));
  $faltas = 0; foreach ($att as $a) if ($a->status === 'falta') $faltas++;
  $slips = $wpdb->get_results($wpdb->prepare("SELECT * FROM " . cg_tbl('payslips') . " WHERE staff_id=%d ORDER BY period DESC LIMIT 12", $sel));
  $calc = cg_payslip_calc($s);
  ?>
  <div id="detalle" class="cg-card" style="border:2px solid #c9a84c">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
      <h2 style="margin:0"><?php echo esc_html($s->name); ?> <span style="font-size:13px;color:#64748b">(<?php echo esc_html($s->role); ?>)</span></h2>
      <span><?php echo $s->active ? '<b style="color:#1a7f37;font-size:15px">● DE ALTA</b>' : '<b style="color:#c0392b;font-size:15px">● DE BAJA</b>'; ?></span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:14px">
      <div>
        <h4 style="margin:0 0 6px;color:#0c2b3d">Datos y contrato</h4>
        <table class="widefat" style="font-size:12px">
          <tr><td><b>DNI/CE</b></td><td><?php echo esc_html($s->doc_id ?: '—'); ?></td></tr>
          <tr><td><b>Telefono</b></td><td><?php echo esc_html($s->phone ?: '—'); ?></td></tr>
          <tr><td><b>Inicio</b></td><td><?php echo esc_html($s->hire_date ?: '—'); ?></td></tr>
          <tr><td><b>Fin contrato</b></td><td><?php echo esc_html($s->contract_end ?: 'indefinido'); ?></td></tr>
          <tr><td><b>Contrato</b></td><td><?php echo $s->contract_att ? '<a target="_blank" href="' . esc_url(wp_get_attachment_url($s->contract_att)) . '">📄 Ver PDF</a>' : 'sin archivo'; ?></td></tr>
          <tr><td><b>Horario</b></td><td><?php echo esc_html($s->schedule ?: '—'); ?></td></tr>
          <tr><td><b>Pension</b></td><td><?php echo esc_html(strtoupper($s->pension_type ?: 'afp') . ($s->afp_name ? ' — ' . $s->afp_name : '')); ?></td></tr>
        </table>
        <h4 style="margin:12px 0 6px;color:#0c2b3d">Obligaciones del puesto</h4>
        <div style="background:#f6f7f9;border-radius:8px;padding:10px;font-size:12px;white-space:pre-line"><?php echo esc_html($s->duties ?: 'Sin descripcion registrada.'); ?></div>
        <p style="margin-top:8px"><a class="button button-small" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => $sel, 'editar' => 1], admin_url('admin.php'))); ?>#editar">✏ Editar ficha</a></p>
      </div>
      <div>
        <h4 style="margin:0 0 6px;color:#0c2b3d">Hijos menores de 18 (asignacion familiar)</h4>
        <?php if ($children) : ?><table class="widefat striped" style="font-size:12px"><tr><th>Nombre</th><th>Nacimiento</th><th></th></tr>
          <?php foreach ($children as $c) : $u18 = strtotime($c->birthdate) > strtotime('-18 years'); ?>
            <tr><td><?php echo esc_html($c->name); ?></td><td><?php echo esc_html($c->birthdate); echo $u18 ? ' <b style="color:#1a7f37">✔<18</b>' : ' <span style="color:#94a3b8">18+</span>'; ?></td>
              <td><a style="color:#c0392b" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg3_childdel&id=' . $c->id . '&staff=' . $sel), 'cg3_childdel_' . $c->id)); ?>">✕</a></td></tr>
          <?php endforeach; ?></table>
        <?php else : ?><p style="font-size:12px;color:#64748b">Sin hijos registrados → sin asignacion familiar.</p><?php endif; ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:6px;margin-top:8px">
          <?php wp_nonce_field('cg3_child', '_n'); ?><input type="hidden" name="action" value="cg3_child"><input type="hidden" name="staff" value="<?php echo $sel; ?>">
          <input name="name" placeholder="Nombre del hijo" required style="flex:1"><input type="date" name="birthdate" required>
          <button class="button button-small">Agregar</button>
        </form>
        <h4 style="margin:14px 0 6px;color:#0c2b3d">Asistencia — <?php echo esc_html($month); ?> <span style="color:#c0392b">(<?php echo $faltas; ?> faltas)</span></h4>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:6px;margin-bottom:8px">
          <?php wp_nonce_field('cg3_att', '_n'); ?><input type="hidden" name="action" value="cg3_att"><input type="hidden" name="staff" value="<?php echo $sel; ?>">
          <input type="date" name="work_date" value="<?php echo esc_attr(current_time('Y-m-d')); ?>">
          <select name="status"><option value="presente">Presente</option><option value="falta">Falta</option><option value="tarde">Tardanza</option><option value="descanso">Descanso</option><option value="permiso">Permiso</option></select>
          <button class="button button-small">Marcar</button>
        </form>
        <div style="max-height:150px;overflow:auto"><table class="widefat striped" style="font-size:12px">
          <?php foreach ($att as $a) : $col = ['presente'=>'#1a7f37','falta'=>'#c0392b','tarde'=>'#bd8b00','descanso'=>'#64748b','permiso'=>'#154562'][$a->status] ?? '#666'; ?>
            <tr><td><?php echo esc_html($a->work_date); ?></td><td style="color:<?php echo $col; ?>;font-weight:700"><?php echo esc_html(ucfirst($a->status)); ?></td></tr>
          <?php endforeach; if (!$att) echo '<tr><td colspan="2" style="color:#64748b">Sin registros este mes.</td></tr>'; ?>
        </table></div>
      </div>
      <div>
        <h4 style="margin:0 0 6px;color:#0c2b3d">Estructura salarial vigente</h4>
        <table class="widefat" style="font-size:12px">
          <tr><td>Sueldo base</td><td style="text-align:right">S/ <?php echo number_format($calc['base'], 2); ?></td></tr>
          <tr><td>Asignacion familiar</td><td style="text-align:right">S/ <?php echo number_format($calc['family_allow'], 2); ?></td></tr>
          <tr><td><b>Bruto</b></td><td style="text-align:right"><b>S/ <?php echo number_format($calc['gross'], 2); ?></b></td></tr>
          <tr><td>(-) <?php echo strtoupper($calc['pension_type']); ?></td><td style="text-align:right;color:#c0392b">- S/ <?php echo number_format($calc['pension_amount'], 2); ?></td></tr>
          <tr style="background:#dff5e5"><td><b>NETO al trabajador</b></td><td style="text-align:right"><b>S/ <?php echo number_format($calc['net'], 2); ?></b></td></tr>
          <tr><td>(+) EsSalud 9% (paga el hotel)</td><td style="text-align:right">S/ <?php echo number_format($calc['essalud'], 2); ?></td></tr>
          <tr style="background:#eaf2f8"><td><b>Costo total para el hotel</b></td><td style="text-align:right"><b>S/ <?php echo number_format($calc['employer_cost'], 2); ?></b></td></tr>
        </table>
        <h4 style="margin:14px 0 6px;color:#0c2b3d">Historial de pagos</h4>
        <div style="max-height:190px;overflow:auto"><table class="widefat striped" style="font-size:12px">
          <tr><th>Mes</th><th>Neto</th><th>Estado</th><th>Boleta</th></tr>
          <?php foreach ($slips as $sl) : ?>
            <tr><td><?php echo esc_html($sl->period); ?></td><td>S/ <?php echo number_format((float) $sl->net, 2); ?></td>
              <td><?php echo $sl->paid ? '<b style="color:#1a7f37">Pagado</b>' : '<b style="color:#c0392b">Pendiente</b>'; ?></td>
              <td><a class="button button-small" target="_blank" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-boleta', 'id' => $sl->id], admin_url('admin.php'))); ?>">🧾 Boleta</a></td></tr>
          <?php endforeach; if (!$slips) echo '<tr><td colspan="4" style="color:#64748b">Sin boletas — generalas en Planilla.</td></tr>'; ?>
        </table></div>
      </div>
    </div>

    <?php if (isset($_GET['editar'])) : ?>
      <div id="editar" style="border-top:2px dashed #e3e6ea;margin-top:16px;padding-top:14px">
        <h4 style="color:#0c2b3d">Editar ficha</h4>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <?php wp_nonce_field('cg3_staff', '_n'); ?><input type="hidden" name="action" value="cg3_staff"><input type="hidden" name="id" value="<?php echo $sel; ?>">
          <?php $F = function ($l, $i) { echo '<label style="display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#50575e">' . $l . $i . '</label>'; };
          $F('Nombre', '<input name="name" value="' . esc_attr($s->name) . '" required>');
          $F('DNI/CE', '<input name="doc_id" value="' . esc_attr($s->doc_id) . '">');
          $rr = '<select name="role">'; foreach (['Recepcion','Limpieza','Cocina','Catering','Administracion','Mantenimiento','Seguridad'] as $r) $rr .= '<option' . selected($s->role, $r, false) . '>' . $r . '</option>'; $rr .= '</select>'; $F('Puesto', $rr);
          $F('Telefono', '<input name="phone" value="' . esc_attr($s->phone) . '">');
          $F('Sueldo base (S/)', '<input type="number" step="0.01" name="salary" value="' . esc_attr($s->salary) . '">');
          $F('Horario', '<input name="schedule" value="' . esc_attr($s->schedule) . '" placeholder="Ej: L-S 7:00-15:00">');
          $F('Inicio', '<input type="date" name="hire_date" value="' . esc_attr($s->hire_date) . '">');
          $F('Fin contrato', '<input type="date" name="contract_end" value="' . esc_attr($s->contract_end) . '">');
          $pp = '<select name="pension_type"><option value="afp"' . selected($s->pension_type, 'afp', false) . '>AFP</option><option value="onp"' . selected($s->pension_type, 'onp', false) . '>ONP</option></select>'; $F('Sistema de pension', $pp);
          $F('AFP (nombre)', '<input name="afp_name" value="' . esc_attr($s->afp_name) . '" placeholder="Integra, Prima...">');
          $att2 = (int) $s->contract_att;
          $F('Contrato PDF', '<input type="hidden" name="contract_att" id="cg3-ct" value="' . $att2 . '"><span style="display:flex;gap:6px"><button type="button" class="button cg-pick-pdf" data-target="#cg3-ct" data-label="#cg3-ctn">📄 PDF</button><em id="cg3-ctn" style="font-size:11px;color:#64748b">' . ($att2 ? 'cargado' : 'ninguno') . '</em></span>');
          ?>
          <label style="display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#50575e;grid-column:1/-1">Obligaciones del puesto<textarea name="duties" rows="3"><?php echo esc_textarea($s->duties); ?></textarea></label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700"><input type="checkbox" name="active" value="1" <?php checked($s->active, 1); ?>> DE ALTA (desmarcar = baja)</label>
          <div style="grid-column:1/-1"><button class="button button-primary">Guardar ficha</button></div>
        </form>
      </div>
    <?php endif; ?>
  </div>
  <?php
}

/* ---------- Vista PLANILLA (matriz mensual) ---------- */
function cg_crm3_planilla() {
  global $wpdb; $tp = cg_tbl('payslips');
  $from = sanitize_text_field($_GET['pm_from'] ?? date('Y-m', strtotime('-3 months')));
  $to = sanitize_text_field($_GET['pm_to'] ?? date('Y-m', strtotime('+3 months')));
  $months = []; $cur = $from . '-01';
  while (substr($cur, 0, 7) <= $to && count($months) < 24) { $months[] = substr($cur, 0, 7); $cur = date('Y-m-d', strtotime($cur . ' +1 month')); }
  $staff = $wpdb->get_results("SELECT * FROM " . cg_tbl('staff') . " WHERE active=1 ORDER BY name");
  $slips = [];
  foreach ($wpdb->get_results("SELECT * FROM $tp") as $p) $slips[$p->staff_id][$p->period] = $p;
  $today_m = date('Y-m');
  ?>
  <div class="cg-card">
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:12px">
      <form method="get" style="display:flex;gap:8px;align-items:flex-end">
        <input type="hidden" name="page" value="cg-crm-personal"><input type="hidden" name="vista" value="planilla">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Desde<input type="month" name="pm_from" value="<?php echo esc_attr($from); ?>"></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Hasta<input type="month" name="pm_to" value="<?php echo esc_attr($to); ?>"></label>
        <button class="button">Ver rango</button>
      </form>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:8px;align-items:flex-end">
        <?php wp_nonce_field('cg3_gen', '_n'); ?><input type="hidden" name="action" value="cg3_gen">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Generar boletas del mes<input type="month" name="period" value="<?php echo esc_attr($today_m); ?>"></label>
        <button class="button button-primary">Generar</button>
      </form>
      <a class="button" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg4_csv_planilla&period=' . $today_m), 'cg4_csv')); ?>">⬇ Exportar planilla CSV</a>
    </div>
    <div style="overflow-x:auto">
    <table class="widefat" style="border-collapse:collapse;min-width:760px">
      <thead><tr><th style="text-align:left;position:sticky;left:0;background:#fff">Trabajador</th>
        <?php foreach ($months as $m) : ?><th style="text-align:center;<?php echo $m === $today_m ? 'background:#fdf8ec;border-bottom:2px solid #c9a84c' : ''; ?>"><?php echo esc_html(date('M y', strtotime($m . '-01'))); ?></th><?php endforeach; ?></tr></thead>
      <tbody>
      <?php foreach ($staff as $s) : ?>
        <tr><td style="font-weight:700;position:sticky;left:0;background:#fff"><?php echo esc_html($s->name); ?><br><span style="font-size:11px;color:#64748b;font-weight:400"><?php echo esc_html($s->role); ?></span></td>
        <?php foreach ($months as $m) : $p = $slips[$s->id][$m] ?? null; ?>
          <td style="text-align:center;padding:6px;<?php echo $m === $today_m ? 'background:#fdf8ec' : ''; ?>">
          <?php if (!$p) : ?><span style="color:#cbd5e1">—</span>
          <?php elseif ($p->paid) : ?>
            <a target="_blank" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-boleta', 'id' => $p->id], admin_url('admin.php'))); ?>" style="text-decoration:none">
            <span style="display:inline-block;background:#dff5e5;color:#155724;font-weight:800;border-radius:8px;padding:3px 8px;font-size:11px">✓ S/ <?php echo number_format((float) $p->net, 0); ?></span></a>
          <?php else : ?>
            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg3_pay&id=' . $p->id . '&pm_from=' . $from . '&pm_to=' . $to), 'cg3_pay_' . $p->id)); ?>" style="text-decoration:none" title="Marcar pagado">
            <span style="display:inline-block;background:#fdecea;color:#c0392b;font-weight:800;border-radius:8px;padding:3px 8px;font-size:11px">✗ S/ <?php echo number_format((float) $p->net, 0); ?></span></a>
          <?php endif; ?></td>
        <?php endforeach; ?></tr>
      <?php endforeach; ?>
      </tbody>
    </table></div>
    <p style="font-size:12px;color:#64748b;margin-top:8px">✓ pagado (clic = ver boleta) · ✗ pendiente (clic = marcar pagado; registra el egreso total: neto + pension retenida + EsSalud) · — sin generar. El mes actual esta resaltado.</p>
  </div>
  <?php
}

/* ---------- BOLETA imprimible ---------- */
function cg_crm3_render_boleta() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $id = (int) ($_GET['id'] ?? 0);
  $p = $wpdb->get_row($wpdb->prepare("SELECT p.*, s.name, s.doc_id, s.role, s.hire_date, s.afp_name FROM " . cg_tbl('payslips') . " p JOIN " . cg_tbl('staff') . " s ON s.id=p.staff_id WHERE p.id=%d", $id));
  if (!$p) { echo 'Boleta no encontrada'; return; }
  $biz = cg_crm_settings()['biz_name'];
  ?>
  <style>#adminmenumain,#wpadminbar,#wpfooter{display:none!important}#wpcontent{margin-left:0!important}
  .boleta{max-width:720px;margin:24px auto;background:#fff;border:2px solid #0c2b3d;padding:28px;font-family:Georgia,serif}
  .boleta table{width:100%;border-collapse:collapse;font-size:13px}.boleta td,.boleta th{border:1px solid #94a3b8;padding:7px 10px}
  .boleta h1{font-size:18px;margin:0;text-align:center}.boleta .tag{text-align:center;color:#64748b;font-size:12px;margin:4px 0 16px}
  @media print {.no-print{display:none}}</style>
  <div class="boleta">
    <h1>BOLETA DE PAGO — <?php echo esc_html(strtoupper($p->period)); ?></h1>
    <div class="tag"><?php echo esc_html($biz); ?> · Av. Luna Pizarro 202, Vallecito, Arequipa</div>
    <table style="margin-bottom:14px">
      <tr><td><b>Trabajador</b></td><td><?php echo esc_html($p->name); ?></td><td><b>DNI/CE</b></td><td><?php echo esc_html($p->doc_id ?: '—'); ?></td></tr>
      <tr><td><b>Cargo</b></td><td><?php echo esc_html($p->role); ?></td><td><b>Fecha ingreso</b></td><td><?php echo esc_html($p->hire_date ?: '—'); ?></td></tr>
      <tr><td><b>Regimen pension</b></td><td><?php echo esc_html(strtoupper($p->pension_type) . ($p->afp_name ? ' — ' . $p->afp_name : '')); ?></td><td><b>Estado</b></td><td><?php echo $p->paid ? 'PAGADO el ' . esc_html($p->paid_date) : 'PENDIENTE'; ?></td></tr>
    </table>
    <table>
      <tr style="background:#eef2f7"><th colspan="2">INGRESOS</th><th colspan="2">DESCUENTOS</th></tr>
      <tr><td>Sueldo basico</td><td style="text-align:right">S/ <?php echo number_format((float) $p->base, 2); ?></td>
          <td><?php echo esc_html(strtoupper($p->pension_type)); ?> (retencion)</td><td style="text-align:right">S/ <?php echo number_format((float) $p->pension_amount, 2); ?></td></tr>
      <tr><td>Asignacion familiar</td><td style="text-align:right">S/ <?php echo number_format((float) $p->family_allow, 2); ?></td><td></td><td></td></tr>
      <tr><td>Bonificaciones <?php echo $p->bonus_note ? '(' . esc_html($p->bonus_note) . ')' : ''; ?></td><td style="text-align:right">S/ <?php echo number_format((float) $p->bonuses, 2); ?></td><td></td><td></td></tr>
      <tr style="background:#f8fafc"><td><b>TOTAL INGRESOS</b></td><td style="text-align:right"><b>S/ <?php echo number_format((float) $p->gross, 2); ?></b></td>
          <td><b>TOTAL DESCUENTOS</b></td><td style="text-align:right"><b>S/ <?php echo number_format((float) $p->pension_amount, 2); ?></b></td></tr>
      <tr style="background:#dff5e5"><td colspan="2"><b>NETO A PAGAR AL TRABAJADOR</b></td><td colspan="2" style="text-align:right;font-size:16px"><b>S/ <?php echo number_format((float) $p->net, 2); ?></b></td></tr>
      <tr><td colspan="2">Aportes del empleador: EsSalud 9%</td><td colspan="2" style="text-align:right">S/ <?php echo number_format((float) $p->essalud, 2); ?></td></tr>
    </table>
    <table style="margin-top:26px;border:0"><tr>
      <td style="border:0;text-align:center;padding-top:34px"><div style="border-top:1px solid #333;width:200px;margin:0 auto">Empleador</div></td>
      <td style="border:0;text-align:center;padding-top:34px"><div style="border-top:1px solid #333;width:200px;margin:0 auto">Trabajador</div></td>
    </tr></table>
    <p class="no-print" style="text-align:center;margin-top:18px"><button class="button button-primary" onclick="window.print()">🖨 Imprimir boleta</button></p>
  </div>
  <?php
}

/* ---------- Handlers personal v3 ---------- */
add_action('admin_post_cg3_staff', function () {
  check_admin_referer('cg3_staff', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb;
  $id = (int) $_POST['id'];
  $wpdb->update(cg_tbl('staff'), [
    'name' => sanitize_text_field($_POST['name']), 'doc_id' => sanitize_text_field($_POST['doc_id'] ?? ''),
    'role' => sanitize_text_field($_POST['role']), 'phone' => sanitize_text_field($_POST['phone'] ?? ''),
    'salary' => (float) $_POST['salary'], 'schedule' => sanitize_text_field($_POST['schedule'] ?? ''),
    'hire_date' => (sanitize_text_field($_POST['hire_date'] ?? '') ?: null),
    'contract_end' => (sanitize_text_field($_POST['contract_end'] ?? '') ?: null),
    'pension_type' => $_POST['pension_type'] === 'onp' ? 'onp' : 'afp',
    'afp_name' => sanitize_text_field($_POST['afp_name'] ?? ''),
    'duties' => sanitize_textarea_field($_POST['duties'] ?? ''),
    'contract_att' => (int) ($_POST['contract_att'] ?? 0),
    'active' => isset($_POST['active']) ? 1 : 0,
  ], ['id' => $id]);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => $id, 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg3_child', function () {
  check_admin_referer('cg3_child', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb; $sid = (int) $_POST['staff'];
  $wpdb->insert(cg_tbl('staff_children'), ['staff_id' => $sid, 'name' => sanitize_text_field($_POST['name']), 'birthdate' => sanitize_text_field($_POST['birthdate'])]);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => $sid, 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg3_childdel', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg3_childdel_' . $id);
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb; $wpdb->delete(cg_tbl('staff_children'), ['id' => $id]);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => (int) ($_GET['staff'] ?? 0), 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg3_att', function () {
  check_admin_referer('cg3_att', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb; $sid = (int) $_POST['staff'];
  $wpdb->replace(cg_tbl('attendance'), ['staff_id' => $sid, 'work_date' => sanitize_text_field($_POST['work_date']),
    'status' => sanitize_key($_POST['status']), 'note' => '']);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'fichas', 'ficha' => $sid, 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg3_gen', function () {
  check_admin_referer('cg3_gen', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $period = sanitize_text_field($_POST['period'] ?? date('Y-m'));
  cg_generate_payslips($period);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'planilla', 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg3_pay', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg3_pay_' . $id);
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  global $wpdb; $tp = cg_tbl('payslips');
  $p = $wpdb->get_row($wpdb->prepare("SELECT p.*, s.name FROM $tp p JOIN " . cg_tbl('staff') . " s ON s.id=p.staff_id WHERE p.id=%d", $id));
  if ($p && !$p->paid) {
    $wpdb->update($tp, ['paid' => 1, 'paid_date' => current_time('Y-m-d')], ['id' => $id]);
    // egreso total del hotel = bruto (incluye neto + retencion AFP/ONP que se paga a la entidad) + EsSalud
    $total = (float) $p->gross + (float) $p->essalud;
    $wpdb->insert(cg_tbl('ledger'), ['kind' => 'egreso', 'category' => 'Personal',
      'concept' => 'Planilla ' . $p->period . ' — ' . $p->name . ' (neto ' . number_format((float) $p->net, 2) . ' + ' . strtoupper($p->pension_type) . ' ' . number_format((float) $p->pension_amount, 2) . ' + EsSalud ' . number_format((float) $p->essalud, 2) . ')',
      'amount' => $total, 'taxable' => 0, 'ref_type' => 'payslip', 'ref_id' => (string) $p->id]);
  }
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-personal', 'vista' => 'planilla',
    'pm_from' => sanitize_text_field($_GET['pm_from'] ?? ''), 'pm_to' => sanitize_text_field($_GET['pm_to'] ?? ''), 'done' => 1], admin_url('admin.php'))); exit;
});

/* Pagina boleta (oculta del menu) */
add_action('admin_menu', function () {
  add_submenu_page('', 'Boleta de pago', 'Boleta', 'manage_hotel', 'cg-crm-boleta', 'cg_crm3_render_boleta');
}, 20);
