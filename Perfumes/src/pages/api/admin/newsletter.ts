import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { verifySession } from '../../../lib/auth';
import { syncWithNewsletterProvider } from '../newsletter';

// Helper para verificar sesión de administrador
function checkAuth(cookies: any) {
  const sessionCookie = cookies.get('admin_session');
  return sessionCookie && verifySession(sessionCookie.value);
}

let isRetryJobRunning = false;

async function runNewsletterRetryJob() {
  if (isRetryJobRunning) return;
  isRetryJobRunning = true;
  try {
    const pendingOrFailed = db.prepare("SELECT * FROM newsletter WHERE sync_status IN ('pending', 'failed') AND sync_attempts < 5").all() as any[];
    for (const sub of pendingOrFailed) {
      const nextAttempts = (sub.sync_attempts || 0) + 1;
      try {
        const provider = await syncWithNewsletterProvider(sub.email);
        db.prepare("UPDATE newsletter SET sync_status = 'synced', sync_provider = ?, sync_attempts = ? WHERE id = ?")
          .run(provider, nextAttempts, sub.id);
      } catch (syncErr: any) {
        console.error(`[NEWSLETTER RETRY] Falló reintento para ${sub.email}:`, syncErr.message);
        db.prepare("UPDATE newsletter SET sync_status = 'failed', sync_attempts = ?, last_sync_error = ? WHERE id = ?")
          .run(nextAttempts, syncErr.message, sub.id);
      }
    }
  } catch (err) {
    console.error('[NEWSLETTER RETRY JOB ERROR]', err);
  } finally {
    isRetryJobRunning = false;
  }
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  // Ejecutar el reintento de forma no bloqueante
  runNewsletterRetryJob().catch(err => console.error('[NEWSLETTER RETRY JOB PROMISE ERROR]', err));

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
