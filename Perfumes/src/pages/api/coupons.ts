import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { checkRateLimit } from '../../lib/rateLimit';

export const GET: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 10, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Código de cupón es requerido' }), { status: 400 });
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code) as any;

    if (!coupon) {
      return new Response(JSON.stringify({ error: 'Cupón no válido o inexistente' }), { status: 404 });
    }

    if (!coupon.is_active) {
      return new Response(JSON.stringify({ error: 'Este cupón ha sido desactivado' }), { status: 400 });
    }

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ error: 'Este cupón ha alcanzado el límite de usos' }), { status: 400 });
    }

    if (coupon.expires_at) {
      const expirationDate = new Date(coupon.expires_at);
      if (expirationDate.getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: 'Este cupón ha expirado' }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in coupons API:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor al validar cupón' }), { status: 500 });
  }
};
