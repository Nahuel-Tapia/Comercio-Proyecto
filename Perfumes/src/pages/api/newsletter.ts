import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { checkRateLimit } from '../../lib/rateLimit';
import { z } from 'zod';

const NewsletterSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 5, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const result = NewsletterSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }

    const { email } = result.data;

    try {
      db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);
    } catch (dbErr: any) {
      // Si el email ya existe (UNIQUE constraint failed), devolvemos éxito silencioso o mensaje amigable
      if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return new Response(JSON.stringify({ success: true, message: 'Ya te encuentras registrado en nuestro boletín.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw dbErr;
    }

    return new Response(JSON.stringify({ success: true, message: '¡Te has registrado con éxito en nuestro boletín!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in newsletter endpoint:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor al registrarse' }), { status: 500 });
  }
};
