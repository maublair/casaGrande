'use client';

import { useEffect, useState } from 'react';
import { Salad, Soup, UtensilsCrossed, CakeSlice, GlassWater, MapPin, MessageCircle } from 'lucide-react';
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

// Menu de ejemplo con un poco de historia de cada plato (cocina arequipena).
// El admin lo edita en WP-admin -> Menu (Restaurante). Es solo vitrina: se pide en el restaurante.
const FALLBACK_DISHES: MenuItem[] = [
  { id: 'e1', name: 'Solterito de queso', category: 'Entradas', price: 22, image: img('Entradas'), description: 'Ensalada arequipena de habas, choclo, queso fresco, rocoto y aceitunas. Su nombre evoca a los "solteros" que la preparaban por lo fresca y sencilla.' },
  { id: 'e2', name: 'Ocopa arequipena', category: 'Entradas', price: 20, image: img('Entradas'), is_featured: true, description: 'Papa sancochada banada en una cremosa salsa de huacatay, aji y mani, herencia de las picanterias arequipenas.' },
  { id: 'e3', name: 'Causa limena de pollo', category: 'Entradas', price: 24, image: img('Entradas'), description: 'Masa de papa amarilla al limon rellena de pollo y palta; su origen se remonta a la epoca de la independencia.' },
  { id: 'e4', name: 'Tamal criollo', category: 'Entradas', price: 16, image: img('Entradas'), description: 'Masa de maiz envuelta en hoja, rellena y acompanada de salsa criolla; un clasico del desayuno peruano.' },
  { id: 's1', name: 'Chupe de camarones', category: 'Sopas', price: 38, image: img('Sopas'), is_featured: true, description: 'El plato mas emblematico de Arequipa: camarones de rio, leche, huevo y queso en un caldo reconfortante.' },
  { id: 's2', name: 'Caldo de gallina', category: 'Sopas', price: 22, image: img('Sopas'), description: 'Caldo sustancioso de gallina con fideos, papa y huevo; el reconstituyente peruano por excelencia.' },
  { id: 's3', name: 'Chairo arequipeno', category: 'Sopas', price: 24, image: img('Sopas'), description: 'Sopa andina de carne, chuno, trigo y verduras, de raices compartidas con el altiplano.' },
  { id: 'p1', name: 'Rocoto relleno con pastel de papa', category: 'Principales', price: 34, image: img('Principales'), is_featured: true, description: 'El plato bandera de Arequipa: rocoto relleno de carne, mani y queso, nacido en las picanterias del siglo XIX, con pastel de papa gratinado.' },
  { id: 'p2', name: 'Adobo arequipeno', category: 'Principales', price: 30, image: img('Principales'), description: 'Cerdo macerado en chicha de jora y especias, tradicional de los domingos por la manana en Arequipa.' },
  { id: 'p3', name: 'Chicharron de chancho', category: 'Principales', price: 32, image: img('Principales'), description: 'Crujiente cerdo dorado en su propia grasa, servido con mote, camote y salsa criolla.' },
  { id: 'p4', name: 'Lomo saltado', category: 'Principales', price: 33, image: img('Principales'), description: 'Icono de la cocina criolla y la fusion chino-peruana (chifa): lomo salteado al wok con cebolla, tomate, papas y arroz.' },
  { id: 'p5', name: 'Aji de gallina', category: 'Principales', price: 28, image: img('Principales'), description: 'Gallina deshilachada en una cremosa salsa de aji amarillo, pan y nueces; comfort food peruano de raiz colonial.' },
  { id: 'p6', name: 'Cuy chactado', category: 'Principales', price: 48, image: img('Principales'), is_featured: true, description: 'Cuy frito a la piedra, manjar andino servido en celebraciones desde tiempos prehispanicos.' },
  { id: 'd1', name: 'Queso helado arequipeno', category: 'Postres', price: 14, image: img('Postres'), is_featured: true, description: 'El postre helado tipico de Arequipa, batido artesanalmente con leche, canela y coco. No lleva queso: su nombre viene de su forma.' },
  { id: 'd2', name: 'Suspiro a la limena', category: 'Postres', price: 15, image: img('Postres'), description: 'Manjar blanco coronado con merengue al oporto; lo llamaron asi por ser suave y dulce como un suspiro.' },
  { id: 'd3', name: 'Crema volteada', category: 'Postres', price: 13, image: img('Postres'), description: 'Flan de huevo banado en caramelo, el postre casero mas querido del Peru.' },
  { id: 'b1', name: 'Chicha morada', category: 'Bebidas', price: 10, image: img('Bebidas'), description: 'Refrescante bebida de maiz morado, pina y especias; se bebe en el Peru desde la epoca prehispanica.' },
  { id: 'b2', name: 'Jugo de fruta natural', category: 'Bebidas', price: 12, image: img('Bebidas'), description: 'Jugo del dia preparado al instante con fruta fresca de estacion.' },
  { id: 'b3', name: 'Pisco sour', category: 'Bebidas', price: 22, image: img('Bebidas'), is_featured: true, description: 'El coctel bandera del Peru: pisco, limon, jarabe y clara de huevo, batido al momento.' },
  { id: 'b4', name: 'Cafe de altura', category: 'Bebidas', price: 8, image: img('Bebidas'), description: 'Cafe peruano de altura, espresso o americano, de origen selva.' },
];

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

export default function RestauranteClient({ initialMenu }: { initialMenu?: any[] }) {
  const seed = Array.isArray(initialMenu) && initialMenu.length ? normalize(initialMenu) : FALLBACK_DISHES;
  const [items, setItems] = useState<MenuItem[]>(seed);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Refresco en segundo plano (si el admin edito el menu); no muestra "cargando".
  useEffect(() => {
    getMenu()
      .then((dishes) => { if (Array.isArray(dishes) && dishes.length) setItems(normalize(dishes)); })
      .catch(() => {});
  }, []);

  const categories = CATEGORY_ORDER.filter(c => items.some(i => i.category === c))
    .concat(items.map(i => i.category).filter((c, idx, arr) => arr.indexOf(c) === idx && !CATEGORY_ORDER.includes(c)));

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 sm:h-72 md:h-96">
        <img
          src="https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg"
          alt="Restaurante Casagrande"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay flex items-end pb-10 sm:pb-12 justify-center text-center px-4">
          <div>
            <p className="font-serif italic text-gold-300 text-lg sm:text-xl mb-2">Cocina Arequipena</p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-white font-light tracking-wide">Nuestro Restaurante</h1>
            <p className="text-white/75 mt-3 text-base sm:text-lg">Sabores tradicionales de Arequipa, preparados al momento</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        {/* Aviso: solo vitrina, se pide en el restaurante */}
        <div className="bg-cream border border-gold/30 rounded-2xl px-5 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-navy text-sm">Una muestra de nuestra carta</p>
              <p className="text-gray-500 text-sm">Todos los platos se preparan al momento y se sirven en el restaurante del hotel. Consulta disponibilidad en recepcion.</p>
            </div>
          </div>
          <a
            href="https://wa.me/51942330137?text=Hola%2C%20quiero%20consultar%20por%20la%20carta%20del%20restaurante"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
          </a>
        </div>

        {/* Filtro de categorias */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-10 scrollbar-hide -mx-4 px-4">
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

        {activeCategory === 'all' ? (
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
                <MenuGrid items={catItems} />
              </div>
            );
          })
        ) : (
          <MenuGrid items={items.filter(i => i.category === activeCategory)} />
        )}
      </div>

      {/* Ubicacion / horario del restaurante */}
      <div className="bg-navy-900 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="font-serif text-2xl sm:text-3xl font-light mb-3">Te esperamos en el restaurante</h3>
          <p className="text-white/60 mb-5">Desayuno, almuerzo y cena con el sabor de la cocina arequipena.</p>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
            <MapPin className="w-4 h-4 text-gold-300" />
            Av. Luna Pizarro 202, Vallecito, Arequipa
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow flex flex-col">
          <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-100">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {item.is_featured && (
              <span className="absolute top-3 left-3 bg-gold text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">Recomendado</span>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
              {item.price > 0 && <span className="text-navy font-bold text-sm whitespace-nowrap">S/ {item.price.toFixed(0)}</span>}
            </div>
            {item.description && <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
