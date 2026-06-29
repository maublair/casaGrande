'use client';

import { useEffect, useState } from 'react';
import { Salad, Sandwich, Soup, UtensilsCrossed, CakeSlice, GlassWater, Plus, ShoppingCart, X, CheckCircle } from 'lucide-react';
import { getMenu } from '@/lib/wp';

interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tags: string[];
  prep_time_minutes: number;
}

type CartItem = MenuItem & { qty: number };

const categoryIcons: Record<string, React.ElementType> = {
  Salad: Salad, Sandwich: Sandwich, Soup: Soup,
  UtensilsCrossed: UtensilsCrossed, Cake: CakeSlice, GlassWater: GlassWater,
};

const foodImages: Record<string, string> = {
  'Entradas': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Sandwiches': 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Sopas': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Principales': 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Postres': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bebidas': 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export default function RestaurantePage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const dishes = await getMenu();
      setCategories([]);
      setItems(dishes as unknown as MenuItem[]);
      setLoading(false);
    }
    load();
  }, []);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(i => i.category_id === activeCategory);

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
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
            <p className="font-serif italic text-gold-300 text-xl mb-2">Cocina Peruana</p>
            <h1 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide">Nuestro Restaurante</h1>
            <p className="text-white/75 mt-3 text-lg">Menu a la carta — disfruta en tu habitacion o en nuestro comedor</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category filter */}
        <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-10 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-navy text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todo el Menu
          </button>
          {categories.map(cat => {
            const Icon = categoryIcons[cat.icon] || UtensilsCrossed;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="h-48 shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Section headers per category */}
            {activeCategory === 'all' ? (
              categories.map(cat => {
                const catItems = items.filter(i => i.category_id === cat.id);
                if (!catItems.length) return null;
                const Icon = categoryIcons[cat.icon] || UtensilsCrossed;
                return (
                  <div key={cat.id} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-navy" />
                      </div>
                      <h2 className="font-serif text-2xl text-gray-900 font-light">{cat.name}</h2>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <MenuGrid items={catItems} catName={cat.name} onAdd={addToCart} cart={cart} />
                  </div>
                );
              })
            ) : (
              <MenuGrid items={filteredItems} catName="" onAdd={addToCart} cart={cart} />
            )}
          </>
        )}
      </div>

      {/* Floating cart button */}
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

      {/* Cart sidebar */}
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
                  <p className="text-sm font-semibold text-gray-800 w-20 text-right">
                    S/ {(item.price * item.qty).toFixed(2)}
                  </p>
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
                <button
                  onClick={sendOrder}
                  className="w-full bg-olive-600 hover:bg-olive-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md"
                >
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

function MenuGrid({ items, catName, onAdd, cart }: {
  items: MenuItem[];
  catName: string;
  onAdd: (item: MenuItem) => void;
  cart: CartItem[];
}) {
  const foodImages: Record<string, string> = {
    'Entradas': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Sandwiches': 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Sopas': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Principales': 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Postres': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Bebidas': 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg?auto=compress&cs=tinysrgb&w=600',
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => {
        const inCart = cart.find(c => c.id === item.id);
        return (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden menu-card group">
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img
                src={item.image_url || foodImages[catName] || 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600'}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {item.is_featured && (
                <span className="absolute top-3 left-3 bg-gold text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Recomendado
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
              {item.description && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <p className="text-navy font-bold text-lg">S/ {item.price.toFixed(2)}</p>
                <button
                  onClick={() => onAdd(item)}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-all ${
                    inCart
                      ? 'bg-olive-600 text-white'
                      : 'bg-navy hover:bg-navy-700 text-white'
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
