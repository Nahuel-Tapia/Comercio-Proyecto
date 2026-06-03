import React, { useState, useEffect } from 'react';
import type { PerfumeProduct } from '../../data/products';

function ProductFormModal({ 
  product, 
  onClose, 
  onSave 
}: { 
  product: Partial<PerfumeProduct>, 
  onClose: () => void, 
  onSave: (prod: Partial<PerfumeProduct>, file?: File) => void 
}) {
  const [formData, setFormData] = useState<Partial<PerfumeProduct>>({
    name: product.name || '',
    category: product.category || 'Unisex',
    family: product.family || '',
    image: product.image || '',
    description: product.description || '',
    concentration: product.concentration || '',
    recommendation: product.recommendation || '',
    intensity: product.intensity || 'Media',
    longevity: product.longevity || '',
    sillage: product.sillage || '',
    sizes: product.sizes?.map(s => ({
      label: s.label,
      price: s.price,
      stock: s.stock !== undefined ? s.stock : (s.label.includes('Frasco') ? 10 : 100)
    })) || [
      { label: '5ml', price: 0, stock: 100 },
      { label: '10ml', price: 0, stock: 100 },
      { label: 'Frasco Original', price: 0, stock: 10 }
    ],
    id: product.id
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // States for comma-separated fields
  const [topNotesStr, setTopNotesStr] = useState(product.notes?.top?.join(', ') || '');
  const [heartNotesStr, setHeartNotesStr] = useState(product.notes?.heart?.join(', ') || '');
  const [baseNotesStr, setBaseNotesStr] = useState(product.notes?.base?.join(', ') || '');
  const [bestForStr, setBestForStr] = useState(product.bestFor?.join(', ') || '');
  const [seasonsStr, setSeasonsStr] = useState(product.seasons?.join(', ') || '');
  const [tagsStr, setTagsStr] = useState(product.tags?.join(', ') || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizePriceChange = (index: number, priceStr: string) => {
    const newSizes = [...(formData.sizes || [])];
    newSizes[index] = { ...newSizes[index], price: parseInt(priceStr) || 0 };
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const handleSizeStockChange = (index: number, stockStr: string) => {
    const newSizes = [...(formData.sizes || [])];
    newSizes[index] = { ...newSizes[index], stock: parseInt(stockStr) || 0 };
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    const finalProduct = {
      ...formData,
      notes: {
        top: topNotesStr.split(',').map(s => s.trim()).filter(Boolean),
        heart: heartNotesStr.split(',').map(s => s.trim()).filter(Boolean),
        base: baseNotesStr.split(',').map(s => s.trim()).filter(Boolean),
      },
      bestFor: bestForStr.split(',').map(s => s.trim()).filter(Boolean),
      seasons: seasonsStr.split(',').map(s => s.trim()).filter(Boolean),
      tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
    };
    onSave(finalProduct, imageFile || undefined);
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-white max-w-3xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-brand-dark/50 hover:text-brand-dark text-xl">✕</button>
        <h2 className="font-serif text-3xl text-brand-dark mb-6">{product.id ? 'Editar Fragancia' : 'Nueva Fragancia'}</h2>
        
        <div className="space-y-6">
          {/* Section: Información General */}
          <div className="border-b border-brand-dark/10 pb-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Información General</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Nombre</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Categoría</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold">
                  <option value="Para Mujer">Para Mujer</option>
                  <option value="Para Hombre">Para Hombre</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Familia Olfativa</label>
                <input name="family" value={formData.family} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Concentración</label>
                <input name="concentration" value={formData.concentration} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Ej: Eau de Parfum" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Descripción</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Recomendación de Uso</label>
              <textarea name="recommendation" value={formData.recommendation} onChange={handleChange} rows={2} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
            </div>
          </div>

          {/* Section: Características */}
          <div className="border-b border-brand-dark/10 pb-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Características</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Intensidad</label>
                <select name="intensity" value={formData.intensity} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold">
                  <option value="Suave">Suave</option>
                  <option value="Media">Media</option>
                  <option value="Intensa">Intensa</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Duración (Longevidad)</label>
                <input name="longevity" value={formData.longevity} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Ej: 8 a 10 horas" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Estela (Sillage)</label>
                <input name="sillage" value={formData.sillage} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Ej: Moderada" />
              </div>
            </div>
          </div>

          {/* Section: Notas Olfativas */}
          <div className="border-b border-brand-dark/10 pb-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Notas Olfativas (separadas por comas)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Notas de Salida</label>
                <input value={topNotesStr} onChange={e => setTopNotesStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Pimienta rosa, Café" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Notas de Corazón</label>
                <input value={heartNotesStr} onChange={e => setHeartNotesStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Jazmín, Azahar" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Notas de Fondo</label>
                <input value={baseNotesStr} onChange={e => setBaseNotesStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Vainilla, Pachulí" />
              </div>
            </div>
          </div>

          {/* Section: Etiquetas y Temporada */}
          <div className="border-b border-brand-dark/10 pb-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Uso, Temporadas y Etiquetas (separados por comas)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Mejor Para</label>
                <input value={bestForStr} onChange={e => setBestForStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Noche, Cita" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Temporadas</label>
                <input value={seasonsStr} onChange={e => setSeasonsStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Otoño, Invierno" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Etiquetas</label>
                <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="Dulce, Sensual" />
              </div>
            </div>
          </div>

          {/* Imagen e Imagen local */}
          <div className="border-b border-brand-dark/10 pb-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Imagen del Producto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">URL de Imagen Existente</label>
                <input name="image" value={formData.image} onChange={handleChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Subir Nueva Imagen</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-1.5 text-xs text-brand-dark focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-4 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-brand-dark file:text-brand-white file:cursor-pointer hover:file:bg-brand-gold" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-4">Precios y Stock de Variantes</h3>
            <div className="space-y-4">
              {formData.sizes?.map((size, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-4 items-end border-b border-brand-dark/5 pb-3 last:border-0 last:pb-0">
                  <div className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
                    {size.label}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-dark/50 mb-1">Precio ($)</label>
                    <input type="number" value={size.price} onChange={e => handleSizePriceChange(idx, e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-dark/50 mb-1">Stock (uds)</label>
                    <input type="number" value={size.stock !== undefined ? size.stock : 0} onChange={e => handleSizeStockChange(idx, e.target.value)} className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-2 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold hover:text-brand-dark">Cancelar</button>
            <button onClick={handleSave} className="px-8 py-2 bg-brand-dark text-brand-white text-xs uppercase tracking-widest font-semibold hover:bg-brand-gold transition-colors">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ initialProducts }: { initialProducts: PerfumeProduct[] }) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stats' | 'coupons' | 'messages' | 'newsletter' | 'reviews'>('products');
  const [products, setProducts] = useState<PerfumeProduct[]>(initialProducts);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newsletter, setNewsletter] = useState<{ id: number; email: string; created_at: string }[]>([]);
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    expires_at: ''
  });
  const [isEditing, setIsEditing] = useState<Partial<PerfumeProduct> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    if (res.ok) setProducts(await res.json());
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    if (res.ok) setOrders(await res.json());
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    if (res.ok) setStats(await res.json());
  };

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons');
    if (res.ok) setCoupons(await res.json());
  };

  const fetchMessages = async () => {
    const res = await fetch('/api/admin/messages');
    if (res.ok) setMessages(await res.json());
  };

  const fetchNewsletter = async () => {
    const res = await fetch('/api/admin/newsletter');
    if (res.ok) setNewsletter(await res.json());
  };

  const fetchReviewsList = async () => {
    const res = await fetch('/api/admin/reviews');
    if (res.ok) setReviewsList(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'coupons') fetchCoupons();
    if (activeTab === 'messages') fetchMessages();
    if (activeTab === 'newsletter') fetchNewsletter();
    if (activeTab === 'reviews') fetchReviewsList();
  }, [activeTab]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_value) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Por favor completa los campos requeridos' }}));
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discount_type: newCoupon.discount_type,
        discount_value: parseFloat(newCoupon.discount_value),
        max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
        expires_at: newCoupon.expires_at || null
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          max_uses: '',
          expires_at: ''
        });
        await fetchCoupons();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Cupón creado con éxito' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: data.error || 'Error al crear cupón' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error del servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCoupon = async (code: string, currentActive: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, is_active: !currentActive })
      });
      if (res.ok) {
        await fetchCoupons();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: `Cupón ${code} ${!currentActive ? 'activado' : 'desactivado'}` }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al cambiar estado' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el cupón ${code}?`)) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        await fetchCoupons();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Cupón eliminado' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al eliminar cupón' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchMessages();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Mensaje eliminado' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al eliminar mensaje' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este suscriptor?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchNewsletter();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Suscriptor eliminado' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al eliminar suscriptor' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyNewsletterEmails = () => {
    const filtered = newsletter.filter(sub => 
      sub.email.toLowerCase().includes(newsletterSearch.toLowerCase())
    );
    const emailsStr = filtered.map(sub => sub.email).join(', ');
    if (!emailsStr) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'No hay correos para copiar' }}));
      return;
    }
    navigator.clipboard.writeText(emailsStr)
      .then(() => {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Lista de correos copiada al portapapeles' }}));
      })
      .catch(() => {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al copiar al portapapeles' }}));
      });
  };

  const handleToggleReview = async (id: number, currentApproved: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentApproved })
      });
      if (res.ok) {
        await fetchReviewsList();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: `Reseña ${!currentApproved ? 'aprobada' : 'ocultada'} con éxito` }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al cambiar estado de reseña' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchReviewsList();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Reseña eliminada' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al eliminar reseña' }}));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error de servidor' }}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (prod: Partial<PerfumeProduct>, file?: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('productData', JSON.stringify(prod));
      if (file) {
        formData.append('imageFile', file);
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        setIsEditing(null);
        await fetchProducts();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Producto guardado con éxito' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al guardar el producto' }}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este perfume permanentemente?")) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchProducts();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Producto eliminado' }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al eliminar el producto' }}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        await fetchOrders();
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: `Orden ${id} actualizada` }}));
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Error al actualizar orden' }}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-white border border-brand-dark/5 p-8 max-w-6xl mx-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-brand-white/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <span className="text-sm uppercase tracking-widest text-brand-dark font-semibold animate-pulse">Procesando...</span>
        </div>
      )}
      
      <div className="flex justify-between items-end mb-8 border-b border-brand-dark/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold block mb-2">Panel de Control</span>
          <h1 className="font-serif text-3xl text-brand-dark">Gestión Administrativa</h1>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'products' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Catálogo
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'orders' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Órdenes
          </button>
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'stats' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Estadísticas
          </button>
          <button 
            onClick={() => setActiveTab('coupons')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'coupons' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Cupones
          </button>
          <button 
            onClick={() => setActiveTab('messages')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'messages' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Consultas
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'newsletter' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Boletín
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`uppercase tracking-widest text-xs font-semibold px-4 py-2.5 md:px-6 md:py-3 transition-colors ${activeTab === 'reviews' ? 'bg-brand-dark text-brand-white' : 'text-brand-dark/60 hover:text-brand-dark'}`}
          >
            Reseñas
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex justify-end mb-6">
            <button onClick={() => setIsEditing({})} className="uppercase tracking-widest text-xs font-semibold bg-brand-dark text-brand-white px-6 py-3 hover:bg-brand-gold transition-colors">
              + Nuevo Perfume
            </button>
          </div>
          {/* Vista de Tabla (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-dark/10 bg-brand-light">
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Producto</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Familia</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold text-right">Variantes</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-light/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover bg-brand-gold-light" />
                        <div>
                          <p className="font-serif text-lg text-brand-dark">{product.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-dark/40">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-brand-dark/70 font-light">{product.family}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {product.sizes.map((size) => (
                          <span key={size.label} className="text-xs text-brand-dark/60 font-medium">
                            {size.label}: <span className="text-brand-dark">${size.price.toLocaleString('es-AR')}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => setIsEditing(product)} className="text-xs uppercase tracking-widest text-brand-gold font-semibold hover:text-brand-dark transition-colors mr-4">Editar</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-xs uppercase tracking-widest text-red-400 font-semibold hover:text-red-600 transition-colors">Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Vista de Tarjetas (Mobile) */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-brand-light/30 border border-brand-dark/10 p-4">
                <div className="flex items-start gap-4 mb-4">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover bg-brand-gold-light" />
                  <div>
                    <p className="font-serif text-xl text-brand-dark leading-tight">{product.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-dark/50 mt-1">{product.category} • {product.family}</p>
                  </div>
                </div>
                <div className="border-t border-brand-dark/5 pt-3 mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-brand-dark/60 mb-2 font-semibold">Variantes</p>
                  <div className="flex flex-col gap-1">
                    {product.sizes.map((size) => (
                      <div key={size.label} className="flex justify-between text-xs">
                        <span className="text-brand-dark/70">{size.label}</span>
                        <span className="font-semibold text-brand-dark">${size.price.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-3 border-t border-brand-dark/5">
                  <button onClick={() => setIsEditing(product)} className="flex-1 py-2 text-xs uppercase tracking-widest text-brand-dark font-semibold bg-brand-gold-light hover:bg-brand-gold transition-colors">Editar</button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 py-2 text-xs uppercase tracking-widest text-red-600 font-semibold border border-red-200 hover:bg-red-50 transition-colors">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p className="text-center py-12 text-brand-dark/50">No hay órdenes registradas aún.</p>
          ) : (
            <>
              {/* Vista de Tabla (Desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-light">
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">ID</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Cliente</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Detalles</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Monto</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-brand-light/50 transition-colors">
                        <td className="py-4 px-4 font-mono text-sm">{order.id}</td>
                        <td className="py-4 px-4">
                          <p className="font-serif text-lg text-brand-dark">{order.client_name}</p>
                          <p className="text-[10px] text-brand-dark/60">{order.phone}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-dark/70 font-light">
                          <p className="mb-1"><span className="font-semibold uppercase text-[10px] tracking-widest">Entrega:</span> {order.method}</p>
                          <ul className="text-xs list-disc list-inside">
                            {order.items?.map((item: any, i: number) => (
                              <li key={i}>{item.quantity}x {item.name}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-4 px-4 font-medium text-brand-dark">${order.total.toLocaleString('es-AR')}</td>
                        <td className="py-4 px-4">
                          <select 
                            value={order.status} 
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`text-xs uppercase tracking-widest font-semibold p-2 border focus:outline-none ${order.status === 'Completado' ? 'bg-green-50 text-green-700 border-green-200' : order.status === 'Cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-brand-gold-light text-brand-dark border-brand-dark/10'}`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Vista de Tarjetas (Mobile) */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-brand-light/30 border border-brand-dark/10 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase text-brand-dark/50">#{order.id}</p>
                        <p className="font-serif text-xl text-brand-dark">{order.client_name}</p>
                        <p className="text-xs text-brand-dark/60 mt-1">{order.phone}</p>
                      </div>
                      <span className="font-semibold text-brand-dark">${order.total.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="border-t border-brand-dark/5 pt-3 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Método: {order.method}</p>
                      <ul className="text-xs text-brand-dark/70 space-y-1">
                        {order.items?.map((item: any, i: number) => (
                          <li key={i}>{item.quantity}x {item.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-brand-dark/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest font-semibold">Estado:</span>
                      <select 
                        value={order.status} 
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 border focus:outline-none ${order.status === 'Completado' ? 'bg-green-50 text-green-700 border-green-200' : order.status === 'Cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-brand-gold-light text-brand-dark border-brand-dark/10'}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8">
          {!stats ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-8 h-8 text-brand-gold animate-spin mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Cargando Estadísticas...</span>
            </div>
          ) : (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Ventas Totales */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-semibold">Ventas Totales</span>
                    <div className="bg-brand-gold-light/45 p-2 text-brand-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-brand-dark">${stats.kpis.totalSales.toLocaleString('es-AR')}</h3>
                  <p className="text-[10px] text-green-600 mt-1 font-semibold">Completado</p>
                </div>

                {/* Ticket Promedio */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-semibold">Ticket Promedio</span>
                    <div className="bg-brand-gold-light/45 p-2 text-brand-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-brand-dark">${stats.kpis.averageOrderValue.toLocaleString('es-AR')}</h3>
                  <p className="text-[10px] text-brand-dark/40 mt-1">Por orden completada</p>
                </div>

                {/* Conteo de Órdenes */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-semibold">Órdenes Realizadas</span>
                    <div className="bg-brand-gold-light/45 p-2 text-brand-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-brand-dark">{stats.kpis.completedOrdersCount} <span className="text-sm font-sans text-brand-dark/40 font-normal">/ {stats.kpis.totalOrdersCount}</span></h3>
                  <p className="text-[10px] text-brand-dark/40 mt-1">
                    {stats.kpis.pendingOrdersCount} pendientes • {stats.kpis.cancelledOrdersCount} canceladas
                  </p>
                </div>

                {/* Alertas de Almacén */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-semibold">Alertas de Stock</span>
                    <div className={`p-2 ${stats.kpis.lowStockAlertsCount > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`font-serif text-2xl ${stats.kpis.lowStockAlertsCount > 0 ? 'text-red-500 font-semibold' : 'text-brand-dark'}`}>
                    {stats.kpis.lowStockAlertsCount}
                  </h3>
                  <p className="text-[10px] text-brand-dark/40 mt-1">Variantes con bajo inventario</p>
                </div>
              </div>

              {/* Sales Chart Section */}
              <SalesChart salesHistory={stats.salesHistory} />

              {/* Grid 2 Columns: Top Selling vs Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm">
                  <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
                    Productos Más Vendidos
                  </h3>
                  {stats.topProducts.length === 0 ? (
                    <p className="text-center text-sm py-12 text-brand-dark/40">No hay registros de productos vendidos aún.</p>
                  ) : (
                    <div className="space-y-6">
                      {stats.topProducts.map((p: any, idx: number) => {
                        const maxQty = Math.max(...stats.topProducts.map((tp: any) => tp.quantity), 1);
                        const percent = (p.quantity / maxQty) * 100;
                        return (
                          <div key={p.id} className="flex items-center gap-4">
                            <img src={p.image} alt={p.name} className="w-12 h-12 object-cover bg-brand-gold-light" />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-serif text-sm text-brand-dark truncate">{p.name}</h4>
                                <span className="text-xs font-semibold text-brand-dark">{p.quantity} uds.</span>
                              </div>
                              <div className="w-full bg-brand-light h-1.5 rounded-none overflow-hidden">
                                <div className="bg-brand-gold h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                              </div>
                              <p className="text-[10px] text-brand-dark/40 mt-1">Total generado: ${p.total.toLocaleString('es-AR')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stock Alerts */}
                <div className="bg-brand-white border border-brand-dark/5 p-6 shadow-sm">
                  <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Alertas de Almacén (Stock Bajo)
                  </h3>
                  {stats.lowStockItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-brand-dark/80">Todo en regla</p>
                      <p className="text-[10px] text-brand-dark/40 mt-1">Todas las variantes tienen suficiente stock.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {stats.lowStockItems.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-4 p-3 border border-brand-dark/5 hover:border-brand-gold/30 transition-colors">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover bg-brand-gold-light" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm text-brand-dark leading-tight">{item.name}</h4>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.lowVariants.map((v: any, i: number) => (
                                <span key={i} className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${v.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-gold-light/40 text-brand-dark border-brand-dark/10'}`}>
                                  {v.label}: {v.stock} uds
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Formulario de creación de cupón */}
          <div className="bg-brand-light/30 border border-brand-dark/10 p-6">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
              Crear Nuevo Cupón de Descuento
            </h3>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Código *</label>
                <input 
                  type="text" 
                  value={newCoupon.code} 
                  onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="EJ: VERANO20" 
                  className="w-full bg-brand-white border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold uppercase text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Tipo de Descuento *</label>
                <select 
                  value={newCoupon.discount_type} 
                  onChange={e => setNewCoupon(prev => ({ ...prev, discount_type: e.target.value }))}
                  className="w-full bg-brand-white border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold text-sm"
                  required
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Valor *</label>
                <input 
                  type="number" 
                  value={newCoupon.discount_value} 
                  onChange={e => setNewCoupon(prev => ({ ...prev, discount_value: e.target.value }))}
                  placeholder={newCoupon.discount_type === 'percentage' ? 'Ej: 15' : 'Ej: 1500'} 
                  className="w-full bg-brand-white border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold text-sm"
                  min="0.01"
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Límite de Usos</label>
                <input 
                  type="number" 
                  value={newCoupon.max_uses} 
                  onChange={e => setNewCoupon(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="Ilimitado" 
                  className="w-full bg-brand-white border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-dark/60 font-semibold mb-2">Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  value={newCoupon.expires_at} 
                  onChange={e => setNewCoupon(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full bg-brand-white border border-brand-dark/10 px-4 py-2 text-brand-dark focus:outline-none focus:border-brand-gold text-xs"
                />
              </div>
              <div className="lg:col-span-5 flex justify-end">
                <button type="submit" className="uppercase tracking-widest text-xs font-semibold bg-brand-dark text-brand-white px-8 py-3 hover:bg-brand-gold transition-colors">
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>

          {/* Listado de cupones */}
          <div>
            {coupons.length === 0 ? (
              <p className="text-center py-12 text-brand-dark/50 font-light">No hay cupones registrados.</p>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-dark/10 bg-brand-light">
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Código</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Tipo</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Descuento</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Usos</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Vence</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Activo</th>
                        <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {coupons.map((coupon) => (
                        <tr key={coupon.code} className="hover:bg-brand-light/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-sm tracking-wider text-brand-dark">{coupon.code}</td>
                          <td className="py-4 px-4 text-[10px] uppercase tracking-wider font-semibold text-brand-dark/60">
                            {coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Fijo'}
                          </td>
                          <td className="py-4 px-4 font-serif text-sm font-semibold text-brand-dark">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value.toLocaleString('es-AR')}`}
                          </td>
                          <td className="py-4 px-4 text-xs text-brand-dark/80">
                            <span className="font-semibold">{coupon.uses_count}</span>
                            <span className="text-brand-dark/40 font-light"> / {coupon.max_uses !== null ? coupon.max_uses : '∞'}</span>
                          </td>
                          <td className="py-4 px-4 text-xs text-brand-dark/70 font-light">
                            {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('es-AR') : 'Sin límite'}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleCoupon(coupon.code, !!coupon.is_active)}
                              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${coupon.is_active ? 'bg-brand-gold' : 'bg-brand-dark/20'}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-brand-white shadow ring-0 transition duration-200 ease-in-out ${coupon.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handleDeleteCoupon(coupon.code)} 
                              className="text-xs uppercase tracking-widest text-red-400 font-semibold hover:text-red-600 transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.code} className="bg-brand-light/30 border border-brand-dark/10 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-base tracking-wider text-brand-dark">{coupon.code}</span>
                        <button
                          onClick={() => handleToggleCoupon(coupon.code, !!coupon.is_active)}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${coupon.is_active ? 'bg-brand-gold' : 'bg-brand-dark/20'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-brand-white shadow ring-0 transition duration-200 ease-in-out ${coupon.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-brand-dark/40 uppercase tracking-widest text-[9px] block mb-0.5">Tipo</span>
                          <span className="font-semibold text-brand-dark">{coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Fijo'}</span>
                        </div>
                        <div>
                          <span className="text-brand-dark/40 uppercase tracking-widest text-[9px] block mb-0.5">Valor</span>
                          <span className="font-serif font-bold text-brand-dark">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value.toLocaleString('es-AR')}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-dark/40 uppercase tracking-widest text-[9px] block mb-0.5">Usos</span>
                          <span className="text-brand-dark">
                            <span className="font-semibold">{coupon.uses_count}</span>
                            <span className="text-brand-dark/40 font-light"> / {coupon.max_uses !== null ? coupon.max_uses : '∞'}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-dark/40 uppercase tracking-widest text-[9px] block mb-0.5">Vencimiento</span>
                          <span className="text-brand-dark">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('es-AR') : 'Sin límite'}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-brand-dark/5 flex justify-end">
                        <button 
                          onClick={() => handleDeleteCoupon(coupon.code)} 
                          className="py-1 text-xs uppercase tracking-widest text-red-600 font-semibold border border-red-200 px-3 hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
              Bandeja de Consultas Recibidas
            </h3>
            <span className="text-[10px] uppercase tracking-widest bg-brand-gold-light/45 px-3 py-1 font-semibold text-brand-gold">
              {messages.length} {messages.length === 1 ? 'Mensaje' : 'Mensajes'}
            </span>
          </div>

          {messages.length === 0 ? (
            <p className="text-center py-12 text-brand-dark/50 font-light">No hay consultas de clientes registradas.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const formattedDate = new Date(msg.created_at).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                // Formatear enlace de respuesta de WhatsApp
                const cleanPhone = msg.phone ? msg.phone.replace(/[^0-9]/g, '') : '';
                const waUrl = cleanPhone 
                  ? `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(msg.name)},%20gracias%20por%20escribirnos%20a%20L%C3%A9%20D%C3%A9sir.%20Te%20respondo%20sobre%20tu%20consulta%20por%20${encodeURIComponent(msg.reason || 'contacto')}:` 
                  : null;

                return (
                  <div key={msg.id} className="bg-brand-white border border-brand-dark/5 p-6 hover:border-brand-gold/30 transition-all shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-serif text-lg text-brand-dark">{msg.name}</h4>
                          {msg.reason && (
                            <span className="text-[9px] uppercase tracking-widest bg-brand-gold-light/40 text-brand-dark px-2 py-0.5 font-semibold">
                              {msg.reason}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-[10px] text-brand-dark/60 mt-1 uppercase tracking-widest font-semibold">
                          <span>Tel: {msg.phone || 'No provisto'}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {waUrl && (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] uppercase tracking-widest bg-green-600 text-brand-white px-4 py-2 font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.113.992 11.998.992c-5.452 0-9.887 4.372-9.892 9.8c-.001 1.77.475 3.5 1.378 5.037L2.43 21.53l5.884-1.528c-.58.307-1.127.469-1.667.152zM17.487 14.39c-.3-.15-1.782-.88-2.062-.982-.28-.102-.485-.153-.69.152-.203.305-.79.983-.97 1.186-.18.203-.359.229-.66.078-.3-.15-1.264-.467-2.408-1.488-.89-.793-1.49-1.77-1.666-2.074-.176-.304-.019-.469.13-.619.136-.134.304-.355.456-.533.151-.178.203-.305.304-.508.102-.203.05-.381-.025-.533-.076-.152-.69-1.662-.947-2.28-.25-.6-.524-.518-.72-.528-.18-.009-.387-.01-.595-.01-.207 0-.547.078-.832.39-.285.312-1.09 1.066-1.09 2.6 0 1.533 1.115 3.013 1.267 3.217.152.2 2.193 3.35 5.312 4.698.743.321 1.321.512 1.772.656.748.238 1.429.205 1.968.125.6-.09 1.782-.728 2.032-1.396.25-.668.25-1.242.176-1.396-.075-.152-.28-.254-.58-.404z"/>
                            </svg>
                            Responder
                          </a>
                        )}
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)} 
                          className="text-[10px] uppercase tracking-widest text-red-600 border border-red-200 px-4 py-2 font-semibold hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="bg-brand-light p-4 text-sm text-brand-dark/80 font-light whitespace-pre-wrap leading-relaxed border-l-2 border-brand-gold">
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'newsletter' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
                Suscriptores del Boletín de Novedades
              </h3>
              <span className="text-[10px] uppercase tracking-widest bg-brand-gold-light/45 px-3 py-1 font-semibold text-brand-gold mt-2 inline-block">
                {newsletter.length} {newsletter.length === 1 ? 'Suscriptor' : 'Suscriptores'}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopyNewsletterEmails} 
                className="text-xs uppercase tracking-widest bg-brand-dark text-brand-white px-5 py-2.5 font-semibold hover:bg-brand-gold transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copiar Lista
              </button>
            </div>
          </div>

          <div className="mb-6">
            <input 
              type="text" 
              value={newsletterSearch} 
              onChange={e => setNewsletterSearch(e.target.value)} 
              placeholder="Buscar por correo electrónico..." 
              className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2.5 text-brand-dark focus:outline-none focus:border-brand-gold text-sm"
            />
          </div>

          {newsletter.filter(sub => sub.email.toLowerCase().includes(newsletterSearch.toLowerCase())).length === 0 ? (
            <p className="text-center py-12 text-brand-dark/50 font-light">No se encontraron suscriptores.</p>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-light">
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">ID</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Correo Electrónico</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Fecha de Registro</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {newsletter
                      .filter(sub => sub.email.toLowerCase().includes(newsletterSearch.toLowerCase()))
                      .map((sub) => {
                        const formattedDate = new Date(sub.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <tr key={sub.id} className="hover:bg-brand-light/50 transition-colors">
                            <td className="py-4 px-4 text-sm font-mono text-brand-dark/50">{sub.id}</td>
                            <td className="py-4 px-4 text-sm font-medium text-brand-dark">{sub.email}</td>
                            <td className="py-4 px-4 text-xs text-brand-dark/70 font-light">{formattedDate}</td>
                            <td className="py-4 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteSubscriber(sub.id)} 
                                className="text-xs uppercase tracking-widest text-red-400 font-semibold hover:text-red-600 transition-colors"
                              >
                                Dar de Baja
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {newsletter
                  .filter(sub => sub.email.toLowerCase().includes(newsletterSearch.toLowerCase()))
                  .map((sub) => {
                    const formattedDate = new Date(sub.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <div key={sub.id} className="bg-brand-light/30 border border-brand-dark/10 p-4 space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-mono text-[9px] text-brand-dark/40 block mb-0.5">#{sub.id}</span>
                            <span className="text-sm font-semibold text-brand-dark break-all">{sub.email}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-brand-dark/50 font-light">
                          Registrado: {formattedDate}
                        </div>
                        <div className="pt-2 border-t border-brand-dark/5 flex justify-end">
                          <button 
                            onClick={() => handleDeleteSubscriber(sub.id)} 
                            className="py-1 text-[10px] uppercase tracking-widest text-red-600 font-semibold border border-red-200 px-3 hover:bg-red-50 transition-colors"
                          >
                            Dar de Baja
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
              Moderación de Reseñas de Clientes
            </h3>
            <span className="text-[10px] uppercase tracking-widest bg-brand-gold-light/45 px-3 py-1 font-semibold text-brand-gold">
              {reviewsList.length} {reviewsList.length === 1 ? 'Reseña' : 'Reseñas'}
            </span>
          </div>

          <div className="mb-6">
            <input 
              type="text" 
              value={reviewsSearch} 
              onChange={e => setReviewsSearch(e.target.value)} 
              placeholder="Buscar por cliente, correo o comentario..." 
              className="w-full bg-brand-light border border-brand-dark/10 px-4 py-2.5 text-brand-dark focus:outline-none focus:border-brand-gold text-sm"
            />
          </div>

          {reviewsList.filter(r => 
            r.client_name.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
            r.email.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
            r.comment.toLowerCase().includes(reviewsSearch.toLowerCase())
          ).length === 0 ? (
            <p className="text-center py-12 text-brand-dark/50 font-light">No hay reseñas que coincidan con la búsqueda.</p>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-light">
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Producto</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Cliente</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Calificación</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Comentario</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold">Estado</th>
                      <th className="py-4 px-4 text-xs uppercase tracking-widest text-brand-dark/60 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {reviewsList
                      .filter(r => 
                        r.client_name.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
                        r.email.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
                        r.comment.toLowerCase().includes(reviewsSearch.toLowerCase())
                      )
                      .map((review) => (
                        <tr key={review.id} className="hover:bg-brand-light/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 max-w-[150px]">
                              {review.product_image && (
                                <img src={review.product_image} alt={review.product_name} className="w-8 h-8 object-cover bg-brand-gold-light" />
                              )}
                              <span className="text-xs font-semibold text-brand-dark truncate">{review.product_name || review.product_id}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-serif text-sm text-brand-dark">{review.client_name}</p>
                            <p className="text-[10px] text-brand-dark/50">{review.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex text-brand-gold text-sm">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-brand-dark/80 max-w-[250px] truncate" title={review.comment}>
                            {review.comment}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                              {review.is_approved ? 'Aprobada' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => handleToggleReview(review.id, !!review.is_approved)} 
                              className="text-xs uppercase tracking-widest text-brand-gold font-semibold hover:text-brand-dark transition-colors mr-4"
                            >
                              {review.is_approved ? 'Ocultar' : 'Aprobar'}
                            </button>
                            <button 
                              onClick={() => handleDeleteReview(review.id)} 
                              className="text-xs uppercase tracking-widest text-red-400 font-semibold hover:text-red-600 transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {reviewsList
                  .filter(r => 
                    r.client_name.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
                    r.email.toLowerCase().includes(reviewsSearch.toLowerCase()) || 
                    r.comment.toLowerCase().includes(reviewsSearch.toLowerCase())
                  )
                  .map((review) => (
                    <div key={review.id} className="bg-brand-light/30 border border-brand-dark/10 p-4 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {review.product_image && (
                              <img src={review.product_image} alt={review.product_name} className="w-6 h-6 object-cover bg-brand-gold-light" />
                            )}
                            <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider truncate max-w-[150px]">{review.product_name || review.product_id}</span>
                          </div>
                          <span className="font-serif font-semibold text-brand-dark block">{review.client_name}</span>
                          <span className="text-[9px] text-brand-dark/40 block">{review.email}</span>
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {review.is_approved ? 'Aprobada' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex text-brand-gold text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <p className="text-xs text-brand-dark/70 font-light italic bg-brand-white/40 p-2 border-l border-brand-gold font-serif">
                        "{review.comment}"
                      </p>
                      <div className="pt-2 border-t border-brand-dark/5 flex justify-end gap-3">
                        <button 
                          onClick={() => handleToggleReview(review.id, !!review.is_approved)} 
                          className="py-1 text-[10px] uppercase tracking-widest text-brand-gold font-semibold"
                        >
                          {review.is_approved ? 'Ocultar' : 'Aprobar'}
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review.id)} 
                          className="py-1 text-[10px] uppercase tracking-widest text-red-600 font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {isEditing && (
        <ProductFormModal 
          product={isEditing} 
          onClose={() => setIsEditing(null)} 
          onSave={handleSaveProduct} 
        />
      )}
    </div>
  );
}

function SalesChart({ salesHistory }: { salesHistory: { date: string, total: number, count: number }[] }) {
  if (!salesHistory || salesHistory.length === 0) {
    return (
      <div className="bg-brand-white border border-brand-dark/5 p-8 text-center text-brand-dark/40 py-16">
        No hay historial de ventas suficiente para generar un gráfico. Las ventas completadas aparecerán aquí.
      </div>
    );
  }

  // Conservar los últimos 30 días para un gráfico más limpio
  const data = salesHistory.slice(-30);
  const maxTotal = Math.max(...data.map(d => d.total), 1000);
  
  // Configuración del viewBox del SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generar coordenadas
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.total / maxTotal) * chartHeight;
    return { x, y, date: d.date, total: d.total, count: d.count };
  });

  // Generar rutas SVG
  let linePath = '';
  let areaPath = '';
  
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Formato para los montos en el eje Y
  const formatYLabel = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  // 4 marcas en el eje Y
  const yTicks = [0, maxTotal * 0.25, maxTotal * 0.5, maxTotal * 0.75, maxTotal];

  return (
    <div className="bg-brand-white border border-brand-dark/5 p-6 relative">
      <h3 className="text-xs uppercase tracking-widest text-brand-dark/80 font-semibold mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
        Historial de Ventas Diarias (Últimos 30 días)
      </h3>
      
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible">
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5a880" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c5a880" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas de cuadrícula horizontal */}
          {yTicks.map((tick, i) => {
            const y = height - paddingBottom - (tick / maxTotal) * chartHeight;
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(0,0,0,0.05)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[9px] font-sans fill-brand-dark/40 font-semibold"
                >
                  {formatYLabel(tick)}
                </text>
              </g>
            );
          })}

          {/* Área debajo de la línea */}
          {areaPath && (
            <path d={areaPath} fill="url(#chart-area-grad)" />
          )}

          {/* Línea del gráfico */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#c5a880" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round" 
            />
          )}

          {/* Puntos interactivos */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.date === p.date ? 5 : 3}
              fill={hoveredPoint?.date === p.date ? '#c5a880' : '#ffffff'}
              stroke="#c5a880"
              strokeWidth={hoveredPoint?.date === p.date ? 2 : 1.5}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Eje X */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="rgba(0,0,0,0.1)" 
          />

          {/* Etiquetas del eje X (Inicio, medio, fin) */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - paddingBottom + 16} textAnchor="middle" className="text-[9px] font-sans fill-brand-dark/40 uppercase tracking-wider font-semibold">
                {new Date(points[0].date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </text>
              {points.length > 2 && (
                <text x={points[Math.floor(points.length / 2)].x} y={height - paddingBottom + 16} textAnchor="middle" className="text-[9px] font-sans fill-brand-dark/40 uppercase tracking-wider font-semibold">
                  {new Date(points[Math.floor(points.length / 2)].date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </text>
              )}
              <text x={points[points.length - 1].x} y={height - paddingBottom + 16} textAnchor="middle" className="text-[9px] font-sans fill-brand-dark/40 uppercase tracking-wider font-semibold">
                {new Date(points[points.length - 1].date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </text>
            </>
          )}
        </svg>

        {/* Tooltip flotante */}
        {hoveredPoint && (
          <div 
            className="absolute bg-brand-dark text-brand-white p-3 shadow-xl rounded-none text-xs border border-brand-gold/20 pointer-events-none z-10 transition-all duration-100"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-[9px] uppercase tracking-widest text-brand-gold mb-1">
              {new Date(hoveredPoint.date).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
            <p className="font-serif text-sm">${hoveredPoint.total.toLocaleString('es-AR')}</p>
            <p className="text-[9px] text-brand-white/60 mt-0.5">{hoveredPoint.count} pedidos completados</p>
          </div>
        )}
      </div>
    </div>
  );
}
