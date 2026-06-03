import type { APIRoute } from 'astro';
import db from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    
    // Convertir de lista de filas a un objeto clave-valor plano
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
