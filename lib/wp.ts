// Cliente REST de WordPress (backend headless de Casa Grande).
// El front estatico consume estos endpoints; el admin es WP-admin.
const WP =
  process.env.NEXT_PUBLIC_WP_API ||
  'https://casagrande-cms.bcode.work/wp-json/casagrande/v1';

export interface WpRoom {
  id: string;
  name: string;
  description: string;
  base_price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  units?: number;
  available: number;
}

async function getJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${WP}${path}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export const getRooms = () => getJSON<WpRoom[]>('/rooms', []);
export const getSettings = () => getJSON<Record<string, string>>('/settings', {});
export const getMenu = () => getJSON<any[]>('/menu', []);

// Disponibilidad real por rango de fechas (anti-overbooking).
export interface AvailRoom {
  id: string;
  name: string;
  units: number;
  reserved: number;
  available: number;
  base_price: number;
  capacity: number;
}
export async function getAvailability(checkIn?: string, checkOut?: string): Promise<AvailRoom[]> {
  const qs = checkIn && checkOut ? `?check_in=${checkIn}&check_out=${checkOut}` : '';
  const r = await getJSON<{ rooms: AvailRoom[] }>(`/availability${qs}`, { rooms: [] });
  return r.rooms || [];
}

export interface ReservationInput {
  name: string;
  email?: string;
  phone?: string;
  room?: string;
  room_id?: string;
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
  total?: number;
  notes?: string;
}

export interface ReservationResult {
  ok: boolean;
  reservation_code?: string;
  id?: string;
  status?: string;
  error?: string;
  available?: number;
}

export async function createReservation(d: ReservationInput): Promise<ReservationResult> {
  try {
    const r = await fetch(`${WP}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, ...(json as object) };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export const sendContact = (d: { name: string; email?: string; phone?: string; message: string }) =>
  createReservation({ name: d.name, email: d.email, phone: d.phone, room: 'Consulta de contacto', notes: d.message });
