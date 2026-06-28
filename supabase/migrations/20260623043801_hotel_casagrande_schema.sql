/*
# Hotel Casagrande - Schema Completo del Sistema de Gestion Hotelera

## Descripcion
Schema completo para el sistema de gestion del Hotel Boutique Casagrande (Lima, Peru).
Incluye: habitaciones, reservas, clientes, personal, finanzas e historial de chat.

## Tablas Nuevas

### 1. room_types
Tipos de habitacion disponibles (Simple, Doble, Suite, etc.) con precios base.

### 2. rooms
Habitaciones fisicas del hotel, cada una con tipo, numero, piso, estado y amenidades.

### 3. customers
Clientes registrados del hotel con historial de contacto y preferencias.

### 4. reservations
Reservas de habitaciones con fechas, estado, total, canal de origen y notas especiales.

### 5. reservation_guests
Huespedes adicionales vinculados a una reserva (mas alla del titular).

### 6. staff
Personal del hotel con cargo, departamento, salario y estado activo.

### 7. expenses
Gastos operativos del hotel clasificados por categoria, fecha y departamento.

### 8. payments
Pagos recibidos vinculados a reservas, con metodo y estado.

### 9. chat_conversations
Conversaciones del agente automatico 24/7 con clientes.

### 10. chat_messages
Mensajes individuales de cada conversacion del chat.

### 11. hotel_settings
Configuracion general del hotel (nombre, contacto, politicas, etc.).

## Seguridad
- RLS habilitado en todas las tablas.
- Politicas abiertas a anon + authenticated (sistema single-tenant / admin interno).

## Notas
- Sistema de gestion interna: no requiere auth multi-usuario individual por cliente.
- Las politicas permiten acceso total al anon key para que el frontend funcione sin auth obligatorio.
- Las metricas financieras se calculan con queries sobre expenses y payments.
*/

-- =============================
-- TIPOS DE HABITACION
-- =============================
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  capacity int NOT NULL DEFAULT 2,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_room_types" ON room_types;
CREATE POLICY "select_room_types" ON room_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_room_types" ON room_types;
CREATE POLICY "insert_room_types" ON room_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_room_types" ON room_types;
CREATE POLICY "update_room_types" ON room_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_room_types" ON room_types;
CREATE POLICY "delete_room_types" ON room_types FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- HABITACIONES
-- =============================
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  room_type_id uuid REFERENCES room_types(id),
  floor int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'reserved')),
  notes text,
  images text[] DEFAULT '{}',
  price_override numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_rooms" ON rooms;
CREATE POLICY "select_rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_rooms" ON rooms;
CREATE POLICY "insert_rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_rooms" ON rooms;
CREATE POLICY "update_rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_rooms" ON rooms;
CREATE POLICY "delete_rooms" ON rooms FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- CLIENTES
-- =============================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  document_type text DEFAULT 'DNI' CHECK (document_type IN ('DNI', 'Pasaporte', 'CE', 'RUC')),
  document_number text,
  nationality text DEFAULT 'Peruana',
  address text,
  city text,
  country text DEFAULT 'Peru',
  birth_date date,
  preferences text,
  tags text[] DEFAULT '{}',
  total_stays int NOT NULL DEFAULT 0,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_customers" ON customers;
CREATE POLICY "select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_customers" ON customers;
CREATE POLICY "insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_customers" ON customers;
CREATE POLICY "update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_customers" ON customers;
CREATE POLICY "delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- RESERVAS
-- =============================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code text UNIQUE NOT NULL DEFAULT 'RES-' || upper(substr(gen_random_uuid()::text, 1, 8)),
  customer_id uuid REFERENCES customers(id),
  room_id uuid REFERENCES rooms(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults int NOT NULL DEFAULT 1,
  children int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  source text DEFAULT 'direct' CHECK (source IN ('direct', 'web', 'phone', 'email', 'booking', 'expedia', 'airbnb', 'agent')),
  special_requests text,
  breakfast_included boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_reservations" ON reservations;
CREATE POLICY "select_reservations" ON reservations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_reservations" ON reservations;
CREATE POLICY "insert_reservations" ON reservations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_reservations" ON reservations;
CREATE POLICY "update_reservations" ON reservations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_reservations" ON reservations;
CREATE POLICY "delete_reservations" ON reservations FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- PERSONAL
-- =============================
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  role text NOT NULL,
  department text NOT NULL CHECK (department IN ('recepcion', 'housekeeping', 'cocina', 'mantenimiento', 'administracion', 'seguridad')),
  salary numeric(10,2),
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_staff" ON staff;
CREATE POLICY "select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_staff" ON staff;
CREATE POLICY "insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_staff" ON staff;
CREATE POLICY "update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_staff" ON staff;
CREATE POLICY "delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- PAGOS
-- =============================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'transfer', 'yape', 'plin', 'booking_prepaid')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  reference text,
  notes text,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_payments" ON payments;
CREATE POLICY "insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_payments" ON payments;
CREATE POLICY "update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_payments" ON payments;
CREATE POLICY "delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- GASTOS
-- =============================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('salarios', 'suministros', 'mantenimiento', 'marketing', 'servicios', 'alimentos', 'equipamiento', 'otros')),
  amount numeric(10,2) NOT NULL,
  department text CHECK (department IN ('recepcion', 'housekeeping', 'cocina', 'mantenimiento', 'administracion', 'seguridad', 'general')),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  approved_by uuid REFERENCES staff(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_expenses" ON expenses;
CREATE POLICY "select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_expenses" ON expenses;
CREATE POLICY "insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_expenses" ON expenses;
CREATE POLICY "update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_expenses" ON expenses;
CREATE POLICY "delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- CONVERSACIONES DE CHAT
-- =============================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'email')),
  customer_id uuid REFERENCES customers(id),
  assigned_to uuid REFERENCES staff(id),
  intent text,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_chat_conversations" ON chat_conversations;
CREATE POLICY "select_chat_conversations" ON chat_conversations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_chat_conversations" ON chat_conversations;
CREATE POLICY "insert_chat_conversations" ON chat_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_chat_conversations" ON chat_conversations;
CREATE POLICY "update_chat_conversations" ON chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_chat_conversations" ON chat_conversations;
CREATE POLICY "delete_chat_conversations" ON chat_conversations FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- MENSAJES DE CHAT
-- =============================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'staff')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages" ON chat_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages" ON chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_chat_messages" ON chat_messages;
CREATE POLICY "update_chat_messages" ON chat_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_chat_messages" ON chat_messages;
CREATE POLICY "delete_chat_messages" ON chat_messages FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- CONFIGURACION DEL HOTEL
-- =============================
CREATE TABLE IF NOT EXISTS hotel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_hotel_settings" ON hotel_settings;
CREATE POLICY "select_hotel_settings" ON hotel_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_hotel_settings" ON hotel_settings;
CREATE POLICY "insert_hotel_settings" ON hotel_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_hotel_settings" ON hotel_settings;
CREATE POLICY "update_hotel_settings" ON hotel_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_hotel_settings" ON hotel_settings;
CREATE POLICY "delete_hotel_settings" ON hotel_settings FOR DELETE TO anon, authenticated USING (true);

-- =============================
-- INDICES
-- =============================
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id);
