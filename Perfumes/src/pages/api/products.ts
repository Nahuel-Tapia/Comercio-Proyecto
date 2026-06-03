import type { APIRoute } from 'astro';
import db, { getProducts } from '../../lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { verifySession } from '../../lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum(['Para Mujer', 'Para Hombre', 'Unisex']),
  family: z.string().min(1, 'La familia olfativa es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  concentration: z.string().min(1, 'La concentración es requerida'),
  intensity: z.enum(['Suave', 'Media', 'Intensa']),
  longevity: z.string().min(1, 'La duración es requerida'),
  sillage: z.string().min(1, 'La estela es requerida'),
  recommendation: z.string().min(1, 'La recomendación es requerida'),
  sizes: z.array(z.object({
    label: z.string(),
    price: z.number().positive('El precio debe ser mayor a 0'),
    stock: z.number().int().nonnegative('El stock no puede ser negativo')
  })).min(1, 'Debe tener al menos una variante de tamaño'),
  bestFor: z.array(z.string()).optional().default([]),
  seasons: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.object({
    top: z.array(z.string()).optional().default([]),
    heart: z.array(z.string()).optional().default([]),
    base: z.array(z.string()).optional().default([])
  }).optional().default({ top: [], heart: [], base: [] })
});

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const products = getProducts();
  return new Response(JSON.stringify(products), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    let data;
    let imageUrl = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data = JSON.parse(formData.get('productData') as string);
      
      const file = formData.get('imageFile') as File;
      
      if (!data.name || typeof data.name !== 'string') {
        return new Response(JSON.stringify({ error: 'El nombre del producto es requerido' }), { status: 400 });
      }

      if (file && file.size > 0) {
        if (file.size > 5 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'La imagen supera el tamaño máximo de 5MB' }), { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          return new Response(JSON.stringify({ error: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG, WEBP, AVIF y GIF.' }), { status: 400 });
        }

        let extension = '.jpg';
        if (file.type === 'image/png') extension = '.png';
        else if (file.type === 'image/webp') extension = '.webp';
        else if (file.type === 'image/avif') extension = '.avif';
        else if (file.type === 'image/gif') extension = '.gif';

        const fileName = `${crypto.randomUUID()}${extension}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        imageUrl = `/uploads/${fileName}`;

        // Intentar borrar la imagen anterior si existía
        if (data.id) {
          const oldProd = db.prepare('SELECT image FROM products WHERE id = ?').get(data.id) as any;
          if (oldProd && oldProd.image && oldProd.image.startsWith('/uploads/')) {
            try {
              await fs.unlink(path.join(process.cwd(), 'public', oldProd.image));
            } catch (err) {}
          }
        }
      } else {
        imageUrl = data.image || '';
      }
    } else {
      data = await request.json();
      imageUrl = data.image || '';
    }

    const validationResult = ProductSchema.safeParse(data);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: validationResult.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }
    const validatedData = validationResult.data;
    
    const insertOrReplace = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, category, image, description, family, concentration, intensity,
        longevity, sillage, recommendation, sizes_json, bestFor_json, seasons_json,
        tags_json, notes_json
      ) VALUES (
        @id, @name, @category, @image, @description, @family, @concentration, @intensity,
        @longevity, @sillage, @recommendation, @sizes_json, @bestFor_json, @seasons_json,
        @tags_json, @notes_json
      )
    `);

    insertOrReplace.run({
      id: validatedData.id || Math.random().toString(36).substr(2, 9),
      name: validatedData.name,
      category: validatedData.category,
      image: imageUrl,
      description: validatedData.description,
      family: validatedData.family,
      concentration: validatedData.concentration,
      intensity: validatedData.intensity,
      longevity: validatedData.longevity,
      sillage: validatedData.sillage,
      recommendation: validatedData.recommendation,
      sizes_json: JSON.stringify(validatedData.sizes),
      bestFor_json: JSON.stringify(validatedData.bestFor),
      seasons_json: JSON.stringify(validatedData.seasons),
      tags_json: JSON.stringify(validatedData.tags),
      notes_json: JSON.stringify(validatedData.notes),
    });
    
    return new Response(JSON.stringify({ success: true, message: 'Producto guardado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Error del servidor al guardar' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('admin_session');
  if (!sessionCookie || !verifySession(sessionCookie.value)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) throw new Error("ID es requerido");

    const existingProduct = db.prepare('SELECT image FROM products WHERE id = ?').get(id) as any;
    if (existingProduct && existingProduct.image && existingProduct.image.startsWith('/uploads/')) {
      const oldImagePath = path.join(process.cwd(), 'public', existingProduct.image);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.error('Error al borrar la imagen antigua:', err);
      }
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    return new Response(JSON.stringify({ success: true, message: 'Producto eliminado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Error del servidor al eliminar' }), { status: 500 });
  }
};
