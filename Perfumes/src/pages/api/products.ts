import type { APIRoute } from 'astro';
import db, { getProducts } from '../../lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { verifySession } from '../../lib/auth';

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
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
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
      id: data.id || Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      category: data.category || 'Unisex',
      image: imageUrl,
      description: data.description || '',
      family: data.family || '',
      concentration: data.concentration || '',
      intensity: data.intensity || 'Media',
      longevity: data.longevity || '',
      sillage: data.sillage || '',
      recommendation: data.recommendation || '',
      sizes_json: JSON.stringify(data.sizes || []),
      bestFor_json: JSON.stringify(data.bestFor || []),
      seasons_json: JSON.stringify(data.seasons || []),
      tags_json: JSON.stringify(data.tags || []),
      notes_json: JSON.stringify(data.notes || { top: [], heart: [], base: [] }),
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
