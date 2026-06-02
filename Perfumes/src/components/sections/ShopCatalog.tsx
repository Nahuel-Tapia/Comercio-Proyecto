import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCompare, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import {
  allProductNotes,
  productSearchText,
  type PerfumeProduct,
} from '../../data/products';

const CATEGORIES = ['Todos', 'Para Mujer', 'Para Hombre', 'Unisex'];

const FILTERS = [
  'Dulce',
  'Fresco',
  'Floral',
  'Maderoso',
  'Cítrico',
  'Ámbar',
  'Vainilla',
  'Limpio',
  'Noche',
  'Oficina',
  'Regalo',
  'Alta fijación',
];

const QUIZ_STEPS = [
  {
    id: 'occasion',
    label: '¿Para qué momento lo querés?',
    options: ['Día', 'Noche', 'Oficina', 'Cita', 'Regalo'],
  },
  {
    id: 'style',
    label: '¿Qué vibra te atrae más?',
    options: ['Dulce', 'Fresco', 'Floral', 'Maderoso', 'Limpio'],
  },
  {
    id: 'intensity',
    label: '¿Qué intensidad preferís?',
    options: ['Suave', 'Media', 'Intensa'],
  },
  {
    id: 'category',
    label: '¿Para quién es?',
    options: ['Para Mujer', 'Para Hombre', 'Unisex'],
  },
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const cartPayload = (product: PerfumeProduct, sizeLabel: string, price: number) => ({
  id: `${product.id}-${sizeLabel}`,
  productId: product.id,
  sizeLabel,
  name: `${product.name} (${sizeLabel})`,
  category: product.category,
  price,
  image: product.image,
});

const addToCart = (product: PerfumeProduct, sizeLabel: string, price: number) => {
  window.dispatchEvent(new CustomEvent('cart:add', { detail: cartPayload(product, sizeLabel, price) }));
  window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: `${product.name} (${sizeLabel}) añadido a tu bolsa` }}));
};

const scoreProduct = (product: PerfumeProduct, quizAnswers: Record<string, string>) => {
  const terms = normalizeText(productSearchText(product));

  return Object.values(quizAnswers).reduce((score, answer) => {
    if (!answer) return score;
    const normalizedAnswer = normalizeText(answer);
    if (product.category === answer) return score + 3;
    if (product.intensity === answer) return score + 2;
    if (product.bestFor.includes(answer)) return score + 3;
    if (product.tags.includes(answer)) return score + 3;
    return terms.includes(normalizedAnswer) ? score + 1 : score;
  }, 0);
};

function QuizPanel({
  quizAnswers,
  onSelect,
  onReset,
  recommendedProducts,
  onOpenProduct,
}: {
  quizAnswers: Record<string, string>;
  onSelect: (stepId: string, value: string) => void;
  onReset: () => void;
  recommendedProducts: PerfumeProduct[];
  onOpenProduct: (product: PerfumeProduct) => void;
}) {
  const answeredCount = Object.values(quizAnswers).filter(Boolean).length;

  return (
    <section className="bg-[#F3F0E9] border border-brand-dark/5 p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={18} strokeWidth={1.3} className="text-brand-gold" />
            <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold">
              asesor olfativo
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-brand-dark font-light lowercase">
            encontrá tu fragancia
          </h2>
          <p className="text-sm text-brand-dark/60 leading-relaxed font-light mt-4 max-w-md">
            Respondé unas preguntas rápidas y te mostramos las opciones más alineadas a tu gusto, ocasión e intensidad.
          </p>
          {answeredCount > 0 && (
            <button
              onClick={onReset}
              className="mt-6 text-xs uppercase tracking-widest text-brand-dark/50 hover:text-brand-dark border-b border-brand-dark/15 hover:border-brand-dark pb-0.5 transition-colors"
            >
              Reiniciar quiz
            </button>
          )}
        </div>

        <div className="space-y-6">
          {QUIZ_STEPS.map((step) => (
            <div key={step.id}>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/50 font-semibold mb-3">
                {step.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {step.options.map((option) => {
                  const isSelected = quizAnswers[step.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => onSelect(step.id, option)}
                      className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition-all duration-300 ${
                        isSelected
                          ? 'bg-brand-dark text-brand-white border-brand-dark'
                          : 'bg-brand-white/50 text-brand-dark/60 border-brand-dark/10 hover:border-brand-dark/35 hover:text-brand-dark'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {answeredCount > 0 && (
        <div className="mt-10 pt-8 border-t border-brand-dark/5">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h3 className="font-serif text-2xl text-brand-dark font-light lowercase">
              recomendados para vos
            </h3>
            <span className="text-[11px] uppercase tracking-[0.22em] text-brand-dark/40 font-semibold">
              {answeredCount}/{QUIZ_STEPS.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onOpenProduct(product)}
                className="text-left bg-brand-white/55 hover:bg-brand-white border border-brand-dark/5 p-4 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-semibold">
                  {product.family}
                </span>
                <div className="flex items-baseline justify-between gap-3 mt-2">
                  <h4 className="font-serif text-xl text-brand-dark">{product.name}</h4>
                  <span className="text-xs font-semibold text-brand-dark/70">
                    Desde ${product.sizes[0].price.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-xs text-brand-dark/55 leading-relaxed font-light mt-2">
                  {product.recommendation}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: PerfumeProduct;
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[2] || product.sizes[0]);

  const details: Array<[string, string]> = [
    ['Concentración', product.concentration],
    ['Intensidad', product.intensity],
    ['Duración', product.longevity],
    ['Estela', product.sillage],
  ];
  const noteGroups: Array<[string, string[]]> = [
    ['Salida', product.notes.top],
    ['Corazón', product.notes.heart],
    ['Fondo', product.notes.base],
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-brand-dark/30 backdrop-blur-sm p-4 md:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          className="relative bg-brand-light max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] min-h-[640px] shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-brand-white/80 text-brand-dark/55 hover:text-brand-dark transition-colors"
            aria-label="Cerrar ficha"
          >
            <X size={20} strokeWidth={1.3} />
          </button>

          <div className="relative min-h-[380px] bg-brand-gold-light">
            <img src={product.image} alt={product.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          <div className="p-7 md:p-10 flex flex-col">
            <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold">
              {product.family}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mt-3">
              <h2 className="font-serif text-4xl md:text-5xl text-brand-dark font-light">
                {product.name}
              </h2>
              <div className="flex flex-col items-end gap-2">
                <span className="font-serif text-2xl text-brand-dark">
                  ${selectedSize.price.toLocaleString('es-AR')}
                </span>
                <select 
                  value={selectedSize.label}
                  onChange={(e) => {
                    const size = product.sizes.find(s => s.label === e.target.value);
                    if (size) setSelectedSize(size);
                  }}
                  className="text-sm bg-transparent border-b border-brand-dark/10 text-brand-dark/70 focus:outline-none"
                >
                  {product.sizes.map(s => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-brand-dark/62 leading-relaxed font-light mt-5">
              {product.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
              {details.map(([label, value]) => (
                <div key={label} className="border border-brand-dark/5 bg-brand-white/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-dark/35 font-semibold">
                    {label}
                  </p>
                  <p className="text-sm text-brand-dark/75 mt-1">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
              {noteGroups.map(([label, notes]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/45 font-semibold mb-2">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((note) => (
                      <span key={note} className="bg-brand-gold-light px-2.5 py-1 text-[11px] text-brand-dark/65">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm text-brand-dark/65 leading-relaxed font-light">
                {product.recommendation}
              </p>
              <div className="flex flex-wrap gap-2">
                {[...product.bestFor, ...product.seasons, ...product.tags.slice(0, 4)].map((tag) => (
                  <span
                    key={tag}
                    className="border border-brand-dark/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark/50 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                addToCart(product, selectedSize.label, selectedSize.price);
                onClose();
              }}
              className="mt-auto w-full bg-brand-dark text-brand-white py-4 uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold transition-colors duration-300"
            >
              Añadir a la bolsa
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CompareModal({
  products,
  onClose,
}: {
  products: PerfumeProduct[];
  onClose: () => void;
}) {
  const rows: Array<[string, (product: PerfumeProduct) => string]> = [
    ['Familia', (product) => product.family],
    ['Intensidad', (product) => product.intensity],
    ['Duración', (product) => product.longevity],
    ['Estela', (product) => product.sillage],
    ['Mejor para', (product) => product.bestFor.join(', ')],
    ['Temporada', (product) => product.seasons.join(', ')],
    ['Notas clave', (product) => allProductNotes(product).slice(0, 6).join(', ')],
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] bg-brand-dark/30 backdrop-blur-sm p-4 md:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="bg-brand-light max-w-5xl mx-auto p-6 md:p-8 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold">
                comparador
              </span>
              <h2 className="font-serif text-3xl text-brand-dark font-light lowercase mt-2">
                compará antes de elegir
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-dark/45 hover:text-brand-dark transition-colors"
              aria-label="Cerrar comparador"
            >
              <X size={22} strokeWidth={1.3} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {products.map((product) => (
              <div key={product.id} className="border border-brand-dark/5 bg-brand-white/45 p-4">
                <img src={product.image} alt={product.name} className="h-56 w-full object-cover bg-brand-gold-light mb-4" />
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-2xl text-brand-dark">{product.name}</h3>
                  <span className="text-sm font-semibold text-brand-dark/75">
                    Desde ${product.sizes[0].price.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-sm text-brand-dark/55 leading-relaxed mt-3">{product.recommendation}</p>
              </div>
            ))}
          </div>

          <div className="border border-brand-dark/5 divide-y divide-brand-dark/5">
            {rows.map(([label, getValue]) => (
              <div key={label} className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr]">
                <div className="bg-brand-gold-light/70 p-4 text-xs uppercase tracking-[0.18em] text-brand-dark/45 font-semibold">
                  {label}
                </div>
                {products.map((product) => (
                  <div key={`${product.id}-${label}`} className="p-4 text-sm text-brand-dark/70">
                    {getValue(product)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CompareBar({
  products,
  onOpen,
  onRemove,
  onClear,
}: {
  products: PerfumeProduct[];
  onOpen: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (products.length === 0) return null;

  return (
    <div className="fixed left-4 right-4 bottom-4 z-[60] bg-brand-dark text-brand-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GitCompare size={18} strokeWidth={1.3} className="text-brand-gold" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold">
            {products.length}/2 para comparar
          </span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onRemove(product.id)}
              className="bg-brand-white/10 hover:bg-brand-white/15 px-3 py-2 text-xs text-brand-white/85 transition-colors"
            >
              {product.name} ×
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClear}
            className="text-xs uppercase tracking-widest text-brand-white/45 hover:text-brand-white transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={onOpen}
            disabled={products.length < 2}
            className="bg-brand-white text-brand-dark px-5 py-3 text-xs uppercase tracking-widest font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-gold hover:text-brand-white transition-colors"
          >
            Comparar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopCatalog({ products }: { products: PerfumeProduct[] }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<PerfumeProduct | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const recommendedProducts = useMemo(() => {
    return [...products]
      .map((product) => ({ product, score: scoreProduct(product, quizAnswers) }))
      .sort((first, second) => second.score - first.score)
      .slice(0, 3)
      .map(({ product }) => product);
  }, [quizAnswers]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchQuery.trim());

    return products.filter((product) => {
      const searchableText = normalizeText(productSearchText(product));
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesFilters = selectedFilters.every((filter) =>
        searchableText.includes(normalizeText(filter))
      );

      return matchesCategory && matchesSearch && matchesFilters;
    });
  }, [selectedCategory, searchQuery, selectedFilters]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const compareProducts = useMemo(
    () => compareIds.map((id) => products.find((product) => product.id === id)).filter(Boolean) as PerfumeProduct[],
    [compareIds]
  );

  const toggleFilter = (filter: string) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
    setVisibleCount(12);
  };

  const toggleCompare = (product: PerfumeProduct) => {
    setCompareIds((current) => {
      if (current.includes(product.id)) return current.filter((id) => id !== product.id);
      if (current.length >= 2) return [current[1], product.id];
      return [...current, product.id];
    });
  };

  return (
    <div className="space-y-16 pb-24">
      <QuizPanel
        quizAnswers={quizAnswers}
        onSelect={(stepId, value) => setQuizAnswers((current) => ({ ...current, [stepId]: value }))}
        onReset={() => setQuizAnswers({})}
        recommendedProducts={recommendedProducts}
        onOpenProduct={setSelectedProduct}
      />

      <div className="space-y-7 pb-7 border-b border-brand-dark/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={16} strokeWidth={1.3} className="text-brand-gold" />
            <span className="text-xs uppercase tracking-[0.25em] text-brand-dark/55 font-semibold">
              filtrar colección
            </span>
          </div>

          <div className="relative w-full md:max-w-xs border-b border-brand-dark/20 pb-1.5">
            <input
              type="text"
              placeholder="Buscar por aroma, nota u ocasión..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent pl-8 pr-2 py-1 text-sm focus:outline-none placeholder-brand-dark/30 font-light"
            />
            <Search size={14} className="absolute left-1 top-1/2 -translate-y-1/2 text-brand-dark/40" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs uppercase tracking-[0.25em] transition-all duration-300 relative py-1 font-semibold ${
                selectedCategory === category
                  ? 'text-brand-dark after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-brand-dark'
                  : 'text-brand-dark/40 hover:text-brand-dark'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isSelected = selectedFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-2 text-[11px] uppercase tracking-[0.16em] border transition-all duration-300 ${
                  isSelected
                    ? 'bg-brand-dark text-brand-white border-brand-dark'
                    : 'bg-transparent text-brand-dark/50 border-brand-dark/10 hover:border-brand-dark/30 hover:text-brand-dark'
                }`}
              >
                {filter}
              </button>
            );
          })}
          {selectedFilters.length > 0 && (
            <button
              onClick={() => setSelectedFilters([])}
              className="px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-brand-dark/40 hover:text-brand-dark transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-brand-white/20 border border-brand-dark/5 rounded-xs">
          <p className="text-brand-dark/40 text-xs sm:text-sm font-light">
            No encontramos fragancias que coincidan con tu búsqueda.
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16"
        >
          <AnimatePresence mode="popLayout">
            {displayedProducts.map((product) => {
              const isCompared = compareIds.includes(product.id);

              return (
                <motion.article
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  className="group flex flex-col bg-transparent"
                >
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="text-left flex flex-col flex-grow"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#F3F0E9] rounded-xs mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[0.25,1,0.5,1] group-hover:scale-102"
                      />
                      <div className="absolute inset-0 bg-brand-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute left-3 top-3 bg-brand-white/85 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-dark/70 font-semibold">
                        {product.intensity}
                      </div>
                    </div>

                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline gap-4">
                          <h3 className="font-serif text-lg text-brand-dark font-medium group-hover:text-brand-gold transition-colors duration-300">
                            {product.name}
                          </h3>
                          <span className="text-sm font-semibold text-brand-dark/85">
                            Desde ${product.sizes[0].price.toLocaleString('es-AR')}
                          </span>
                        </div>

                        <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/40 mt-1 mb-2 font-semibold">
                          {product.family}
                        </p>

                        <p className="text-sm text-brand-dark/60 font-light leading-relaxed mb-4 line-clamp-2 h-10">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-brand-gold-light px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark/55 font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3.5 border-t border-brand-dark/5 mt-auto">
                        <p className="text-xs uppercase tracking-wider text-brand-gold font-medium truncate">
                          Notas: {allProductNotes(product).slice(0, 4).join(', ')}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, product.sizes[2].label, product.sizes[2].price);
                      }}
                      className="text-xs uppercase tracking-widest font-semibold text-brand-dark/75 hover:text-brand-dark border-b border-brand-dark/10 hover:border-brand-dark pb-0.5 transition-all duration-300"
                    >
                      Añadir +
                    </button>
                    <button
                      onClick={() => toggleCompare(product)}
                      className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold transition-colors ${
                        isCompared ? 'text-brand-gold' : 'text-brand-dark/45 hover:text-brand-dark'
                      }`}
                    >
                      <GitCompare size={13} strokeWidth={1.4} />
                      {isCompared ? 'Quitar' : 'Comparar'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {filteredProducts.length > visibleCount && (
        <div className="flex justify-center mt-12 pt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="border border-brand-dark px-10 py-3 text-xs uppercase tracking-widest text-brand-dark font-semibold hover:bg-brand-dark hover:text-brand-white transition-colors duration-300"
          >
            Cargar más fragancias
          </button>
        </div>
      )}

      <CompareBar
        products={compareProducts}
        onOpen={() => setIsCompareOpen(true)}
        onRemove={(id) => setCompareIds((current) => current.filter((item) => item !== id))}
        onClear={() => setCompareIds([])}
      />

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {isCompareOpen && compareProducts.length >= 2 && (
        <CompareModal products={compareProducts} onClose={() => setIsCompareOpen(false)} />
      )}
    </div>
  );
}
