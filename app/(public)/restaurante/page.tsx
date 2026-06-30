import { getMenu } from '@/lib/wp';
import RestauranteClient from './RestauranteClient';

// Server component: trae el menu en build (SSG) y lo hornea en el HTML.
// Asi los platos aparecen al instante (sin esperar el fetch del cliente).
export default async function RestaurantePage() {
  const menu = await getMenu();
  return <RestauranteClient initialMenu={menu} />;
}
