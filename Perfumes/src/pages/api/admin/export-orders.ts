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
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];

    // Cabeceras CSV
    const headers = ['ID', 'Cliente', 'Email', 'Telefono', 'Direccion', 'Metodo', 'Monto Total', 'Estado', 'Fecha de Creacion'];
    
    // Generar las filas del CSV sanitizando comillas y comas
    const rows = orders.map(order => {
      const escape = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };
      
      return [
        escape(order.id),
        escape(order.client_name),
        escape(order.client_email),
        escape(order.phone),
        escape(order.address),
        escape(order.method === 'envio' ? 'Envio a domicilio' : 'Retiro a coordinar'),
        escape(order.total),
        escape(order.status),
        escape(order.created_at)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Incluye BOM para acentos en Excel

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reporte_ordenes.csv"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor al exportar órdenes' }), { status: 500 });
  }
};
