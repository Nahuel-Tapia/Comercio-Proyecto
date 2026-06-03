import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { SITE } from '../../data/site';

export interface CartItem {
  id: string;
  productId: string;
  sizeLabel: string;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
}

interface SlideCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export default function SlideCart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: SlideCartProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'envio' | 'takeaway'>('takeaway');
  
  // Coupon states
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount_type: string, discount_value: number } | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const SHIPPING_COST = 5000;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round(subtotal * (appliedCoupon.discount_value / 100));
    } else if (appliedCoupon.discount_type === 'fixed') {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const finalTotal = shippingMethod === 'envio' 
    ? Math.max(0, subtotal - discountAmount) + SHIPPING_COST 
    : Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(couponInput.trim())}`);
      const result = await res.json();
      if (res.ok) {
        setAppliedCoupon(result);
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: `Cupón ${result.code} aplicado con éxito` }}));
      } else {
        setAppliedCoupon(null);
        setCouponError(result.error || 'Cupón inválido');
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: result.error || 'Cupón inválido' }}));
      }
    } catch (err) {
      setCouponError('Error al validar el cupón');
    }
  };

  const handleRemoveCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleCheckoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: name,
          phone,
          address: shippingMethod === 'envio' ? address : '',
          method: shippingMethod,
          items: cartItems,
          total: finalTotal,
          couponCode: appliedCoupon?.code || null
        })
      });

      if (!res.ok) {
        throw new Error('Error al enviar la orden');
      }

      const orderTitle = `*Nuevo pedido - ${SITE.brandFull}*\n\n`;
      const clientDetails = `*Cliente:* ${name}\n*Teléfono:* ${phone || 'No especificado'}\n*Método:* ${
        shippingMethod === 'envio' ? 'Envío a domicilio' : SITE.pickupLabel
      }\n${shippingMethod === 'envio' ? `*Dirección:* ${address}\n` : ''}\n`;
      const itemsHeader = '*Productos:*\n';
      const itemsList = cartItems
        .map(
          (item) =>
            `- ${item.quantity}x ${item.name} (${item.category}) - $${(
              item.price * item.quantity
            ).toLocaleString('es-AR')}`
        )
        .join('\n');
      const shippingLine = shippingMethod === 'envio' ? `\n*Envío:* $${SHIPPING_COST.toLocaleString('es-AR')}` : '';
      const couponLine = appliedCoupon ? `\n*Cupón aplicado:* ${appliedCoupon.code} (-$${discountAmount.toLocaleString('es-AR')})` : '';
      const totalFooter = `\n${shippingLine}${couponLine}\n*Total estimado: $${finalTotal.toLocaleString('es-AR')}*`;
      const note = '\n\nQuedo atento/a para coordinar pago, disponibilidad y entrega.';
      const fullMessage = encodeURIComponent(orderTitle + clientDetails + itemsHeader + itemsList + totalFooter + note);

      window.open(`https://wa.me/${SITE.whatsappNumber}?text=${fullMessage}`, '_blank', 'noopener,noreferrer');

      onClearCart();
      setAppliedCoupon(null);
      setCouponInput('');
      setIsCheckoutOpen(false);
      onClose();
    } catch (error) {
      console.error("Error al registrar la orden", error);
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Hubo un error al procesar tu pedido. Intenta nuevamente.' }}));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/15 backdrop-blur-xs z-50 cursor-pointer"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-brand-light z-50 shadow-lg flex flex-col border-l border-brand-dark/5"
          >
            <div className="p-6 border-b border-brand-dark/5 flex items-center justify-between bg-brand-white">
              <div className="flex items-center space-x-3 bg-brand-white">
                <ShoppingBag size={20} strokeWidth={1.2} className="text-brand-dark" />
                <h2 className="font-serif text-xl text-brand-dark font-medium lowercase">tu bolsa</h2>
                <span className="text-xs uppercase tracking-wider text-brand-dark/45 font-semibold">
                  ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-brand-dark/40 hover:text-brand-dark transition-colors p-1"
                aria-label="Cerrar bolsa"
              >
                <X size={22} strokeWidth={1.2} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 bg-brand-white/40">
              {isCheckoutOpen ? (
                <div className="space-y-8">
                  <div className="mb-4">
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="text-xs uppercase tracking-widest text-brand-dark/45 hover:text-brand-dark transition-colors border-b border-brand-dark/20 pb-0.5"
                    >
                      Volver a la bolsa
                    </button>
                    <h3 className="font-serif text-2xl text-brand-dark mt-6 mb-2 font-medium lowercase">
                      datos de entrega
                    </h3>
                    <p className="text-sm text-brand-dark/55 font-light leading-relaxed">
                      Completá tus datos y generamos el pedido listo para enviar por WhatsApp.
                    </p>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-1.5 font-medium">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ej. María González"
                        className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors placeholder-brand-dark/30 font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-1.5 font-medium">
                        Teléfono de contacto
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Ej. +54 9 11 1234 5678"
                        className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors placeholder-brand-dark/30 font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-2 font-medium">
                        Método de entrega
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setShippingMethod('takeaway')}
                          className={`py-3 text-xs uppercase tracking-widest border transition-all duration-300 font-medium ${
                            shippingMethod === 'takeaway'
                              ? 'border-brand-dark bg-brand-dark text-brand-white'
                              : 'border-brand-dark/10 hover:border-brand-dark/30 text-brand-dark/55 bg-transparent'
                          }`}
                        >
                          Retiro
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingMethod('envio')}
                          className={`py-3 text-xs uppercase tracking-widest border transition-all duration-300 font-medium ${
                            shippingMethod === 'envio'
                              ? 'border-brand-dark bg-brand-dark text-brand-white'
                              : 'border-brand-dark/10 hover:border-brand-dark/30 text-brand-dark/55 bg-transparent'
                          }`}
                        >
                          Envío
                        </button>
                      </div>
                    </div>

                    {shippingMethod === 'envio' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-xs uppercase tracking-widest text-brand-dark/60 mb-1.5 font-medium">
                          Dirección completa *
                        </label>
                        <input
                          type="text"
                          required={shippingMethod === 'envio'}
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          placeholder="Calle, número, localidad"
                          className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors placeholder-brand-dark/30 font-light"
                        />
                      </motion.div>
                    )}

                    {/* Sección de Cupón de Descuento */}
                    <div className="pt-4 border-t border-brand-dark/5 space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-brand-dark/60 font-medium">
                        ¿Tenés un cupón de descuento?
                      </label>
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          disabled={!!appliedCoupon}
                          placeholder="Ej. LEDESIR10"
                          className="flex-grow bg-transparent px-1 py-2 text-sm focus:outline-none border-b border-brand-dark/15 focus:border-brand-dark transition-colors placeholder-brand-dark/30 font-light uppercase"
                        />
                        {appliedCoupon ? (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 text-xs uppercase tracking-wider font-semibold hover:bg-red-100 transition-colors"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="bg-brand-dark text-brand-white px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-brand-gold transition-colors"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                      )}
                      {appliedCoupon && (
                        <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1.5">
                          ✓ Cupón aplicado: {appliedCoupon.code} ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value}`} de descuento)
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-dark text-brand-white py-4 uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold transition-colors duration-300 shadow-xs"
                    >
                      Confirmar pedido por WhatsApp
                    </button>
                  </form>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-12">
                  <div className="w-16 h-16 bg-brand-light border border-brand-dark/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={22} strokeWidth={1.2} className="text-brand-dark/30" />
                  </div>
                  <h3 className="font-serif text-xl text-brand-dark mb-2 font-medium lowercase">
                    tu bolsa está vacía
                  </h3>
                  <p className="text-sm text-brand-dark/50 max-w-xs mb-8 leading-relaxed font-light">
                    Explorá nuestra colección y añadí esencias selectas a tu carrito.
                  </p>
                  <a
                    href="/shop"
                    onClick={onClose}
                    className="border border-brand-dark text-brand-dark bg-transparent px-8 py-3.5 uppercase tracking-widest text-xs hover:bg-brand-dark hover:text-brand-white transition-all duration-300 font-medium"
                  >
                    Explorar perfumes
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex space-x-4 pb-6 border-b border-brand-dark/5 items-center"
                    >
                      <div className="w-20 h-24 bg-brand-gold-light overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-grow flex flex-col justify-between h-24 py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif text-lg text-brand-dark leading-tight pr-2 font-medium">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-brand-dark/30 hover:text-red-500 transition-colors p-1 animate-fade-in"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 size={16} strokeWidth={1.2} />
                            </button>
                          </div>
                          <p className="text-xs uppercase tracking-widest text-brand-dark/40 mt-1">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center border border-brand-dark/10 bg-transparent rounded-xs">
                            <button
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="px-2.5 py-1 text-brand-dark/45 hover:text-brand-dark transition-colors"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="px-1 text-xs font-medium text-brand-dark">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 py-1 text-brand-dark/45 hover:text-brand-dark transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <span className="text-sm font-semibold text-brand-dark">
                            ${(item.price * item.quantity).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && !isCheckoutOpen && (
              <div className="p-6 border-t border-brand-dark/5 bg-brand-white space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-dark/50 uppercase tracking-wider">Subtotal</span>
                  <span className="font-serif text-xl font-medium text-brand-dark">
                    ${subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-xs text-brand-dark/40 leading-normal font-light">
                  El pedido se envía por WhatsApp para coordinar pago, disponibilidad y entrega final.
                </p>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-brand-dark text-brand-white py-4 uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold transition-colors duration-300 shadow-xs"
                >
                  Iniciar pedido
                </button>
              </div>
            )}

            {cartItems.length > 0 && isCheckoutOpen && (
              <div className="p-6 border-t border-brand-dark/5 bg-brand-white space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-dark/50 uppercase tracking-wider">Subtotal</span>
                  <span className="font-medium text-brand-dark">
                    ${subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
                {shippingMethod === 'envio' && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-dark/50 uppercase tracking-wider">Envío</span>
                    <span className="font-medium text-brand-dark">
                      ${SHIPPING_COST.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-green-600 font-medium">
                    <span className="uppercase tracking-wider">Descuento ({appliedCoupon?.code})</span>
                    <span>
                      -${discountAmount.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-brand-dark/10 pt-3">
                  <span className="text-brand-dark/80 font-bold uppercase tracking-wider">Total</span>
                  <span className="font-serif text-xl font-bold text-brand-dark">
                    ${finalTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
