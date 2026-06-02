import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { verifySession } from '../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    const orders = rows.map((row) => ({
      ...row,
      items: JSON.parse(row.items_json),
    }));

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return new Response(JSON.stringify({ error: 'El pedido debe contener al menos un producto' }), { status: 400 });
    }
    
    if (typeof data.total !== 'number' || data.total <= 0) {
      return new Response(JSON.stringify({ error: 'El total del pedido no es válido' }), { status: 400 });
    }
    
    // Generar un ID simple de 6 caracteres
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, client_name, phone, address, method, items_json, total)
      VALUES (@id, @client_name, @phone, @address, @method, @items_json, @total)
    `);

    // Usar transacción para insertar orden y restar stock
    const processOrder = db.transaction((orderData: any, items: any[]) => {
      insertOrder.run(orderData);

      const getProduct = db.prepare('SELECT sizes_json FROM products WHERE id = ?');
      const updateProduct = db.prepare('UPDATE products SET sizes_json = ? WHERE id = ?');

      for (const item of items) {
        if (!item.productId || !item.sizeLabel) continue;
        const prod = getProduct.get(item.productId) as any;
        if (prod) {
          const sizes = JSON.parse(prod.sizes_json);
          let updated = false;
          for (const size of sizes) {
            if (size.label === item.sizeLabel) {
              size.stock = Math.max(0, (size.stock || 0) - item.quantity);
              updated = true;
              break;
            }
          }
          if (updated) {
            updateProduct.run(JSON.stringify(sizes), item.productId);
          }
        }
      }
    });

    processOrder(
      {
        id: orderId,
        client_name: data.client_name || 'Desconocido',
        phone: data.phone || '',
        address: data.address || '',
        method: data.method || 'retiro',
        items_json: JSON.stringify(data.items || []),
        total: data.total || 0,
      },
      data.items
    );
    
    return new Response(JSON.stringify({ success: true, orderId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error guardando la orden:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor al guardar orden' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status) throw new Error("ID y Status son requeridos");

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor al actualizar' }), { status: 500 });
  }
};
