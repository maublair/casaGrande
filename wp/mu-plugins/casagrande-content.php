<?php
/**
 * Plugin Name: Casa Grande Content
 * Description: Contenido editable desde WordPress para el front React: Hero/Promos (slides), Galeria moderna y Blog (posts nativos). Seleccion de imagenes con el modal nativo de la mediateca (sin rutas manuales). Endpoints REST bajo casagrande/v1.
 */
if (!defined('ABSPATH')) exit;

/* ============ CPTs: Hero/Promos + Galeria (Blog usa 'post' nativo) ============ */
add_action('init', function () {
  register_post_type('cg_slide', [
    'labels' => [
      'name' => 'Hero / Promociones', 'singular_name' => 'Slide',
      'add_new' => 'Agregar slide', 'add_new_item' => 'Agregar slide del hero',
      'edit_item' => 'Editar slide', 'menu_name' => 'Hero / Promos',
    ],
    'public' => false, 'show_ui' => true, 'show_in_menu' => true,
    'menu_icon' => 'dashicons-images-alt2', 'menu_position' => 56,
    'supports' => ['title', 'thumbnail', 'page-attributes'], 'has_archive' => false,
    'capability_type' => 'post',
  ]);
  register_post_type('cg_gallery', [
    'labels' => ['name' => 'Galeria', 'singular_name' => 'Foto'],
    'public' => false, 'show_ui' => true, 'show_in_menu' => false, // menu propio moderno abajo
    'supports' => ['title', 'thumbnail', 'page-attributes'], 'has_archive' => false,
    'capability_type' => 'post',
  ]);
});

/* ============ Modal de mediateca en metaboxes (sin rutas manuales) ============ */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $need = in_array($hook, ['post.php', 'post-new.php'], true) && $screen && in_array($screen->post_type, ['cg_slide', 'room', 'post'], true);
  $need = $need || ($hook === 'toplevel_page_cg-galeria');
  if ($need) wp_enqueue_media();
});

// Boton reutilizable: abre wp.media y guarda el attachment elegido en un hidden
function cg_media_picker_js() {
  static $printed = false;
  if ($printed) return; $printed = true;
  ?>
  <script>
  jQuery(function($){
    // Selector simple (una imagen -> hidden id + preview)
    $(document).on('click', '.cg-pick-image', function(e){
      e.preventDefault();
      var btn = $(this), target = $(btn.data('target')), preview = $(btn.data('preview'));
      var frame = wp.media({ title: 'Elegir imagen', button: { text: 'Usar esta imagen' }, multiple: false, library: { type: 'image' } });
      frame.on('select', function(){
        var att = frame.state().get('selection').first().toJSON();
        target.val(att.id);
        var url = (att.sizes && att.sizes.medium ? att.sizes.medium.url : att.url);
        preview.html('<img src="'+url+'" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e3e6ea">');
        btn.text('Cambiar imagen');
      });
      frame.open();
    });
    // Selector multiple (varias imagenes -> agrega URLs a un textarea)
    $(document).on('click', '.cg-pick-images-multi', function(e){
      e.preventDefault();
      var ta = $($(this).data('target'));
      var frame = wp.media({ title: 'Elegir imagenes', button: { text: 'Agregar seleccionadas' }, multiple: 'add', library: { type: 'image' } });
      frame.on('select', function(){
        var urls = frame.state().get('selection').map(function(a){ return a.toJSON().url; });
        var cur = ta.val().trim();
        ta.val((cur ? cur + "\n" : '') + urls.join("\n"));
      });
      frame.open();
    });
  });
  </script>
  <?php
}
add_action('admin_footer', function () {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  if (!$screen) return;
  if (in_array($screen->post_type, ['cg_slide', 'room'], true) || $screen->id === 'toplevel_page_cg-galeria') cg_media_picker_js();
});

// En Habitaciones: boton "Agregar desde la mediateca" junto al textarea cg_images
add_action('admin_footer', function () {
  $screen = function_exists('get_current_screen') ? get_current_screen() : null;
  if (!$screen || $screen->post_type !== 'room') return;
  ?>
  <script>
  jQuery(function($){
    var ta = $('textarea[name="cg_images"]');
    if (!ta.length) return;
    ta.attr('id', 'cg-room-images');
    $('<p><button type="button" class="button cg-pick-images-multi" data-target="#cg-room-images">🖼️ Agregar imagenes desde la mediateca</button> <span style="color:#666;font-size:12px">Se agregan al final de la lista (una URL por linea).</span></p>').insertAfter(ta);
  });
  </script>
  <?php
});

/* ============ Metabox: Slide del hero (imagen por modal) ============ */
add_action('add_meta_boxes', function () {
  add_meta_box('cg_slide_box', 'Contenido del slide', function ($post) {
    wp_nonce_field('cg_slide_save', 'cg_slide_nonce');
    $g = function ($k, $d = '') use ($post) { $v = get_post_meta($post->ID, $k, true); return esc_attr($v !== '' ? $v : $d); };
    $active = get_post_meta($post->ID, 'cg_active', true);
    if ($active === '') $active = '1';
    $thumb_id = get_post_thumbnail_id($post->ID);
    $thumb = $thumb_id ? wp_get_attachment_image_url($thumb_id, 'medium') : '';
    echo '<style>.cgs p{margin:.7em 0}.cgs label{font-weight:600;display:block;margin-bottom:3px}.cgs input[type=text]{width:100%}.cgs .cg-img-preview{margin:6px 0;max-width:340px}</style><div class="cgs">';
    echo '<p><label>Imagen de fondo</label>';
    echo '<span class="cg-img-preview" id="cg-slide-preview">' . ($thumb ? '<img src="' . esc_url($thumb) . '" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e3e6ea">' : '<em style="color:#888">Sin imagen elegida</em>') . '</span>';
    echo '<input type="hidden" name="cg_media_id" id="cg-slide-media" value="">';
    echo '<button type="button" class="button cg-pick-image" data-target="#cg-slide-media" data-preview="#cg-slide-preview">' . ($thumb ? 'Cambiar imagen' : '🖼️ Elegir imagen de la mediateca') . '</button></p>';
    echo '<p><label>Antetitulo (eyebrow)</label><input type="text" name="cg_eyebrow" value="' . $g('cg_eyebrow', 'Hotel Boutique Casagrande') . '"></p>';
    echo '<p><label>Titulo</label><input type="text" name="cg_title" value="' . $g('cg_title') . '" placeholder="Ej: Una Experiencia"></p>';
    echo '<p><label>Palabra destacada (dorada, italica)</label><input type="text" name="cg_accent" value="' . $g('cg_accent') . '" placeholder="Ej: Inolvidable"></p>';
    echo '<p><label>Subtitulo</label><input type="text" name="cg_subtitle" value="' . $g('cg_subtitle') . '"></p>';
    echo '<p><label>Boton — texto (opcional, para promociones)</label><input type="text" name="cg_cta_label" value="' . $g('cg_cta_label') . '" placeholder="Ej: Ver promocion"></p>';
    echo '<p><label>Boton — enlace (opcional)</label><input type="text" name="cg_cta_link" value="' . $g('cg_cta_link') . '" placeholder="Ej: /habitaciones"></p>';
    echo '<p><label><input type="checkbox" name="cg_active" value="1"' . checked($active, '1', false) . ' style="width:auto"> Mostrar este slide en la web</label></p>';
    echo '<p style="color:#666">El orden de los slides se cambia en <strong>Atributos &gt; Orden</strong>. Para una promocion: crea un slide con la imagen, el texto y el boton, y desactivalo cuando termine.</p>';
    echo '</div>';
  }, 'cg_slide', 'normal', 'high');
});
add_action('save_post_cg_slide', function ($id) {
  if (!isset($_POST['cg_slide_nonce']) || !wp_verify_nonce($_POST['cg_slide_nonce'], 'cg_slide_save')) return;
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  foreach (['cg_eyebrow','cg_title','cg_accent','cg_subtitle','cg_cta_label','cg_cta_link'] as $k)
    if (isset($_POST[$k])) update_post_meta($id, $k, sanitize_text_field($_POST[$k]));
  update_post_meta($id, 'cg_active', isset($_POST['cg_active']) ? '1' : '0');
  if (!empty($_POST['cg_media_id'])) set_post_thumbnail($id, (int) $_POST['cg_media_id']);
});

/* ============ Galeria: pagina de administracion moderna ============ */
function cg_gallery_cats() { return ['Habitaciones', 'Restaurante', 'Exteriores', 'Servicios', 'Eventos']; }

add_action('admin_menu', function () {
  add_menu_page('Galeria', 'Galeria', 'manage_hotel', 'cg-galeria', 'cg_galeria_page', 'dashicons-format-gallery', 57);
});

function cg_galeria_page() {
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $filter = sanitize_text_field($_GET['cat'] ?? 'Todos');
  $args = ['post_type' => 'cg_gallery', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'menu_order', 'order' => 'ASC'];
  $items = get_posts($args);
  $counts = ['Todos' => count($items)];
  foreach (cg_gallery_cats() as $c) $counts[$c] = 0;
  foreach ($items as $p) { $c = get_post_meta($p->ID, 'cg_category', true) ?: 'Habitaciones'; $counts[$c] = ($counts[$c] ?? 0) + 1; }
  ?>
  <div class="wrap cg-gal">
    <h1 style="display:flex;align-items:center;gap:10px"><span class="dashicons dashicons-format-gallery"></span> Galeria de fotos</h1>
    <style>
      .cg-gal .cg-cats{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}
      .cg-gal .cg-cats a{padding:7px 14px;border-radius:20px;text-decoration:none;background:#fff;border:1px solid #dcdcde;color:#50575e;font-weight:600;font-size:13px}
      .cg-gal .cg-cats a.on{background:#0c2b3d;border-color:#0c2b3d;color:#fff}
      .cg-gal .cg-add{background:#fff;border:1px solid #e3e6ea;border-radius:14px;padding:16px 18px;margin-bottom:18px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
      .cg-gal .cg-add label{display:flex;flex-direction:column;font-size:12px;font-weight:600;color:#50575e;gap:4px}
      .cg-gal .cg-add input[type=text],.cg-gal .cg-add select{min-width:180px}
      .cg-gal .cg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
      .cg-gal .cg-item{background:#fff;border:1px solid #e3e6ea;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)}
      .cg-gal .cg-item img{width:100%;height:140px;object-fit:cover;display:block}
      .cg-gal .cg-item .cg-body{padding:10px 12px}
      .cg-gal .cg-item .cg-title{font-weight:600;color:#0c2b3d;font-size:13px;margin-bottom:8px;line-height:1.3}
      .cg-gal .cg-item form{display:flex;gap:6px;align-items:center}
      .cg-gal .cg-item select{font-size:12px;flex:1}
      .cg-gal .cg-item .cg-del{color:#c0392b;text-decoration:none;font-size:12px;font-weight:600}
      .cg-gal .cg-note{background:#eaf6ff;border:1px solid #9ec5e8;border-radius:10px;padding:10px 14px;margin:12px 0;font-size:13px;color:#0c2b3d}
      .cg-gal #cg-new-preview img{max-height:64px;border-radius:8px;border:1px solid #e3e6ea}
    </style>

    <?php if (isset($_GET['done'])) echo '<div class="cg-note">Cambios guardados ✔</div>'; ?>

    <div class="cg-add">
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <?php wp_nonce_field('cg_gal_add', '_n'); ?>
        <input type="hidden" name="action" value="cg_gal_add">
        <input type="hidden" name="media_id" id="cg-new-media" value="">
        <label>Foto <span id="cg-new-preview"><button type="button" class="button cg-pick-image" data-target="#cg-new-media" data-preview="#cg-new-preview">🖼️ Elegir o subir foto</button></span></label>
        <label>Titulo (descripcion corta)<input type="text" name="title" placeholder="Ej: Suite con vista al jardin" required></label>
        <label>Categoria<select name="cat"><?php foreach (cg_gallery_cats() as $c) echo '<option>' . esc_html($c) . '</option>'; ?></select></label>
        <button class="button button-primary button-large">Agregar a la galeria</button>
      </form>
    </div>
    <p class="description" style="margin-top:-8px">Al elegir foto puedes <b>subir una nueva</b> o escoger una existente. El texto alternativo (SEO) se edita en la mediateca; si la foto no tiene, se usa el titulo.</p>

    <div class="cg-cats">
      <?php foreach ($counts as $c => $n): ?>
        <a class="<?php echo $filter === $c ? 'on' : ''; ?>" href="<?php echo esc_url(add_query_arg(['page' => 'cg-galeria', 'cat' => $c], admin_url('admin.php'))); ?>"><?php echo esc_html($c); ?> (<?php echo (int) $n; ?>)</a>
      <?php endforeach; ?>
    </div>

    <div class="cg-grid">
      <?php foreach ($items as $p):
        $cat = get_post_meta($p->ID, 'cg_category', true) ?: 'Habitaciones';
        if ($filter !== 'Todos' && $cat !== $filter) continue;
        $img = get_the_post_thumbnail_url($p->ID, 'medium') ?: get_post_meta($p->ID, 'cg_src_url', true);
        $del = wp_nonce_url(admin_url('admin-post.php?action=cg_gal_del&id=' . $p->ID . '&cat=' . rawurlencode($filter)), 'cg_gal_del_' . $p->ID);
      ?>
      <div class="cg-item">
        <?php if ($img): ?><img src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr($p->post_title); ?>"><?php endif; ?>
        <div class="cg-body">
          <div class="cg-title"><?php echo esc_html($p->post_title); ?></div>
          <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('cg_gal_cat', '_n'); ?>
            <input type="hidden" name="action" value="cg_gal_cat">
            <input type="hidden" name="id" value="<?php echo (int) $p->ID; ?>">
            <input type="hidden" name="back_cat" value="<?php echo esc_attr($filter); ?>">
            <select name="cat" onchange="this.form.submit()">
              <?php foreach (cg_gallery_cats() as $c) echo '<option' . selected($cat, $c, false) . '>' . esc_html($c) . '</option>'; ?>
            </select>
            <a class="cg-del" href="<?php echo esc_url($del); ?>" onclick="return confirm('¿Quitar esta foto de la galeria? (la imagen sigue en la mediateca)')">Quitar</a>
          </form>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  <?php
}

add_action('admin_post_cg_gal_add', function () {
  check_admin_referer('cg_gal_add', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  $mid = (int) ($_POST['media_id'] ?? 0);
  $title = sanitize_text_field($_POST['title'] ?? '');
  $cat = sanitize_text_field($_POST['cat'] ?? 'Habitaciones');
  if ($mid && $title) {
    $id = wp_insert_post(['post_type' => 'cg_gallery', 'post_status' => 'publish', 'post_title' => $title, 'menu_order' => 99]);
    if ($id && !is_wp_error($id)) {
      set_post_thumbnail($id, $mid);
      update_post_meta($id, 'cg_category', $cat);
      // SEO: si la imagen no tiene ALT, usar el titulo
      if (!get_post_meta($mid, '_wp_attachment_image_alt', true))
        update_post_meta($mid, '_wp_attachment_image_alt', $title . ' - Hotel Boutique Casa Grande, Arequipa');
    }
  }
  wp_safe_redirect(add_query_arg(['page' => 'cg-galeria', 'cat' => rawurlencode($cat), 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg_gal_cat', function () {
  check_admin_referer('cg_gal_cat', '_n');
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  update_post_meta((int) $_POST['id'], 'cg_category', sanitize_text_field($_POST['cat']));
  wp_safe_redirect(add_query_arg(['page' => 'cg-galeria', 'cat' => rawurlencode($_POST['back_cat'] ?? 'Todos'), 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg_gal_del', function () {
  $id = (int) ($_GET['id'] ?? 0);
  check_admin_referer('cg_gal_del_' . $id);
  if (!current_user_can('manage_hotel')) wp_die('Sin permiso');
  if ($id && get_post_type($id) === 'cg_gallery') wp_trash_post($id);
  wp_safe_redirect(add_query_arg(['page' => 'cg-galeria', 'cat' => rawurlencode($_GET['cat'] ?? 'Todos'), 'done' => 1], admin_url('admin.php'))); exit;
});

/* ============ REST: slides, gallery, posts, post ============ */
add_action('rest_api_init', function () {
  register_rest_route('casagrande/v1', '/slides', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function () {
      $q = new WP_Query(['post_type' => 'cg_slide', 'posts_per_page' => -1, 'post_status' => 'publish',
        'orderby' => 'menu_order', 'order' => 'ASC']);
      $out = [];
      foreach ($q->posts as $p) {
        if (get_post_meta($p->ID, 'cg_active', true) === '0') continue;
        $img = get_the_post_thumbnail_url($p->ID, 'full') ?: get_post_meta($p->ID, 'cg_bg_url', true);
        if (!$img) continue;
        $out[] = [
          'id' => (string) $p->ID,
          'eyebrow' => get_post_meta($p->ID, 'cg_eyebrow', true) ?: 'Hotel Boutique Casagrande',
          'title' => get_post_meta($p->ID, 'cg_title', true) ?: $p->post_title,
          'accent' => get_post_meta($p->ID, 'cg_accent', true),
          'subtitle' => get_post_meta($p->ID, 'cg_subtitle', true),
          'cta_label' => get_post_meta($p->ID, 'cg_cta_label', true),
          'cta_link' => get_post_meta($p->ID, 'cg_cta_link', true),
          'image' => $img,
        ];
      }
      return $out;
    }]);

  register_rest_route('casagrande/v1', '/gallery', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function () {
      $q = new WP_Query(['post_type' => 'cg_gallery', 'posts_per_page' => -1, 'post_status' => 'publish',
        'orderby' => 'menu_order', 'order' => 'ASC']);
      $out = [];
      foreach ($q->posts as $p) {
        $tid = get_post_thumbnail_id($p->ID);
        $img = $tid ? wp_get_attachment_image_url($tid, 'large') : get_post_meta($p->ID, 'cg_src_url', true);
        if (!$img) continue;
        $alt = $tid ? get_post_meta($tid, '_wp_attachment_image_alt', true) : '';
        $out[] = ['id' => (string) $p->ID, 'title' => $p->post_title,
          'category' => get_post_meta($p->ID, 'cg_category', true) ?: 'Habitaciones',
          'src' => $img, 'alt' => $alt ?: ($p->post_title . ' - Hotel Boutique Casa Grande, Arequipa')];
      }
      return $out;
    }]);

  register_rest_route('casagrande/v1', '/posts', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $r) {
      $limit = min(50, max(1, (int) ($r->get_param('limit') ?: 20)));
      $q = new WP_Query(['post_type' => 'post', 'posts_per_page' => $limit, 'post_status' => 'publish',
        'orderby' => 'date', 'order' => 'DESC']);
      $out = [];
      foreach ($q->posts as $p) {
        $cats = get_the_category($p->ID);
        $words = str_word_count(wp_strip_all_tags($p->post_content));
        $out[] = [
          'id' => (string) $p->ID, 'slug' => $p->post_name, 'title' => get_the_title($p->ID),
          'excerpt' => wp_strip_all_tags(get_the_excerpt($p->ID)),
          'date' => get_the_date('c', $p->ID),
          'date_h' => get_the_date('j \d\e F, Y', $p->ID),
          'category' => !empty($cats) ? $cats[0]->name : 'Novedades',
          'author' => get_the_author_meta('display_name', $p->post_author) ?: 'Casa Grande',
          'image' => get_the_post_thumbnail_url($p->ID, 'large') ?: '',
          'reading' => max(1, (int) ceil($words / 200)),
        ];
      }
      return $out;
    }]);

  register_rest_route('casagrande/v1', '/post', ['methods' => 'GET', 'permission_callback' => '__return_true',
    'callback' => function (WP_REST_Request $r) {
      $slug = sanitize_title($r->get_param('slug') ?: '');
      if (!$slug) return new WP_REST_Response(['error' => 'no_slug'], 400);
      $q = new WP_Query(['post_type' => 'post', 'name' => $slug, 'posts_per_page' => 1, 'post_status' => 'publish']);
      if (empty($q->posts)) return new WP_REST_Response(['error' => 'not_found'], 404);
      $p = $q->posts[0];
      $cats = get_the_category($p->ID);
      $words = str_word_count(wp_strip_all_tags($p->post_content));
      return [
        'id' => (string) $p->ID, 'slug' => $p->post_name, 'title' => get_the_title($p->ID),
        'date' => get_the_date('c', $p->ID), 'date_h' => get_the_date('j \d\e F, Y', $p->ID),
        'category' => !empty($cats) ? $cats[0]->name : 'Novedades',
        'author' => get_the_author_meta('display_name', $p->post_author) ?: 'Casa Grande',
        'image' => get_the_post_thumbnail_url($p->ID, 'full') ?: '',
        'reading' => max(1, (int) ceil($words / 200)),
        'content' => apply_filters('the_content', $p->post_content),
      ];
    }]);
});

/* ============ Seed idempotente (v3, ya ejecutado en esta instalacion) ============ */
add_action('init', function () {
  if (get_option('cg_content_seeded') === '3') return;
  // El seed original creo slides, galeria y posts demo; en instalaciones nuevas se re-crea.
  $slide_bgs = ['/hotel/real-63.webp', '/hotel/real-10.webp', '/hotel/real-54.webp'];
  $slide_txt = [
    ['Una Experiencia', 'Inolvidable', 'Hotel Boutique en el corazon de Vallecito, Arequipa'],
    ['Suites de', 'Lujo', 'Disena cada detalle de tu estancia con nosotros'],
    ['Gastronomia', 'Arequipena', 'Sabores autenticos en nuestro restaurante boutique'],
  ];
  if (!get_posts(['post_type' => 'cg_slide', 'posts_per_page' => 1, 'post_status' => 'any', 'fields' => 'ids'])) {
    foreach ($slide_txt as $i => $s) {
      $id = wp_insert_post(['post_type' => 'cg_slide', 'post_status' => 'publish', 'post_title' => $s[0] . ' ' . $s[1], 'menu_order' => $i]);
      if ($id && !is_wp_error($id)) {
        update_post_meta($id, 'cg_eyebrow', 'Hotel Boutique Casagrande');
        update_post_meta($id, 'cg_title', $s[0]);
        update_post_meta($id, 'cg_accent', $s[1]);
        update_post_meta($id, 'cg_subtitle', $s[2]);
        update_post_meta($id, 'cg_bg_url', $slide_bgs[$i]);
        update_post_meta($id, 'cg_active', '1');
      }
    }
  }
  update_option('cg_content_seeded', '3');
}, 20);
