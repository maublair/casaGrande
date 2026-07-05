<?php
/**
 * Plugin Name: Casa Grande CRM UI
 * Description: Interfaz de CRM en el admin de WordPress para Casa Grande: dashboard, personal, limpieza, turnos, reservas, almacen, finanzas, WhatsApp y atajos al contenido.
 */
if (!defined('ABSPATH')) exit;

function cg_crm_can_access() {
  return current_user_can('manage_hotel') || current_user_can('manage_options');
}

function cg_crm_sections() {
  return [
    'cg-crm' => 'dashboard',
    'cg-crm-personal' => 'personal',
    'cg-crm-limpieza' => 'limpieza',
    'cg-crm-turnos' => 'turnos',
    'cg-crm-reservas' => 'reservas',
    'cg-crm-cuartos' => 'cuartos',
    'cg-crm-proveedores' => 'proveedores',
    'cg-crm-huespedes' => 'huespedes',
    'cg-crm-canales' => 'canales',
    'cg-crm-tarifas' => 'tarifas',
    'cg-crm-mantenimiento' => 'mantenimiento',
    'cg-crm-reportes' => 'reportes',
    'cg-crm-almacen' => 'almacen',
    'cg-crm-finanzas' => 'finanzas',
    'cg-crm-whatsapp' => 'whatsapp',
    'cg-crm-contenido' => 'contenido',
  ];
}

function cg_crm_section_from_page() {
  $page = sanitize_key($_GET['page'] ?? 'cg-crm');
  $map = cg_crm_sections();
  return $map[$page] ?? 'dashboard';
}

function cg_crm_url($page) {
  return admin_url('admin.php?page=' . $page);
}

function cg_crm_money_fmt($value) {
  return 'S/ ' . number_format((float) $value, 2, '.', ',');
}

function cg_crm_staff_rows() {
  global $wpdb; $t = cg_tbl('staff');
  return $wpdb->get_results("SELECT * FROM $t ORDER BY active DESC, role ASC, name ASC");
}

function cg_crm_inventory_rows() {
  global $wpdb; $t = cg_tbl('inventory');
  return $wpdb->get_results("SELECT * FROM $t ORDER BY area, name");
}

function cg_crm_ledger_rows_all($limit = 20) {
  global $wpdb; $t = cg_tbl('ledger');
  return $wpdb->get_results($wpdb->prepare("SELECT * FROM $t ORDER BY ts DESC LIMIT %d", $limit));
}

function cg_crm_conversations($limit = 8) {
  global $wpdb; $t = cg_tbl('wa_conversations');
  return $wpdb->get_results($wpdb->prepare("SELECT * FROM $t ORDER BY last_ts DESC LIMIT %d", $limit));
}

function cg_crm_messages($conv_id, $limit = 6) {
  global $wpdb; $t = cg_tbl('wa_messages');
  return $wpdb->get_results($wpdb->prepare("SELECT * FROM $t WHERE conv_id=%d ORDER BY ts DESC LIMIT %d", $conv_id, $limit));
}

function cg_crm_recent_reservations($limit = 8) {
  return get_posts([
    'post_type' => 'reservation',
    'post_status' => 'publish',
    'posts_per_page' => $limit,
    'orderby' => 'date',
    'order' => 'DESC',
  ]);
}

function cg_crm_svg_line_chart($series) {
  if (empty($series)) return '<div class="cg-empty">Sin datos para graficar.</div>';
  $w = 920; $h = 240; $pad = 28;
  $max = 1;
  foreach ($series as $row) {
    $max = max($max, (float) ($row['ingresos'] ?? 0), (float) ($row['egresos'] ?? 0));
  }
  $count = max(1, count($series) - 1);
  $step = ($w - ($pad * 2)) / $count;
  $map = function ($value) use ($h, $pad, $max) {
    return $h - $pad - (((float) $value / $max) * ($h - ($pad * 2)));
  };
  $pointsIng = [];
  $pointsEgr = [];
  foreach ($series as $i => $row) {
    $x = $pad + ($step * $i);
    $pointsIng[] = $x . ',' . $map($row['ingresos'] ?? 0);
    $pointsEgr[] = $x . ',' . $map($row['egresos'] ?? 0);
  }
  ob_start(); ?>
  <svg viewBox="0 0 <?php echo (int) $w; ?> <?php echo (int) $h; ?>" class="cg-svg">
    <?php for ($i = 0; $i <= 4; $i++) : $y = $pad + (($h - ($pad * 2)) / 4) * $i; ?>
      <line x1="<?php echo $pad; ?>" y1="<?php echo $y; ?>" x2="<?php echo $w - $pad; ?>" y2="<?php echo $y; ?>" class="cg-grid" />
    <?php endfor; ?>
    <polyline points="<?php echo esc_attr(implode(' ', $pointsIng)); ?>" class="cg-line cg-line-ing" />
    <polyline points="<?php echo esc_attr(implode(' ', $pointsEgr)); ?>" class="cg-line cg-line-egr" />
    <?php foreach ($series as $i => $row) : $x = $pad + ($step * $i); ?>
      <text x="<?php echo $x; ?>" y="<?php echo $h - 8; ?>" class="cg-axis-label"><?php echo esc_html($row['label'] ?? ''); ?></text>
    <?php endforeach; ?>
  </svg>
  <div class="cg-legend">
    <span><i class="dot ing"></i>Ingresos</span>
    <span><i class="dot egr"></i>Egresos</span>
  </div>
  <?php
  return ob_get_clean();
}

function cg_crm_svg_bars($pairs) {
  if (empty($pairs)) return '<div class="cg-empty">Sin datos para graficar.</div>';
  $w = 920; $h = 240; $pad = 28; $barH = 22; $gap = 14;
  $max = 1;
  foreach ($pairs as $p) $max = max($max, (float) $p['value']);
  ob_start(); ?>
  <svg viewBox="0 0 <?php echo (int) $w; ?> <?php echo (int) $h; ?>" class="cg-svg">
    <?php foreach ($pairs as $i => $p) :
      $y = $pad + ($i * ($barH + $gap));
      $barW = max(1, (($w - 220) * ((float) $p['value'] / $max)));
    ?>
      <text x="<?php echo $pad; ?>" y="<?php echo $y + 16; ?>" class="cg-bar-label"><?php echo esc_html($p['label']); ?></text>
      <rect x="180" y="<?php echo $y; ?>" width="<?php echo $barW; ?>" height="<?php echo $barH; ?>" rx="10" class="cg-bar" />
      <text x="<?php echo 192 + $barW; ?>" y="<?php echo $y + 16; ?>" class="cg-bar-value"><?php echo esc_html($p['formatted']); ?></text>
    <?php endforeach; ?>
  </svg>
  <?php
  return ob_get_clean();
}

function cg_crm_tabs($active) {
  $tabs = [
    'dashboard' => ['cg-crm', 'Dashboard'],
    'reservas' => ['cg-crm-reservas', 'Reservas'],
    'personal' => ['cg-crm-personal', 'Personal'],
    'limpieza' => ['cg-crm-limpieza', 'Limpieza'],
    'turnos' => ['cg-crm-turnos', 'Turnos'],
    'almacen' => ['cg-crm-almacen', 'Almacen'],
    'finanzas' => ['cg-crm-finanzas', 'Finanzas'],
    'whatsapp' => ['cg-crm-whatsapp', 'WhatsApp'],
    'contenido' => ['cg-crm-contenido', 'Contenido'],
  ];
  echo '<div class="cg-tabs">';
  foreach ($tabs as $key => [$slug, $label]) {
    $cls = $key === $active ? ' active' : '';
    echo '<a class="cg-tab' . esc_attr($cls) . '" href="' . esc_url(cg_crm_url($slug)) . '">' . esc_html($label) . '</a>';
  }
  echo '</div>';
}

function cg_crm_shell_start($title, $subtitle, $active) {
  if (!cg_crm_can_access()) wp_die('Acceso restringido', 'Acceso restringido', ['response' => 403]);
  echo '<div class="wrap cg-crm-wrap">';
  echo '<style>
    .cg-crm-wrap{max-width:1400px}
    .cg-hero{background:linear-gradient(135deg,#0c2b3d 0%,#1a4a6b 50%,#c9a84c 100%);color:#fff;border-radius:24px;padding:28px 28px 22px;box-shadow:0 18px 40px rgba(12,43,61,.18);margin:10px 0 18px}
    .cg-hero h1{margin:0;font-size:28px;line-height:1.15}
    .cg-hero p{margin:8px 0 0;max-width:900px;color:rgba(255,255,255,.86);font-size:14px}
    .cg-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 22px}
    .cg-tab{background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:600;color:#334155;text-decoration:none;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .cg-tab.active{background:#0c2b3d;color:#fff;border-color:#0c2b3d}
    .cg-grid{display:grid;gap:16px}
    .cg-grid.kpis{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
    .cg-grid.two{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
    .cg-card{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;box-shadow:0 1px 1px rgba(15,23,42,.03)}
    .cg-card h3{margin:0 0 10px;font-size:16px;color:#0f172a}
    .cg-kpi .label{color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
    .cg-kpi .value{font-size:26px;font-weight:800;color:#0f172a;margin-top:6px}
    .cg-kpi .sub{font-size:12px;color:#64748b;margin-top:4px}
    .cg-kpi .badge{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;margin-top:10px}
    .cg-b-blue{background:#e8f2ff;color:#1a4a6b}.cg-b-gold{background:#fef2c5;color:#8a6b0f}.cg-b-green{background:#e7f7ef;color:#166534}.cg-b-red{background:#fee2e2;color:#991b1b}.cg-b-olive{background:#edf4d8;color:#556b14}.cg-b-slate{background:#e2e8f0;color:#334155}
    .cg-quick{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
    .cg-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px}
    .cg-btn.primary{background:#0c2b3d;color:#fff}.cg-btn.soft{background:#f8fafc;color:#0f172a;border:1px solid #e5e7eb}
    .cg-svg{width:100%;height:auto;display:block}
    .cg-grid{stroke:#e2e8f0;stroke-width:1}
    .cg-line{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
    .cg-line-ing{stroke:#1a4a6b}.cg-line-egr{stroke:#c0392b}
    .cg-axis-label,.cg-bar-label,.cg-bar-value{font-size:11px;fill:#64748b;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    .cg-bar{fill:#1a4a6b}
    .cg-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#475569;margin-top:10px}
    .cg-legend .dot{display:inline-block;width:10px;height:10px;border-radius:999px;margin-right:6px}
    .cg-legend .dot.ing{background:#1a4a6b}.cg-legend .dot.egr{background:#c0392b}
    .cg-table{width:100%;border-collapse:collapse;font-size:13px}
    .cg-table th,.cg-table td{border-bottom:1px solid #eef2f7;padding:10px 8px;text-align:left;vertical-align:top}
    .cg-table th{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;background:#f8fafc}
    .cg-pill{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700}
    .cg-pill.ok{background:#e7f7ef;color:#166534}.cg-pill.warn{background:#fef3c7;color:#92400e}.cg-pill.bad{background:#fee2e2;color:#991b1b}.cg-pill.neutral{background:#e2e8f0;color:#334155}
    .cg-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px}
    .cg-form input,.cg-form select,.cg-form textarea{width:100%;border:1px solid #dbe3ee;border-radius:10px;padding:10px 12px;font-size:13px;background:#fff}
    .cg-form textarea{min-height:84px}
    .cg-form .full{grid-column:1/-1}
    .cg-form button{border:0;border-radius:12px;background:#0c2b3d;color:#fff;font-weight:700;padding:10px 14px;cursor:pointer}
    .cg-empty{padding:20px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;color:#64748b;font-size:13px}
    .cg-note{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:14px;color:#475569;font-size:13px}
  </style>';
  echo '<div class="cg-hero"><h1>' . esc_html($title) . '</h1><p>' . esc_html($subtitle) . '</p>';
  do_action('cg_shell_help', $active);
  echo '<div class="cg-quick">';
  echo '<a class="cg-btn primary" href="' . esc_url(admin_url('edit.php?post_type=reservation')) . '">Reservas WP</a>';
  echo '<a class="cg-btn soft" href="' . esc_url(admin_url('edit.php?post_type=room')) . '">Habitaciones WP</a>';
  echo '<a class="cg-btn soft" href="' . esc_url(admin_url('edit.php?post_type=cg_slide')) . '">Hero / Promos</a>';
  echo '<a class="cg-btn soft" href="' . esc_url(admin_url('admin.php?page=cg-galeria')) . '">Galeria</a>';
  echo '<a class="cg-btn soft" href="' . esc_url(admin_url('edit.php')) . '">Blog</a>';
  echo '</div></div>';
  cg_crm_tabs($active);
}

function cg_crm_shell_end() {
  echo '</div>';
}

function cg_crm_dashboard_render() {
  $start = date('Y-m-01', strtotime('-5 months'));
  $end = current_time('Y-m-t');
  $finance = function_exists('cg_finance_summary') ? cg_finance_summary($start, $end) : ['ingresos' => 0, 'egresos' => 0, 'utilidad' => 0, 'igv' => 0];
  $monthly = function_exists('cg_monthly_series') ? cg_monthly_series(6) : [];
  $inv = function_exists('cg_inventory_summary') ? cg_inventory_summary() : ['rows' => [], 'value' => 0, 'alerts' => 0, 'by_area' => []];
  $occ = function_exists('cg_occupancy_today') ? cg_occupancy_today() : ['units' => 0, 'occupied' => 0, 'free' => 0, 'rate' => 0];
  $staff = function_exists('cg_staff_counts') ? cg_staff_counts() : ['active' => 0, 'on_shift' => 0];
  $hk = function_exists('cg_hk_counts') ? cg_hk_counts() : [];
  $wa = cg_crm_conversations(50);
  $hotel = function_exists('cg_hotel_kpis') ? cg_hotel_kpis(date('Y-m-01'), current_time('Y-m-t')) : ['adr' => 0, 'revpar' => 0, 'nights' => 0];
  $moves = function_exists('cg_today_movements') ? cg_today_movements() : ['arrivals' => [], 'departures' => []];
  $unread = 0;
  foreach ($wa as $c) $unread += (int) ($c->unread ?? 0);
  $by_area = [];
  foreach (($inv['by_area'] ?? []) as $area => $value) {
    $by_area[] = ['label' => ucfirst((string) $area), 'value' => (float) $value, 'formatted' => cg_crm_money_fmt($value)];
  }
  $hk_pairs = [];
  foreach ($hk as $status => $count) {
    if ($count <= 0) continue;
    $hk_pairs[] = ['label' => ucwords(str_replace('_', ' ', (string) $status)), 'value' => (float) $count, 'formatted' => (string) $count];
  }
  ?>
  <?php if (function_exists('cg4_alerts_render')) cg4_alerts_render(); ?>
  <div class="cg-grid kpis">
    <?php
    $cards = [
      ['Ingresos', $finance['ingresos'] ?? 0, cg_crm_money_fmt($finance['ingresos'] ?? 0), 'cg-b-blue', 'ingresos y reservas pagadas'],
      ['Egresos', $finance['egresos'] ?? 0, cg_crm_money_fmt($finance['egresos'] ?? 0), 'cg-b-red', 'compras, servicios y planilla'],
      ['Utilidad', $finance['utilidad'] ?? 0, cg_crm_money_fmt($finance['utilidad'] ?? 0), 'cg-b-green', 'resultado operativo'],
      ['IGV estimado', $finance['igv'] ?? 0, cg_crm_money_fmt($finance['igv'] ?? 0), 'cg-b-gold', 'impuesto calculado'],
      ['Almacen', $inv['value'] ?? 0, cg_crm_money_fmt($inv['value'] ?? 0), 'cg-b-olive', ($inv['alerts'] ?? 0) . ' alertas de stock'],
      ['Personal', $staff['active'] ?? 0, (string) ($staff['active'] ?? 0) . ' activos', 'cg-b-slate', ($staff['on_shift'] ?? 0) . ' en turno hoy'],
      ['Ocupacion', $occ['rate'] ?? 0, (string) ($occ['rate'] ?? 0) . '%', 'cg-b-blue', ($occ['occupied'] ?? 0) . ' ocupadas / ' . ($occ['free'] ?? 0) . ' libres'],
      ['WhatsApp', $unread, (string) $unread . ' no leidos', 'cg-b-gold', 'con YCloud y bot por reglas'],
      ['ADR (tarifa media)', $hotel['adr'] ?? 0, cg_crm_money_fmt($hotel['adr'] ?? 0), 'cg-b-slate', ($hotel['nights'] ?? 0) . ' noches vendidas este mes'],
      ['RevPAR', $hotel['revpar'] ?? 0, cg_crm_money_fmt($hotel['revpar'] ?? 0), 'cg-b-olive', 'ingreso por habitacion disponible'],
    ];
    foreach ($cards as [$label, $value, $formatted, $badge, $sub]) : ?>
      <div class="cg-card cg-kpi">
        <div class="label"><?php echo esc_html($label); ?></div>
        <div class="value"><?php echo esc_html($formatted); ?></div>
        <div class="sub"><?php echo esc_html($sub); ?></div>
        <div class="badge <?php echo esc_attr($badge); ?>">Automatico y compartido</div>
      </div>
    <?php endforeach; ?>
  </div>

  <div class="cg-grid two" style="margin-top:16px;">
    <div class="cg-card">
      <h3>Ingresos vs Egresos</h3>
      <?php echo cg_crm_svg_line_chart($monthly); ?>
    </div>
    <div class="cg-card">
      <h3>Almacen por area</h3>
      <?php echo cg_crm_svg_bars($by_area); ?>
    </div>
    <div class="cg-card">
      <h3>Estado de Limpieza</h3>
      <?php echo cg_crm_svg_bars($hk_pairs); ?>
    </div>
    <div class="cg-card">
      <h3>Automatizacion</h3>
      <div class="cg-note">
        <strong>Sin pasar datos de un cuadro a otro.</strong> Las reservas pagadas alimentan ingresos, las compras alimentan egresos, la planilla se agrega sola, el stock baja con movimientos y el WhatsApp responde por reglas o manualmente dentro de la ventana de 24 horas.
      </div>
      <div class="cg-note" style="margin-top:10px">
        Conexiones listas: WordPress, YCloud, webhooks, contenidos editables, blog, galerias y hero desde el mismo CMS.
      </div>
    </div>
  </div>

  <div class="cg-grid two" style="margin-top:16px;">
    <div class="cg-card">
      <h3>Reservas recientes</h3>
      <table class="cg-table">
        <thead><tr><th>Codigo</th><th>Huesped</th><th>Fechas</th><th>Pago</th><th>Estado</th></tr></thead>
        <tbody>
        <?php foreach (cg_crm_recent_reservations(6) as $res) :
          $pay = get_post_meta($res->ID, 'cg_payment', true) ?: 'por_pagar';
          $status = get_post_meta($res->ID, 'cg_status', true) ?: 'pendiente';
          $pay_cls = $pay === 'pagado' ? 'ok' : ($pay === 'parcial' ? 'warn' : 'bad');
          $status_cls = $status === 'confirmada' ? 'ok' : ($status === 'cancelada' ? 'neutral' : 'warn');
        ?>
          <tr>
            <td><strong><?php echo esc_html(get_post_meta($res->ID, 'cg_code', true) ?: $res->post_title); ?></strong></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_name', true) ?: '---'); ?></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_check_in', true) . ' → ' . get_post_meta($res->ID, 'cg_check_out', true)); ?></td>
            <td><span class="cg-pill <?php echo esc_attr($pay_cls); ?>"><?php echo esc_html(ucwords(str_replace('_', ' ', $pay))); ?></span></td>
            <td><span class="cg-pill <?php echo esc_attr($status_cls); ?>"><?php echo esc_html(ucwords(str_replace('_', ' ', $status))); ?></span></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <div class="cg-card">
      <h3>Recepcion hoy — llegadas y salidas</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-weight:700;color:#155e37;margin-bottom:6px">→ Llegadas (<?php echo count($moves['arrivals']); ?>)</div>
          <?php if (!$moves['arrivals']) echo '<div class="cg-note">Sin llegadas hoy.</div>'; ?>
          <?php foreach ($moves['arrivals'] as $mv) : ?>
            <div class="cg-note" style="margin-bottom:6px"><strong><?php echo esc_html($mv['name'] ?: $mv['code']); ?></strong><div style="font-size:12px;color:#64748b"><?php echo esc_html($mv['room']); ?> · <?php echo esc_html($mv['code']); ?></div></div>
          <?php endforeach; ?>
        </div>
        <div>
          <div style="font-weight:700;color:#9a3412;margin-bottom:6px">← Salidas (<?php echo count($moves['departures']); ?>)</div>
          <?php if (!$moves['departures']) echo '<div class="cg-note">Sin salidas hoy.</div>'; ?>
          <?php foreach ($moves['departures'] as $mv) : ?>
            <div class="cg-note" style="margin-bottom:6px"><strong><?php echo esc_html($mv['name'] ?: $mv['code']); ?></strong><div style="font-size:12px;color:#64748b"><?php echo esc_html($mv['room']); ?> · <?php echo esc_html($mv['code']); ?></div></div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </div>

  <div class="cg-grid two" style="margin-top:16px;">
    <div class="cg-card">
      <h3>WhatsApp / YCloud</h3>
      <?php foreach (cg_crm_conversations(4) as $conv) : ?>
        <div class="cg-note" style="margin-bottom:10px">
          <strong><?php echo esc_html($conv->name ?: $conv->phone); ?></strong>
          <div style="font-size:12px;color:#64748b;margin-top:4px"><?php echo esc_html($conv->service); ?> · <?php echo esc_html($conv->status); ?> · unread <?php echo (int) $conv->unread; ?></div>
          <div style="margin-top:6px;font-size:13px"><?php echo esc_html($conv->last_body); ?></div>
        </div>
      <?php endforeach; ?>
      <div class="cg-quick"><a class="cg-btn primary" href="<?php echo esc_url(cg_crm_url('cg-crm-whatsapp')); ?>">Abrir inbox</a></div>
    </div>
  </div>
  <?php do_action('cg_dashboard_bottom');
}

function cg_crm_render_staff() {
  $rows = cg_crm_staff_rows();
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Agregar personal</h3>
      <form class="cg-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg_crm_save_staff', 'cg_crm_staff_nonce'); ?>
        <input type="hidden" name="action" value="cg_crm_save_staff" />
        <div><input name="name" placeholder="Nombre" required /></div>
        <div><input name="role" placeholder="Rol" required /></div>
        <div><input name="phone" placeholder="Telefono" /></div>
        <div><input name="salary" type="number" step="0.01" placeholder="Sueldo" /></div>
        <div class="full"><button type="submit">Guardar personal</button></div>
      </form>
    </div>
    <div class="cg-card">
      <h3>Resumen del equipo</h3>
      <table class="cg-table">
        <thead><tr><th>Nombre</th><th>Rol</th><th>Telefono</th><th>Sueldo</th><th>Estado</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $row) : ?>
          <tr>
            <td><?php echo esc_html($row->name); ?></td>
            <td><?php echo esc_html($row->role); ?></td>
            <td><?php echo esc_html($row->phone); ?></td>
            <td><?php echo esc_html(cg_crm_money_fmt($row->salary)); ?></td>
            <td><span class="cg-pill <?php echo (int) $row->active ? 'ok' : 'neutral'; ?>"><?php echo (int) $row->active ? 'Activo' : 'Inactivo'; ?></span></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php
}

function cg_crm_render_limpieza() {
  global $wpdb; $t = cg_tbl('housekeeping');
  $rows = $wpdb->get_results("SELECT * FROM $t ORDER BY room_name ASC");
  ?>
  <div class="cg-card">
    <h3>Estado de habitaciones</h3>
    <table class="cg-table">
      <thead><tr><th>Habitacion</th><th>Estado</th><th>Responsable</th><th>Nota</th><th>Actualizar</th></tr></thead>
      <tbody>
      <?php foreach ($rows as $row) : ?>
        <tr>
          <td><?php echo esc_html($row->room_name); ?></td>
          <td><?php echo esc_html($row->status); ?></td>
          <td><?php echo esc_html($row->staff_id); ?></td>
          <td><?php echo esc_html($row->note); ?></td>
          <td>
            <form class="cg-form" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:0" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
              <?php wp_nonce_field('cg_crm_save_hk', 'cg_crm_hk_nonce'); ?>
              <input type="hidden" name="action" value="cg_crm_save_hk" />
              <input type="hidden" name="id" value="<?php echo (int) $row->id; ?>" />
              <input name="room_name" value="<?php echo esc_attr($row->room_name); ?>" />
              <select name="status">
                <?php foreach (['limpio','sucio','en_limpieza','mantenimiento','ocupado'] as $st) : ?>
                  <option value="<?php echo esc_attr($st); ?>" <?php selected($row->status, $st); ?>><?php echo esc_html($st); ?></option>
                <?php endforeach; ?>
              </select>
              <input name="note" value="<?php echo esc_attr($row->note); ?>" placeholder="Nota" />
              <button type="submit">Guardar</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

function cg_crm_render_turnos() {
  $rows = cg_crm_staff_rows();
  global $wpdb; $t = cg_tbl('shifts');
  $today = current_time('Y-m-d');
  $today_rows = $wpdb->get_results($wpdb->prepare("SELECT s.*, p.name, p.role FROM $t s LEFT JOIN " . cg_tbl('staff') . " p ON p.id=s.staff_id WHERE s.work_date=%s ORDER BY s.shift ASC, p.name ASC", $today));
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Asignar turno</h3>
      <form class="cg-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg_crm_save_shift', 'cg_crm_shift_nonce'); ?>
        <input type="hidden" name="action" value="cg_crm_save_shift" />
        <div>
          <select name="staff_id" required>
            <option value="">Seleccionar personal</option>
            <?php foreach ($rows as $row) : ?>
              <option value="<?php echo (int) $row->id; ?>"><?php echo esc_html($row->name . ' - ' . $row->role); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div><input type="date" name="work_date" value="<?php echo esc_attr($today); ?>" required /></div>
        <div>
          <select name="shift">
            <?php foreach (['manana' => 'Mañana', 'tarde' => 'Tarde', 'noche' => 'Noche', 'completo' => 'Completo'] as $key => $label) : ?>
              <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="full"><button type="submit">Guardar turno</button></div>
      </form>
    </div>
    <div class="cg-card">
      <h3>Turnos de hoy</h3>
      <table class="cg-table">
        <thead><tr><th>Personal</th><th>Rol</th><th>Turno</th></tr></thead>
        <tbody>
        <?php foreach ($today_rows as $row) : ?>
          <tr><td><?php echo esc_html($row->name ?: $row->staff_id); ?></td><td><?php echo esc_html($row->role ?: '-'); ?></td><td><?php echo esc_html($row->shift); ?></td></tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php
}

function cg_crm_render_reservas() {
  $rooms = function_exists('cg_availability') ? cg_availability(current_time('Y-m-d'), date('Y-m-d', strtotime(current_time('Y-m-d') . ' +1 day'))) : [];
  $rows = cg_crm_recent_reservations(10);
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Disponibilidad inmediata</h3>
      <table class="cg-table">
        <thead><tr><th>Habitacion</th><th>Unidades</th><th>Libres</th><th>Estado</th></tr></thead>
        <tbody>
        <?php foreach ($rooms as $row) : ?>
          <tr>
            <td><?php echo esc_html($row['name']); ?></td>
            <td><?php echo (int) $row['units']; ?></td>
            <td><?php echo (int) $row['available']; ?></td>
            <td><span class="cg-pill <?php echo $row['available'] > 0 ? 'ok' : 'bad'; ?>"><?php echo $row['available'] > 0 ? 'Disponible' : 'Completo'; ?></span></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <div class="cg-card">
      <h3>Reservas recientes</h3>
      <table class="cg-table">
        <thead><tr><th>Codigo</th><th>Huesped</th><th>Habitacion</th><th>Fechas</th><th>Estado</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $res) : ?>
          <tr>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_code', true) ?: $res->post_title); ?></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_name', true)); ?></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_room', true)); ?></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_check_in', true) . ' → ' . get_post_meta($res->ID, 'cg_check_out', true)); ?></td>
            <td><?php echo esc_html(get_post_meta($res->ID, 'cg_status', true)); ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php
}

function cg_crm_render_almacen() {
  $rows = cg_crm_inventory_rows();
  global $wpdb; $t = cg_tbl('stock_moves'); $i = cg_tbl('inventory');
  $moves = $wpdb->get_results("SELECT m.*, inv.name AS item_name, inv.area AS item_area FROM $t m LEFT JOIN $i inv ON inv.id=m.item_id ORDER BY m.ts DESC LIMIT 12");
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Agregar insumo</h3>
      <form class="cg-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg_crm_save_inventory', 'cg_crm_inventory_nonce'); ?>
        <input type="hidden" name="action" value="cg_crm_save_inventory" />
        <div><input name="sku" placeholder="SKU" /></div>
        <div><input name="name" placeholder="Nombre" required /></div>
        <div><select name="area"><option value="hotel">Hotel</option><option value="restaurante">Restaurante</option><option value="catering">Catering</option></select></div>
        <div><input name="unit" placeholder="Unidad" value="und" /></div>
        <div><input name="stock" type="number" step="0.01" placeholder="Stock" /></div>
        <div><input name="min_stock" type="number" step="0.01" placeholder="Minimo" /></div>
        <div><input name="cost" type="number" step="0.01" placeholder="Costo" /></div>
        <div class="full"><button type="submit">Guardar insumo</button></div>
      </form>
    </div>
    <div class="cg-card">
      <h3>Registrar movimiento</h3>
      <form class="cg-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg_crm_save_move', 'cg_crm_move_nonce'); ?>
        <input type="hidden" name="action" value="cg_crm_save_move" />
        <div>
          <select name="item_id" required>
            <option value="">Seleccionar item</option>
            <?php foreach ($rows as $row) : ?>
              <option value="<?php echo (int) $row->id; ?>"><?php echo esc_html($row->name . ' (' . $row->area . ')'); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <select name="kind"><option value="entrada">Entrada</option><option value="salida">Salida</option><option value="ajuste">Ajuste</option></select>
        </div>
        <div><input name="qty" type="number" step="0.01" placeholder="Cantidad" required /></div>
        <div><input name="unit_cost" type="number" step="0.01" placeholder="Costo unitario" /></div>
        <div class="full"><input name="note" placeholder="Nota" /></div>
        <div class="full"><button type="submit">Guardar movimiento</button></div>
      </form>
    </div>
  </div>
  <div class="cg-card" style="margin-top:16px;">
    <h3>Stock actual</h3>
    <table class="cg-table">
      <thead><tr><th>Insumo</th><th>Area</th><th>Stock</th><th>Minimo</th><th>Costo</th></tr></thead>
      <tbody>
      <?php foreach ($rows as $row) : ?>
        <tr>
          <td><?php echo esc_html($row->name); ?></td>
          <td><?php echo esc_html($row->area); ?></td>
          <td><?php echo esc_html($row->stock . ' ' . $row->unit); ?></td>
          <td><?php echo esc_html($row->min_stock . ' ' . $row->unit); ?></td>
          <td><?php echo esc_html(cg_crm_money_fmt($row->cost)); ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <div class="cg-card" style="margin-top:16px;">
    <h3>Movimientos recientes</h3>
    <table class="cg-table">
      <thead><tr><th>Fecha</th><th>Item</th><th>Tipo</th><th>Cantidad</th><th>Total</th><th>Nota</th></tr></thead>
      <tbody>
      <?php foreach ($moves as $move) : ?>
        <tr>
          <td><?php echo esc_html($move->ts); ?></td>
          <td><?php echo esc_html($move->item_name ?: $move->item_id); ?></td>
          <td><?php echo esc_html($move->kind); ?></td>
          <td><?php echo esc_html($move->qty); ?></td>
          <td><?php echo esc_html(cg_crm_money_fmt($move->total)); ?></td>
          <td><?php echo esc_html($move->note); ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

function cg_crm_render_finanzas() {
  $summary = function_exists('cg_finance_summary') ? cg_finance_summary(date('Y-m-01', strtotime('-5 months')), current_time('Y-m-t')) : ['ingresos' => 0, 'egresos' => 0, 'utilidad' => 0, 'igv' => 0, 'ing_rows' => [], 'egr_rows' => []];
  $rows = cg_crm_ledger_rows_all(18);
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Registrar asiento</h3>
      <form class="cg-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg_crm_save_ledger', 'cg_crm_ledger_nonce'); ?>
        <input type="hidden" name="action" value="cg_crm_save_ledger" />
        <div><select name="kind"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
        <div><input name="category" placeholder="Categoria" required /></div>
        <div><input name="concept" placeholder="Concepto" required /></div>
        <div><input name="amount" type="number" step="0.01" placeholder="Monto" required /></div>
        <div><select name="taxable"><option value="1">Gravado</option><option value="0">No gravado</option></select></div>
        <div class="full"><button type="submit">Guardar asiento</button></div>
      </form>
    </div>
    <div class="cg-card">
      <h3>Resumen automatico</h3>
      <table class="cg-table">
        <tbody>
          <tr><th>Ingresos</th><td><?php echo esc_html(cg_crm_money_fmt($summary['ingresos'] ?? 0)); ?></td></tr>
          <tr><th>Egresos</th><td><?php echo esc_html(cg_crm_money_fmt($summary['egresos'] ?? 0)); ?></td></tr>
          <tr><th>Utilidad</th><td><?php echo esc_html(cg_crm_money_fmt($summary['utilidad'] ?? 0)); ?></td></tr>
          <tr><th>IGV estimado</th><td><?php echo esc_html(cg_crm_money_fmt($summary['igv'] ?? 0)); ?></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="cg-card" style="margin-top:16px;">
    <h3>Libro de movimientos</h3>
    <table class="cg-table">
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoria</th><th>Concepto</th><th>Monto</th><th>IGV</th></tr></thead>
      <tbody>
      <?php foreach ($rows as $row) : ?>
        <tr>
          <td><?php echo esc_html($row->ts); ?></td>
          <td><?php echo esc_html($row->kind); ?></td>
          <td><?php echo esc_html($row->category); ?></td>
          <td><?php echo esc_html($row->concept); ?></td>
          <td><?php echo esc_html(cg_crm_money_fmt($row->amount)); ?></td>
          <td><?php echo (int) $row->taxable ? 'Si' : 'No'; ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

function cg_crm_render_whatsapp() {
  $conv = cg_crm_conversations(12);
  ?>
  <div class="cg-card">
    <h3>Inbox WhatsApp</h3>
    <div class="cg-note" style="margin-bottom:14px">Respuestas manuales y automáticas listas para YCloud. El bot responde por reglas y la ventana de respuesta de 24 horas queda cubierta para mensajes de sesion gratuitos.</div>
    <table class="cg-table">
      <thead><tr><th>Cliente</th><th>Servicio</th><th>Ultimo mensaje</th><th>Estado</th><th>Responder</th></tr></thead>
      <tbody>
      <?php foreach ($conv as $row) : ?>
        <tr>
          <td><strong><?php echo esc_html($row->name ?: $row->phone); ?></strong><br /><span style="color:#64748b;font-size:12px"><?php echo esc_html($row->phone); ?></span>
            <?php if (function_exists('cg_guest_key')) : $gk = cg_guest_key($row->name, $row->phone, ''); ?>
              <br><a style="font-size:11px" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-huespedes', 'g' => $gk], admin_url('admin.php'))); ?>#perfil">👤 Ver perfil</a>
            <?php endif; ?></td>
          <td><?php echo esc_html($row->service); ?></td>
          <td><?php echo esc_html($row->last_body); ?></td>
          <td><?php echo esc_html($row->status); ?><br />Unread <?php echo (int) $row->unread; ?></td>
          <td>
            <form class="cg-form" style="grid-template-columns:1fr;gap:8px;margin-top:0" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
              <?php wp_nonce_field('cg_wa_reply_' . (int) $row->id, 'cg_wa_nonce'); ?>
              <input type="hidden" name="action" value="cg_crm_wa_reply" />
              <input type="hidden" name="conv_id" value="<?php echo (int) $row->id; ?>" />
              <input type="hidden" name="phone" value="<?php echo esc_attr($row->phone); ?>" />
              <select onchange="if(this.value){this.closest('form').querySelector('textarea').value=this.value;this.selectedIndex=0}" style="font-size:12px">
                <option value="">⚡ Respuesta rapida...</option>
                <?php foreach (cg5_canned_replies() as $cr) : ?>
                  <option value="<?php echo esc_attr($cr[1]); ?>"><?php echo esc_html($cr[0]); ?></option>
                <?php endforeach; ?>
              </select>
              <textarea name="message" placeholder="Responder manualmente" required></textarea>
              <button type="submit">Enviar</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

function cg_crm_render_contenido() {
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>Contenido editable desde WordPress</h3>
      <div class="cg-note">Hero, galeria y blog se administran desde WordPress. El front consume esas piezas sin copiar datos a otras pantallas.</div>
      <div class="cg-quick" style="margin-top:14px">
        <a class="cg-btn primary" href="<?php echo esc_url(admin_url('edit.php?post_type=cg_slide')); ?>">Hero / Promos</a>
        <a class="cg-btn soft" href="<?php echo esc_url(admin_url('admin.php?page=cg-galeria')); ?>">Galeria</a>
        <a class="cg-btn soft" href="<?php echo esc_url(admin_url('edit.php')); ?>">Blog</a>
        <a class="cg-btn soft" href="<?php echo esc_url(admin_url('edit.php?post_type=room')); ?>">Habitaciones</a>
      </div>
    </div>
    <div class="cg-card">
      <h3>Acceso y demo</h3>
      <div class="cg-note">El login de WordPress muestra una card con el usuario demo restringido y el boton para rellenar y entrar. El rol <code>cg_hotel</code> administra el hotel sin acceso a plugins, temas, usuarios o exportacion.</div>
      <div class="cg-note" style="margin-top:10px">Para YCloud solo faltan las credenciales y el webhook: el CRM ya expone la ruta y la logica de respuesta automatica/manual.</div>
    </div>
  </div>
  <?php
}

function cg_crm_render_router() {
  $section = cg_crm_section_from_page();
  $titles = [
    'dashboard' => ['CRM Casa Grande', 'Panel operativo con KPIs, grafico financiero, almacen, personal y WhatsApp conectados.'],
    'reservas' => ['Front Desk', 'Calendario de ocupacion, check-in/check-out y cuenta del cuarto.'],
    'cuartos' => ['Cuartos', 'Rack de habitaciones 101-515 por piso: tipo, capacidad y estado.'],
    'proveedores' => ['Proveedores', 'Proveedores de insumos y servicios de terceros.'],
    'huespedes' => ['Huespedes', 'Perfiles, historial de estancias, gasto total y notas.'],
    'tarifas' => ['Tarifas', 'Precios por temporada aplicados noche por noche.'],
    'mantenimiento' => ['Mantenimiento', 'Ordenes de trabajo con prioridad, costo y estados.'],
    'reportes' => ['Reportes', 'Ocupacion, ADR/RevPAR, ingresos por categoria y rankings.'],
    'personal' => ['Personal', 'Equipo, roles y sueldo base.'],
    'limpieza' => ['Limpieza', 'Estado de habitaciones y mantenimiento.'],
    'turnos' => ['Turnos', 'Asignacion semanal y turno de hoy.'],
    'almacen' => ['Almacen', 'Insumos hotel, restaurante y catering con movimientos.'],
    'finanzas' => ['Finanzas', 'Ingresos, egresos, IGV e utilidades.'],
    'whatsapp' => ['Mensajes', 'WhatsApp y chat de la web en cards: ficha del lead, archivos y links de pago.'],
    'canales' => ['Chatbot & Canales', 'Personaliza y entrena el bot, conecta YCloud y configura links de pago.'],
    'contenido' => ['Contenido', 'Hero, galeria, blog y accesos de edicion.'],
  ];
  [$title, $subtitle] = $titles[$section] ?? $titles['dashboard'];
  cg_crm_shell_start($title, $subtitle, $section);
  switch ($section) {
    case 'personal': cg_crm3_render_personal(); break;
    case 'limpieza': cg5_render_limpieza(); break;
    case 'turnos': cg5_render_turnos(); break;
    case 'reservas': cg_crm2_render_reservas(); break;
    case 'almacen': cg_crm2_render_almacen(); break;
    case 'finanzas': cg_crm2_render_finanzas(); break;
    case 'whatsapp': cg8_render_inbox(); break;
    case 'cuartos': cg_crm2_render_cuartos(); break;
    case 'proveedores': cg_crm2_render_proveedores(); break;
    case 'huespedes': cg5_render_huespedes(); break;
    case 'canales': cg8_render_canales(); break;
    case 'tarifas': cg5_render_tarifas(); break;
    case 'mantenimiento': cg5_render_mantenimiento(); break;
    case 'reportes': cg5_render_reportes(); break;
    case 'contenido': cg_crm_render_contenido(); break;
    default: cg_crm_dashboard_render(); break;
  }
  cg_crm_shell_end();
}

add_action('admin_menu', function () {
  $cap = 'manage_hotel';
  add_menu_page('CRM Casa Grande', 'CRM Casa Grande', $cap, 'cg-crm', 'cg_crm_render_router', 'dashicons-chart-area', 3);
  add_submenu_page('cg-crm', 'Dashboard', 'Dashboard', $cap, 'cg-crm', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Personal', 'Personal', $cap, 'cg-crm-personal', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Limpieza', 'Limpieza', $cap, 'cg-crm-limpieza', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Turnos', 'Turnos', $cap, 'cg-crm-turnos', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Reservas', 'Reservas', $cap, 'cg-crm-reservas', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Cuartos', 'Cuartos', $cap, 'cg-crm-cuartos', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Proveedores', 'Proveedores', $cap, 'cg-crm-proveedores', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Almacen', 'Almacen', $cap, 'cg-crm-almacen', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Finanzas', 'Finanzas', $cap, 'cg-crm-finanzas', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'WhatsApp', 'WhatsApp', $cap, 'cg-crm-whatsapp', 'cg_crm_render_router');
  add_submenu_page('cg-crm', 'Contenido', 'Contenido', $cap, 'cg-crm-contenido', 'cg_crm_render_router');
});

add_action('admin_post_cg_crm_save_staff', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_staff', 'cg_crm_staff_nonce');
  global $wpdb; $t = cg_tbl('staff');
  $wpdb->insert($t, [
    'name' => sanitize_text_field(wp_unslash($_POST['name'] ?? '')),
    'role' => sanitize_text_field(wp_unslash($_POST['role'] ?? '')),
    'phone' => sanitize_text_field(wp_unslash($_POST['phone'] ?? '')),
    'salary' => (float) ($_POST['salary'] ?? 0),
    'active' => 1,
  ]);
  wp_safe_redirect(cg_crm_url('cg-crm-personal')); exit;
});

add_action('admin_post_cg_crm_save_shift', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_shift', 'cg_crm_shift_nonce');
  global $wpdb; $t = cg_tbl('shifts');
  $wpdb->insert($t, [
    'staff_id' => (int) ($_POST['staff_id'] ?? 0),
    'work_date' => sanitize_text_field(wp_unslash($_POST['work_date'] ?? current_time('Y-m-d'))),
    'shift' => sanitize_text_field(wp_unslash($_POST['shift'] ?? 'manana')),
  ]);
  wp_safe_redirect(cg_crm_url('cg-crm-turnos')); exit;
});

add_action('admin_post_cg_crm_save_hk', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_hk', 'cg_crm_hk_nonce');
  global $wpdb; $t = cg_tbl('housekeeping');
  $data = [
    'room_name' => sanitize_text_field(wp_unslash($_POST['room_name'] ?? '')),
    'status' => sanitize_text_field(wp_unslash($_POST['status'] ?? 'limpio')),
    'note' => sanitize_text_field(wp_unslash($_POST['note'] ?? '')),
    'updated' => current_time('mysql'),
  ];
  $id = (int) ($_POST['id'] ?? 0);
  if ($id > 0) $wpdb->update($t, $data, ['id' => $id]); else $wpdb->insert($t, $data);
  wp_safe_redirect(cg_crm_url('cg-crm-limpieza')); exit;
});

add_action('admin_post_cg_crm_save_inventory', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_inventory', 'cg_crm_inventory_nonce');
  global $wpdb; $t = cg_tbl('inventory');
  $wpdb->insert($t, [
    'sku' => sanitize_text_field(wp_unslash($_POST['sku'] ?? '')),
    'name' => sanitize_text_field(wp_unslash($_POST['name'] ?? '')),
    'area' => sanitize_text_field(wp_unslash($_POST['area'] ?? 'hotel')),
    'unit' => sanitize_text_field(wp_unslash($_POST['unit'] ?? 'und')),
    'stock' => (float) ($_POST['stock'] ?? 0),
    'min_stock' => (float) ($_POST['min_stock'] ?? 0),
    'cost' => (float) ($_POST['cost'] ?? 0),
  ]);
  wp_safe_redirect(cg_crm_url('cg-crm-almacen')); exit;
});

add_action('admin_post_cg_crm_save_move', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_move', 'cg_crm_move_nonce');
  global $wpdb; $ti = cg_tbl('inventory'); $tm = cg_tbl('stock_moves');
  $item_id = (int) ($_POST['item_id'] ?? 0);
  $qty = (float) ($_POST['qty'] ?? 0);
  $kind = sanitize_text_field(wp_unslash($_POST['kind'] ?? 'entrada'));
  $unit_cost = (float) ($_POST['unit_cost'] ?? 0);
  $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $ti WHERE id=%d", $item_id));
  if ($item) {
    $total = $qty * ($unit_cost > 0 ? $unit_cost : (float) $item->cost);
    $wpdb->insert($tm, [
      'item_id' => $item_id,
      'kind' => $kind,
      'qty' => $qty,
      'unit_cost' => $unit_cost,
      'total' => $total,
      'note' => sanitize_text_field(wp_unslash($_POST['note'] ?? '')),
      'ts' => current_time('mysql'),
    ]);
    $new = (float) $item->stock;
    if ($kind === 'entrada') $new += $qty;
    elseif ($kind === 'salida') $new -= $qty;
    else $new = $qty;
    $wpdb->update($ti, ['stock' => max(0, $new), 'updated' => current_time('mysql')], ['id' => $item_id]);
  }
  wp_safe_redirect(cg_crm_url('cg-crm-almacen')); exit;
});

add_action('admin_post_cg_crm_save_ledger', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  check_admin_referer('cg_crm_save_ledger', 'cg_crm_ledger_nonce');
  global $wpdb; $t = cg_tbl('ledger');
  $wpdb->insert($t, [
    'kind' => sanitize_text_field(wp_unslash($_POST['kind'] ?? 'ingreso')),
    'category' => sanitize_text_field(wp_unslash($_POST['category'] ?? 'General')),
    'concept' => sanitize_text_field(wp_unslash($_POST['concept'] ?? '')),
    'amount' => (float) ($_POST['amount'] ?? 0),
    'taxable' => (int) ($_POST['taxable'] ?? 1),
    'ts' => current_time('mysql'),
  ]);
  wp_safe_redirect(cg_crm_url('cg-crm-finanzas')); exit;
});

add_action('admin_post_cg_crm_wa_reply', function () {
  if (!cg_crm_can_access()) wp_die('Sin permiso', 'Sin permiso', ['response' => 403]);
  $conv_id = (int) ($_POST['conv_id'] ?? 0);
  check_admin_referer('cg_wa_reply_' . $conv_id, 'cg_wa_nonce');
  $phone = sanitize_text_field(wp_unslash($_POST['phone'] ?? ''));
  $message = sanitize_textarea_field(wp_unslash($_POST['message'] ?? ''));
  if ($conv_id > 0 && $phone !== '' && $message !== '') {
    $via = function_exists('cg_ycloud_send') ? cg_ycloud_send($phone, $message) : 'demo';
    if (function_exists('cg_wa_add_message')) cg_wa_add_message($conv_id, 'out', $message, $via === 'ycloud' ? 'ycloud' : 'manual');
  }
  wp_safe_redirect(cg_crm_url('cg-crm-whatsapp')); exit;
});
