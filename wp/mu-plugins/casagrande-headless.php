<?php
/**
 * Plugin Name: Casa Grande Headless
 * Description: Backend headless para el front Next.js: habitaciones, menu, ajustes, RESERVAS con disponibilidad anti-overbooking y gestion (pago/estado). Sin dependencias externas (portable a hosting compartido).
 */
if (!defined('ABSPATH')) exit;

/* ============ CORS para la REST API (front estatico cross-origin) ============ */
add_action('rest_api_init', function () {
  remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
  add_filter('rest_pre_serve_request', function ($served) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && strpos($_SERVER['REQUEST_URI'] ?? '', '/casagrande/v1/') !== false) {
      header('Cache-Control: public, max-age=60');
    }
    if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) { status_header(204); exit; }
    return $served;
  });
}, 15);

/* ============ Custom Post Types ============ */
add_action('init', function () {
  // "room" es el CATALOGO de TIPOS (Doble, Suite...) para precios/marketing de la web.
  // La habitacion FISICA real (101-515, con su propio numero) se administra en Operaciones > Cuartos.
  register_post_type('room', [
    'labels' => ['name' => 'Tipos de Habitacion', 'singular_name' => 'Tipo de habitacion', 'menu_name' => 'Tipos de Habitacion',
                 'add_new_item' => 'Agregar tipo de habitacion', 'edit_item' => 'Editar tipo de habitacion'],
    'public' => true, 'show_in_rest' => true, 'rest_base' => 'rooms', 'show_in_menu' => 'cg-crm',
    'menu_icon' => 'dashicons-bank', 'supports' => ['title', 'editor', 'thumbnail', 'page-attributes'],
    'has_archive' => false,
  ]);
  register_post_type('dish', [
    'labels' => ['name' => 'Menu (Restaurante)', 'singular_name' => 'Plato'],
    'public' => true, 'show_in_rest' => true, 'rest_base' => 'dishes',
    'menu_icon' => 'dashicons-food', 'supports' => ['title', 'editor', 'thumbnail', 'page-attributes'],
  ]);
  register_post_type('reservation', [
    'labels' => ['name' => 'Reservas', 'singular_name' => 'Reserva', 'menu_name' => 'Reservas (registro WP)'],
    'public' => false, 'show_ui' => true, 'show_in_rest' => false, 'show_in_menu' => 'cg-crm',
    'menu_icon' => 'dashicons-calendar-alt', 'supports' => ['title'],
    'capability_type' => 'post',
  ]);
});

/* ============ Meta de habitacion ============ */
function cg_room_meta_defs() {
  return ['cg_price' => 'Precio por noche (S/)', 'cg_capacity' => 'Capacidad (personas)',
          'cg_units' => 'Cantidad de habitaciones de este tipo (inventario)',
          'cg_amenities' => 'Amenidades (una por linea)', 'cg_images' => 'Imagenes URL (una por linea)'];
}
add_action('add_meta_boxes', function () {
  add_meta_box('cg_room_box', 'Datos de la habitacion', function ($post) {
    wp_nonce_field('cg_room_save', 'cg_room_nonce');
    foreach (cg_room_meta_defs() as $k => $label) {
      $v = esc_textarea(get_post_meta($post->ID, $k, true));
      $multi = in_array($k, ['cg_amenities', 'cg_images']);
      echo '<p><label style="font-weight:600;display:block">' . esc_html($label) . '</label>';
      if ($multi) echo '<textarea name="' . $k . '" rows="5" style="width:100%">' . $v . '</textarea>';
      else echo '<input type="text" name="' . $k . '" value="' . $v . '" style="width:100%">';
      echo '</p>';
    }
  }, 'room', 'normal', 'high');
});
add_action('save_post_room', function ($post_id) {
  if (!isset($_POST['cg_room_nonce']) || !wp_verify_nonce($_POST['cg_room_nonce'], 'cg_room_save')) return;
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  foreach (array_keys(cg_room_meta_defs()) as $k) {
    if (isset($_POST[$k])) update_post_meta($post_id, $k, sanitize_textarea_field($_POST[$k]));
  }
});

/* ============ Meta de plato (Menu Restaurante) ============ */
function cg_dish_categories() { return ['Entradas', 'Sopas', 'Principales', 'Postres', 'Bebidas']; }
add_action('add_meta_boxes', function () {
  add_meta_box('cg_dish_box', 'Datos del plato', function ($post) {
    wp_nonce_field('cg_dish_save', 'cg_dish_nonce');
    $price = esc_attr(get_post_meta($post->ID, 'cg_price', true));
    $cat = get_post_meta($post->ID, 'cg_category', true) ?: 'Principales';
    $feat = get_post_meta($post->ID, 'cg_featured', true) === '1';
    echo '<p><label style="font-weight:600;display:block">Precio (S/)</label><input type="number" step="0.01" name="cg_price" value="' . $price . '" style="width:100%"></p>';
    echo '<p><label style="font-weight:600;display:block">Categoria</label><select name="cg_category" style="width:100%">';
    foreach (cg_dish_categories() as $c) echo '<option value="' . esc_attr($c) . '"' . selected($cat, $c, false) . '>' . esc_html($c) . '</option>';
    echo '</select></p>';
    echo '<p><label><input type="checkbox" name="cg_featured" value="1"' . checked($feat, true, false) . '> Marcar como recomendado</label></p>';
    echo '<p style="color:#666">La descripcion va en el editor de contenido. La foto, en "Imagen destacada".</p>';
  }, 'dish', 'normal', 'high');
});
add_action('save_post_dish', function ($post_id) {
  if (!isset($_POST['cg_dish_nonce']) || !wp_verify_nonce($_POST['cg_dish_nonce'], 'cg_dish_save')) return;
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  if (isset($_POST['cg_price'])) update_post_meta($post_id, 'cg_price', sanitize_text_field($_POST['cg_price']));
  if (isset($_POST['cg_category'])) update_post_meta($post_id, 'cg_category', sanitize_text_field($_POST['cg_category']));
  update_post_meta($post_id, 'cg_featured', isset($_POST['cg_featured']) ? '1' : '0');
});

/* ============ Pagina de Ajustes del sitio (hotel_settings) ============ */
function cg_settings_defs() {
  return ['site_name' => 'Nombre del hotel', 'hero_title' => 'Titulo hero', 'hero_subtitle' => 'Subtitulo hero',
          'about_title' => 'Titulo historia', 'about_text' => 'Texto historia', 'contact_phone' => 'Telefono',
          'contact_whatsapp' => 'WhatsApp', 'contact_email' => 'Email', 'contact_address' => 'Direccion',
          'checkin_time' => 'Check-in', 'checkout_time' => 'Check-out',
          'pay_izipay_merchant_code' => 'Izipay - Codigo de comercio',
          'pay_izipay_public_key' => 'Izipay - Llave publica',
          'pay_izipay_secret_key' => 'Izipay - Llave privada',
          'pay_izipay_endpoint' => 'Izipay - Endpoint / URL de integracion',
          'pay_yape_number' => 'Yape - Numero / alias',
          'pay_yape_holder' => 'Yape - Titular',
          'pay_yape_qr' => 'Yape - QR / enlace',
          'pay_plin_number' => 'Plin - Numero / alias',
          'pay_plin_holder' => 'Plin - Titular',
          'pay_plin_qr' => 'Plin - QR / enlace',
          'pay_bank_name' => 'Banco - Nombre',
          'pay_bank_holder' => 'Banco - Titular',
          'pay_bank_account' => 'Banco - Cuenta',
          'pay_bank_cci' => 'Banco - CCI',
          'pay_bank_currency' => 'Banco - Moneda',
          'pay_payment_note' => 'Nota de pagos para reservas'];
}
add_action('admin_menu', function () {
  add_menu_page('Ajustes Casa Grande', 'Ajustes del sitio', 'manage_options', 'cg-settings', function () {
    if (!current_user_can('manage_options')) return;
    if (isset($_POST['cg_settings_nonce']) && wp_verify_nonce($_POST['cg_settings_nonce'], 'cg_settings_save')) {
      $s = [];
      foreach (array_keys(cg_settings_defs()) as $k) $s[$k] = sanitize_text_field($_POST[$k] ?? '');
      update_option('cg_settings', $s);
      echo '<div class="updated"><p>Guardado.</p></div>';
    }
    $s = get_option('cg_settings', []);
    echo '<div class="wrap"><h1>Ajustes del sitio (web publica)</h1><form method="post">';
    wp_nonce_field('cg_settings_save', 'cg_settings_nonce');
    echo '<table class="form-table">';
    foreach (cg_settings_defs() as $k => $label) {
      $v = esc_attr($s[$k] ?? '');
      echo '<tr><th>' . esc_html($label) . '</th><td><input type="text" name="' . $k . '" value="' . $v . '" class="regular-text"></td></tr>';
    }
    echo '</table>'; submit_button(); echo '</form></div>';
  }, 'dashicons-admin-customizer', 58);
});

/* ============ Disponibilidad / ocupacion (logica anti-overbooking) ============ */
function cg_room_units($room_id) {
  $u = (int) get_post_meta($room_id, 'cg_units', true);
  $u = $u > 0 ? $u : 3; // por defecto 3 si no se configuro
  // Si existe el rack de habitaciones fisicas (CRM), el conteo real manda.
  return (int) apply_filters('cg_room_units_override', $u, $room_id);
}
function cg_ranges_overlap($a_in, $a_out, $b_in, $b_out) {
  return ($a_in < $b_out) && ($a_out > $b_in);
}
// Reservas NO canceladas de un tipo de habitacion que se cruzan con [ci, co)
function cg_reserved_count($room_id, $ci, $co) {
  $q = new WP_Query([
    'post_type' => 'reservation', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids',
    'meta_query' => [
      ['key' => 'cg_room_id', 'value' => (string) $room_id],
      ['key' => 'cg_status', 'value' => 'cancelada', 'compare' => '!='],
    ],
  ]);
  $n = 0;
  foreach ($q->posts as $rid) {
    $rin = get_post_meta($rid, 'cg_check_in', true);
    $rout = get_post_meta($rid, 'cg_check_out', true);
    if (!$rin || !$rout) continue;
    if (cg_ranges_overlap($ci, $co, $rin, $rout)) $n++;
  }
  return $n;
}
function cg_resolve_room($room_field) {
  if ($room_field === '' || $room_field === null) return null;
  if (is_numeric($room_field)) { $p = get_post((int) $room_field); if ($p && $p->post_type === 'room' && $p->post_status === 'publish') return $p; }
  $p = get_page_by_title($room_field, OBJECT, 'room');
  return ($p && $p->post_status === 'publish') ? $p : null;
}
function cg_availability($ci, $co) {
  $q = new WP_Query(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish',
    'orderby' => 'menu_order meta_value_num', 'meta_key' => 'cg_price', 'order' => 'ASC']);
  $out = [];
  foreach ($q->posts as $p) {
    $units = cg_room_units($p->ID);
    $res = cg_reserved_count($p->ID, $ci, $co);
    $out[] = ['id' => (string) $p->ID, 'name' => $p->post_title, 'units' => $units,
              'reserved' => $res, 'available' => max(0, $units - $res),
              'base_price' => (float) get_post_meta($p->ID, 'cg_price', true),
              'capacity' => (int) get_post_meta($p->ID, 'cg_capacity', true) ?: 2];
  }
  return $out;
}

/* ============ REST: rooms, menu, settings, availability, reservations ============ */
function cg_post_images($id) {
  $imgs = array_filter(array_map('trim', explode("\n", (string) get_post_meta($id, 'cg_images', true))));
  $thumb = get_the_post_thumbnail_url($id, 'large');
  if ($thumb) array_unshift($imgs, $thumb);
  return array_values(array_unique($imgs));
}

function cg_res_payment_methods() {
  return [
    'izipay' => 'Izipay',
    'yape' => 'Yape',
    'plin' => 'Plin',
    'transferencia' => 'Transferencia bancaria',
    'tarjeta' => 'Tarjeta',
    'efectivo' => 'Efectivo',
  ];
}
add_action('rest_api_init', function () {
  register_rest_route('casagrande/v1', '/rooms', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function () {
      $today = current_time('Y-m-d');
      $tomorrow = date('Y-m-d', strtotime($today . ' +1 day'));
      $q = new WP_Query(['post_type' => 'room', 'posts_per_page' => -1, 'orderby' => 'menu_order meta_value_num', 'meta_key' => 'cg_price', 'order' => 'ASC', 'post_status' => 'publish']);
      $out = [];
      foreach ($q->posts as $p) {
        $units = cg_room_units($p->ID);
        $out[] = [
          'id' => (string) $p->ID, 'name' => $p->post_title,
          'description' => wp_strip_all_tags($p->post_content),
          'base_price' => (float) get_post_meta($p->ID, 'cg_price', true),
          'capacity' => (int) get_post_meta($p->ID, 'cg_capacity', true) ?: 2,
          'amenities' => array_values(array_filter(array_map('trim', explode("\n", (string) get_post_meta($p->ID, 'cg_amenities', true))))),
          'images' => cg_post_images($p->ID),
          'units' => $units,
          'available' => max(0, $units - cg_reserved_count($p->ID, $today, $tomorrow)),
        ];
      }
      return $out;
    }]);
  register_rest_route('casagrande/v1', '/menu', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function () {
      $q = new WP_Query(['post_type' => 'dish', 'posts_per_page' => -1, 'orderby' => 'menu_order', 'order' => 'ASC', 'post_status' => 'publish']);
      $out = [];
      foreach ($q->posts as $p) $out[] = ['id' => (string) $p->ID, 'name' => $p->post_title,
        'description' => wp_strip_all_tags($p->post_content), 'price' => (float) get_post_meta($p->ID, 'cg_price', true),
        'category' => get_post_meta($p->ID, 'cg_category', true) ?: 'Principales',
        'image' => get_the_post_thumbnail_url($p->ID, 'large') ?: '',
        'is_featured' => get_post_meta($p->ID, 'cg_featured', true) === '1'];
      return $out;
    }]);
  register_rest_route('casagrande/v1', '/settings', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function () { return (object) get_option('cg_settings', []); }]);
  register_rest_route('casagrande/v1', '/availability', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $r) {
      $ci = sanitize_text_field($r->get_param('check_in') ?: current_time('Y-m-d'));
      $co = sanitize_text_field($r->get_param('check_out') ?: date('Y-m-d', strtotime($ci . ' +1 day')));
      if ($co <= $ci) $co = date('Y-m-d', strtotime($ci . ' +1 day'));
      $rooms = cg_availability($ci, $co);
      // Precio real de la estadia con tarifas por temporada (si el CRM esta activo)
      if (function_exists('cg_stay_total')) {
        $nights = max(1, (int) ((strtotime($co) - strtotime($ci)) / 86400));
        foreach ($rooms as &$rm) {
          $tot = cg_stay_total((int) $rm['id'], $ci, $co);
          $rm['stay_total'] = round($tot, 2);
          $rm['avg_night'] = round($tot / $nights, 2);
        }
        unset($rm);
      }
      return ['check_in' => $ci, 'check_out' => $co, 'rooms' => $rooms];
    }]);
  register_rest_route('casagrande/v1', '/reservations', ['methods' => 'POST', 'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $r) {
      $b = $r->get_json_params();
      $ci = sanitize_text_field($b['check_in'] ?? '');
      $co = sanitize_text_field($b['check_out'] ?? '');
      $room = cg_resolve_room((string) ($b['room_id'] ?? '')) ?: cg_resolve_room((string) ($b['room'] ?? ''));
      // Guard anti-overbooking: si hay habitacion y fechas validas, exigir disponibilidad
      if ($room && $ci && $co && $co > $ci) {
        if ((cg_room_units($room->ID) - cg_reserved_count($room->ID, $ci, $co)) <= 0) {
          return new WP_REST_Response(['error' => 'no_availability', 'room' => $room->post_title, 'available' => 0], 409);
        }
      }
      $code = 'RES-' . strtoupper(substr(md5(uniqid('', true)), 0, 8));
      $name = sanitize_text_field($b['name'] ?? 'Huesped Web');
      $id = wp_insert_post(['post_type' => 'reservation', 'post_status' => 'publish', 'post_title' => $code . ' - ' . $name]);
      if (is_wp_error($id) || !$id) return new WP_REST_Response(['error' => 'no_create'], 500);
      foreach (['email','phone','room','check_in','check_out','adults','children','total','notes'] as $k)
        if (isset($b[$k])) update_post_meta($id, 'cg_' . $k, sanitize_text_field((string) $b[$k]));
      if (isset($b['payment_method'])) update_post_meta($id, 'cg_payment_method', sanitize_text_field((string) $b['payment_method']));
      if (isset($b['payment_reference'])) update_post_meta($id, 'cg_payment_reference', sanitize_text_field((string) $b['payment_reference']));
      if ($room) {
        update_post_meta($id, 'cg_room_id', (string) $room->ID);
        update_post_meta($id, 'cg_room', $room->post_title);
        if ($ci && $co && $co > $ci && empty($b['total'])) {
          // Total por noche con tarifas de temporada (si el CRM esta activo)
          if (function_exists('cg_stay_total')) {
            update_post_meta($id, 'cg_total', (string) cg_stay_total($room->ID, $ci, $co));
          } else {
            $nights = max(1, (int) ((strtotime($co) - strtotime($ci)) / 86400));
            update_post_meta($id, 'cg_total', (string) ($nights * (float) get_post_meta($room->ID, 'cg_price', true)));
          }
        }
      }
      update_post_meta($id, 'cg_code', $code);
      update_post_meta($id, 'cg_status', 'pendiente');
      update_post_meta($id, 'cg_payment', 'por_pagar');
      // Reserva por NUMERO de habitacion: asignacion automatica de cuarto fisico libre
      do_action('cg_reservation_created', $id, $room ? $room->ID : 0, $ci, $co);
      $assigned = get_post_meta($id, 'cg_room_number', true);
      return ['reservation_code' => $code, 'id' => (string) $id, 'status' => 'pendiente', 'room_number' => $assigned];
    }]);
});

/* ============ Gestion de reservas en WP-admin ============ */
function cg_res_status_opts() { return ['pendiente' => 'Pendiente (por revisar)', 'confirmada' => 'Confirmada (ocupa habitacion)', 'cancelada' => 'Cancelada (libera)']; }
function cg_res_pay_opts() { return ['por_pagar' => 'Falta pagar', 'parcial' => 'Adelanto / parcial', 'pagado' => 'Pagado']; }

add_action('add_meta_boxes', function () {
  add_meta_box('cg_res_box', 'Gestion de la reserva', function ($post) {
    wp_nonce_field('cg_res_save', 'cg_res_nonce');
    $g = function ($k) use ($post) { return esc_attr(get_post_meta($post->ID, $k, true)); };
    $status = get_post_meta($post->ID, 'cg_status', true) ?: 'pendiente';
    $pay = get_post_meta($post->ID, 'cg_payment', true) ?: 'por_pagar';
    $pay_method = get_post_meta($post->ID, 'cg_payment_method', true) ?: 'izipay';
    $room_id = get_post_meta($post->ID, 'cg_room_id', true);
    $rooms = get_posts(['post_type' => 'room', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'title', 'order' => 'ASC']);
    echo '<style>.cgr p{margin:.6em 0}.cgr label{font-weight:600;display:block;margin-bottom:2px}.cgr input,.cgr select{width:100%}</style><div class="cgr">';
    echo '<p><label>Estado de la reserva</label><select name="cg_status">';
    foreach (cg_res_status_opts() as $k => $l) echo '<option value="' . $k . '"' . selected($status, $k, false) . '>' . esc_html($l) . '</option>';
    echo '</select></p>';
    echo '<p><label>Estado de pago</label><select name="cg_payment">';
    foreach (cg_res_pay_opts() as $k => $l) echo '<option value="' . $k . '"' . selected($pay, $k, false) . '>' . esc_html($l) . '</option>';
    echo '</select></p>';
    echo '<p><label>Metodo de pago</label><select name="cg_payment_method">';
    foreach (cg_res_payment_methods() as $k => $l) echo '<option value="' . esc_attr($k) . '"' . selected($pay_method, $k, false) . '>' . esc_html($l) . '</option>';
    echo '</select></p>';
    echo '<p><label>Habitacion</label><select name="cg_room_id"><option value="">— sin asignar —</option>';
    foreach ($rooms as $rm) echo '<option value="' . $rm->ID . '"' . selected($room_id, $rm->ID, false) . '>' . esc_html($rm->post_title) . '</option>';
    echo '</select></p>';
    echo '<p><label>Check-in</label><input type="date" name="cg_check_in" value="' . $g('cg_check_in') . '"></p>';
    echo '<p><label>Check-out</label><input type="date" name="cg_check_out" value="' . $g('cg_check_out') . '"></p>';
    echo '<p><label>Huespedes (adultos)</label><input type="number" name="cg_adults" value="' . $g('cg_adults') . '"></p>';
    echo '<p><label>Total (S/)</label><input type="number" step="0.01" name="cg_total" value="' . $g('cg_total') . '"></p>';
    echo '<p><label>Pagado (S/)</label><input type="number" step="0.01" name="cg_paid" value="' . $g('cg_paid') . '"></p>';
    echo '<p><label>Referencia / voucher</label><input type="text" name="cg_payment_reference" value="' . $g('cg_payment_reference') . '" placeholder="Operacion, voucher o enlace"></p>';
    echo '<p><label>Email</label><input type="text" name="cg_email" value="' . $g('cg_email') . '"></p>';
    echo '<p><label>Telefono</label><input type="text" name="cg_phone" value="' . $g('cg_phone') . '"></p>';
    echo '<p style="color:#666;margin-top:1em">Codigo: <strong>' . esc_html(get_post_meta($post->ID, 'cg_code', true)) . '</strong></p>';
    echo '</div>';
  }, 'reservation', 'normal', 'high');
});
add_action('save_post_reservation', function ($id) {
  if (!isset($_POST['cg_res_nonce']) || !wp_verify_nonce($_POST['cg_res_nonce'], 'cg_res_save')) return;
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  foreach (['cg_status','cg_payment','cg_payment_method','cg_payment_reference','cg_room_id','cg_check_in','cg_check_out','cg_adults','cg_total','cg_paid','cg_email','cg_phone'] as $k)
    if (isset($_POST[$k])) update_post_meta($id, $k, sanitize_text_field($_POST[$k]));
  if (!empty($_POST['cg_room_id'])) { $rm = get_post((int) $_POST['cg_room_id']); if ($rm) update_post_meta($id, 'cg_room', $rm->post_title); }
});

/* ---- Acciones rapidas en la lista (Marcar pagada / Confirmar / Cancelar) ---- */
add_filter('post_row_actions', function ($actions, $post) {
  if ($post->post_type !== 'reservation') return $actions;
  $base = admin_url('admin-post.php');
  $mk = function ($do, $label) use ($post, $base) {
    $u = wp_nonce_url($base . '?action=cg_res_action&do=' . $do . '&id=' . $post->ID, 'cg_res_' . $post->ID);
    return '<a href="' . esc_url($u) . '">' . esc_html($label) . '</a>';
  };
  $extra = [];
  if (get_post_meta($post->ID, 'cg_payment', true) !== 'pagado') $extra['cg_pay'] = $mk('pagar', 'Marcar pagada');
  if (get_post_meta($post->ID, 'cg_status', true) !== 'confirmada') $extra['cg_conf'] = $mk('confirmar', 'Confirmar');
  if (get_post_meta($post->ID, 'cg_status', true) !== 'cancelada') $extra['cg_canc'] = $mk('cancelar', 'Cancelar');
  return array_merge($actions, $extra);
}, 10, 2);
add_action('admin_post_cg_res_action', function () {
  if (!current_user_can('edit_posts')) wp_die('Sin permiso');
  $id = (int) ($_GET['id'] ?? 0); $do = sanitize_text_field($_GET['do'] ?? '');
  check_admin_referer('cg_res_' . $id);
  if ($do === 'pagar') { update_post_meta($id, 'cg_payment', 'pagado');
    if (!get_post_meta($id, 'cg_paid_date', true)) update_post_meta($id, 'cg_paid_date', current_time('Y-m-d')); }
  if ($do === 'confirmar') update_post_meta($id, 'cg_status', 'confirmada');
  if ($do === 'cancelar') update_post_meta($id, 'cg_status', 'cancelada');
  wp_safe_redirect(wp_get_referer() ?: admin_url('edit.php?post_type=reservation')); exit;
});

/* ---- Columnas de la lista de reservas ---- */
add_filter('manage_reservation_posts_columns', function ($c) {
  return ['cb' => $c['cb'], 'title' => 'Codigo / Nombre', 'cg_room' => 'N° Habitacion', 'cg_dates' => 'Fechas',
          'cg_total' => 'Total', 'cg_payment' => 'Pago', 'cg_status' => 'Estado', 'date' => 'Creada'];
});
add_action('manage_reservation_posts_custom_column', function ($col, $id) {
  if ($col === 'cg_room') echo function_exists('cg_room_badge_admin') ? cg_room_badge_admin($id) : esc_html(get_post_meta($id, 'cg_room_number', true) ?: '—');
  if ($col === 'cg_dates') echo esc_html(get_post_meta($id, 'cg_check_in', true) . ' → ' . get_post_meta($id, 'cg_check_out', true));
  if ($col === 'cg_total') { $t = get_post_meta($id, 'cg_total', true); echo $t !== '' ? 'S/ ' . esc_html(number_format((float) $t, 0)) : '—'; }
  if ($col === 'cg_payment') {
    $p = get_post_meta($id, 'cg_payment', true) ?: 'por_pagar';
    $map = ['por_pagar' => ['#b32d2e', 'Falta pagar'], 'parcial' => ['#bd8b00', 'Parcial'], 'pagado' => ['#1a7f37', 'Pagado']];
    $m = $map[$p] ?? ['#666', $p];
    echo '<span style="color:' . $m[0] . ';font-weight:600">' . esc_html($m[1]) . '</span>';
  }
  if ($col === 'cg_status') {
    $s = get_post_meta($id, 'cg_status', true) ?: 'pendiente';
    $map = ['pendiente' => ['#bd8b00', 'Pendiente'], 'confirmada' => ['#1a7f37', 'Confirmada'], 'cancelada' => ['#888', 'Cancelada']];
    $m = $map[$s] ?? ['#666', $s];
    echo '<span style="color:' . $m[0] . ';font-weight:600">' . esc_html($m[1]) . '</span>';
  }
}, 10, 2);

/* ---- Pagina de Disponibilidad / Ocupacion ---- */
add_action('admin_menu', function () {
  add_submenu_page('edit.php?post_type=reservation', 'Disponibilidad / Ocupacion', 'Disponibilidad', 'edit_posts', 'cg-availability', function () {
    if (!current_user_can('edit_posts')) return;
    $ci = sanitize_text_field($_GET['ci'] ?? current_time('Y-m-d'));
    $co = sanitize_text_field($_GET['co'] ?? date('Y-m-d', strtotime($ci . ' +1 day')));
    if ($co <= $ci) $co = date('Y-m-d', strtotime($ci . ' +1 day'));
    $rows = cg_availability($ci, $co);
    echo '<div class="wrap"><h1>Disponibilidad / Ocupacion</h1>';
    echo '<p>Consulta cuantas habitaciones de cada tipo estan libres en un rango de fechas (no cuenta reservas canceladas).</p>';
    echo '<form method="get" style="margin:1em 0"><input type="hidden" name="post_type" value="reservation"><input type="hidden" name="page" value="cg-availability">';
    echo '<label>Desde </label><input type="date" name="ci" value="' . esc_attr($ci) . '"> ';
    echo '<label> hasta </label><input type="date" name="co" value="' . esc_attr($co) . '"> ';
    submit_button('Ver disponibilidad', 'primary', '', false); echo '</form>';
    echo '<table class="widefat striped" style="max-width:760px"><thead><tr><th>Habitacion</th><th>Unidades</th><th>Reservadas</th><th>Libres</th><th>Estado</th></tr></thead><tbody>';
    foreach ($rows as $r) {
      $free = $r['available'];
      $color = $free > 0 ? '#1a7f37' : '#b32d2e';
      $txt = $free > 0 ? ($free . ' libre(s)') : 'COMPLETO';
      echo '<tr><td><strong>' . esc_html($r['name']) . '</strong></td><td>' . (int) $r['units'] . '</td><td>' . (int) $r['reserved'] . '</td><td>' . (int) $free . '</td><td style="color:' . $color . ';font-weight:700">' . esc_html($txt) . '</td></tr>';
    }
    echo '</tbody></table></div>';
  });
});


add_action('init', function () {
  global $wpdb;

  $room_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='room' AND post_status='publish'");
  if ($room_count === 0) {
    $rooms = [
      ['Suite con Jacuzzi', 520, 2, 1, "Jacuzzi\nDesayuno incluido\nWiFi premium\nVista panoramica", 'Suite premium para estancias romanticas y ejecutivas.'],
      ['Suite Ejecutiva', 390, 2, 3, "Sala de trabajo\nDesayuno incluido\nWiFi premium\nAire acondicionado", 'Habitacion amplia para negocios y estadias largas.'],
      ['Habitacion Doble Superior', 240, 2, 4, "Dos camas\nDesayuno incluido\nWiFi gratuito\nCaja fuerte", 'Opcion versatil para parejas o viajeros corporativos.'],
      ['Suite Familiar', 440, 4, 2, "2 ambientes\nDesayuno incluido\nWiFi premium\nCuna bajo pedido", 'Pensada para familias y grupos pequenos.'],
    ];
    foreach ($rooms as $i => $room) {
      [$title, $price, $capacity, $units, $amenities, $desc] = $room;
      $id = wp_insert_post([
        'post_type' => 'room',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_content' => $desc,
        'menu_order' => $i,
      ]);
      if ($id && !is_wp_error($id)) {
        update_post_meta($id, 'cg_price', (string) $price);
        update_post_meta($id, 'cg_capacity', (string) $capacity);
        update_post_meta($id, 'cg_units', (string) $units);
        update_post_meta($id, 'cg_amenities', $amenities);
        update_post_meta($id, 'cg_images', '');
      }
    }
  }

  $reservation_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='reservation' AND post_status='publish'");
  if ($reservation_count === 0) {
    $rooms = get_posts(['post_type' => 'room', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'menu_order', 'order' => 'ASC']);
    if (!empty($rooms)) {
      $today = current_time('Y-m-d');
      $samples = [
        ['RES-DEMO-01', 'Ana Torres', 'ana@example.com', '999111222', $rooms[0]->ID, $today, date('Y-m-d', strtotime($today . ' +2 day')), 2, 0, 'confirmada', 'pagado'],
        ['RES-DEMO-02', 'Carlos Rios', 'carlos@example.com', '999333444', $rooms[1]->ID, date('Y-m-d', strtotime($today . ' +3 day')), date('Y-m-d', strtotime($today . ' +5 day')), 1, 1, 'pendiente', 'por_pagar'],
        ['RES-DEMO-03', 'Marta Lopez', 'marta@example.com', '999555666', $rooms[2]->ID, date('Y-m-d', strtotime($today . ' -1 day')), $today, 2, 0, 'confirmada', 'pagado'],
      ];
      foreach ($samples as $i => $sample) {
        [$code, $name, $email, $phone, $room_id, $check_in, $check_out, $adults, $children, $status, $payment] = $sample;
        $room = get_post((int) $room_id);
        if (!$room || $room->post_type !== 'room') continue;
        $id = wp_insert_post([
          'post_type' => 'reservation',
          'post_status' => 'publish',
          'post_title' => $code . ' - ' . $name,
          'post_content' => '',
          'menu_order' => $i,
        ]);
        if ($id && !is_wp_error($id)) {
          update_post_meta($id, 'cg_code', $code);
          update_post_meta($id, 'cg_name', $name);
          update_post_meta($id, 'cg_email', $email);
          update_post_meta($id, 'cg_phone', $phone);
          update_post_meta($id, 'cg_room_id', (string) $room->ID);
          update_post_meta($id, 'cg_room', $room->post_title);
          update_post_meta($id, 'cg_check_in', $check_in);
          update_post_meta($id, 'cg_check_out', $check_out);
          update_post_meta($id, 'cg_adults', (string) $adults);
          update_post_meta($id, 'cg_children', (string) $children);
          update_post_meta($id, 'cg_status', $status);
          update_post_meta($id, 'cg_payment', $payment);
          $nights = max(1, (int) ((strtotime($check_out) - strtotime($check_in)) / 86400));
          $total = $nights * (float) get_post_meta($room->ID, 'cg_price', true);
          update_post_meta($id, 'cg_total', (string) $total);
          update_post_meta($id, 'cg_paid', $payment === 'pagado' ? (string) $total : '0');
        }
      }
    }
  }
}, 22);
