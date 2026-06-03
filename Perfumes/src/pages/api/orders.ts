import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { verifySession } from '../../lib/auth';
import { checkRateLimit } from '../../lib/rateLimit';
import { z } from 'zod';
import { sendOrderEmails } from '../../lib/email';

const OrderSchema = z.object({
  client_name: z.string().min(1, 'El nombre del cliente es requerido'),
  client_email: z.string().email('El correo electrónico no es válido'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  method: z.string().default('retiro'),
  couponCode: z.string().optional().nullable(),
  payment_method: z.enum(['whatsapp', 'mercadopago']).default('whatsapp'),
  items: z.array(z.object({
    productId: z.string(),
    sizeLabel: z.string(),
    quantity: z.number().int().positive('La cantidad debe ser mayor a 0')
  })).min(1, 'El pedido debe contener al menos un producto')
});

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
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 10, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const result = OrderSchema.safeParse(data);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }
    const validatedData = result.data;
    
    // Validar productos y calcular total en el servidor
    let serverTotal = 0;
    const getProductPrice = db.prepare('SELECT sizes_json FROM products WHERE id = ?');
    
    for (const item of validatedData.items) {
      if (!item.productId || !item.sizeLabel) {
        return new Response(JSON.stringify({ error: 'Formato de ítem inválido en el pedido' }), { status: 400 });
      }
      
      const prod = getProductPrice.get(item.productId) as any;
      if (!prod) {
        return new Response(JSON.stringify({ error: `El producto no existe` }), { status: 400 });
      }
      
      const sizes = JSON.parse(prod.sizes_json);
      const matchedSize = sizes.find((s: any) => s.label === item.sizeLabel);
      if (!matchedSize) {
        return new Response(JSON.stringify({ error: `La variante de tamaño ${item.sizeLabel} no existe` }), { status: 400 });
      }
      
      const price = matchedSize.price;
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      serverTotal += price * quantity;
    }

    // Generar un ID simple de 6 caracteres
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();

    let discount = 0;
    let couponCode = validatedData.couponCode?.trim().toUpperCase() || null;
    
    if (couponCode) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(couponCode) as any;
      if (!coupon) {
        return new Response(JSON.stringify({ error: 'Cupón de descuento no válido o inexistente' }), { status: 400 });
      }
      if (!coupon.is_active) {
        return new Response(JSON.stringify({ error: 'Este cupón está inactivo' }), { status: 400 });
      }
      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return new Response(JSON.stringify({ error: 'Este cupón ha superado el límite de usos' }), { status: 400 });
      }
      if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: 'Este cupón ha expirado' }), { status: 400 });
      }
      
      if (coupon.discount_type === 'percentage') {
        discount = Math.round(serverTotal * (coupon.discount_value / 100));
      } else if (coupon.discount_type === 'fixed') {
        discount = coupon.discount_value;
      }
      
      serverTotal = Math.max(0, serverTotal - discount);
    }

    let preferenceId = null;
    let preferenceUrl = '';

    if (validatedData.payment_method === 'mercadopago') {
      const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
      const siteUrl = process.env.SITE_URL || 'http://localhost:4321';

      if (mpAccessToken && mpAccessToken !== 'TEST-TOKEN-SIMULADO') {
        try {
          const mpResponse = await fetch('https://api.mercadopago.com/v1/checkout/preferences', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mpAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: [
                {
                  id: orderId,
                  title: `Fragancias premium Lé Désir - Pedido #${orderId}`,
                  quantity: 1,
                  unit_price: serverTotal,
                  currency_id: 'ARS',
                }
              ],
              back_urls: {
                success: `${siteUrl}/checkout/success?orderId=${orderId}`,
                pending: `${siteUrl}/checkout/pending?orderId=${orderId}`,
                failure: `${siteUrl}/checkout/failure?orderId=${orderId}`,
              },
              auto_return: 'approved',
              external_reference: orderId,
              notification_url: `${siteUrl}/api/webhooks/mercadopago`,
            })
          });

          if (mpResponse.ok) {
            const mpData = await mpResponse.json();
            preferenceId = mpData.id;
            preferenceUrl = mpData.init_point;
          } else {
            const errText = await mpResponse.text();
            console.error('Mercado Pago API error details:', errText);
            preferenceUrl = `${siteUrl}/checkout/success?orderId=${orderId}&status=approved&simulated=true`;
          }
        } catch (err) {
          console.error('Error contacting Mercado Pago:', err);
          preferenceUrl = `${siteUrl}/checkout/success?orderId=${orderId}&status=approved&simulated=true`;
        }
      } else {
        console.log('MERCADO_PAGO_ACCESS_TOKEN no configurado o simulado. Usando simulación local.');
        preferenceUrl = `${siteUrl}/checkout/success?orderId=${orderId}&status=approved&simulated=true`;
      }
    }

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, client_name, client_email, phone, address, method, items_json, total, coupon_code, discount, payment_method, payment_status, preference_id)
      VALUES (@id, @client_name, @client_email, @phone, @address, @method, @items_json, @total, @coupon_code, @discount, @payment_method, @payment_status, @preference_id)
    `);

    // Usar transacción para insertar orden, restar stock e incrementar usos del cupón
    const processOrder = db.transaction((orderData: any, items: any[]) => {
      insertOrder.run(orderData);

      if (couponCode) {
        db.prepare('UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?').run(couponCode);
      }

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

    const orderData = {
      id: orderId,
      client_name: validatedData.client_name || 'Desconocido',
      client_email: validatedData.client_email,
      phone: validatedData.phone || '',
      address: validatedData.address || '',
      method: validatedData.method || 'retiro',
      items_json: JSON.stringify(validatedData.items || []),
      total: serverTotal,
      coupon_code: couponCode,
      discount: discount,
      payment_method: validatedData.payment_method,
      payment_status: validatedData.payment_method === 'mercadopago' ? 'Pendiente' : 'Aprobado',
      preference_id: preferenceId,
    };

    processOrder(orderData, validatedData.items);

    // Enviar correos de confirmación/alerta de orden en segundo plano
    try {
      const getProductDetails = db.prepare('SELECT name FROM products WHERE id = ?');
      const hydratedItems = validatedData.items.map(item => {
        const prod = getProductDetails.get(item.productId) as any;
        const prodAll = db.prepare('SELECT sizes_json FROM products WHERE id = ?').get(item.productId) as any;
        let price = 0;
        if (prodAll) {
          const sizes = JSON.parse(prodAll.sizes_json);
          const s = sizes.find((sz: any) => sz.label === item.sizeLabel);
          if (s) price = s.price;
        }
        return {
          ...item,
          name: prod ? prod.name : 'Fragancia',
          price: price
        };
      });

      sendOrderEmails(orderData, hydratedItems).catch(err => {
        console.error('Error enviando correos electrónicos:', err);
      });
    } catch (emailErr) {
      console.error('Error al iniciar el flujo de email:', emailErr);
    }
    
    return new Response(JSON.stringify({ success: true, orderId, preferenceUrl }), {
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
