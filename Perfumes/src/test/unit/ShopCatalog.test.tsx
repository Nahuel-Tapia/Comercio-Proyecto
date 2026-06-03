import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ShopCatalog from '../../components/sections/ShopCatalog';
import type { PerfumeProduct } from '../../data/products';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  GitCompare: () => <span data-testid="compare-icon" />,
  Search: () => <span data-testid="search-icon" />,
  SlidersHorizontal: () => <span data-testid="sliders-icon" />,
  Sparkles: () => <span data-testid="sparkles-icon" />,
  X: () => <span data-testid="close-icon" />,
}));

const sampleProducts: PerfumeProduct[] = [
  {
    id: '1',
    name: 'Gilded Oud',
    category: 'Para Mujer',
    family: 'Maderoso',
    image: '/images/gold.jpg',
    description: 'Una fragancia lujosa y cálida con toques de oud y ámbar.',
    concentration: 'Eau de Parfum',
    recommendation: 'Noche, Cita',
    intensity: 'Intensa',
    longevity: '8 a 10 horas',
    sillage: 'Moderada',
    sizes: [
      { label: '5ml', price: 12000, stock: 100 },
      { label: '10ml', price: 22000, stock: 100 },
    ],
    notes: {
      top: ['Café', 'Pimienta rosa'],
      heart: ['Jazmín', 'Azahar'],
      base: ['Oud', 'Vainilla', 'Ámbar'],
    },
    bestFor: ['Noche', 'Cita'],
    seasons: ['Otoño', 'Invierno'],
    tags: ['Maderoso', 'Dulce', 'Cálido'],
  },
  {
    id: '2',
    name: 'Noir Ambre',
    category: 'Unisex',
    family: 'Ámbar',
    image: '/images/black.jpg',
    description: 'Misterio y sensualidad en una botella con ámbar y vainilla.',
    concentration: 'Extrait de Parfum',
    recommendation: 'Noche',
    intensity: 'Intensa',
    longevity: '10 a 12 horas',
    sillage: 'Pesada',
    sizes: [
      { label: '5ml', price: 15000, stock: 50 },
      { label: '10ml', price: 28000, stock: 50 },
    ],
    notes: {
      top: ['Cardamomo', 'Canela'],
      heart: ['Tupelo', 'Tabaco'],
      base: ['Ámbar', 'Vainilla', 'Sándalo'],
    },
    bestFor: ['Noche'],
    seasons: ['Invierno'],
    tags: ['Ámbar', 'Dulce', 'Sensual'],
  },
  {
    id: '3',
    name: 'Citrus Breeze',
    category: 'Para Hombre',
    family: 'Cítrico',
    image: '/images/citrus.jpg',
    description: 'Fresco e ideal para el día a día.',
    concentration: 'Eau de Toilette',
    recommendation: 'Día, Oficina',
    intensity: 'Suave',
    longevity: '4 a 6 horas',
    sillage: 'Limpia',
    sizes: [
      { label: '5ml', price: 8000, stock: 200 },
      { label: '10ml', price: 14000, stock: 200 },
    ],
    notes: {
      top: ['Limón', 'Bergamota'],
      heart: ['Menta', 'Lavanda'],
      base: ['Almizcle', 'Cedro'],
    },
    bestFor: ['Día', 'Oficina'],
    seasons: ['Verano', 'Primavera'],
    tags: ['Fresco', 'Cítrico', 'Limpio'],
  },
];

describe('ShopCatalog Component', () => {
  it('renders all products by default', () => {
    render(<ShopCatalog products={sampleProducts} />);

    expect(screen.getByText('Gilded Oud')).toBeInTheDocument();
    expect(screen.getByText('Noir Ambre')).toBeInTheDocument();
    expect(screen.getByText('Citrus Breeze')).toBeInTheDocument();
  });

  it('filters products when category button is clicked', () => {
    render(<ShopCatalog products={sampleProducts} />);

    // Click "Para Mujer" category button (the category selector buttons are second, quiz is first)
    const mujerCategoryButtons = screen.getAllByRole('button', { name: 'Para Mujer' });
    fireEvent.click(mujerCategoryButtons[1]);

    // Gilded Oud (Para Mujer) should be visible, others shouldn't
    expect(screen.getByText('Gilded Oud')).toBeInTheDocument();
    expect(screen.queryByText('Noir Ambre')).not.toBeInTheDocument();
    expect(screen.queryByText('Citrus Breeze')).not.toBeInTheDocument();
  });

  it('filters products based on search input', () => {
    render(<ShopCatalog products={sampleProducts} />);

    // Search for "Citrus"
    const searchInput = screen.getByPlaceholderText('Buscar por aroma, nota u ocasión...');
    fireEvent.change(searchInput, { target: { value: 'Citrus' } });

    expect(screen.queryByText('Gilded Oud')).not.toBeInTheDocument();
    expect(screen.queryByText('Noir Ambre')).not.toBeInTheDocument();
    expect(screen.getByText('Citrus Breeze')).toBeInTheDocument();
  });

  it('sorts products by price ascending and descending', () => {
    render(<ShopCatalog products={sampleProducts} />);

    // Click on sorting selector
    const sortSelect = screen.getByRole('combobox');
    
    // Sort Price: menor a mayor
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
    
    // Prices should be 8000 (Citrus Breeze), 12000 (Gilded Oud), 15000 (Noir Ambre)
    // We verify the ordering by querying all matching tags or checking array order
    const articles = screen.getAllByRole('heading', { level: 3 });
    expect(articles[0].textContent).toBe('Citrus Breeze');
    expect(articles[1].textContent).toBe('Gilded Oud');
    expect(articles[2].textContent).toBe('Noir Ambre');

    // Sort Price: mayor a menor
    fireEvent.change(sortSelect, { target: { value: 'price-desc' } });
    const articlesDesc = screen.getAllByRole('heading', { level: 3 });
    expect(articlesDesc[0].textContent).toBe('Noir Ambre');
    expect(articlesDesc[1].textContent).toBe('Gilded Oud');
    expect(articlesDesc[2].textContent).toBe('Citrus Breeze');
  });

  it('provides olfactory advice quiz and shows recommendations', async () => {
    render(<ShopCatalog products={sampleProducts} />);

    // Click "Día" for occasion
    const diaOption = screen.getByRole('button', { name: 'Día' });
    fireEvent.click(diaOption);

    // It should display "recomendados para vos" section
    expect(screen.getByText('recomendados para vos')).toBeInTheDocument();
    
    // Citrus Breeze is recommended for "Día" (check that there is at least one instance, in recommendation section)
    const matches = screen.getAllByText('Citrus Breeze');
    expect(matches.length).toBeGreaterThan(1); // One in recommendation, one in catalog
  });
});
