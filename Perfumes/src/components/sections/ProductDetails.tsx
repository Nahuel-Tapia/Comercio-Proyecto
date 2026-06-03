import React, { useState, useEffect } from 'react';
import type { PerfumeProduct } from '../../data/products';

export default function ProductDetails({ 
  product, 
  relatedProducts = [] 
}: { 
  product: PerfumeProduct; 
  relatedProducts?: PerfumeProduct[]; 
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[product.sizes.length - 1] || product.sizes[0]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ client_name: '', email: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReviews = () => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          client_name: newReview.client_name,
          email: newReview.email,
          rating: Number(newReview.rating),
          comment: newReview.comment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Reseña enviada con éxito. Se mostrará cuando sea aprobada.');
        setNewReview({ client_name: '', email: '', rating: 5, comment: '' });
      } else {
        setErrorMsg(data.error || 'Error al enviar reseña');
      }
    } catch (err) {
      setErrorMsg('Error de red al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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

      {/* Sección de Reseñas de Clientes */}
      <div className="pt-16 border-t border-brand-dark/5 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-start">
          {/* Columna Izquierda: Promedio e Ingreso de Opinión */}
          <div className="space-y-8 bg-brand-light/35 p-8 border border-brand-dark/5">
            <div>
              <h3 className="text-xs uppercase tracking-[0.25em] text-brand-dark/80 font-bold mb-4">Opiniones de Clientes</h3>
              {averageRating ? (
                <div className="flex items-center gap-4">
                  <span className="font-serif text-5xl text-brand-dark font-medium">{averageRating}</span>
                  <div>
                    <div className="flex text-brand-gold text-lg">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < Math.round(Number(averageRating)) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-brand-dark/40 font-semibold">Basado en {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-dark/40 italic">Aún no hay opiniones de este producto. ¡Sé el primero en calificarlo!</p>
              )}
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 pt-6 border-t border-brand-dark/5">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-brand-dark/65 font-bold">Escribir una Reseña</h4>
              
              {successMsg && (
                <div className="p-3 bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-brand-dark/50 font-semibold mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={newReview.client_name}
                  onChange={e => setNewReview(prev => ({ ...prev, client_name: e.target.value }))}
                  required
                  placeholder="Ej: Sofía L."
                  className="w-full bg-brand-white border border-brand-dark/10 px-3 py-2 text-xs text-brand-dark focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-brand-dark/50 font-semibold mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newReview.email}
                  onChange={e => setNewReview(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Ej: sofia@mail.com"
                  className="w-full bg-brand-white border border-brand-dark/10 px-3 py-2 text-xs text-brand-dark focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-brand-dark/50 font-semibold mb-1">Calificación</label>
                <div className="flex gap-1.5 text-xl cursor-pointer">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: i + 1 }))}
                      className={`${i < newReview.rating ? 'text-brand-gold' : 'text-brand-dark/20'} transition-colors hover:scale-110 focus:outline-none`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-brand-dark/50 font-semibold mb-1">Comentario</label>
                <textarea 
                  value={newReview.comment}
                  onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Comparte tu experiencia con la fragancia..."
                  className="w-full bg-brand-white border border-brand-dark/10 px-3 py-2 text-xs text-brand-dark focus:outline-none focus:border-brand-gold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-dark text-brand-white py-3 uppercase tracking-widest text-[10px] font-semibold hover:bg-brand-gold transition-colors duration-300 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar opinión'}
              </button>
            </form>
          </div>

          {/* Columna Derecha: Listado de Comentarios Aprobados */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.25em] text-brand-dark/80 font-bold">Opiniones Compartidas</h3>
            
            {reviews.length === 0 ? (
              <p className="text-xs text-brand-dark/50 italic py-8">Aún no hay comentarios publicados sobre esta fragancia.</p>
            ) : (
              <div className="divide-y divide-brand-dark/5">
                {reviews.map((review) => {
                  const formattedDate = new Date(review.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  });
                  return (
                    <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <span className="font-serif font-semibold text-brand-dark block sm:inline mr-2">{review.client_name}</span>
                          <span className="text-[9px] uppercase tracking-wider text-brand-dark/40 font-semibold">{formattedDate}</span>
                        </div>
                        <div className="flex text-brand-gold text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-brand-dark/70 font-light leading-relaxed font-serif italic">
                        "{review.comment}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
