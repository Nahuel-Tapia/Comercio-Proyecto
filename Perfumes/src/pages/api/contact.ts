import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { checkRateLimit } from '../../lib/rateLimit';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional().default(''),
  reason: z.string().optional().default('Asesoramiento'),
  message: z.string().min(1, 'El mensaje es requerido'),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 3, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const result = ContactSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }

    const { name, phone, reason, message } = result.data;

    db.prepare('INSERT INTO messages (name, phone, reason, message) VALUES (?, ?, ?, ?)').run(
      name,
      phone,
      reason,
      message
    );

    return new Response(JSON.stringify({ success: true, message: 'Consulta enviada con éxito. Te responderemos a la brevedad.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in contact endpoint:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor al procesar consulta' }), { status: 500 });
  }
};
