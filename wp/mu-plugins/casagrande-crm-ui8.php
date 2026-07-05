<?php
/**
 * Plugin Name: Casa Grande CRM (mensajeria y bot)
 * Description: Inbox unificado en cards (WhatsApp + chat web), ficha del lead con chat de respuesta manual, envio de archivos y links de pago, chatbot personalizable/entrenable desde wp-admin y tutoriales en modal por seccion.
 */
if (!defined('ABSPATH')) exit;

function cg8_can() { if (!current_user_can('manage_hotel')) wp_die('Sin permiso'); }

/* ================= INBOX unificado en CARDS ================= */
function cg8_render_inbox() {
  global $wpdb; $tc = cg_tbl('wa_conversations'); $tm = cg_tbl('wa_messages');
  $sel = (int) ($_GET['conv'] ?? 0);
  if ($sel) { cg8_render_ficha($sel); return; }
  $fil = sanitize_key($_GET['canal'] ?? '');
  $where = $fil === 'wa' ? "WHERE channel='wa'" : ($fil === 'web' ? "WHERE channel='web'" : '');
  $convs = $wpdb->get_results("SELECT * FROM $tc $where ORDER BY unread DESC, last_ts DESC LIMIT 60");
  $nwa = (int) $wpdb->get_var("SELECT COUNT(*) FROM $tc WHERE channel='wa'");
  $nweb = (int) $wpdb->get_var("SELECT COUNT(*) FROM $tc WHERE channel='web'");
  ?>
  <div style="display:flex;gap:8px;margin-bottom:14px;align-items:center">
    <a class="button <?php echo !$fil ? 'button-primary' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-whatsapp')); ?>">Todas (<?php echo $nwa + $nweb; ?>)</a>
    <a class="button <?php echo $fil === 'wa' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-whatsapp', 'canal' => 'wa'], admin_url('admin.php'))); ?>">📱 WhatsApp (<?php echo $nwa; ?>)</a>
    <a class="button <?php echo $fil === 'web' ? 'button-primary' : ''; ?>" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-whatsapp', 'canal' => 'web'], admin_url('admin.php'))); ?>">🌐 Chat web (<?php echo $nweb; ?>)</a>
    <span style="margin-left:auto;font-size:12px;color:#64748b">Haz clic en una card para abrir la ficha del lead y responder.</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">
    <?php foreach ($convs as $c) :
      $isWeb = ($c->channel ?? 'wa') === 'web';
      $open24 = !$isWeb && (time() - strtotime($c->last_ts)) < 86400;
      $ini = strtoupper(mb_substr($c->name ?: 'V', 0, 1));
      $mins = max(1, round((time() - strtotime($c->last_ts)) / 60));
      $ago = $mins < 60 ? $mins . ' min' : ($mins < 1440 ? round($mins / 60) . ' h' : round($mins / 1440) . ' d');
    ?>
    <a href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-whatsapp', 'conv' => $c->id], admin_url('admin.php'))); ?>"
       style="display:block;background:#fff;border:2px solid <?php echo $c->unread ? '#c9a84c' : '#e3e6ea'; ?>;border-radius:16px;padding:16px;text-decoration:none;transition:box-shadow .15s;box-shadow:0 1px 3px rgba(0,0,0,.05)"
       onmouseover="this.style.boxShadow='0 6px 18px rgba(12,43,61,.15)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,.05)'">
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
        <span style="width:42px;height:42px;border-radius:50%;background:<?php echo $isWeb ? 'linear-gradient(135deg,#154562,#3d87ba)' : 'linear-gradient(135deg,#1a7f37,#25d366)'; ?>;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;flex-shrink:0"><?php echo esc_html($ini); ?></span>
        <span style="min-width:0">
          <b style="color:#0c2b3d;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><?php echo esc_html($c->name ?: $c->phone); ?></b>
          <span style="font-size:11px;color:#64748b"><?php echo $isWeb ? '🌐 Chat web' : '📱 WhatsApp'; ?> · <?php echo esc_html($c->service); ?></span>
        </span>
        <?php if ($c->unread) : ?><span style="margin-left:auto;background:#c0392b;color:#fff;border-radius:12px;padding:2px 9px;font-size:11px;font-weight:800;flex-shrink:0"><?php echo (int) $c->unread; ?></span><?php endif; ?>
      </div>
      <div style="font-size:13px;color:#50575e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px">"<?php echo esc_html($c->last_body); ?>"</div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
        <span style="color:#94a3b8">hace <?php echo $ago; ?></span>
        <?php if (!$isWeb) : ?>
          <span style="padding:2px 8px;border-radius:10px;font-weight:700;<?php echo $open24 ? 'background:#dff5e5;color:#1a7f37' : 'background:#fdecea;color:#c0392b'; ?>"><?php echo $open24 ? '✓ ventana gratis abierta' : 'ventana cerrada'; ?></span>
        <?php else : ?>
          <span style="padding:2px 8px;border-radius:10px;background:#eaf2f8;color:#154562;font-weight:700">respuesta en vivo</span>
        <?php endif; ?>
      </div>
    </a>
    <?php endforeach; if (!$convs) echo '<p style="color:#64748b">Sin conversaciones aun. Llegan solas desde el chat de la web y el WhatsApp del hotel.</p>'; ?>
  </div>
  <?php
}

/* ================= FICHA del lead + chat ================= */
function cg8_render_ficha($conv_id) {
  global $wpdb; $tc = cg_tbl('wa_conversations'); $tm = cg_tbl('wa_messages');
  $c = $wpdb->get_row($wpdb->prepare("SELECT * FROM $tc WHERE id=%d", $conv_id));
  if (!$c) { echo 'Conversacion no encontrada'; return; }
  $wpdb->update($tc, ['unread' => 0], ['id' => $conv_id]);
  $msgs = $wpdb->get_results($wpdb->prepare("SELECT * FROM $tm WHERE conv_id=%d ORDER BY id ASC", $conv_id));
  $isWeb = ($c->channel ?? 'wa') === 'web';
  $open24 = !$isWeb && (time() - strtotime((string) $wpdb->get_var($wpdb->prepare("SELECT MAX(ts) FROM $tm WHERE conv_id=%d AND direction='in'", $conv_id)))) < 86400;
  // datos de huesped si matchea
  $guest = null;
  if (function_exists('cg_guests_index') && !$isWeb) {
    $gk = cg_guest_key($c->name, $c->phone, '');
    $all = cg_guests_index();
    $guest = $all[$gk] ?? null;
  }
  $s = cg_crm_settings();
  $paylinks = array_filter(['Yape' => $s['pay_yape_link'] ?? '', 'Plin' => $s['pay_plin_link'] ?? '', 'Izipay' => $s['pay_izipay_link'] ?? '']);
  ?>
  <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-whatsapp')); ?>">← Volver a las conversaciones</a></p>
  <div style="display:grid;grid-template-columns:300px 1fr;gap:16px">
    <!-- Ficha del lead -->
    <div class="cg-card" style="align-self:start">
      <div style="text-align:center;margin-bottom:12px">
        <span style="width:64px;height:64px;border-radius:50%;background:<?php echo $isWeb ? 'linear-gradient(135deg,#154562,#3d87ba)' : 'linear-gradient(135deg,#1a7f37,#25d366)'; ?>;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:26px"><?php echo esc_html(strtoupper(mb_substr($c->name ?: 'V', 0, 1))); ?></span>
        <h3 style="margin:8px 0 2px"><?php echo esc_html($c->name ?: $c->phone); ?></h3>
        <span style="font-size:12px;color:#64748b"><?php echo $isWeb ? '🌐 Chat de la web' : '📱 ' . esc_html($c->phone); ?></span>
      </div>
      <table class="widefat" style="font-size:12px">
        <tr><td><b>Interes</b></td><td><?php echo esc_html($c->service); ?></td></tr>
        <tr><td><b>Primer contacto</b></td><td><?php echo esc_html(date('d/m/Y', strtotime($c->created))); ?></td></tr>
        <tr><td><b>Bot automatico</b></td><td><?php echo $c->bot_enabled ? '🟢 Activo' : '🔴 Apagado'; ?>
          <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=cg8_bot&conv=' . $conv_id), 'cg8_bot_' . $conv_id)); ?>"><?php echo $c->bot_enabled ? 'Apagar' : 'Encender'; ?></a></td></tr>
        <?php if (!$isWeb) : ?>
        <tr><td><b>Ventana 24h</b></td><td><?php echo $open24 ? '<b style="color:#1a7f37">Abierta (respuesta gratis)</b>' : '<b style="color:#c0392b">Cerrada (requiere plantilla)</b>'; ?></td></tr>
        <?php endif; ?>
      </table>
      <?php if ($guest) : ?>
        <div style="background:#fdf8ec;border:1px solid #f0e3bb;border-radius:10px;padding:10px;margin-top:10px">
          <b style="color:#a87214">⭐ Huesped conocido</b>
          <div style="font-size:12px;color:#50575e;margin-top:4px"><?php echo (int) $guest['visits']; ?> visitas · <?php echo (int) $guest['nights']; ?> noches · S/ <?php echo number_format($guest['spent'], 0); ?> gastados</div>
          <a class="button button-small" style="margin-top:6px" href="<?php echo esc_url(add_query_arg(['page' => 'cg-crm-huespedes', 'g' => cg_guest_key($c->name, $c->phone, '')], admin_url('admin.php'))); ?>#perfil">Ver perfil completo</a>
        </div>
      <?php endif; ?>
      <div style="margin-top:10px">
        <b style="font-size:12px;color:#50575e">Acciones rapidas</b>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
          <a class="button button-small" href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-reservas')); ?>">➕ Crear reserva walk-in</a>
          <a class="button button-small" href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-tarifas')); ?>">💲 Ver tarifas</a>
        </div>
      </div>
    </div>

    <!-- Chat -->
    <div class="cg-card" style="display:flex;flex-direction:column;min-height:560px">
      <div style="flex:1;overflow-y:auto;max-height:430px;padding:6px;background:linear-gradient(180deg,#f8fafc,#eef2f7);border-radius:12px;display:flex;flex-direction:column;gap:8px" id="cg8-msgs">
        <?php foreach ($msgs as $m) : $in = $m->direction === 'in'; ?>
          <div style="max-width:72%;align-self:<?php echo $in ? 'flex-start' : 'flex-end'; ?>;background:<?php echo $in ? '#fff' : '#dcf8c6'; ?>;border:1px solid <?php echo $in ? '#e3e6ea' : '#c8ecb0'; ?>;border-radius:14px;padding:9px 13px">
            <div style="font-size:13px;color:#1f2937;white-space:pre-wrap;word-break:break-word"><?php echo wp_kses(make_clickable(esc_html($m->body)), ['a' => ['href' => true, 'target' => true, 'rel' => true]]); ?></div>
            <?php if (!empty($m->attachment)) : ?>
              <a href="<?php echo esc_url($m->attachment); ?>" target="_blank" style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;background:#0c2b3d;color:#8fd3ff;border-radius:8px;padding:4px 10px;font-size:12px;text-decoration:none">📎 <?php echo esc_html(basename(parse_url($m->attachment, PHP_URL_PATH))); ?></a>
            <?php endif; ?>
            <div style="font-size:10px;color:#94a3b8;margin-top:3px;text-align:right"><?php echo esc_html(date('d/m H:i', strtotime($m->ts))); ?><?php echo !$in ? ' · ' . esc_html($m->via) : ''; ?></div>
          </div>
        <?php endforeach; ?>
      </div>
      <script>var e=document.getElementById('cg8-msgs'); if(e) e.scrollTop=e.scrollHeight;</script>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:12px">
        <?php wp_nonce_field('cg8_send', '_n'); ?>
        <input type="hidden" name="action" value="cg8_send"><input type="hidden" name="conv" value="<?php echo (int) $conv_id; ?>">
        <input type="hidden" name="attachment_url" id="cg8-att" value="">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          <button type="button" class="button button-small cg8-file">📎 Adjuntar archivo</button>
          <span id="cg8-att-name" style="font-size:11px;color:#64748b;align-self:center"></span>
          <?php foreach ($paylinks as $pl => $url) : ?>
            <button type="button" class="button button-small" onclick="var t=this.closest('form').querySelector('textarea');t.value=(t.value?t.value+'\n':'')+'Puedes pagar aqui con <?php echo esc_js($pl); ?>: <?php echo esc_js($url); ?>'">💳 Link <?php echo esc_html($pl); ?></button>
          <?php endforeach; ?>
          <?php if (!$paylinks) : ?><span style="font-size:11px;color:#94a3b8;align-self:center">Configura tus links de pago en <a href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-canales')); ?>">Chatbot & Canales</a></span><?php endif; ?>
          <select onchange="if(this.value){var t=this.closest('form').querySelector('textarea');t.value=this.value;this.selectedIndex=0}" style="font-size:12px;margin-left:auto">
            <option value="">⚡ Respuesta rapida...</option>
            <?php foreach (function_exists('cg5_canned_replies') ? cg5_canned_replies() : [] as $cr) : ?>
              <option value="<?php echo esc_attr($cr[1]); ?>"><?php echo esc_html($cr[0]); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <textarea name="message" placeholder="Escribe tu respuesta manual..." style="flex:1;min-height:64px"></textarea>
          <button class="button button-primary button-large" style="align-self:flex-end">Enviar ➤</button>
        </div>
        <?php if ($isWeb) : ?><p style="font-size:11px;color:#64748b;margin:6px 0 0">El visitante ve tu respuesta al instante en el chat de la web.</p>
        <?php elseif (!$open24) : ?><p style="font-size:11px;color:#c0392b;margin:6px 0 0">⚠ Ventana de 24h cerrada: WhatsApp puede requerir plantilla pagada para entregar este mensaje.</p><?php endif; ?>
      </form>
    </div>
  </div>
  <script>
  jQuery(function($){
    $('.cg8-file').on('click', function(e){
      e.preventDefault();
      var f = wp.media({ title: 'Adjuntar archivo', button: { text: 'Adjuntar' }, multiple: false });
      f.on('select', function(){
        var a = f.state().get('selection').first().toJSON();
        $('#cg8-att').val(a.url); $('#cg8-att-name').text('📎 ' + (a.filename || a.title));
      });
      f.open();
    });
  });
  </script>
  <?php
}
add_action('admin_post_cg8_send', function () {
  check_admin_referer('cg8_send', '_n'); cg8_can(); global $wpdb;
  $conv = (int) $_POST['conv'];
  $text = sanitize_textarea_field($_POST['message'] ?? '');
  $att = esc_url_raw($_POST['attachment_url'] ?? '');
  if ($text === '' && !$att) cg8_back($conv);
  $c = $wpdb->get_row($wpdb->prepare("SELECT * FROM " . cg_tbl('wa_conversations') . " WHERE id=%d", $conv));
  $via = 'agente';
  if ($c && ($c->channel ?? 'wa') === 'wa') {
    $body = $text . ($att ? "\n📎 " . $att : '');
    $via = cg_ycloud_send($c->phone, $body) === 'ycloud' ? 'ycloud' : 'agente';
  }
  global $wpdb;
  $wpdb->insert(cg_tbl('wa_messages'), ['conv_id' => $conv, 'direction' => 'out', 'body' => $text ?: '📎 Archivo adjunto', 'via' => $via, 'attachment' => $att]);
  $wpdb->query($wpdb->prepare("UPDATE " . cg_tbl('wa_conversations') . " SET last_body=%s, last_ts=NOW() WHERE id=%d", mb_substr($text ?: 'Archivo', 0, 240), $conv));
  if (function_exists('cg_log')) cg_log('respuesta_manual', 'conv#' . $conv . ($att ? ' +archivo' : ''));
  cg8_back($conv);
});
function cg8_back($conv) { wp_safe_redirect(add_query_arg(['page' => 'cg-crm-whatsapp', 'conv' => $conv], admin_url('admin.php'))); exit; }
add_action('admin_post_cg8_bot', function () {
  $conv = (int) ($_GET['conv'] ?? 0);
  check_admin_referer('cg8_bot_' . $conv); cg8_can(); global $wpdb;
  $cur = (int) $wpdb->get_var($wpdb->prepare("SELECT bot_enabled FROM " . cg_tbl('wa_conversations') . " WHERE id=%d", $conv));
  $wpdb->update(cg_tbl('wa_conversations'), ['bot_enabled' => $cur ? 0 : 1], ['id' => $conv]);
  cg8_back($conv);
});

/* ================= CHATBOT & CANALES (personalizacion + entrenamiento) ================= */
function cg8_render_canales() {
  $b = cg_bot_settings(); $s = cg_crm_settings(); $faq = cg_bot_faq();
  $hook = rest_url('casagrande/v1/whatsapp/webhook') . '?token=' . rawurlencode($s['webhook_token'] ?? 'casagrande');
  ?>
  <div class="cg-grid two">
    <div class="cg-card">
      <h3>🤖 Personalizacion del chatbot</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg8_botcfg', '_n'); ?><input type="hidden" name="action" value="cg8_botcfg">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Nombre del bot<input name="bot_name" value="<?php echo esc_attr($b['bot_name']); ?>"></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Color del widget<input type="color" name="bot_color" value="<?php echo esc_attr($b['bot_color']); ?>" style="height:36px;width:80px"></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px;grid-column:1/-1">Mensaje de bienvenida<textarea name="bot_greeting" rows="2"><?php echo esc_textarea($b['bot_greeting']); ?></textarea></label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600"><input type="checkbox" name="bot_enabled_web" value="1" <?php checked($b['bot_enabled_web'], '1'); ?>> Bot activo en el chat de la web</label>
        <div style="grid-column:1/-1"><button class="button button-primary">Guardar personalizacion</button></div>
      </form>
      <div style="background:#eaf6ff;border:1px solid #9ec5e8;border-radius:10px;padding:10px 14px;margin-top:12px;font-size:12px;color:#0c2b3d">
        🛡 <b>Seguridad por diseño:</b> el bot funciona con reglas y datos reales de tu sistema — <b>no usa APIs de IA</b>, asi que no tiene costo mensual y es <b>inmune a prompt injection</b>. Ademas: mensajes sanitizados, limite de 500 caracteres y maximo 20 mensajes por visitante cada 5 minutos.
      </div>
    </div>
    <div class="cg-card">
      <h3>🧠 Entrenar al bot (conocimiento propio)</h3>
      <p style="font-size:12px;color:#64748b">Una linea por regla: <code>palabras clave separadas por coma | respuesta</code>. El bot ya sabe (de tus bases de datos reales): tarifas y temporadas, disponibilidad de hoy, carta del restaurante, horarios, direccion y telefonos.</p>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <?php wp_nonce_field('cg8_botfaq', '_n'); ?><input type="hidden" name="action" value="cg8_botfaq">
        <textarea name="faq" rows="9" style="width:100%;font-family:monospace;font-size:12px" placeholder="mascotas, perro, gato | Aceptamos mascotas pequenas con un cargo de S/30 por noche. 🐶"><?php
          foreach ($faq as $row) echo esc_textarea(($row['q'] ?? '') . ' | ' . ($row['a'] ?? '')) . "\n"; ?></textarea>
        <p><button class="button button-primary">Guardar conocimiento</button></p>
      </form>
    </div>
    <div class="cg-card">
      <h3>📱 WhatsApp / YCloud</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <?php wp_nonce_field('cg8_ycfg', '_n'); ?><input type="hidden" name="action" value="cg8_ycfg">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">YCloud API Key<input name="ycloud_api_key" value="<?php echo esc_attr($s['ycloud_api_key'] ?? ''); ?>" placeholder="(vacio = modo demo)"></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Numero remitente<input name="wa_from" value="<?php echo esc_attr($s['wa_from'] ?? ''); ?>" placeholder="+51 9..."></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Token del webhook<input name="webhook_token" value="<?php echo esc_attr($s['webhook_token'] ?? 'casagrande'); ?>"></label>
        <div style="align-self:end"><button class="button button-primary">Guardar</button></div>
      </form>
      <div style="margin-top:10px;background:#f6f7f9;border-radius:10px;padding:10px"><b style="font-size:12px">Webhook para YCloud:</b><code style="display:block;margin-top:6px;word-break:break-all;background:#0c2b3d;color:#8fd3ff;padding:8px;border-radius:6px;font-size:11px"><?php echo esc_html($hook); ?></code></div>
    </div>
    <div class="cg-card">
      <h3>💳 Links de pago (para enviar en el chat)</h3>
      <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:grid;gap:10px">
        <?php wp_nonce_field('cg8_paycfg', '_n'); ?><input type="hidden" name="action" value="cg8_paycfg">
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Link Yape<input name="pay_yape_link" value="<?php echo esc_attr($s['pay_yape_link'] ?? ''); ?>" placeholder="https://yape.me/..."></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Link Plin<input name="pay_plin_link" value="<?php echo esc_attr($s['pay_plin_link'] ?? ''); ?>" placeholder="https://..."></label>
        <label style="font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:3px">Link Izipay / pasarela<input name="pay_izipay_link" value="<?php echo esc_attr($s['pay_izipay_link'] ?? ''); ?>" placeholder="https://pago.izipay.pe/..."></label>
        <div><button class="button button-primary">Guardar links</button></div>
      </form>
      <p style="font-size:12px;color:#64748b;margin-top:8px">Apareceran como botones al responder cualquier conversacion: un clic inserta el link en el mensaje.</p>
    </div>
  </div>
  <?php
}
add_action('admin_post_cg8_botcfg', function () {
  check_admin_referer('cg8_botcfg', '_n'); cg8_can();
  $b = cg_bot_settings();
  $b['bot_name'] = sanitize_text_field($_POST['bot_name'] ?: 'Casa');
  $b['bot_color'] = sanitize_hex_color($_POST['bot_color']) ?: '#1a5270';
  $b['bot_greeting'] = sanitize_textarea_field($_POST['bot_greeting']);
  $b['bot_enabled_web'] = isset($_POST['bot_enabled_web']) ? '1' : '0';
  update_option('cg_bot_settings', $b);
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-canales', 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg8_botfaq', function () {
  check_admin_referer('cg8_botfaq', '_n'); cg8_can();
  $rows = [];
  foreach (explode("\n", (string) ($_POST['faq'] ?? '')) as $line) {
    if (strpos($line, '|') === false) continue;
    [$q, $a] = array_map('trim', explode('|', $line, 2));
    if ($q && $a) $rows[] = ['q' => sanitize_text_field($q), 'a' => sanitize_text_field($a)];
  }
  update_option('cg_bot_faq', $rows);
  if (function_exists('cg_log')) cg_log('bot_entrenado', count($rows) . ' reglas de conocimiento');
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-canales', 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg8_ycfg', function () {
  check_admin_referer('cg8_ycfg', '_n'); cg8_can();
  foreach (['ycloud_api_key', 'wa_from', 'webhook_token'] as $k) if (isset($_POST[$k])) cg_crm_set($k, sanitize_text_field($_POST[$k]));
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-canales', 'done' => 1], admin_url('admin.php'))); exit;
});
add_action('admin_post_cg8_paycfg', function () {
  check_admin_referer('cg8_paycfg', '_n'); cg8_can();
  foreach (['pay_yape_link', 'pay_plin_link', 'pay_izipay_link'] as $k) if (isset($_POST[$k])) cg_crm_set($k, esc_url_raw($_POST[$k]));
  wp_safe_redirect(add_query_arg(['page' => 'cg-crm-canales', 'done' => 1], admin_url('admin.php'))); exit;
});

/* ================= TUTORIAL EN MODAL por seccion ================= */
function cg8_help_content() {
  return [
    'dashboard' => ['El panel de control', "Aqui ves TODO de un vistazo: alertas que requieren accion (arriba), KPIs del mes, graficos, llegadas/salidas de hoy y la actividad reciente.\n\n1. Revisa las alertas rojas primero.\n2. Los KPIs se calculan solos desde reservas, almacen y planilla.\n3. Al final tienes el Cierre del dia y el backup."],
    'reservas' => ['Front Desk', "El corazon del hotel:\n\n1. ➕ Walk-in: crea reservas en 30 segundos.\n2. Tape chart: mapa de 14 dias por habitacion (azul=ocupada).\n3. Check-in: elige la habitacion (viene pre-asignada) y listo.\n4. 🧾 Cuenta: carga consumos, registra pagos, extiende la estadia.\n5. Check-out: liquida la cuenta y manda la habitacion a limpieza."],
    'cuartos' => ['Cuartos', "El mapa del hotel en vivo y el rack por pisos.\n\n1. Cada celda de color es una habitacion (verde=disponible, azul=ocupada, rojo=sucia).\n2. En el rack puedes cambiar el tipo y capacidad de cada cuarto.\n3. La disponibilidad de la web se recalcula sola."],
    'limpieza' => ['Limpieza', "1. Filtra por 'Sucias' para ver lo pendiente.\n2. Asignalas una por una o todas juntas a una persona.\n3. ▶ Iniciar → ✔ Marcar limpia.\n4. Imprime la hoja del dia desde el Dashboard."],
    'personal' => ['Personal', "Fichas: haz clic en una card para ver TODO del trabajador (contrato PDF, hijos, asistencia, boletas).\n\nPlanilla: genera las boletas del mes y marcalas pagadas (✗→✓). El desglose peruano es automatico: AFP/ONP se descuenta al trabajador, EsSalud lo paga el hotel aparte, y la asignacion familiar entra sola si registraste hijos menores de 18."],
    'turnos' => ['Turnos', "Asigna la semana completa de una vez: manana, tarde, noche o descanso para cada trabajador y cada dia. Guarda con un solo boton. Navega entre semanas con las flechas."],
    'almacen' => ['Almacen', "Control total del inmueble: alimentos (con vencimiento), materiales, herramientas, equipos y activos.\n\n1. Entrada = compra (suma stock y registra el gasto solo).\n2. Salida = uso con destino.\n3. Los consumos del restaurante cargados a habitaciones descuentan stock automaticamente.\n4. Rojo = vencido o stock bajo."],
    'finanzas' => ['Finanzas', "Los ingresos por alojamiento, consumos, compras y planilla entran SOLOS. Aqui registras lo demas (ventas directas, gastos) con fecha y metodo de pago. Exporta a Excel con un clic."],
    'whatsapp' => ['Mensajes', "Todas tus conversaciones (WhatsApp + chat de la web) en cards.\n\n1. Las cards con borde dorado tienen mensajes sin leer.\n2. Haz clic para abrir la ficha del lead: veras su historial y si ya es huesped.\n3. Responde manual, adjunta archivos 📎 o envia links de pago 💳 con un clic.\n4. El bot responde solo; puedes apagarlo por conversacion.\n5. En WhatsApp, la etiqueta verde indica que responder es GRATIS (ventana 24h)."],
    'huespedes' => ['Huespedes', "Tu cartera de clientes, creada sola desde las reservas. Los ⭐ VIP son los que mas gastan o mas vuelven. Abre un perfil para ver su historial completo y agregar notas (preferencias, alergias)."],
    'tarifas' => ['Tarifas', "Crea reglas de temporada (ej: 'Fiestas Patrias', del 25 al 31 de julio, S/350). Las reservas nuevas y la web publica cobran ese precio noche por noche automaticamente."],
    'mantenimiento' => ['Mantenimiento', "Reporta averias como ordenes de trabajo con prioridad. La habitacion queda bloqueada (mantenimiento) hasta resolver; al resolver pasa a limpieza y el costo va a gastos."],
    'reportes' => ['Reportes', "Metricas de hotel profesional: ocupacion, ADR (tarifa promedio) y RevPAR por mes — incluida la proyeccion futura por las reservas ya tomadas. Usalos para decidir tarifas."],
    'proveedores' => ['Proveedores', "Registra proveedores de insumos y servicios de terceros (lavanderia, mantenimiento externo). Al registrar un gasto en Finanzas puedes vincularlo al proveedor."],
    'canales' => ['Chatbot & Canales', "1. Personaliza el bot: nombre, color del widget y saludo.\n2. Entrenalo: agrega conocimiento propio (palabras clave | respuesta).\n3. El bot ya conoce tus tarifas, disponibilidad y carta REALES.\n4. Conecta YCloud pegando tus credenciales y el webhook.\n5. Configura tus links de pago para enviarlos en el chat."],
    'contenido' => ['Contenido', "El hero, la galeria, las noticias y las habitaciones de la web se editan desde WordPress con el selector visual de imagenes. La web publica se actualiza sola."],
  ];
}
add_action('cg_shell_help', function ($section) {
  $help = cg8_help_content();
  $h = $help[$section] ?? null;
  if (!$h) return;
  ?>
  <button type="button" onclick="document.getElementById('cg8-help').style.display='flex'" class="button" style="border-radius:20px;font-weight:700">❓ Como usar esta seccion</button>
  <div id="cg8-help" style="display:none;position:fixed;inset:0;background:rgba(8,30,42,.55);z-index:99999;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:18px;max-width:560px;width:92%;padding:26px 30px;box-shadow:0 24px 60px rgba(0,0,0,.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="margin:0;color:#0c2b3d">📖 <?php echo esc_html($h[0]); ?></h2>
        <button type="button" class="button" onclick="document.getElementById('cg8-help').style.display='none'">✕</button>
      </div>
      <div style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-line"><?php echo esc_html($h[1]); ?></div>
      <p style="margin-top:14px"><a href="<?php echo esc_url(admin_url('admin.php?page=cg-crm-guia')); ?>">Ver la guia completa →</a></p>
    </div>
  </div>
  <?php
});
