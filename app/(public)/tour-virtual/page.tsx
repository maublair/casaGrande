'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Eye, MapPin, BedDouble, Utensils, TreePine, Building2, Bath, Wine, Dumbbell, Car, ArrowRight, Compass, Hand, ExternalLink, Play, Box } from 'lucide-react';

interface TourScene {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  image: string;
  description: string;
  hotspots: { x: number; y: number; label: string; targetId?: string }[];
}

const scenes: TourScene[] = [
  {
    id: 'exterior',
    name: 'Fachada del Hotel',
    category: 'Areas Comunes',
    icon: Building2,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg',
    description: 'La fachada de Hotel Casagrande te recibe en el tradicional barrio de Vallecito, a pasos de la Plaza de Armas de Arequipa.',
    hotspots: [
      { x: 50, y: 60, label: 'Entrar al Lobby', targetId: 'lobby' },
    ],
  },
  {
    id: 'lobby',
    name: 'Recepcion & Lobby',
    category: 'Areas Comunes',
    icon: Building2,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-4.jpg',
    description: 'Nuestro acogedor lobby donde la tradicion de una casona se une con el confort de un hotel moderno.',
    hotspots: [
      { x: 25, y: 60, label: 'Restaurante', targetId: 'restaurant' },
      { x: 75, y: 55, label: 'Ir a Habitaciones', targetId: 'simple' },
      { x: 55, y: 70, label: 'Jardines', targetId: 'garden' },
    ],
  },
  {
    id: 'simple',
    name: 'Habitacion Simple',
    category: 'Habitaciones',
    icon: BedDouble,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-8.jpg',
    description: 'Habitacion acogedora con cama matrimonial, bano privado, Wi-Fi gratuito y TV por cable.',
    hotspots: [
      { x: 80, y: 50, label: 'Bano', targetId: 'bathroom' },
      { x: 15, y: 65, label: 'Volver al Lobby', targetId: 'lobby' },
      { x: 65, y: 45, label: 'Ver Suite', targetId: 'suite' },
    ],
  },
  {
    id: 'double',
    name: 'Habitacion Doble',
    category: 'Habitaciones',
    icon: BedDouble,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-7.jpg',
    description: 'Espaciosa habitacion doble con dos camas individuales o una cama queen, perfecta para familias.',
    hotspots: [
      { x: 70, y: 55, label: 'Ver Suite', targetId: 'suite' },
      { x: 20, y: 60, label: 'Regresar al Lobby', targetId: 'lobby' },
    ],
  },
  {
    id: 'suite',
    name: 'Suite Ejecutiva',
    category: 'Habitaciones',
    icon: BedDouble,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-2.jpg',
    description: 'Ambiente amplio y elegante con cama Queen, escritorio de trabajo, pequena sala, TV con cable, Wi-Fi y bano privado.',
    hotspots: [
      { x: 20, y: 50, label: 'Jardines', targetId: 'garden' },
      { x: 78, y: 60, label: 'Lobby', targetId: 'lobby' },
      { x: 45, y: 55, label: 'Bano Premium', targetId: 'bathroom' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bano Privado',
    category: 'Habitaciones',
    icon: Bath,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-16.jpg',
    description: 'Banos privados completamente equipados con ducha, productos de bienvenida y detalles de confort.',
    hotspots: [
      { x: 80, y: 60, label: 'Volver al cuarto', targetId: 'suite' },
      { x: 20, y: 45, label: 'Lobby', targetId: 'lobby' },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurante',
    category: 'Areas Comunes',
    icon: Utensils,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-3.jpg',
    description: 'Nuestro restaurante ofrece desayunos buffet y sabores caseros que reflejan la esencia arequipena.',
    hotspots: [
      { x: 50, y: 40, label: 'Ver Menu', targetId: undefined },
      { x: 20, y: 65, label: 'Volver al Lobby', targetId: 'lobby' },
      { x: 80, y: 55, label: 'Ir al Jardin', targetId: 'garden' },
    ],
  },
  {
    id: 'events',
    name: 'Sala de Eventos',
    category: 'Areas Comunes',
    icon: Wine,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-12.jpg',
    description: 'Salones de eventos y reuniones totalmente equipados, ideales para conferencias, capacitaciones o encuentros privados.',
    hotspots: [
      { x: 30, y: 60, label: 'Restaurante', targetId: 'restaurant' },
      { x: 70, y: 55, label: 'Lobby', targetId: 'lobby' },
    ],
  },
  {
    id: 'garden',
    name: 'Jardines & Terraza',
    category: 'Areas Comunes',
    icon: TreePine,
    image: 'https://deykard.com/uploads/imagenes/hotel-casagrande-5.jpg',
    description: 'Rodeado de amplios jardines en el tradicional barrio de Vallecito. El lugar perfecto para relajarse.',
    hotspots: [
      { x: 25, y: 55, label: 'Lobby', targetId: 'lobby' },
      { x: 75, y: 45, label: 'Restaurante', targetId: 'restaurant' },
    ],
  },
];

const categories = ['Todos', 'Habitaciones', 'Areas Comunes'] as const;

export default function TourVirtualPage() {
  const [currentScene, setCurrentScene] = useState(scenes[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [filterCat, setFilterCat] = useState<typeof categories[number]>('Todos');
  const [fullscreen, setFullscreen] = useState(false);
  const [panX, setPanX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [viewMode, setViewMode] = useState<'gallery' | 'matterport'>('gallery');

  const goToScene = useCallback((scene: TourScene) => {
    if (scene.id === currentScene.id || isTransitioning) return;
    setIsTransitioning(true);
    setPanX(0);
    setTimeout(() => {
      setCurrentScene(scene);
      setIsTransitioning(false);
    }, 450);
  }, [currentScene, isTransitioning]);

  useEffect(() => {
    if (currentScene.id !== 'lobby') setShowHint(false);
  }, [currentScene]);

  const goNext = () => {
    const idx = scenes.findIndex(s => s.id === currentScene.id);
    goToScene(scenes[(idx + 1) % scenes.length]);
  };

  const goPrev = () => {
    const idx = scenes.findIndex(s => s.id === currentScene.id);
    goToScene(scenes[(idx - 1 + scenes.length) % scenes.length]);
  };

  function handleMouseDown(e: React.MouseEvent) {
    if (isTransitioning) return;
    setIsDragging(true);
    setDragStart(e.clientX);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const delta = e.clientX - dragStart;
    setPanX(prev => Math.max(-120, Math.min(120, prev + delta * 0.5)));
    setDragStart(e.clientX);
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (isTransitioning) return;
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStart;
    setPanX(prev => Math.max(-120, Math.min(120, prev + delta * 0.5)));
    setDragStart(e.touches[0].clientX);
  }

  const filteredScenes = filterCat === 'Todos' ? scenes : scenes.filter(s => s.category === filterCat);
  const currentIdx = scenes.findIndex(s => s.id === currentScene.id);

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}>
      {!fullscreen && (
        <div className="relative h-64 md:h-80">
          <img
            src="https://deykard.com/uploads/imagenes/hotel-casagrande-1.jpg"
            alt="Tour Virtual"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay flex items-end pb-10 justify-center text-center">
            <div>
              <p className="font-serif italic text-gold-300 text-xl mb-2">Explora nuestros espacios</p>
              <h1 className="font-serif text-4xl md:text-6xl text-white font-light tracking-wide">Tour del Hotel</h1>
              <p className="text-white/70 mt-3 text-sm md:text-base max-w-xl mx-auto px-4">
                Recorre cada rincón del hotel desde tu pantalla. Arrastra para mirar alrededor, haz clic en los puntos para navegar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${fullscreen ? 'h-full p-4' : 'max-w-7xl mx-auto px-4 py-10'} flex flex-col ${fullscreen ? '' : 'gap-8'}`}>
        {/* Mode toggle */}
        {!fullscreen && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'gallery' ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" /> Tour Guiado
            </button>
            <button
              onClick={() => setViewMode('matterport')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'matterport' ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Box className="w-4 h-4" /> Tour 3D Matterport
            </button>
          </div>
        )}

        {/* Matterport 3D Tour */}
        {viewMode === 'matterport' && (
          <div className={`relative ${fullscreen ? 'flex-1' : 'rounded-2xl overflow-hidden shadow-2xl'}`}>
            <div className={`${fullscreen ? 'h-full' : 'h-[600px] md:h-[700px]'} relative`}>
              <iframe
                src="https://my.matterport.com/show?play=1&lang=es&m=eFRTosPYLJq"
                className="w-full h-full border-0"
                allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
                allowFullScreen
                title="Tour 3D Hotel Casagrande - Matterport"
              />
            </div>
            {!fullscreen && (
              <div className="mt-4 flex items-center justify-between bg-cream rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center">
                    <Box className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Tour 3D Matterport</h3>
                    <p className="text-sm text-gray-500">Recorre el hotel en 3D con tecnologia Matterport. Usa los controles del visor para moverte.</p>
                  </div>
                </div>
                <a
                  href="https://my.matterport.com/show?play=1&lang=es&m=eFRTosPYLJq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-navy hover:text-navy-600 text-sm font-semibold"
                >
                  Abrir en pestana nueva <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tour */}
        {viewMode === 'gallery' && (
          <>
            {/* Main Viewer */}
            <div className={`relative ${fullscreen ? 'flex-1' : 'rounded-2xl overflow-hidden shadow-2xl'} bg-black`}>
              <div
                className={`relative w-full ${fullscreen ? 'h-full max-h-[88vh]' : 'h-[440px] md:h-[580px] lg:h-[640px]'} overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={currentScene.image}
                  alt={currentScene.name}
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
                  style={{
                    transform: `translateX(${panX}px) scale(${panX !== 0 ? 1.15 : 1.05})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out, opacity 0.45s ease, scale 0.45s ease',
                  }}
                />

                {showHint && !isTransitioning && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce" style={{ animationDuration: '2s' }}>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-medium border border-white/30">
                      <Hand className="w-5 h-5" />
                      Arrastra para mirar alrededor
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                {!isTransitioning && currentScene.hotspots.map((hs, i) => {
                  const target = scenes.find(s => s.id === hs.targetId);
                  return (
                    <button
                      key={i}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hs.targetId === undefined && hs.label === 'Ver Menu') {
                          window.location.href = '/restaurante';
                        } else if (target) {
                          goToScene(target);
                        }
                      }}
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="hotspot-ring" />
                        <div className="absolute inset-0 w-10 h-10 m-auto bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:bg-gold transition-all duration-300 group-hover:scale-110">
                          {target ? (
                            <Eye className="w-5 h-5 text-navy group-hover:text-white" />
                          ) : (
                            <ArrowRight className="w-5 h-5 text-navy group-hover:text-white" />
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-1 whitespace-nowrap pointer-events-none">
                        <span className="bg-black/85 backdrop-blur-sm text-white text-xs font-semibold px-3.5 py-2 rounded-full border border-white/20">{hs.label}</span>
                      </div>
                    </button>
                  );
                })}

                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                  <button onClick={goPrev}
                    className="w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-110">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={goNext}
                    className="w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-110">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button
                    onClick={() => setPanX(0)}
                    className={`w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-all ${panX === 0 ? 'opacity-50' : 'opacity-100'}`}
                    title="Centrar vista"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFullscreen(!fullscreen)}
                    className="w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-all"
                    title={fullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
                  >
                    {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
                  <div className="flex items-end justify-between">
                    <div className="max-w-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">360°</span>
                        <p className="text-gold-300 text-xs font-semibold uppercase tracking-widest">{currentScene.category}</p>
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl text-white font-light">{currentScene.name}</h2>
                      <p className="text-white/70 text-sm mt-1">{currentScene.description}</p>
                    </div>
                    <div className="text-white/40 text-sm hidden md:block flex-shrink-0">
                      {currentIdx + 1} / {scenes.length}
                    </div>
                  </div>
                </div>

                {panX !== 0 && !isDragging && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full z-20 pointer-events-none">
                    Vista desplazada — clic en <Compass className="w-3 h-3 inline mx-1" /> para centrar
                  </div>
                )}
              </div>
            </div>

            {!fullscreen && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        filterCat === cat ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {cat}
                      <span className="ml-1.5 text-xs opacity-60">
                        ({cat === 'Todos' ? scenes.length : scenes.filter(s => s.category === cat).length})
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
                  {filteredScenes.map(scene => {
                    const Icon = scene.icon;
                    const isActive = scene.id === currentScene.id;
                    return (
                      <button key={scene.id} onClick={() => goToScene(scene)}
                        className={`relative rounded-xl overflow-hidden group text-left transition-all ${
                          isActive ? 'ring-2 ring-gold shadow-lg scale-[1.03]' : 'hover:scale-[1.03] hover:shadow-md ring-1 ring-gray-200'
                        }`}>
                        <div className="h-20 sm:h-24 relative">
                          <img src={scene.image} alt={scene.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className={`absolute inset-0 transition-colors ${isActive ? 'bg-gold/20' : 'bg-black/30 group-hover:bg-black/15'}`} />
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gold rounded-full flex items-center justify-center shadow-md">
                              <Eye className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-white/80 rounded-md flex items-center justify-center backdrop-blur-sm">
                            <Icon className="w-3.5 h-3.5 text-navy" />
                          </div>
                        </div>
                        <div className="bg-white p-2">
                          <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{scene.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 truncate">{scene.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  {[
                    { icon: Hand, title: 'Arrastra para explorar', body: 'Mantén presionado y arrastra sobre la imagen para mirar alrededor en 360 grados, igual que en Google Street View.' },
                    { icon: Eye, title: 'Puntos de navegacion', body: 'Los circulos pulsantes te llevan al siguiente ambiente. Haz clic para teletransportarte entre espacios.' },
                    { icon: Box, title: 'Tour 3D Matterport', body: 'Activa el modo Tour 3D para recorrer el hotel con tecnologia Matterport en una experiencia inmersiva real.' },
                  ].map(card => (
                    <div key={card.title} className="flex gap-4 p-5 bg-cream rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <card.icon className="w-5 h-5 text-navy" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
                        <p className="text-gray-600 text-sm">{card.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-6 bg-navy rounded-2xl p-10">
                  <h3 className="font-serif text-3xl text-white font-light mb-3">Te gusto lo que viste?</h3>
                  <p className="text-white/60 mb-6 max-w-lg mx-auto">Reserva ahora y vive la experiencia Casagrande en persona. Confirmacion inmediata.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/#reservar" className="bg-gold hover:bg-gold-600 text-navy-900 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
                      Reservar Ahora
                    </Link>
                    <Link href="/habitaciones" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm">
                      Ver Habitaciones
                    </Link>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
