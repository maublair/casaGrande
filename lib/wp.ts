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

export interface ReservationInput {
  name: string;
  email?: string;
  phone?: string;
  room?: string;
  check_in?: string;
  check_out?: string;
  adults?: number;
  total?: number;
  notes?: string;
}

export async function createReservation(
  d: ReservationInput
): Promise<{ reservation_code?: string; id?: string } | null> {
  try {
    const r = await fetch(`${WP}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export const sendContact = (d: { name: string; email?: string; phone?: string; message: string }) =>
  createReservation({ name: d.name, email: d.email, phone: d.phone, room: 'Consulta de contacto', notes: d.message });
