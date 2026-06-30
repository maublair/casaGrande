'use client';

import { useEffect, useState } from 'react';
import { Salad, Soup, UtensilsCrossed, CakeSlice, GlassWater, Plus, ShoppingCart, X, CheckCircle } from 'lucide-react';
import { getMenu } from '@/lib/wp';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  is_featured?: boolean;
}

type CartItem = MenuItem & { qty: number };

// Orden e iconos de las categorias
const CATEGORY_ORDER = ['Entradas', 'Sopas', 'Principales', 'Postres', 'Bebidas'];
const categoryIcons: Record<string, React.ElementType> = {
  Entradas: Salad, Sopas: Soup, Principales: UtensilsCrossed, Postres: CakeSlice, Bebidas: GlassWater,
};
const foodImages: Record<string, string> = {
  Entradas: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
  Sopas: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
  Principales: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
  Postres: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
  Bebidas: 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg?auto=compress&cs=tinysrgb&w=600',
};
const img = (cat: string) => foodImages[cat] || foodImages['Principales'];

// Menu de ejemplo (cocina arequipena). El admin puede editarlo en WP-admin -> Menu (Restaurante).
const FALLBACK_DISHES: MenuItem[] = [
  // Entradas
  { id: 'e1', name: 'Solterito de queso', description: 'Habas, choclo, queso fresco, rocoto y aceitunas a la usanza arequipena.', price: 22, category: 'Entradas', image: img('Entradas') },
  { id: 'e2', name: 'Ocopa arequipena', description: 'Papa sancochada banada en cremosa salsa de huacatay y mani.', price: 20, category: 'Entradas', image: img('Entradas'), is_featured: true },
  { id: 'e3', name: 'Causa limena de pollo', description: 'Masa de papa amarilla al limon rellena de pollo y palta.', price: 24, category: 'Entradas', image: img('Entradas') },
  { id: 'e4', name: 'Tamal criollo', description: 'Tamal de maiz relleno, acompanado de salsa criolla.', price: 16, category: 'Entradas', image: img('Entradas') },
  // Sopas
  { id: 's1', name: 'Chupe de camarones', description: 'El emblematico chupe arequipeno con camarones de rio, leche y huevo.', price: 38, category: 'Sopas', image: img('Sopas'), is_featured: true },
  { id: 's2', name: 'Caldo de gallina', description: 'Reconfortante caldo de gallina con fideos, papa y huevo.', price: 22, category: 'Sopas', image: img('Sopas') },
  { id: 's3', name: 'Chairo arequipeno', description: 'Sopa robusta de carne, chuno, verduras y trigo.', price: 24, category: 'Sopas', image: img('Sopas') },
  // Principales
  { id: 'p1', name: 'Rocoto relleno con pastel de papa', description: 'Rocoto relleno de carne, mani y queso, con pastel de papa gratinado.', price: 34, category: 'Principales', image: img('Principales'), is_featured: true },
  { id: 'p2', name: 'Adobo arequipeno', description: 'Cerdo macerado en chicha de jora y especias, servido domingos.', price: 30, category: 'Principales', image: img('Principales') },
  { id: 'p3', name: 'Chicharron de chancho', description: 'Crujiente chicharron con mote, camote y salsa criolla.', price: 32, category: 'Principales', image: img('Principales') },
  { id: 'p4', name: 'Lomo saltado', description: 'Clasico salteado de lomo fino, cebolla y tomate al wok, con papas y arroz.', price: 33, category: 'Principales', image: img('Principales') },
  { id: 'p5', name: 'Aji de gallina', description: 'Gallina deshilachada en crema de aji amarillo, con papa y arroz.', price: 28, category: 'Principales', image: img('Principales') },
  { id: 'p6', name: 'Cuy chactado', description: 'Cuy frito a la piedra, especialidad de la casa con papas doradas.', price: 48, category: 'Principales', image: img('Principales'), is_featured: true },
  // Postres
  { id: 'd1', name: 'Queso helado arequipeno', description: 'El postre helado tradicional de Arequipa con canela y coco.', price: 14, category: 'Postres', image: img('Postres'), is_featured: true },
  { id: 'd2', name: 'Suspiro a la limena', description: 'Manjar blanco coronado con merengue al oporto.', price: 15, category: 'Postres', image: img('Postres') },
  { id: 'd3', name: 'Crema volteada', description: 'Flan de huevo banado en caramelo.', price: 13, category: 'Postres', image: img('Postres') },
  // Bebidas
  { id: 'b1', name: 'Chicha morada', description: 'Refrescante bebida de maiz morado, pina y especias (jarra).', price: 10, category: 'Bebidas', image: img('Bebidas') },
  { id: 'b2', name: 'Jugo de fruta natural', description: 'Jugo del dia preparado con fruta fresca de estacion.', price: 12, category: 'Bebidas', image: img('Bebidas') },
  { id: 'b3', name: 'Pisco sour', description: 'El coctel bandera del Peru, preparado al momento.', price: 22, category: 'Bebidas', image: img('Bebidas'), is_featured: true },
  { id: 'b4', name: 'Cafe de altura', description: 'Cafe peruano de altura, espresso o americano.', price: 8, category: 'Bebidas', image: img('Bebidas') },
];

// Normaliza lo que devuelve WordPress (/menu -> {id,name,description,price,category})
function normalize(wp: any[]): MenuItem[] {
  return wp.map((d, i) => ({
    id: String(d.id ?? i),
    name: d.name ?? 'Plato',
    description: d.description ?? '',
    price: Number(d.price) || 0,
    category: d.category || 'Principales',
    image: d.image || img(d.category || 'Principales'),
    is_featured: !!d.is_featured,
  }));
}

export default function RestaurantePage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMenu()
      .then((dishes) => {
        setItems(Array.isArray(dishes) && dishes.length ? normalize(dishes) : FALLBACK_DISHES);
      })
      .catch(() => setItems(FALLBACK_DISHES))
      .finally(() => setLoading(false));
  }, []);

  // Categorias presentes, en el orden definido (+ cualquier extra que venga de WP)
  const extra = items
    .map(i => i.category)
    .filter((c, idx, arr) => arr.indexOf(c) === idx && !CATEGORY_ORDER.includes(c));
  const categories = CATEGORY_ORDER.filter(c => items.some(i => i.category === c)).concat(extra);

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }
  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  function sendOrder() {
    const msg = cart.map(c => `- ${c.name} x${c.qty} = S/ ${(c.price * c.qty).toFixed(2)}`).join('\n');
    const text = `Pedido Hotel Casagrande:\n${msg}\nTOTAL: S/ ${cartTotal.toFixed(2)}`;
    window.open(`https://wa.me/51942330137?text=${encodeURIComponent(text)}`, '_blank');
    setOrderSent(true);
    setTimeout(() => { setOrderSent(false); setCart([]); setCartOpen(false); }, 3000);
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 md:h-96">
        <img
          src="https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg"
          alt="Restaurante Casagrande"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-end pb-12 justify-center text-center">
          <div>
            <p className="font-serif italic text-gold-300 text-xl mb-2">Cocina Arequipena</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide">Nuestro Restaurante</h1>
            <p className="text-white/75 mt-3 text-lg">Menu a la carta — disfruta en tu habitacion o en nuestro comedor</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filtro de categorias */}
        <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-10 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeCategory === 'all' ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todo el Menu
          </button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat] || UtensilsCrossed;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activeCategory === 'all' ? (
          categories.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            if (!catItems.length) return null;
            const Icon = categoryIcons[cat] || UtensilsCrossed;
            return (
              <div key={cat} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-navy" />
                  </div>
                  <h2 className="font-serif text-2xl text-gray-900 font-light">{cat}</h2>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <MenuGrid items={catItems} onAdd={addToCart} cart={cart} />
              </div>
            );
          })
        ) : (
          <MenuGrid items={items.filter(i => i.category === activeCategory)} onAdd={addToCart} cart={cart} />
        )}
      </div>

      {/* Boton flotante carrito */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 bg-olive-600 hover:bg-olive-700 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 transition-all z-40 hover:scale-105"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
          <span className="text-olive-100">•</span>
          <span className="font-bold">S/ {cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Carrito lateral */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">Tu Pedido</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">S/ {item.price.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold text-gray-700 flex items-center justify-center">−</button>
                    <span className="w-6 text-center font-semibold text-gray-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-navy hover:bg-navy-700 rounded-lg text-white flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 w-20 text-right">S/ {(item.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">S/ {cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">El pedido se enviara por WhatsApp a recepcion.</p>
              {orderSent ? (
                <div className="flex items-center justify-center gap-2 bg-olive-50 text-olive-700 font-semibold py-3 rounded-xl">
                  <CheckCircle className="w-5 h-5" /> Pedido enviado
                </div>
              ) : (
                <button onClick={sendOrder} className="w-full bg-olive-600 hover:bg-olive-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md">
                  Enviar pedido por WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuGrid({ items, onAdd, cart }: { items: MenuItem[]; onAdd: (item: MenuItem) => void; cart: CartItem[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => {
        const inCart = cart.find(c => c.id === item.id);
        return (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {item.is_featured && (
                <span className="absolute top-3 left-3 bg-gold text-white text-xs font-semibold px-2.5 py-1 rounded-full">Recomendado</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
              {item.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between mt-4">
                <p className="text-navy font-bold text-lg">S/ {item.price.toFixed(2)}</p>
                <button
                  onClick={() => onAdd(item)}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-all ${
                    inCart ? 'bg-olive-600 text-white' : 'bg-navy hover:bg-navy-700 text-white'
                  }`}
                >
                  {inCart ? `x${inCart.qty}` : <Plus className="w-4 h-4" />}
                  {!inCart && 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
