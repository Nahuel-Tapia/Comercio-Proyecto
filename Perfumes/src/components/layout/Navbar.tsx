import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { PRODUCTS, productSearchText, type PerfumeProduct } from '../../data/products';
import { SITE } from '../../data/site';
import { cn } from '../../lib/utils';
import SlideCart from './SlideCart';
import type { CartItem } from './SlideCart';

const navLinks = [
  { name: 'Inicio', href: '/' },
  { name: 'Catálogo', href: '/shop' },
  { name: 'Nosotros', href: '/about' },
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const cartPayload = (product: PerfumeProduct) => {
  const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[product.sizes.length - 1] : { label: 'Original', price: 0 };
  return {
    id: `${product.id}-${defaultSize.label}`,
    productId: product.id,
    sizeLabel: defaultSize.label,
    name: `${product.name} (${defaultSize.label})`,
    category: product.category,
    price: defaultSize.price,
    image: product.image,
  };
};

function SearchOverlay({
  isOpen,
  onClose,
  products = PRODUCTS,
}: {
  isOpen: boolean;
  onClose: () => void;
  products?: PerfumeProduct[];
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return products.slice(0, 4);

    return products.filter((product) =>
      normalizeText(productSearchText(product)).includes(normalizedQuery)
    ).slice(0, 6);
  }, [query, products]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-brand-dark/25 backdrop-blur-sm p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="bg-brand-light max-w-4xl mx-auto p-6 md:p-8 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-6 mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold">
                  búsqueda olfativa
                </span>
                <h2 className="font-serif text-3xl text-brand-dark font-light lowercase mt-2">
                  encontrá por nota, mood u ocasión
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-brand-dark/45 hover:text-brand-dark transition-colors"
                aria-label="Cerrar búsqueda"
              >
                <X size={22} strokeWidth={1.3} />
              </button>
            </div>

            <div className="relative border-b border-brand-dark/20 pb-2 mb-8">
              <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-dark/40" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Probá con vainilla, oficina, noche, fresco..."
                className="w-full bg-transparent pl-8 pr-2 py-2 text-base focus:outline-none placeholder-brand-dark/35 font-light"
              />
            </div>

            {results.length === 0 ? (
              <div className="py-12 text-center text-sm text-brand-dark/45">
                No encontramos coincidencias. Probá con otra nota o visitá el catálogo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[76px_1fr] gap-4 border border-brand-dark/5 bg-brand-white/45 p-3"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-full object-cover bg-brand-gold-light"
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <a
                          href="/shop"
                          onClick={onClose}
                          className="font-serif text-xl text-brand-dark hover:text-brand-gold transition-colors"
                        >
                          {product.name}
                        </a>
                        <span className="text-xs font-semibold text-brand-dark/65">
                          ${(product.sizes[0]?.price || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold font-semibold mt-1">
                        {product.family}
                      </p>
                      <p className="text-xs text-brand-dark/55 leading-relaxed mt-2 line-clamp-2">
                        {product.recommendation}
                      </p>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('cart:add', { detail: cartPayload(product) }))}
                        className="mt-3 text-[11px] uppercase tracking-widest font-semibold text-brand-dark/70 hover:text-brand-dark border-b border-brand-dark/10 hover:border-brand-dark pb-0.5 transition-all"
                      >
                        Añadir +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <a
                href="/shop"
                onClick={onClose}
                className="text-xs uppercase tracking-[0.25em] font-semibold text-brand-dark hover:text-brand-gold transition-colors"
              >
                abrir catálogo completo
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar({ products = PRODUCTS }: { products?: PerfumeProduct[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [bannerText, setBannerText] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.header_banner) setBannerText(data.header_banner);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem('le_desir_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage', error);
      }
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('le_desir_cart', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
  };

  const handleAddItem = (item: Omit<CartItem, 'quantity'>) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);
    const newItems = existingItem
      ? cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      : [...cartItems, { ...item, quantity: 1 }];

    saveCart(newItems);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    saveCart(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (id: string) => {
    saveCart(cartItems.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const handleAddEvent = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<CartItem, 'quantity'>>;
      if (customEvent.detail) handleAddItem(customEvent.detail);
    };

    window.addEventListener('cart:add', handleAddEvent);
    return () => window.removeEventListener('cart:add', handleAddEvent);
  }, [cartItems]);

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out',
          isScrolled
            ? 'bg-brand-white/80 backdrop-blur-md border-b border-brand-dark/5'
            : 'bg-transparent'
        )}
      >
        {bannerText && (
          <div className="bg-brand-dark text-brand-gold text-[9px] sm:text-[10px] uppercase tracking-widest py-1.5 text-center font-semibold border-b border-brand-gold/10">
            {bannerText}
          </div>
        )}
        <div className={cn('container mx-auto px-4 md:px-8 transition-all duration-500', isScrolled ? 'py-3.5' : 'py-5')}>
          <div className="flex items-center justify-between relative">
            <button
              className="md:hidden text-brand-dark/70 hover:text-brand-dark transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} strokeWidth={1.2} />
            </button>

            <nav className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[13px] uppercase tracking-[0.25em] text-brand-dark/70 hover:text-brand-dark transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-brand-dark after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300 font-medium"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <a href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
              <span className="font-serif text-2xl md:text-3xl tracking-[0.25em] uppercase text-brand-dark font-medium transition-colors">
                {SITE.brand.toLowerCase()}
              </span>
            </a>

            <div className="flex items-center space-x-5">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors p-1"
                aria-label="Buscar"
              >
                <Search size={20} strokeWidth={1.2} />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors relative p-1"
                aria-label="Carrito"
              >
                <ShoppingBag size={20} strokeWidth={1.2} />
                {totalQuantity > 0 && (
                  <span className="absolute -top-0.5 -right-1 bg-brand-dark text-brand-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-semibold">
                    {totalQuantity}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-brand-dark/15 backdrop-blur-xs z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-brand-light z-50 shadow-sm flex flex-col p-8 md:hidden"
              >
                <div className="flex justify-between items-center mb-16">
                  <span className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-dark font-medium">
                    {SITE.brand.toLowerCase()}
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-brand-dark/50 hover:text-brand-dark"
                    aria-label="Cerrar menú"
                  >
                    <X size={22} strokeWidth={1.2} />
                  </button>
                </div>
                <nav className="flex flex-col space-y-8 flex-grow">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-xl uppercase tracking-[0.2em] font-serif text-brand-dark/85 hover:text-brand-dark transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} />
      <SlideCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => saveCart([])}
      />
    </>
  );
}
