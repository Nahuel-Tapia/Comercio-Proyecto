import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { verifyPassword, signSession } from '../../lib/auth';
import { checkRateLimit } from '../../lib/rateLimit';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 5, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, password } = body;

    const user = db.prepare('SELECT id, email, password FROM users WHERE email = ?').get(email) as any;

    if (!user || !verifyPassword(password, user.password)) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear cookie de sesión firmada
    const signedSession = signSession(user.id.toString());
    cookies.set('admin_session', signedSession, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
