import React, { useState } from 'react';
import type { PerfumeProduct } from '../../data/products';

export default function ProductDetails({ 
  product, 
  relatedProducts = [] 
}: { 
  product: PerfumeProduct; 
  relatedProducts?: PerfumeProduct[]; 
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[product.sizes.length - 1] || product.sizes[0]);

  const handleAddToCart = () => {
    window.dispatchEvent(
      new CustomEvent('cart:add', {
        detail: {
          id: `${product.id}-${selectedSize.label}`,
          productId: product.id,
          sizeLabel: selectedSize.label,
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

  const details = [
    ['Concentración', product.concentration],
    ['Intensidad', product.intensity],
    ['Duración', product.longevity],
    ['Estela', product.sillage],
  ];

  const noteGroups = [
    ['Salida', product.notes?.top || []],
    ['Corazón', product.notes?.heart || []],
    ['Fondo', product.notes?.base || []],
  ];

  return (
    <div className="space-y-24">
      {/* Detalle de producto principal */}
      <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-12 md:gap-16 items-start">
        {/* Imagen */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F3F0E9] rounded-xs shadow-sm">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-[1.5s] hover:scale-102"
          />
          <div className="absolute left-4 top-4 bg-brand-white/85 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-dark/70 font-semibold">
            {product.intensity}
          </div>
        </div>

        {/* Detalles */}
        <div className="flex flex-col h-full space-y-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-semibold">
              {product.family}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mt-3">
              <h1 className="font-serif text-4xl md:text-5xl text-brand-dark font-light">
                {product.name}
              </h1>
              <div className="flex flex-col items-end gap-1">
                <span className="font-serif text-2xl text-brand-dark font-medium">
                  ${selectedSize.price.toLocaleString('es-AR')}
                </span>
                <select 
                  value={selectedSize.label}
                  onChange={(e) => {
                    const size = product.sizes.find(s => s.label === e.target.value);
                    if (size) setSelectedSize(size);
                  }}
                  className="text-xs bg-transparent border-b border-brand-dark/15 text-brand-dark/75 focus:outline-none pb-0.5 cursor-pointer"
                >
                  {product.sizes.map(s => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="text-sm text-brand-dark/65 leading-relaxed font-light">
            {product.description}
          </p>

          {/* Características */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {details.map(([label, value]) => (
              <div key={label} className="border border-brand-dark/5 bg-brand-white/35 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-dark/35 font-semibold">
                  {label}
                </p>
                <p className="text-xs font-semibold text-brand-dark/75 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Notas Olfativas */}
          <div className="space-y-4 pt-4 border-t border-brand-dark/5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-brand-dark/85 font-semibold">
              Acorde Olfativo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {noteGroups.map(([label, notes]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-dark/45 font-semibold mb-2">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {notes.map((note) => (
                      <span key={note} className="bg-brand-gold-light px-2.5 py-1 text-[11px] text-brand-dark/65 font-medium">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendación y Ocasión */}
          <div className="space-y-4 pt-4 border-t border-brand-dark/5">
            <p className="text-xs text-brand-dark/65 leading-relaxed font-light italic">
              * {product.recommendation}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...product.bestFor, ...product.seasons, ...(product.tags || []).slice(0, 4)].map((tag) => (
                <span
                  key={tag}
                  className="border border-brand-dark/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-brand-dark/50 font-semibold bg-brand-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-brand-dark text-brand-white py-4 uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold transition-colors duration-300 shadow-sm"
          >
            Añadir a la bolsa
          </button>
        </div>
      </div>

      {/* Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="pt-16 border-t border-brand-dark/5 space-y-12">
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-semibold mb-2 block">
              Quizás te interese
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-brand-dark font-light lowercase">
              fragancias sugeridas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {relatedProducts.map((p) => {
              const defSize = p.sizes[p.sizes.length - 1] || p.sizes[0];
              return (
                <a 
                  key={p.id} 
                  href={`/product/${p.id}`}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#F3F0E9] rounded-xs mb-4">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-102"
                    />
                    <div className="absolute left-3 top-3 bg-brand-white/85 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-brand-dark/70 font-semibold">
                      {p.intensity}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <h3 className="font-serif text-lg text-brand-dark group-hover:text-brand-gold transition-colors">
                      {p.name}
                    </h3>
                    <span className="text-xs font-semibold text-brand-dark/80">
                      Desde ${defSize.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-brand-gold font-semibold mt-1">
                    {p.family}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
