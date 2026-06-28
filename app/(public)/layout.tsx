import Navbar from '@/components/hotel/Navbar';
import Footer from '@/components/hotel/Footer';
import ChatWidget from '@/components/hotel/ChatWidget';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
