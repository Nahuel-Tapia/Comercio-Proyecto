import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { z } from 'zod';

const ReviewSchema = z.object({
  product_id: z.string().min(1, 'El ID del producto es requerido'),
  client_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  rating: z.number().int().min(1, 'La calificación mínima es 1').max(5, 'La calificación máxima es 5'),
  comment: z.string().min(5, 'El comentario debe tener al menos 5 caracteres')
});

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    
    if (!productId) {
      return new Response(JSON.stringify({ error: 'El ID del producto es requerido' }), { status: 400 });
    }

    // Retorna sólo reseñas aprobadas. Ocultamos el email del cliente por privacidad.
    const reviews = db.prepare(`
      SELECT id, product_id, client_name, rating, comment, created_at 
      FROM reviews 
      WHERE product_id = ? AND is_approved = 1 
      ORDER BY created_at DESC
    `).all(productId);

    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor al obtener reseñas' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const validation = ReviewSchema.safeParse(data);

    if (!validation.success) {
      const errorMsg = validation.error.errors.map(e => e.message).join(', ');
      return new Response(JSON.stringify({ error: errorMsg }), { status: 400 });
    }

    const { product_id, client_name, email, rating, comment } = validation.data;

    // Verificar que el producto existe en la base de datos antes de registrar la reseña
    const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!productExists) {
      return new Response(JSON.stringify({ error: 'El producto no existe' }), { status: 404 });
    }

    db.prepare(`
      INSERT INTO reviews (product_id, client_name, email, rating, comment, is_approved)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(product_id, client_name, email, rating, comment);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Reseña enviada con éxito. Se mostrará una vez aprobada por el administrador.' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error del servidor al registrar la reseña' }), { status: 500 });
  }
};
