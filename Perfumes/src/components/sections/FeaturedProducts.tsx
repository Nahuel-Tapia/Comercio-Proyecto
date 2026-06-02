import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { PerfumeProduct } from '../../data/products';

export function ProductCard({ product }: { product: PerfumeProduct }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[2]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('cart:add', {
        detail: {
          id: `${product.id}-${selectedSize.label}`,
          name: `${product.name} (${selectedSize.label})`,
          category: product.category,
          price: selectedSize.price,
          image: product.image,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('toast', { 
        detail: { type: 'success', message: `${product.name} (${selectedSize.label}) añadido a tu bolsa` }
      })
    );
  };

  return (
    <div className="group cursor-pointer flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F3F0E9] rounded-xs">
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

      <div className="flex flex-col mt-4">
        <div className="flex justify-between items-baseline gap-4">
          <h3 className="font-serif text-lg text-brand-dark font-medium group-hover:text-brand-gold transition-colors duration-300">
            {product.name}
          </h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold text-brand-dark/85">
              ${selectedSize.price.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <select 
            value={selectedSize.label}
            onChange={(e) => {
              const size = product.sizes.find((s) => s.label === e.target.value);
              if (size) setSelectedSize(size);
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-transparent border-b border-brand-dark/10 text-brand-dark/70 focus:outline-none w-full pb-1"
          >
            {product.sizes.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center mt-2 gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-brand-dark/40 font-semibold">
            {product.category}
          </span>

          <button
            onClick={handleAddToCart}
            className="text-xs uppercase tracking-widest font-semibold text-brand-dark/75 hover:text-brand-dark border-b border-brand-dark/10 hover:border-brand-dark pb-0.5 transition-all duration-300"
          >
            Añadir +
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-brand-gold-light px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark/55 font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProducts({ products }: { products: PerfumeProduct[] }) {
  const featuredProducts = products.slice(0, 4);
  return (
    <section className="py-32 bg-brand-light border-t border-brand-dark/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-semibold mb-3 block">
            Selección Especial
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-brand-dark mb-4 font-light lowercase">
            colección destacada
          </h2>
          <div className="w-12 h-[1px] bg-brand-gold/60 mx-auto mb-6"></div>
          <p className="text-brand-dark/50 font-light text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Una selección cuidada de nuestras fragancias insignia. Notas profundas diseñadas para permanecer en la piel y en la memoria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <a
            href="/shop"
            className="group inline-flex items-center space-x-3 text-xs uppercase tracking-[0.25em] font-semibold text-brand-dark transition-colors"
          >
            <span>Ver toda la colección</span>
            <span className="h-[1px] bg-brand-dark w-8 group-hover:w-16 transition-all duration-300 ease-out"></span>
          </a>
        </div>
      </div>
    </section>
  );
}
