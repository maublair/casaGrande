import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://disabled.invalid';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'disabled';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type Department = 'recepcion' | 'housekeeping' | 'cocina' | 'mantenimiento' | 'administracion' | 'seguridad';
export type ExpenseCategory = 'salarios' | 'suministros' | 'mantenimiento' | 'marketing' | 'servicios' | 'alimentos' | 'equipamiento' | 'otros';

export interface RoomType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: RoomStatus;
  notes: string | null;
  images: string[];
  price_override: number | null;
  is_active: boolean;
  created_at: string;
  room_types?: RoomType;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  document_type: string;
  document_number: string | null;
  nationality: string;
  address: string | null;
  city: string | null;
  country: string;
  birth_date: string | null;
  preferences: string | null;
  tags: string[];
  total_stays: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  reservation_code: string;
  customer_id: string | null;
  room_id: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  total_amount: number;
  paid_amount: number;
  source: string;
  special_requests: string | null;
  breakfast_included: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  rooms?: Room & { room_types?: RoomType };
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: Department;
  salary: number | null;
  hire_date: string;
  is_active: boolean;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  department: string | null;
  expense_date: string;
  receipt_url: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  channel: string;
  customer_id: string | null;
  assigned_to: string | null;
  intent: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'staff';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tags: string[];
  allergens: string[];
  prep_time_minutes: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  menu_categories?: MenuCategory;
}

export interface InventoryItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  unit_cost: number | null;
  supplier: string | null;
  location: string | null;
  sku: string | null;
  is_active: boolean;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleaningTask {
  id: string;
  room_id: string | null;
  assigned_to: string | null;
  task_type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed_at: string | null;
  notes: string | null;
  checklist: unknown[];
  created_at: string;
  updated_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  work_date: string;
  shift: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}
