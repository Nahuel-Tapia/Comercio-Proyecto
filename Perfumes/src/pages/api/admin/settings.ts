import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { verifySession } from '../../../lib/auth';
import { z } from 'zod';

function checkAuth(cookies: any) {
  const sessionCookie = cookies.get('admin_session');
  return sessionCookie && verifySession(sessionCookie.value);
}

const SettingsUpdateSchema = z.object({
  shipping_cost: z.string().regex(/^\d+$/, 'El costo de envío debe ser un número entero no negativo'),
  whatsapp_number: z.string().min(5, 'El número de WhatsApp debe ser válido'),
  header_banner: z.string().max(250, 'El banner no debe exceder los 250 caracteres')
});

export const GET: APIRoute = async ({ cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsObj = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return new Response(JSON.stringify(settingsObj), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener configuraciones' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!checkAuth(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const data = await request.json();
    const validation = SettingsUpdateSchema.safeParse(data);

    if (!validation.success) {
      const errorMsg = validation.error.errors.map(e => e.message).join(', ');
      return new Response(JSON.stringify({ error: errorMsg }), { status: 400 });
    }

    const updates = validation.data;

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    // Ejecutar transaccionalmente
    const updateTransaction = db.transaction((settingsMap: Record<string, string>) => {
      for (const [key, value] of Object.entries(settingsMap)) {
        stmt.run(key, value);
      }
    });

    updateTransaction(updates);

    return new Response(JSON.stringify({ success: true, message: 'Configuraciones actualizadas con éxito' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor al guardar configuraciones' }), { status: 500 });
  }
};
