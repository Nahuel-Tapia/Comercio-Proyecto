export interface PerfumeProduct {
  id: string;
  name: string;
  category: 'Para Mujer' | 'Para Hombre' | 'Unisex';
  sizes: {
    label: string;
    price: number;
    stock?: number;
  }[];
  image: string;
  description: string;
  family: string;
  concentration: string;
  intensity: 'Suave' | 'Media' | 'Intensa';
  longevity: string;
  sillage: string;
  bestFor: string[];
  seasons: string[];
  tags: string[];
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  recommendation: string;
}

export const PRODUCTS: PerfumeProduct[] = [
  {
    id: '1',
    name: 'Éclat de Nuit',
    category: 'Para Mujer',
    sizes: [
      { label: '5ml', price: 5000 },
      { label: '10ml', price: 9000 },
      { label: 'Frasco Original', price: 45000 },
    ],
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
    description: 'Seductora y misteriosa. Una fragancia oriental floral para momentos inolvidables.',
    family: 'Oriental floral',
    concentration: 'Eau de Parfum',
    intensity: 'Intensa',
    longevity: '8 a 10 horas',
    sillage: 'Notoria',
    bestFor: ['Noche', 'Cita', 'Evento'],
    seasons: ['Otoño', 'Invierno'],
    tags: ['Dulce', 'Sensual', 'Vainilla', 'Café', 'Alta fijación'],
    notes: {
      top: ['Pimienta rosa', 'Café'],
      heart: ['Jazmín', 'Flor de azahar'],
      base: ['Vainilla', 'Pachulí', 'Ámbar'],
    },
    recommendation: 'Ideal si buscás una salida nocturna elegante, dulce y con mucha presencia.',
  },
  {
    id: '2',
    name: 'Oud Absolu',
    category: 'Unisex',
    sizes: [
      { label: '5ml', price: 6500 },
      { label: '10ml', price: 12000 },
      { label: 'Frasco Original', price: 58000 },
    ],
    image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?q=80&w=800&auto=format&fit=crop',
    description: 'Intensa y opulenta. Una joya olfativa que exalta la madera sagrada de oriente.',
    family: 'Amaderada oriental',
    concentration: 'Extrait de Parfum',
    intensity: 'Intensa',
    longevity: '10 a 12 horas',
    sillage: 'Profunda',
    bestFor: ['Noche', 'Evento', 'Firma personal'],
    seasons: ['Otoño', 'Invierno'],
    tags: ['Oud', 'Maderoso', 'Ámbar', 'Especiado', 'Lujo'],
    notes: {
      top: ['Azafrán', 'Cardamomo'],
      heart: ['Madera de oud', 'Rosa oscura'],
      base: ['Sándalo', 'Ámbar gris', 'Cuero'],
    },
    recommendation: 'Para quien quiere una fragancia protagonista, sofisticada y difícil de olvidar.',
  },
  {
    id: '3',
    name: 'Bois Sauvage',
    category: 'Para Hombre',
    sizes: [
      { label: '5ml', price: 4800 },
      { label: '10ml', price: 8500 },
      { label: 'Frasco Original', price: 42000 },
    ],
    image: 'https://images.unsplash.com/photo-1615397323389-913a830026a3?q=80&w=800&auto=format&fit=crop',
    description: 'Frescura indomable y masculina. Una composición cruda y noble a la vez.',
    family: 'Amaderada especiada',
    concentration: 'Eau de Parfum',
    intensity: 'Media',
    longevity: '7 a 9 horas',
    sillage: 'Moderada',
    bestFor: ['Oficina', 'Día', 'Salida casual'],
    seasons: ['Primavera', 'Otoño'],
    tags: ['Maderoso', 'Fresco', 'Especiado', 'Cedro', 'Vetiver'],
    notes: {
      top: ['Bergamota', 'Pimienta de Sichuan'],
      heart: ['Lavanda', 'Cedro'],
      base: ['Vetiver', 'Ambroxan', 'Pachulí'],
    },
    recommendation: 'Una opción segura para uso diario con carácter, frescura y elegancia.',
  },
  {
    id: '4',
    name: 'Rose Poudré',
    category: 'Para Mujer',
    sizes: [
      { label: '5ml', price: 4500 },
      { label: '10ml', price: 8000 },
      { label: 'Frasco Original', price: 39000 },
    ],
    image: 'https://images.unsplash.com/photo-1595532542520-50fa4bc07455?q=80&w=800&auto=format&fit=crop',
    description: 'Romántica y delicada. Un soplo de frescura empolvada clásica y tierna.',
    family: 'Floral almizclada',
    concentration: 'Eau de Parfum',
    intensity: 'Suave',
    longevity: '6 a 8 horas',
    sillage: 'Íntima',
    bestFor: ['Día', 'Oficina', 'Regalo'],
    seasons: ['Primavera', 'Verano'],
    tags: ['Floral', 'Rosa', 'Limpio', 'Suave', 'Almizcle'],
    notes: {
      top: ['Bergamota', 'Pétalos de rosa'],
      heart: ['Rosa de Grasse', 'Iris'],
      base: ['Almizcle blanco', 'Haba tonka'],
    },
    recommendation: 'Perfecta para regalar cuando buscás algo femenino, elegante y fácil de usar.',
  },
  {
    id: '5',
    name: "Soleil d'Or",
    category: 'Unisex',
    sizes: [
      { label: '5ml', price: 6000 },
      { label: '10ml', price: 10500 },
      { label: 'Frasco Original', price: 52000 },
    ],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
    description: 'Radiante y luminosa. Inspirada en los atardeceres dorados del Mediterráneo.',
    family: 'Solar floral',
    concentration: 'Eau de Parfum',
    intensity: 'Media',
    longevity: '7 a 9 horas',
    sillage: 'Moderada',
    bestFor: ['Día', 'Vacaciones', 'Regalo'],
    seasons: ['Primavera', 'Verano'],
    tags: ['Cítrico', 'Coco', 'Floral', 'Limpio', 'Verano'],
    notes: {
      top: ['Bergamota de Calabria', 'Mandarina'],
      heart: ['Flor de tiaré', 'Coco'],
      base: ['Almizcle', 'Maderas blancas'],
    },
    recommendation: 'Va muy bien si querés una fragancia luminosa, playera y elegante sin ser invasiva.',
  },
  {
    id: '6',
    name: 'Ambre Impérial',
    category: 'Unisex',
    sizes: [
      { label: '5ml', price: 7000 },
      { label: '10ml', price: 13000 },
      { label: 'Frasco Original', price: 64000 },
    ],
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
    description: 'Sofisticación y misticismo real. Una mezcla rica, resinosa y dulce.',
    family: 'Ambarada gourmand',
    concentration: 'Extrait de Parfum',
    intensity: 'Intensa',
    longevity: '10 a 12 horas',
    sillage: 'Notoria',
    bestFor: ['Noche', 'Evento', 'Cita'],
    seasons: ['Otoño', 'Invierno'],
    tags: ['Ámbar', 'Dulce', 'Vainilla', 'Resinoso', 'Alta fijación'],
    notes: {
      top: ['Pimienta rosa', 'Benjuí'],
      heart: ['Ámbar', 'Canela suave'],
      base: ['Vainilla de Madagascar', 'Lábdano'],
    },
    recommendation: 'Para quienes aman aromas cálidos, envolventes y con efecto segunda piel de lujo.',
  },
  {
    id: '7',
    name: 'Vétiver Bleu',
    category: 'Para Hombre',
    sizes: [
      { label: '5ml', price: 5200 },
      { label: '10ml', price: 9500 },
      { label: 'Frasco Original', price: 46000 },
    ],
    image: 'https://images.unsplash.com/photo-1588405748373-122b2321bc31?q=80&w=800&auto=format&fit=crop',
    description: 'Elegancia clásica y moderna. Un choque refrescante de cítricos y maderas nobles.',
    family: 'Aromática amaderada',
    concentration: 'Eau de Parfum',
    intensity: 'Media',
    longevity: '7 a 8 horas',
    sillage: 'Moderada',
    bestFor: ['Oficina', 'Día', 'Firma personal'],
    seasons: ['Primavera', 'Verano'],
    tags: ['Fresco', 'Cítrico', 'Vetiver', 'Menta', 'Limpio'],
    notes: {
      top: ['Pomelo', 'Menta fresca'],
      heart: ['Vetiver de Haití', 'Salvia'],
      base: ['Cedro', 'Almizcle limpio'],
    },
    recommendation: 'Una fragancia pulida, fresca y profesional para usar sin pensarlo demasiado.',
  },
  {
    id: '8',
    name: 'Jasmin Absolu',
    category: 'Para Mujer',
    sizes: [
      { label: '5ml', price: 5500 },
      { label: '10ml', price: 10000 },
      { label: 'Frasco Original', price: 48000 },
    ],
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop',
    description: 'Pureza floral absoluta. La sensualidad de un ramo recién cortado bajo el rocío.',
    family: 'Floral blanco',
    concentration: 'Eau de Parfum',
    intensity: 'Media',
    longevity: '7 a 9 horas',
    sillage: 'Elegante',
    bestFor: ['Día', 'Cita', 'Regalo'],
    seasons: ['Primavera', 'Verano'],
    tags: ['Floral', 'Jazmín', 'Limpio', 'Femenino', 'Azahar'],
    notes: {
      top: ['Flor de azahar', 'Mandarina'],
      heart: ['Jazmín sambac', 'Nardos'],
      base: ['Almizcle blanco', 'Maderas suaves'],
    },
    recommendation: 'Si te gustan los florales limpios y sensuales, este es el punto medio perfecto.',
  },
];

export const allProductNotes = (product: PerfumeProduct) => [
  ...product.notes.top,
  ...product.notes.heart,
  ...product.notes.base,
];

export const productSearchText = (product: PerfumeProduct) =>
  [
    product.name,
    product.category,
    product.description,
    product.family,
    product.concentration,
    product.intensity,
    product.longevity,
    product.sillage,
    product.recommendation,
    ...product.bestFor,
    ...product.seasons,
    ...product.tags,
    ...allProductNotes(product),
  ]
    .join(' ')
    .toLowerCase();
