import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { verifySession } from '../../../lib/auth';

function checkAuth(cookies: any) {
  const sessionCookie = cookies.get('admin_session');
  return sessionCookie && verifySession(sessionCookie.value);
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.image as product_image 
      FROM reviews r 
      LEFT JOIN products p ON r.product_id = p.id 
      ORDER BY r.created_at DESC
    `).all();

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener reseñas administrativas' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id, is_approved } = await request.json();
    
    if (id === undefined || is_approved === undefined) {
      return new Response(JSON.stringify({ error: 'ID y estado is_approved son requeridos' }), { status: 400 });
    }

    const approvedVal = is_approved ? 1 : 0;
    db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(approvedVal, id);

    return new Response(JSON.stringify({ success: true, message: 'Estado de reseña actualizado' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al actualizar reseña' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de reseña es requerido' }), { status: 400 });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

    return new Response(JSON.stringify({ success: true, message: 'Reseña eliminada' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al eliminar reseña' }), { status: 500 });
  }
};
