import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Boutique Casagrande | Arequipa, Peru',
  description:
    'Hotel Boutique Casagrande — experiencia unica en el corazon de Arequipa. Reserva tu estancia con las mejores comodidades y servicio personalizado.',
  icons: {
    icon: '/Logo-Casagrande-1-2048x951.png',
    apple: '/Logo-Casagrande-1-2048x951.png',
  },
  openGraph: {
    title: 'Hotel Boutique Casagrande',
    description: 'Elegancia y confort en Arequipa, Peru',
    images: ['https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
