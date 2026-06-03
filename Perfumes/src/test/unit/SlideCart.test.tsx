import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SlideCart, { CartItem } from '../../components/layout/SlideCart';

// Mock site data
vi.mock('../../data/site', () => ({
  SITE: {
    whatsappNumber: '5491123456789',
    pickupLabel: 'Retiro en persona',
    brandFull: 'Lé Désir Perfumes',
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ShoppingBag: () => <span data-testid="shopping-bag" />,
  X: () => <span data-testid="close-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Minus: () => <span data-testid="minus-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
}));

const sampleItems: CartItem[] = [
  {
    id: '1-5ml',
    productId: '1',
    sizeLabel: '5ml',
    name: 'Gilded Oud',
    category: 'Para Mujer',
    price: 12000,
    image: '/images/gold.jpg',
    quantity: 2,
  },
  {
    id: '2-10ml',
    productId: '2',
    sizeLabel: '10ml',
    name: 'Noir Ambre',
    category: 'Unisex',
    price: 25000,
    image: '/images/black.jpg',
    quantity: 1,
  },
];

describe('SlideCart Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnClearCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            shipping_cost: '6000',
            whatsapp_number: '5491199998888',
            header_banner: 'Test Banner text',
          }),
        });
      }
      if (url.includes('/api/coupons')) {
        const code = new URL(url, 'http://localhost').searchParams.get('code');
        if (code === 'DESCUENTO10') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: 'DESCUENTO10',
              discount_type: 'percentage',
              discount_value: 10,
            }),
          });
        }
        if (code === 'FIJO5000') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: 'FIJO5000',
              discount_type: 'fixed',
              discount_value: 5000,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Cupón inválido' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }));
  });

  it('renders cart items and displays correct subtotal', async () => {
    render(
      <SlideCart
        isOpen={true}
        onClose={mockOnClose}
        cartItems={sampleItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
      />
    );

    // Verify product names are rendered
    expect(screen.getByText('Gilded Oud')).toBeInTheDocument();
    expect(screen.getByText('Noir Ambre')).toBeInTheDocument();

    // Verify subtotal (12000 * 2 + 25000 * 1 = 49000)
    // Subtotal should be formatted as $49.000 (Spanish localization dots)
    const subtotalText = screen.getByText('$49.000');
    expect(subtotalText).toBeInTheDocument();
  });

  it('toggles checkout and handles shipping cost configuration', async () => {
    render(
      <SlideCart
        isOpen={true}
        onClose={mockOnClose}
        cartItems={sampleItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
      />
    );

    // Click on "Iniciar pedido"
    const startCheckoutButton = screen.getByText('Iniciar pedido');
    fireEvent.click(startCheckoutButton);

    // Now we should see the checkout form. Verify "datos de entrega" heading is present
    expect(screen.getByText('datos de entrega')).toBeInTheDocument();

    // Change shipping method to "Envío"
    const shippingButton = screen.getByText('Envío');
    fireEvent.click(shippingButton);

    // Verify shipping cost ($6.000) is fetched and displayed
    await waitFor(() => {
      expect(screen.getByText('$6.000')).toBeInTheDocument();
    });

    // Total should be Subtotal ($49.000) + Shipping ($6.000) = $55.000
    expect(screen.getByText('$55.000')).toBeInTheDocument();
  });

  it('applies percentage coupon successfully', async () => {
    render(
      <SlideCart
        isOpen={true}
        onClose={mockOnClose}
        cartItems={sampleItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
      />
    );

    // Open checkout
    fireEvent.click(screen.getByText('Iniciar pedido'));

    // Input and apply coupon
    const couponInput = screen.getByPlaceholderText('Ej. LEDESIR10');
    fireEvent.change(couponInput, { target: { value: 'DESCUENTO10' } });

    const applyButton = screen.getByText('Aplicar');
    fireEvent.click(applyButton);

    // Coupon discount should be 10% of subtotal (10% of 49000 = 4900)
    // Total should be 49000 - 4900 = 44100
    await waitFor(() => {
      expect(screen.getByText('-$4.900')).toBeInTheDocument();
      expect(screen.getByText('$44.100')).toBeInTheDocument();
    });
  });

  it('applies fixed amount coupon successfully', async () => {
    render(
      <SlideCart
        isOpen={true}
        onClose={mockOnClose}
        cartItems={sampleItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
      />
    );

    // Open checkout
    fireEvent.click(screen.getByText('Iniciar pedido'));

    // Input and apply coupon
    const couponInput = screen.getByPlaceholderText('Ej. LEDESIR10');
    fireEvent.change(couponInput, { target: { value: 'FIJO5000' } });

    const applyButton = screen.getByText('Aplicar');
    fireEvent.click(applyButton);

    // Coupon discount should be $5.000
    // Total should be 49000 - 5000 = 44000
    await waitFor(() => {
      expect(screen.getByText('-$5.000')).toBeInTheDocument();
      expect(screen.getByText('$44.000')).toBeInTheDocument();
    });
  });

  it('displays coupon validation error when invalid code is submitted', async () => {
    render(
      <SlideCart
        isOpen={true}
        onClose={mockOnClose}
        cartItems={sampleItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onClearCart={mockOnClearCart}
      />
    );

    // Open checkout
    fireEvent.click(screen.getByText('Iniciar pedido'));

    // Input invalid coupon
    const couponInput = screen.getByPlaceholderText('Ej. LEDESIR10');
    fireEvent.change(couponInput, { target: { value: 'INVALIDO' } });

    const applyButton = screen.getByText('Aplicar');
    fireEvent.click(applyButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText('Cupón inválido')).toBeInTheDocument();
    });
  });
});
