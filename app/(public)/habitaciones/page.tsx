import { getRooms } from '@/lib/wp';
import HabitacionesClient from './HabitacionesClient';

export default async function HabitacionesPage() {
  const rooms = await getRooms();
  return <HabitacionesClient initialRooms={rooms} />;
}
