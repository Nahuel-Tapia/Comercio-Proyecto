import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { verifySession } from '../../../lib/auth';
import { z } from 'zod';

const CouponSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').toUpperCase().trim(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('El valor del descuento debe ser mayor a 0'),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().nullable().optional().transform(val => val === '' ? null : val)
});

// Helper para verificar sesión de administrador
function checkAuth(cookies: any) {
  const sessionCookie = cookies.get('admin_session');
  return sessionCookie && verifySession(sessionCookie.value);
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY code ASC').all();
    return new Response(JSON.stringify(coupons), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener cupones' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const data = await request.json();
    const result = CouponSchema.safeParse(data);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }

    const { code, discount_type, discount_value, max_uses, expires_at } = result.data;

    // Verificar si el código ya existe
    const exists = db.prepare('SELECT code FROM coupons WHERE code = ?').get(code);
    if (exists) {
      return new Response(JSON.stringify({ error: 'El código de cupón ya existe' }), { status: 400 });
    }

    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, is_active, max_uses, expires_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(code, discount_type, discount_value, max_uses || null, expires_at || null);

    return new Response(JSON.stringify({ success: true, message: 'Cupón creado con éxito' }), { status: 200 });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor al crear cupón' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { code, is_active } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Código de cupón es requerido' }), { status: 400 });
    }

    db.prepare('UPDATE coupons SET is_active = ? WHERE code = ?').run(is_active ? 1 : 0, code);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al actualizar cupón' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Código de cupón es requerido' }), { status: 400 });
    }

    db.prepare('DELETE FROM coupons WHERE code = ?').run(code);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al eliminar cupón' }), { status: 500 });
  }
};
