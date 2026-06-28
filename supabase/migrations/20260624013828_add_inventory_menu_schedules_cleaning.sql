-- =============================================
-- MENU ITEMS (Restaurant)
-- =============================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_menu_cat" ON menu_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_menu_cat" ON menu_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_menu_cat" ON menu_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_menu_cat" ON menu_categories FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  allergens text[] DEFAULT '{}',
  prep_time_minutes int DEFAULT 15,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_menu_items" ON menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_menu_items" ON menu_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_menu_items" ON menu_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_menu_items" ON menu_items FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- INVENTORY / WAREHOUSE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_inv_cat" ON inventory_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_inv_cat" ON inventory_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_inv_cat" ON inventory_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_inv_cat" ON inventory_categories FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'unidad',
  current_stock numeric(10,2) NOT NULL DEFAULT 0,
  min_stock numeric(10,2) NOT NULL DEFAULT 0,
  max_stock numeric(10,2),
  unit_cost numeric(10,2),
  supplier text,
  location text,
  sku text,
  is_active boolean NOT NULL DEFAULT true,
  last_restocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_inv_items" ON inventory_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_inv_items" ON inventory_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_inv_items" ON inventory_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_inv_items" ON inventory_items FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
  quantity numeric(10,2) NOT NULL,
  notes text,
  performed_by text,
  reference text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_inv_mov" ON inventory_movements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_inv_mov" ON inventory_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_inv_mov" ON inventory_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_inv_mov" ON inventory_movements FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- STAFF SCHEDULES
-- =============================================
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  shift text NOT NULL CHECK (shift IN ('manana', 'tarde', 'noche', 'completo')),
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'programado' CHECK (status IN ('programado', 'completado', 'ausente', 'licencia')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (staff_id, work_date)
);

ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_schedules" ON staff_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_schedules" ON staff_schedules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_schedules" ON staff_schedules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_schedules" ON staff_schedules FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- CLEANING TASKS / AGENDA
-- =============================================
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES staff(id) ON DELETE SET NULL,
  task_type text NOT NULL CHECK (task_type IN ('limpieza_diaria', 'limpieza_profunda', 'post_checkout', 'inspeccion', 'mantenimiento_menor')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completado', 'omitido')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time time,
  completed_at timestamptz,
  notes text,
  checklist jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_cleaning" ON cleaning_tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ins_cleaning" ON cleaning_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upd_cleaning" ON cleaning_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_cleaning" ON cleaning_tasks FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- SEED: Menu Categories & Items
-- =============================================
INSERT INTO menu_categories (name, display_order, icon) VALUES
  ('Entradas', 1, 'Salad'),
  ('Sandwiches', 2, 'Sandwich'),
  ('Sopas', 3, 'Soup'),
  ('Principales', 4, 'UtensilsCrossed'),
  ('Postres', 5, 'Cake'),
  ('Bebidas', 6, 'GlassWater')
ON CONFLICT DO NOTHING;

-- Seed menu items
WITH cats AS (SELECT id, name FROM menu_categories)
INSERT INTO menu_items (category_id, name, description, price, display_order) VALUES
  ((SELECT id FROM cats WHERE name='Entradas'), 'Ensalada de la casa', 'Ingredientes de temporada', 22.00, 1),
  ((SELECT id FROM cats WHERE name='Entradas'), 'Palta Rellena', 'Trozo de palta rellena con pollo, verduras y mayonesa', 20.00, 2),
  ((SELECT id FROM cats WHERE name='Entradas'), 'Causa de Pollo', 'Papa prensada con aji amarillo, rellena de pollo con mayonesa', 22.00, 3),
  ((SELECT id FROM cats WHERE name='Entradas'), 'Tequeños de queso', 'Crujientes tequeños rellenos de queso, servidos con guacamole de la casa', 18.00, 4),
  ((SELECT id FROM cats WHERE name='Entradas'), 'Salpicon de Pollo', 'Yucas fritas, acompañadas de una rica salsa', 22.00, 5),
  ((SELECT id FROM cats WHERE name='Sandwiches'), 'Sandwich De Pollo', 'Pan de molde tostado relleno pollo, verduras y mayonesa', 20.00, 1),
  ((SELECT id FROM cats WHERE name='Sandwiches'), 'Sandwich Mixto', 'Clasico de Jamon y queso fundido', 20.00, 2),
  ((SELECT id FROM cats WHERE name='Sandwiches'), 'Sandwich de Salchicha Arequipeña', 'Pan de molde con mostaza y salchicha Arequipeña', 20.00, 3),
  ((SELECT id FROM cats WHERE name='Sandwiches'), 'Salchipapa', 'Papas fritas crujientes y salchichas doradas', 22.00, 4),
  ((SELECT id FROM cats WHERE name='Sopas'), 'Sopa Criolla', 'Sopa casera de carne con fideos, leche y huevo escalfado', 25.50, 1),
  ((SELECT id FROM cats WHERE name='Sopas'), 'Sopa a la Minuta', 'Sopa casera de carne con fideos', 25.50, 2),
  ((SELECT id FROM cats WHERE name='Sopas'), 'Dieta de Pollo', 'Caldo de pollo ligero con fideos y verduras', 25.50, 3),
  ((SELECT id FROM cats WHERE name='Principales'), 'Lomo Saltado', 'Trozos de carne y verduras salteadas con arroz y papas fritas', 40.00, 1),
  ((SELECT id FROM cats WHERE name='Principales'), 'Asado de res con pure', 'Medallones de res cocidos lentamente en sus jugos, acompañado de pure de papa', 38.00, 2),
  ((SELECT id FROM cats WHERE name='Principales'), 'Bistec Montado', 'Filete de carne a la plancha, huevo frito con arroz y papas fritas', 38.00, 3),
  ((SELECT id FROM cats WHERE name='Principales'), 'Pollo Saltado', 'Trozos de carne y verduras salteadas con arroz y papas fritas', 35.00, 4),
  ((SELECT id FROM cats WHERE name='Principales'), 'Pollo a la plancha', 'Filete de pollo con ensalada y guarnicion a elegir (pure, arroz o papas fritas)', 35.00, 5),
  ((SELECT id FROM cats WHERE name='Principales'), 'Milanesa de pollo', 'Filete de pollo empanizado con ensalada y guarnicion a elegir (pure, arroz o papas fritas)', 35.00, 6),
  ((SELECT id FROM cats WHERE name='Principales'), 'Lasaña', 'Capas de pasta intercaladas con salsa boloñesa y bechamel gratinada al horno', 35.00, 7),
  ((SELECT id FROM cats WHERE name='Principales'), 'Tallarines/ravioles en salsa roja', 'Pasta al dente bañada en una salsa boloñesa casera', 32.00, 8),
  ((SELECT id FROM cats WHERE name='Principales'), 'Trucha al Vapor/Frita', 'Filete de trucha con ensalada y guarnicion a elegir (pure, arroz o papas fritas)', 38.00, 9),
  ((SELECT id FROM cats WHERE name='Principales'), 'Osobuco con Pure', 'Osobuco cocido a fuego lento en su jugo, acompañado de un pure cremoso', 38.00, 10),
  ((SELECT id FROM cats WHERE name='Principales'), 'Chanchito a la Barbecue', 'Trozos de cerdo glaseadas acompañadas de papas fritas y ensalada', 38.00, 11),
  ((SELECT id FROM cats WHERE name='Postres'), 'Helado', 'Copa con 02 bolas de helado del dia', 8.50, 1),
  ((SELECT id FROM cats WHERE name='Postres'), 'Crepes con manjar', 'Crepes dorados, con manjar y azucar en polvo', 12.50, 2),
  ((SELECT id FROM cats WHERE name='Postres'), 'Ensalada de frutas', 'Mezcla de frutas del dia aderezadas con miel y limon', 12.50, 3),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Gaseosas', 'Bebida gaseosa', 6.00, 1),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Agua Mineral', 'Agua mineral sin gas', 5.00, 2),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Cerveza', 'Cerveza fria', 12.00, 3),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Infusiones', 'Variedad de infusiones calientes', 5.00, 4),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Cafe', 'Cafe preparado', 7.00, 5),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Pisco Sour', 'Pisco sour peruano', 14.00, 6),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Limonada 1/2 litro', 'Limonada fresca', 10.00, 7),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Limonada 01 litro', 'Limonada fresca 1 litro', 20.00, 8),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Jugo de Frutas 1/2 litro', 'Jugo natural de frutas', 10.00, 9),
  ((SELECT id FROM cats WHERE name='Bebidas'), 'Jugo de Frutas 01 litro', 'Jugo natural de frutas 1 litro', 20.00, 10)
ON CONFLICT DO NOTHING;

-- Seed inventory categories
INSERT INTO inventory_categories (name, description) VALUES
  ('Alimentos', 'Productos alimenticios y ingredientes'),
  ('Bebidas', 'Bebidas alcoholicas y no alcoholicas'),
  ('Limpieza', 'Productos de limpieza e higiene'),
  ('Lenceria', 'Ropa de cama, toallas y manteleria'),
  ('Amenidades', 'Productos de bienvenida para habitaciones'),
  ('Mantenimiento', 'Herramientas y suministros de mantenimiento'),
  ('Papeleria', 'Material de oficina y papeleria')
ON CONFLICT DO NOTHING;
