import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { verifySession } from '../../../lib/auth';

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
    const subscribers = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
    return new Response(JSON.stringify(subscribers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener suscriptores' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de suscriptor es requerido' }), { status: 400 });
    }

    db.prepare('DELETE FROM newsletter WHERE id = ?').run(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al eliminar suscriptor' }), { status: 500 });
  }
};
