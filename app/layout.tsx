import './globals.css';
import type { Metadata } from 'next';

const SITE = 'https://casagrande.bcode.work';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Hotel Boutique Casa Grande | Vallecito, Arequipa',
    template: '%s | Hotel Boutique Casa Grande',
  },
  description:
    'Hotel boutique en el tradicional barrio de Vallecito, Arequipa. Habitaciones con jardines privados, desayuno buffet, salas de reuniones y reservas directas sin comisiones. Desde 1994.',
  keywords: ['hotel arequipa', 'hotel boutique arequipa', 'hotel vallecito', 'casa grande arequipa', 'hospedaje arequipa'],
  icons: {
    icon: '/Logo-Casagrande-1-2048x951.png',
    apple: '/Logo-Casagrande-1-2048x951.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: SITE,
    siteName: 'Hotel Boutique Casa Grande',
    title: 'Hotel Boutique Casa Grande | Vallecito, Arequipa',
    description:
      'Tradición desde 1994 en el corazón de Vallecito. Jardines, desayuno buffet y reservas directas sin comisiones.',
    images: [{ url: '/hotel/real-46.webp', width: 1920, height: 1080, alt: 'Fachada del Hotel Boutique Casa Grande, Arequipa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hotel Boutique Casa Grande | Arequipa',
    description: 'Hotel boutique en Vallecito, Arequipa. Reservas directas sin comisiones.',
    images: ['/hotel/real-46.webp'],
  },
  robots: { index: true, follow: true },
};

const hotelJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: 'Hotel Boutique Casa Grande',
  description: 'Hotel boutique en el tradicional barrio de Vallecito, Arequipa. Desde 1994.',
  url: SITE,
  image: `${SITE}/hotel/real-46.webp`,
  telephone: '+51-54-214000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Luna Pizarro 202, Vallecito',
    addressLocality: 'Arequipa',
    addressRegion: 'Arequipa',
    addressCountry: 'PE',
  },
  geo: { '@type': 'GeoCoordinates', latitude: -16.4045, longitude: -71.5442 },
  checkinTime: '14:00',
  checkoutTime: '12:00',
  starRating: { '@type': 'Rating', ratingValue: '3' },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Desayuno buffet', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamiento', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Jardines', value: true },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
        />
      </body>
    </html>
  );
}
