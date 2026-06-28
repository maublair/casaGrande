import Navbar from '@/components/hotel/Navbar';
import HeroSlider from '@/components/hotel/HeroSlider';
import BookingWidget from '@/components/hotel/BookingWidget';
import RoomsSection from '@/components/hotel/RoomsSection';
import ServicesSection from '@/components/hotel/ServicesSection';
import HistorySection from '@/components/hotel/HistorySection';
import GallerySection from '@/components/hotel/GallerySection';
import ContactSection from '@/components/hotel/ContactSection';
import Footer from '@/components/hotel/Footer';
import ChatWidget from '@/components/hotel/ChatWidget';
import ParchmentScroll from '@/components/hotel/ParchmentScroll';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSlider />

      <div id="reservar" className="relative z-10 -mt-20 px-4 pb-0">
        <div className="max-w-5xl mx-auto">
          <BookingWidget />
        </div>
      </div>

      <div className="bg-navy-DEFAULT text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-sm">
          {[
            { label: 'Ubicacion', value: 'Vallecito, Arequipa' },
            { label: 'Habitaciones', value: '33 exclusivas' },
            { label: 'Check-in', value: '2:00 PM' },
            { label: 'Check-out', value: '12:00 PM' },
            { label: 'Telefono', value: '54-214000' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-center">
              <span className="text-white/55 text-xs uppercase tracking-widest">{item.label}</span>
              <span className="text-gold-DEFAULT font-medium">|</span>
              <span className="text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <ParchmentScroll>
        <RoomsSection />
      </ParchmentScroll>
      <ParchmentScroll>
        <ServicesSection />
      </ParchmentScroll>
      <ParchmentScroll>
        <HistorySection />
      </ParchmentScroll>
      <ParchmentScroll>
        <GallerySection />
      </ParchmentScroll>
      <ParchmentScroll>
        <ContactSection />
      </ParchmentScroll>
      <Footer />
      <ChatWidget />
    </main>
  );
}
