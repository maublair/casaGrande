<?php
// Limpia habitaciones previas
foreach (get_posts(['post_type'=>'room','numberposts'=>-1,'post_status'=>'any','fields'=>'ids']) as $id) wp_delete_post($id, true);
$rooms = [
 ['Habitacion Simple','Ideal para quienes buscan una estancia comoda y funcional. Incluye desayuno buffet para empezar el dia con energia. Cama individual con ropa de cama de alta calidad, bano privado, escritorio y armario.',180,1,
  ['Desayuno buffet incluido','Cama individual','Bano privado con ducha','TV pantalla plana con cable','Frigobar','WiFi gratis','Escritorio','Telefono','Limpieza diaria'],
  ['https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg','https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg'],1],
 ['Habitacion Doble (Twin o Matrimonial)','Perfecta para dos personas, ofrece un ambiente calido y relajante. Incluye desayuno buffet. Opciones de dos camas individuales (twin) o una cama matrimonial de 2 plazas.',260,2,
  ['Desayuno buffet incluido','Twin o cama matrimonial','Bano privado','TV pantalla plana con cable','Frigobar','WiFi gratis','Escritorio','Telefono','Limpieza diaria'],
  ['https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg','https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg'],2],
 ['Habitacion Matrimonial Ejecutiva','Mas amplia, con una cama Queen y espacio extra para mayor comodidad. Incluye desayuno buffet. Ideal para parejas o viajeros de negocios.',380,2,
  ['Desayuno buffet incluido','Cama Queen','Espacio extra','Bano privado','TV pantalla plana con cable','Frigobar','WiFi gratis','Escritorio amplio','Telefono','Limpieza diaria'],
  ['https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg','https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg'],3],
 ['Suite','Nuestra opcion mas exclusiva, pensada para celebraciones especiales como lunas de miel, bodas o aniversarios. Cama Queen con ropa premium, bano privado con tina jacuzzi o cabina de hidromasajes, albornoces y articulos de aseo de alta gama. Incluye desayuno buffet.',520,2,
  ['Desayuno buffet incluido','Cama Queen premium','Tina jacuzzi o hidromasaje','Albornoces','Bano privado de alta gama','TV pantalla plana con cable','Frigobar','WiFi gratis','Escritorio amplio','Limpieza diaria'],
  ['https://hotelcasagrande.pe/wp-content/uploads/2025/03/WhatsApp-Image-2023-08-03-at-11.32.26-AM.jpeg','https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg'],4],
];
foreach ($rooms as $r) {
  $id = wp_insert_post(['post_type'=>'room','post_status'=>'publish','post_title'=>$r[0],'post_content'=>$r[1],'menu_order'=>$r[6]]);
  update_post_meta($id,'cg_price',$r[2]);
  update_post_meta($id,'cg_capacity',$r[3]);
  update_post_meta($id,'cg_amenities',implode("\n",$r[4]));
  update_post_meta($id,'cg_images',implode("\n",$r[5]));
}
update_option('cg_settings', [
 'site_name'=>'Hotel Boutique Casagrande','hero_title'=>'Una Experiencia Inolvidable',
 'hero_subtitle'=>'Hotel Boutique en el corazon de Vallecito, Arequipa',
 'about_title'=>'Mas de Dos Decadas de Hospitalidad',
 'about_text'=>'El Hotel Boutique Casagrande nacio del sueno de ofrecer una experiencia de alojamiento distinta: intima, elegante y profundamente arequipena. Desde 2003.',
 'contact_phone'=>'(054) 214000 | +51 942 330 137','contact_whatsapp'=>'+51 942 330 137',
 'contact_email'=>'reservas@hotelcasagrande.pe','contact_address'=>'Av. Luna Pizarro 202, Vallecito, Arequipa, Peru',
 'checkin_time'=>'2:00 PM','checkout_time'=>'12:00 PM',
]);
update_option('cg_front_origin','https://casagrande.bcode.work');
echo "OK rooms=".count($rooms)."\n";
