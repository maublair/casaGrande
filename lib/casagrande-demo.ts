import type { InventoryItem, Reservation, RoomStatus } from '@/lib/supabase';

export type RoomLegendStatus = RoomStatus | 'all';

export const roomLegend = [
  { status: 'available', label: 'Disponible', hint: 'Lista para venta y check-in.' },
  { status: 'occupied', label: 'Ocupada', hint: 'Tiene huésped alojado y reserva activa.' },
  { status: 'reserved', label: 'Reservada', hint: 'Bloqueada para llegada próxima.' },
  { status: 'cleaning', label: 'Limpieza', hint: 'Housekeeping en proceso.' },
  { status: 'maintenance', label: 'Mantenimiento', hint: 'Fuera de venta temporalmente.' },
] as const;

const guestNames = [
  'Ana Maria Quispe',
  'Diego Huaman Rojas',
  'Luz Marina Paredes',
  'Carlos Enrique Soto',
  'Valeria Bustamante',
  'Jorge Luis Gutierrez',
  'Paola Salazar',
  'Renato Caceres',
];

const nationalities = ['Peruana', 'Chilena', 'Argentina', 'Colombiana', 'Mexicana', 'Española'];
const documentTypes = ['DNI', 'Pasaporte', 'CE'];

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function seedFrom(value: string) {
  return value.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function makeDoc(seed: number) {
  return String(40000000 + (seed % 5000000)).slice(0, 8);
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function dateISO(date: Date) {
  return date.toISOString().split('T')[0];
}

function currency(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

export interface DemoGuest {
  fullName: string;
  documentType: string;
  documentNumber: string;
  nationality: string;
  isMain?: boolean;
}

export interface DemoReservation {
  code: string;
  status: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  source: string;
  total: string;
  paid: string;
  notes: string;
  guests: DemoGuest[];
}

export interface DemoRoomAsset {
  category: string;
  name: string;
  serial: string;
  brand: string;
  type: string;
  details: string;
  description: string;
  acquisitionYear: number;
  documents: string[];
  state: string;
  tags: string[];
  maintenanceHistory: string[];
  damageHistory: string[];
}

export interface DemoRoomProfile {
  summary: string;
  currentReservation: DemoReservation | null;
  reservationHistory: Array<{
    code: string;
    guest: string;
    status: string;
    checkIn: string;
    checkOut: string;
    total: string;
    guests: DemoGuest[];
  }>;
  inventory: Array<{
    category: string;
    items: DemoRoomAsset[];
  }>;
  tags: string[];
  alerts: string[];
}

function guestManifest(seed: number, count: number, overrideMain?: string): DemoGuest[] {
  return Array.from({ length: count }, (_, index) => {
    const guestSeed = seed + index * 19;
    const name = index === 0 && overrideMain ? overrideMain : guestNames[guestSeed % guestNames.length];
    return {
      fullName: name,
      documentType: documentTypes[guestSeed % documentTypes.length],
      documentNumber: makeDoc(guestSeed),
      nationality: nationalities[guestSeed % nationalities.length],
      isMain: index === 0,
    };
  });
}

function currentReservationFor(roomNumber: string, status: RoomStatus): DemoReservation | null {
  if (status !== 'occupied' && status !== 'reserved') return null;

  const seed = seedFrom(roomNumber);
  const today = new Date('2026-07-06T00:00:00.000Z');
  const checkIn = status === 'occupied' ? addDays(today, -((seed % 3) + 1)) : addDays(today, 1 + (seed % 2));
  const nights = status === 'occupied' ? 2 + (seed % 3) : 1 + (seed % 2);
  const total = 220 + (seed % 5) * 35;
  const paid = status === 'occupied' ? total * 0.75 : total * 0.35;
  const guests = guestManifest(seed, 2 + (seed % 2), `Huesped principal ${roomNumber}`);

  return {
    code: `CG-${roomNumber}-${String(seed % 97).padStart(2, '0')}`,
    status,
    checkIn: dateISO(checkIn),
    checkOut: dateISO(addDays(checkIn, nights)),
    adults: guests.length,
    children: seed % 2,
    source: status === 'occupied' ? 'walk-in' : 'web',
    total: currency(total),
    paid: currency(paid),
    notes: status === 'occupied'
      ? 'Reserva en casa. Desayuno incluido y salida tardia bajo coordinacion.'
      : 'Reserva en garantia pendiente de check-in.',
    guests,
  };
}

function historyFor(roomNumber: string, status: RoomStatus) {
  const seed = seedFrom(roomNumber);
  const today = new Date('2026-07-06T00:00:00.000Z');
  const labels = ['checked_out', 'checked_out', 'cancelled', status === 'maintenance' ? 'maintenance' : 'confirmed'];
  return labels.map((label, index) => {
    const checkIn = addDays(today, -(index * 11 + (seed % 5)));
    const nights = 1 + ((seed + index) % 4);
    const guests = guestManifest(seed + index * 7, 2 + (index % 2));
    return {
      code: `CGH-${roomNumber}-${index + 1}`,
      guest: guests[0].fullName,
      status: label,
      checkIn: dateISO(checkIn),
      checkOut: dateISO(addDays(checkIn, nights)),
      total: currency(180 + index * 40 + (seed % 25)),
      guests,
    };
  });
}

function assetState(roomNumber: string, index: number, status: RoomStatus) {
  if (status === 'maintenance') return index % 2 === 0 ? 'Necesita revision' : 'Fuera de servicio';
  if (status === 'cleaning') return index % 2 === 0 ? 'En limpieza' : 'Listo para inspeccion';
  return index % 3 === 0 ? 'Operativo' : 'Inspeccion programada';
}

function assetTags(roomNumber: string, index: number, status: RoomStatus) {
  const base = ['Inventario fisico', `Hab. ${roomNumber}`];
  if (status === 'maintenance') return [...base, 'Necesita mantenimiento'];
  if (status === 'reserved') return [...base, 'Cambio programado'];
  return index % 2 === 0 ? [...base, 'Revision semestral'] : [...base, 'En garantia'];
}

function assetTemplate(roomNumber: string, status: RoomStatus): DemoRoomAsset[] {
  const seed = seedFrom(roomNumber);
  const prefix = roomNumber.replace(/\D/g, '') || '000';
  const docs = [
    'Factura de compra',
    'Acta de instalacion',
    'Garantia del proveedor',
  ];

  return [
    {
      category: 'Dormitorio',
      name: 'Colchon ortopedico',
      serial: `${prefix}-BED-${seed % 97}`,
      brand: 'Restonic',
      type: 'Queen / alta densidad',
      details: 'Base firme, protector impermeable y funda antiacaros.',
      description: 'Cama principal del cuarto con uso rotativo y protector sanitario.',
      acquisitionYear: 2024,
      documents: docs,
      state: assetState(roomNumber, 0, status),
      tags: assetTags(roomNumber, 0, status),
      maintenanceHistory: ['2026-05-10: inspeccion visual sin incidencias.', '2026-06-18: rotacion de colchon.'],
      damageHistory: ['Sin daños reportados.'],
    },
    {
      category: 'Tecnologia',
      name: 'Televisor smart',
      serial: `${prefix}-TV-${seed % 83}`,
      brand: 'Samsung',
      type: '43 pulgadas',
      details: 'Control remoto, cable HDMI y soporte VESA.',
      description: 'Pantalla principal para entretenimiento y presentaciones.',
      acquisitionYear: 2023,
      documents: docs,
      state: assetState(roomNumber, 1, status),
      tags: assetTags(roomNumber, 1, status),
      maintenanceHistory: ['2026-06-04: actualizacion de firmware.', '2026-06-25: limpieza de puertos.'],
      damageHistory: ['Sin reporte de pixeles muertos.'],
    },
    {
      category: 'Baño',
      name: 'Ducha monomando',
      serial: `${prefix}-BTH-${seed % 79}`,
      brand: 'Vainsa',
      type: 'Accesorio sanitario',
      details: 'Caudal estable, llave termostatica y flexibles nuevos.',
      description: 'Parte del inventario completo del baño con seguimiento de mantenimiento.',
      acquisitionYear: 2022,
      documents: ['Factura sanitaria', 'Acta de instalacion'],
      state: assetState(roomNumber, 2, status),
      tags: [...assetTags(roomNumber, 2, status), 'Baño'],
      maintenanceHistory: ['2026-04-22: cambio de empaquetadura.', '2026-06-29: prueba de caudal OK.'],
      damageHistory: ['Ningun daño estructural.'],
    },
    {
      category: 'Baño',
      name: 'Inodoro dual flush',
      serial: `${prefix}-WC-${seed % 71}`,
      brand: 'Tramontina',
      type: 'Sanitario',
      details: 'Descarga doble, tapa lenta y tanque de bajo consumo.',
      description: 'Incluye control de desgaste, piezas y posibles cambios preventivos.',
      acquisitionYear: 2022,
      documents: ['Factura sanitaria', 'Garantia extendida'],
      state: assetState(roomNumber, 3, status),
      tags: [...assetTags(roomNumber, 3, status), 'Preventivo'],
      maintenanceHistory: ['2026-03-30: purga interna.', '2026-06-20: ajuste de flotador.'],
      damageHistory: ['Sin fisuras.'],
    },
    {
      category: 'Baño',
      name: 'Caño de lavatorio',
      serial: `${prefix}-FCT-${seed % 67}`,
      brand: 'Forte',
      type: 'Griferia',
      details: 'Acabado cromado, aireador y llave de agua independiente.',
      description: 'Control de llaves, caños y accesorios sanitarios del baño.',
      acquisitionYear: 2022,
      documents: ['Factura sanitaria'],
      state: assetState(roomNumber, 4, status),
      tags: [...assetTags(roomNumber, 4, status), 'Griferia'],
      maintenanceHistory: ['2026-05-15: limpieza de sarro.', '2026-06-26: ajuste de llave.'],
      damageHistory: ['Sin filtraciones visibles.'],
    },
    {
      category: 'Mobiliario',
      name: 'Cortinas blackout',
      serial: `${prefix}-BLK-${seed % 61}`,
      brand: 'Casa Grande',
      type: 'Textil',
      details: 'Tela opaca, riel reforzado y lavado programado.',
      description: 'Conserva privacidad y aislamiento de luz.',
      acquisitionYear: 2024,
      documents: ['Orden de compra interna'],
      state: assetState(roomNumber, 5, status),
      tags: [...assetTags(roomNumber, 5, status), 'Textil'],
      maintenanceHistory: ['2026-06-05: lavado preventivo.'],
      damageHistory: ['Sin roturas.'],
    },
  ];
}

export function buildRoomProfile(roomNumber: string, status: RoomStatus): DemoRoomProfile {
  const seed = seedFrom(roomNumber);
  const currentReservation = currentReservationFor(roomNumber, status);
  const history = historyFor(roomNumber, status);

  return {
    summary: status === 'occupied'
      ? 'Cuarto con reserva activa y trazabilidad completa de huespedes, mantenimiento y activos.'
      : status === 'reserved'
      ? 'Cuarto bloqueado para llegada proxima con ficha operativa lista.'
      : status === 'maintenance'
      ? 'Cuarto fuera de venta con historial de incidentes y tareas de mantenimiento.'
      : 'Cuarto disponible con inventario actualizado y control visual activo.',
    currentReservation,
    reservationHistory: history,
    inventory: [
      { category: 'Dormitorio', items: assetTemplate(roomNumber, status).filter(asset => asset.category === 'Dormitorio') },
      { category: 'Tecnologia', items: assetTemplate(roomNumber, status).filter(asset => asset.category === 'Tecnologia') },
      { category: 'Baño', items: assetTemplate(roomNumber, status).filter(asset => asset.category === 'Baño') },
      { category: 'Mobiliario', items: assetTemplate(roomNumber, status).filter(asset => asset.category === 'Mobiliario') },
    ],
    tags: status === 'occupied'
      ? ['Reserva activa', 'Pago parcial', 'Control recepcion']
      : status === 'reserved'
      ? ['Bloqueado', 'Check-in programado']
      : status === 'maintenance'
      ? ['Necesita mantenimiento', 'Revisar inventario']
      : ['Disponible', 'Limpieza verificada'],
    alerts: status === 'maintenance'
      ? ['Revisar reporte de daños y acta de mantenimiento.']
      : status === 'cleaning'
      ? ['Esperar checklist de housekeeping antes de abrir venta.']
      : [`Ultima actualizacion de ficha: ${dateISO(addDays(new Date('2026-07-06T00:00:00.000Z'), -(seed % 4)))}`],
  };
}

interface WarehouseMeta {
  brand: string;
  type: string;
  flavor: string;
  container: string;
  presentation: string;
  color: string;
  quantityLabel: string;
  usedQuantityLabel: string;
  entryDate: string;
  expiryDate: string | null;
  useDate: string | null;
  unitValue: string;
  details: string;
  tags: string[];
  documents: string[];
  maintenanceHistory: string[];
  damageHistory: string[];
  state: string;
}

function warehouseMeta(item: InventoryItem, categoryName?: string): WarehouseMeta {
  const source = normalize([item.name, item.description || '', categoryName || ''].join(' '));
  const seed = seedFrom(item.name + (item.sku || ''));
  const current = Number(item.current_stock || 0);
  const used = Math.max(0, Math.min(current, Number((current * 0.25).toFixed(2))));
  const unitValue = item.unit_cost != null ? currency(Number(item.unit_cost)) : 'S/ 0.00';
  const commonDocs = ['Factura de compra', 'Guia de ingreso'];
  const commonTags = ['Inventario activo', categoryName || 'Sin categoria'];

  if (source.includes('papa amarilla')) {
    return {
      brand: 'Valle Andino',
      type: 'Tuberculo',
      flavor: 'Terroso y suave',
      container: 'Saco de rafia',
      presentation: '2 kg',
      color: 'Amarillo intenso',
      quantityLabel: `${current.toFixed(2)} ${item.unit}`,
      usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
      entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : '2026-07-02',
      expiryDate: '2026-07-18',
      useDate: '2026-07-06',
      unitValue,
      details: 'Papa para cocina y produccion de platos principales.',
      tags: [...commonTags, 'Cocina', 'Rotacion alta'],
      documents: commonDocs,
      maintenanceHistory: ['2026-07-05: revision de calidad y humedad.'],
      damageHistory: ['Sin daño visible.'],
      state: current <= Number(item.min_stock || 0) ? 'Reponer pronto' : 'Activo',
    };
  }

  if (source.includes('salsa de tomate')) {
    return {
      brand: 'La Huerta',
      type: 'Condimento',
      flavor: 'Umami',
      container: 'Lata',
      presentation: '50 gr',
      color: 'Rojo',
      quantityLabel: `${current.toFixed(2)} ${item.unit}`,
      usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
      entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : '2026-07-03',
      expiryDate: '2026-08-30',
      useDate: '2026-07-06',
      unitValue,
      details: 'Base para salsa y acompañamiento de recetas del restaurante.',
      tags: [...commonTags, 'Restaurante', 'Consumo diario'],
      documents: commonDocs,
      maintenanceHistory: ['2026-07-04: control de sellado.'],
      damageHistory: ['Sin abolladuras.'],
      state: 'Activo',
    };
  }

  if (source.includes('gaseosa')) {
    return {
      brand: 'Inca Cola',
      type: 'Bebida carbonatada',
      flavor: 'Citrico dulce',
      container: 'Botella de vidrio',
      presentation: '500 ml',
      color: 'Amarillo',
      quantityLabel: `${current.toFixed(2)} ${item.unit}`,
      usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
      entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : '2026-07-01',
      expiryDate: '2026-10-01',
      useDate: '2026-07-06',
      unitValue,
      details: 'Bebida para minibar, restaurant y pedidos a habitacion.',
      tags: [...commonTags, 'Minibar', 'Bebida'],
      documents: commonDocs,
      maintenanceHistory: ['2026-07-05: conteo y rotulado.'],
      damageHistory: ['Sin golpes.'],
      state: 'Activo',
    };
  }

  if (source.includes('agua')) {
    return {
      brand: 'Cielo',
      type: 'Agua mineral',
      flavor: 'Natural',
      container: 'Botella PET',
      presentation: '500 ml',
      color: 'Transparente',
      quantityLabel: `${current.toFixed(2)} ${item.unit}`,
      usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
      entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : '2026-07-01',
      expiryDate: '2027-01-12',
      useDate: '2026-07-06',
      unitValue,
      details: 'Agua para habitaciones, eventos y restaurante.',
      tags: [...commonTags, 'Agua', 'Rotacion media'],
      documents: commonDocs,
      maintenanceHistory: ['2026-07-05: conteo y lote revisado.'],
      damageHistory: ['Sin fugas.'],
      state: 'Activo',
    };
  }

  if (source.includes('toalla') || source.includes('saban') || source.includes('almohada')) {
    return {
      brand: 'Casa Grande Linen',
      type: 'Textil hotelero',
      flavor: 'N/A',
      container: 'Paquete',
      presentation: `${item.unit}`,
      color: 'Blanco',
      quantityLabel: `${current.toFixed(2)} ${item.unit}`,
      usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
      entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : '2026-06-28',
      expiryDate: null,
      useDate: null,
      unitValue,
      details: 'Textil de habitacion para rotacion diaria y control de lavanderia.',
      tags: [...commonTags, 'Housekeeping', 'Lavanderia'],
      documents: commonDocs,
      maintenanceHistory: ['2026-07-03: recuento de blancos.'],
      damageHistory: ['Sin rasgaduras.'],
      state: current <= Number(item.min_stock || 0) ? 'Reponer' : 'Activo',
    };
  }

  return {
    brand: categoryName || 'BlairCode Supply',
    type: item.unit || 'Unidad',
    flavor: 'Segun insumo',
    container: 'Presentacion variable',
    presentation: `${item.current_stock} ${item.unit}`,
    color: 'Variable',
    quantityLabel: `${current.toFixed(2)} ${item.unit}`,
    usedQuantityLabel: `${used.toFixed(2)} ${item.unit}`,
    entryDate: item.last_restocked_at ? dateISO(new Date(item.last_restocked_at)) : `2026-07-${String(1 + (seed % 6)).padStart(2, '0')}`,
    expiryDate: seed % 2 === 0 ? dateISO(addDays(new Date('2026-07-06T00:00:00.000Z'), 35 + (seed % 18))) : null,
    useDate: seed % 3 === 0 ? '2026-07-06' : null,
    unitValue,
    details: item.description || 'Descripcion general del insumo con control de lote y rotacion.',
    tags: [...commonTags, current <= Number(item.min_stock || 0) ? 'Stock bajo' : 'Stock sano'],
    documents: commonDocs,
    maintenanceHistory: ['2026-07-04: revision de lote y rotacion.'],
    damageHistory: ['Sin observaciones.'],
    state: current <= Number(item.min_stock || 0) ? 'Reponer' : 'Activo',
  };
}

export function enrichWarehouseItem(item: InventoryItem, categoryName?: string) {
  const meta = warehouseMeta(item, categoryName);
  return {
    ...meta,
    quantityLabel: meta.quantityLabel,
    usedQuantityLabel: meta.usedQuantityLabel,
    currentStock: Number(item.current_stock || 0),
    minimumStock: Number(item.min_stock || 0),
    maxStock: item.max_stock != null ? Number(item.max_stock) : null,
    unitCost: item.unit_cost != null ? Number(item.unit_cost) : null,
    sku: item.sku || `SKU-${seedFrom(item.name)}`,
    supplier: item.supplier || 'Proveedor local',
    location: item.location || 'Almacen general',
    unit: item.unit,
  };
}
