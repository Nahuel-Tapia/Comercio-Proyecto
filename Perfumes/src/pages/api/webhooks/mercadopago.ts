import type { APIRoute } from 'astro';
import db from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    
    // Intentar obtener ID y topic desde query params (IPN) o desde el body (Webhooks)
    let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');
    let topic = url.searchParams.get('topic') || url.searchParams.get('type');
    
    if (!paymentId) {
      try {
        const body = await request.clone().json();
        if (body.type === 'payment' || body.topic === 'payment') {
          paymentId = body.data?.id || body.id;
          topic = 'payment';
        } else if (body.action?.startsWith('payment')) {
          paymentId = body.data?.id;
          topic = 'payment';
        }
      } catch (e) {
        // No hay body JSON, ignorar
      }
    }
    
    // Si no se encuentra topic en query ni en JSON, pero viene un ID
    if (paymentId && !topic) {
      topic = 'payment';
    }
    
    if (topic === 'payment' && paymentId) {
      const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
      
      if (mpAccessToken && mpAccessToken !== 'TEST-TOKEN-SIMULADO') {
        // Consultar el estado del pago a Mercado Pago
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`
          }
        });
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          const orderId = paymentData.external_reference;
          const status = paymentData.status; // approved, pending, rejected, in_process, etc.
          
          if (orderId) {
            let orderStatus = 'Pendiente';
            let paymentStatus = 'Pendiente';
            let shouldSendApprovedEmail = false;
            
            if (status === 'approved') {
              orderStatus = 'Completado';
              paymentStatus = 'Aprobado';
              shouldSendApprovedEmail = true;
            } else if (status === 'rejected') {
              paymentStatus = 'Rechazado';
            } else if (status === 'in_process' || status === 'pending') {
              paymentStatus = 'Pendiente';
            }
            
            // Actualizar de forma segura la orden en la base de datos
            db.prepare(`
              UPDATE orders 
              SET status = ?, payment_status = ?, payment_id = ? 
              WHERE id = ?
            `).run(orderStatus, paymentStatus, paymentId, orderId);
            
            console.log(`Webhook MP: Pedido #${orderId} actualizado con éxito a estado ${paymentStatus}.`);

            if (shouldSendApprovedEmail) {
              try {
                const orderData = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
                if (orderData) {
                  const items = JSON.parse(orderData.items_json);
                  
                  const getProductDetails = db.prepare('SELECT name FROM products WHERE id = ?');
                  const hydratedItems = items.map((item: any) => {
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
                  
                  const { sendOrderApprovedEmail } = await import('../../../lib/email');
                  sendOrderApprovedEmail(orderData, hydratedItems).catch(err => {
                    console.error('Error enviando email de pago aprobado:', err);
                  });
                }
              } catch (emailErr) {
                console.error('Error al iniciar el envío de email de pago aprobado:', emailErr);
              }
            }
          }
        } else {
          console.error(`Error al consultar pago ${paymentId} en Mercado Pago:`, await paymentResponse.text());
        }
      } else {
        console.log(`Webhook MP: Token simulado o no configurado. Recibido evento para pago ${paymentId}.`);
      }
    }
    
    // Siempre responder 200 OK a Mercado Pago
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en Webhook Mercado Pago:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
