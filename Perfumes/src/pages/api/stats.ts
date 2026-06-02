import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { verifySession } from '../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    // 1. Obtener todas las órdenes
    const allOrders = db.prepare('SELECT * FROM orders ORDER BY created_at ASC').all() as any[];
    
    // 2. Obtener todos los productos para stock alerts
    const allProducts = db.prepare('SELECT * FROM products').all() as any[];

    // KPI Calculations
    let totalSales = 0;
    let pendingSales = 0;
    let totalOrdersCount = allOrders.length;
    let completedOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;

    // Temporal sales grouping (last 30 days)
    const salesByDateMap: { [date: string]: { total: number; count: number } } = {};
    
    // Top selling products tracking
    const productSalesMap: { [id: string]: { name: string; quantity: number; total: number; image: string } } = {};

    for (const order of allOrders) {
      const items = JSON.parse(order.items_json || '[]');
      const status = order.status;
      const total = order.total || 0;
      
      // Parse date to YYYY-MM-DD
      // SQLite default DATETIME is 'YYYY-MM-DD HH:MM:SS'
      const dateStr = order.created_at ? order.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10);

      if (status === 'Completado') {
        totalSales += total;
        completedOrdersCount++;

        // Track sales by date
        if (!salesByDateMap[dateStr]) {
          salesByDateMap[dateStr] = { total: 0, count: 0 };
        }
        salesByDateMap[dateStr].total += total;
        salesByDateMap[dateStr].count += 1;

        // Track products
        for (const item of items) {
          const key = item.productId || 'unknown';
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              name: item.name || 'Producto Desconocido',
              quantity: 0,
              total: 0,
              image: item.image || ''
            };
          }
          productSalesMap[key].quantity += item.quantity || 0;
          productSalesMap[key].total += (item.price || 0) * (item.quantity || 0);
        }
      } else if (status === 'Pendiente') {
        pendingSales += total;
        pendingOrdersCount++;
      } else if (status === 'Cancelado') {
        cancelledOrdersCount++;
      }
    }

    // Convert sales by date to array sorted by date
    const salesHistory = Object.entries(salesByDateMap).map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Convert top products to sorted list
    const topProducts = Object.entries(productSalesMap).map(([id, data]) => ({
      id,
      ...data
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Calculate low stock items (threshold < 10)
    const lowStockItems: any[] = [];
    for (const prod of allProducts) {
      const sizes = JSON.parse(prod.sizes_json || '[]');
      const lowSizes = sizes.filter((s: any) => s.stock !== undefined && s.stock < 10);
      if (lowSizes.length > 0) {
        lowStockItems.push({
          id: prod.id,
          name: prod.name,
          image: prod.image,
          lowVariants: lowSizes.map((s: any) => ({
            label: s.label,
            stock: s.stock,
            price: s.price
          }))
        });
      }
    }

    // Calculate average order value (AOV)
    const averageOrderValue = completedOrdersCount > 0 ? Math.round(totalSales / completedOrdersCount) : 0;

    return new Response(JSON.stringify({
      kpis: {
        totalSales,
        pendingSales,
        totalOrdersCount,
        completedOrdersCount,
        pendingOrdersCount,
        cancelledOrdersCount,
        averageOrderValue,
        lowStockAlertsCount: lowStockItems.length
      },
      salesHistory,
      topProducts,
      lowStockItems
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating stats:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor al obtener estadísticas', details: error.message }), { status: 500 });
  }
};
