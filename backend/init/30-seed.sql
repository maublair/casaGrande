-- ============ SEED Hotel Casagrande ============
-- TIPOS DE HABITACION
insert into room_types (id, name, description, base_price, capacity, amenities, images) values
('11111111-1111-1111-1111-111111111101','Habitacion Simple','Ideal para quienes buscan una estancia comoda y funcional. Incluye desayuno buffet para empezar el dia con energia. Cama individual con ropa de cama de alta calidad, bano privado, escritorio y armario.',180,1,
  '{"Desayuno buffet incluido","Cama individual","Bano privado con ducha","TV pantalla plana con cable","Frigobar","WiFi gratis","Escritorio","Telefono","Limpieza diaria"}',
  '{"https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg","https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg"}'),
('11111111-1111-1111-1111-111111111102','Habitacion Doble (Twin o Matrimonial)','Perfecta para dos personas, ofrece un ambiente calido y relajante. Incluye desayuno buffet. Opciones de dos camas individuales (twin) o una cama matrimonial de 2 plazas, con bano privado y todas las comodidades.',260,2,
  '{"Desayuno buffet incluido","Twin o cama matrimonial","Bano privado","TV pantalla plana con cable","Frigobar","WiFi gratis","Escritorio","Telefono","Limpieza diaria"}',
  '{"https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg","https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg"}'),
('11111111-1111-1111-1111-111111111103','Habitacion Matrimonial Ejecutiva','Mas amplia, con una cama Queen y espacio extra para mayor comodidad. Incluye desayuno buffet. Ideal para parejas o viajeros de negocios que buscan mayor confort.',380,2,
  '{"Desayuno buffet incluido","Cama Queen","Espacio extra","Bano privado","TV pantalla plana con cable","Frigobar","WiFi gratis","Escritorio amplio","Telefono","Limpieza diaria"}',
  '{"https://deykard.com/uploads/imagenes/hotel-casagrande-9.jpg","https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg"}'),
('11111111-1111-1111-1111-111111111104','Suite','Nuestra opcion mas exclusiva, pensada para quienes buscan un nivel superior. Ideal para celebraciones especiales como lunas de miel, bodas o aniversarios. Cama Queen con ropa premium, bano privado con tina jacuzzi o cabina de hidromasajes, albornoces y articulos de aseo de alta gama. Incluye desayuno buffet.',520,2,
  '{"Desayuno buffet incluido","Cama Queen premium","Tina jacuzzi o hidromasaje","Albornoces","Bano privado de alta gama","TV pantalla plana con cable","Frigobar","WiFi gratis","Escritorio amplio","Limpieza diaria"}',
  '{"https://hotelcasagrande.pe/wp-content/uploads/2025/03/WhatsApp-Image-2023-08-03-at-11.32.26-AM.jpeg","https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg"}');

-- HABITACIONES (12, todas disponibles)
insert into rooms (room_number, room_type_id, floor, status) values
('101','11111111-1111-1111-1111-111111111101',1,'available'),
('102','11111111-1111-1111-1111-111111111101',1,'available'),
('103','11111111-1111-1111-1111-111111111101',1,'available'),
('201','11111111-1111-1111-1111-111111111102',2,'available'),
('202','11111111-1111-1111-1111-111111111102',2,'available'),
('203','11111111-1111-1111-1111-111111111102',2,'available'),
('301','11111111-1111-1111-1111-111111111103',3,'available'),
('302','11111111-1111-1111-1111-111111111103',3,'available'),
('303','11111111-1111-1111-1111-111111111103',3,'available'),
('401','11111111-1111-1111-1111-111111111104',4,'available'),
('402','11111111-1111-1111-1111-111111111104',4,'available'),
('403','11111111-1111-1111-1111-111111111104',4,'available');

-- MENU
insert into menu_categories (id, name, display_order, icon) values
('22222222-2222-2222-2222-222222222201','Entradas',1,'Salad'),
('22222222-2222-2222-2222-222222222202','Principales',2,'UtensilsCrossed'),
('22222222-2222-2222-2222-222222222203','Postres',3,'Cake'),
('22222222-2222-2222-2222-222222222204','Bebidas',4,'GlassWater');

insert into menu_items (category_id, name, description, price, is_featured, prep_time_minutes) values
('22222222-2222-2222-2222-222222222201','Causa Arequipena','Causa rellena de pollo con palta y aji amarillo.',24,true,15),
('22222222-2222-2222-2222-222222222201','Solterito de queso','Clasica ensalada arequipena con habas, queso y rocoto.',22,false,12),
('22222222-2222-2222-2222-222222222202','Rocoto Relleno','Emblema arequipeno: rocoto relleno con carne, pasas y queso, acompanado de pastel de papa.',38,true,25),
('22222222-2222-2222-2222-222222222202','Adobo Arequipeno','Cerdo macerado en chicha de jora y especias, servido con pan.',36,false,30),
('22222222-2222-2222-2222-222222222202','Lomo Saltado','Clasico peruano con lomo fino, papas fritas y arroz.',34,true,20),
('22222222-2222-2222-2222-222222222203','Queso Helado','Tradicional postre arequipeno cremoso con canela.',16,true,5),
('22222222-2222-2222-2222-222222222204','Chicha Morada','Bebida de maiz morado, pina y especias. Jarra.',18,false,5);

-- CONFIGURACION DEL HOTEL (contenido editable por el CMS)
insert into hotel_settings (key, value, description) values
('site_name','Hotel Boutique Casagrande','Nombre del hotel'),
('hero_title','Una Experiencia Inolvidable','Titulo principal del hero'),
('hero_subtitle','Hotel Boutique en el corazon de Vallecito, Arequipa','Subtitulo del hero'),
('about_title','Mas de Dos Decadas de Hospitalidad','Titulo seccion historia'),
('about_text','El Hotel Boutique Casagrande nacio del sueno de ofrecer una experiencia de alojamiento distinta: intima, elegante y profundamente arequipena. Desde 2003, nuestra casona historica de Vallecito ha sido el hogar de miles de viajeros.','Texto historia'),
('contact_phone','(054) 214000 | +51 942 330 137','Telefono'),
('contact_whatsapp','+51 942 330 137','WhatsApp'),
('contact_email','reservas@hotelcasagrande.pe','Email de reservas'),
('contact_address','Av. Luna Pizarro 202, Vallecito, Arequipa, Peru','Direccion'),
('checkin_time','2:00 PM','Hora de check-in'),
('checkout_time','12:00 PM','Hora de check-out'),
('rooms_count','33','Cantidad de habitaciones'),
('currency','PEN','Moneda (codigo ISO)');
