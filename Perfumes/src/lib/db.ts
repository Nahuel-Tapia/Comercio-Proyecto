import Database from 'better-sqlite3';
import path from 'path';
import { PRODUCTS } from '../data/products';
import { hashPassword } from './auth';

// Para asegurarse de que funcione tanto en modo desarrollo como de producción
const dbPath = path.resolve(process.cwd(), 'local.db');
const db = new Database(dbPath);

// Inicializar tablas
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      family TEXT NOT NULL,
      concentration TEXT NOT NULL,
      intensity TEXT NOT NULL,
      longevity TEXT NOT NULL,
      sillage TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      sizes_json TEXT NOT NULL,
      bestFor_json TEXT NOT NULL,
      seasons_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      notes_json TEXT NOT NULL
    );
  `);

  // Crear usuario admin por defecto si no existe o migrar contraseña
  const adminUser = db.prepare('SELECT id, password FROM users WHERE email = ?').get('admin@ledesir.com') as any;
  
  if (!adminUser) {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('admin@ledesir.com', hashPassword('admin123'));
  } else if (!adminUser.password.includes(':')) {
    // Si la contraseña existe pero no tiene el formato de hash "salt:hash", la migramos
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashPassword(adminUser.password), 'admin@ledesir.com');
  }

  // Tabla de órdenes (pedidos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      method TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'Pendiente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migración para añadir soporte de cupones a la tabla de órdenes
  try {
    db.exec('ALTER TABLE orders ADD COLUMN coupon_code TEXT;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN discount REAL DEFAULT 0;');
  } catch (e) {}

  // Tabla de newsletters
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabla de mensajes de contacto
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      reason TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabla de cupones de descuento
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      max_uses INTEGER,
      uses_count INTEGER DEFAULT 0,
      expires_at DATETIME
    );
  `);

  // Crear cupones por defecto
  const testCoupon = db.prepare('SELECT code FROM coupons WHERE code = ?').get('LEDESIR10');
  if (!testCoupon) {
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, is_active)
      VALUES ('LEDESIR10', 'percentage', 10)
    `).run();
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, is_active)
      VALUES ('DESIR20', 'percentage', 20)
    `).run();
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, is_active)
      VALUES ('PROMO1000', 'fixed', 1000)
    `).run();
  }

  // Índices para optimizar consultas frecuentes
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_family ON products(family);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);');

  // Poblar productos si la tabla está vacía
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, name, category, image, description, family, concentration, intensity,
        longevity, sillage, recommendation, sizes_json, bestFor_json, seasons_json,
        tags_json, notes_json
      ) VALUES (
        @id, @name, @category, @image, @description, @family, @concentration, @intensity,
        @longevity, @sillage, @recommendation, @sizes_json, @bestFor_json, @seasons_json,
        @tags_json, @notes_json
      )
    `);

    const insertMany = db.transaction((products: any[]) => {
      for (const prod of products) {
        // Asegurar que cada tamaño tenga stock inicial si no lo tiene
        const sizesWithStock = prod.sizes.map((s: any) => ({
          ...s,
          stock: s.stock !== undefined ? s.stock : (s.label.includes('Frasco') ? 10 : 100)
        }));

        insertProduct.run({
          id: prod.id,
          name: prod.name,
          category: prod.category,
          image: prod.image,
          description: prod.description,
          family: prod.family,
          concentration: prod.concentration,
          intensity: prod.intensity,
          longevity: prod.longevity,
          sillage: prod.sillage,
          recommendation: prod.recommendation,
          sizes_json: JSON.stringify(sizesWithStock),
          bestFor_json: JSON.stringify(prod.bestFor),
          seasons_json: JSON.stringify(prod.seasons),
          tags_json: JSON.stringify(prod.tags),
          notes_json: JSON.stringify(prod.notes),
        });
      }
    });

    insertMany(PRODUCTS);
  } else {
    // Migración de base de datos existente: Agregar 'stock' a sizes_json si falta
    const allProducts = db.prepare('SELECT id, sizes_json FROM products').all() as any[];
    const updateSize = db.prepare('UPDATE products SET sizes_json = ? WHERE id = ?');
    
    db.transaction(() => {
      for (const p of allProducts) {
        let sizes = JSON.parse(p.sizes_json);
        let modified = false;
        sizes = sizes.map((s: any) => {
          if (s.stock === undefined) {
            modified = true;
            return { ...s, stock: s.label.includes('Frasco') ? 10 : 100 };
          }
          return s;
        });
        
        if (modified) {
          updateSize.run(JSON.stringify(sizes), p.id);
        }
      }
    })();
  }
};

initDb();

export default db;

// Funciones de utilidad para productos
export function getProducts() {
  const rows = db.prepare('SELECT * FROM products').all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image,
    description: row.description,
    family: row.family,
    concentration: row.concentration,
    intensity: row.intensity,
    longevity: row.longevity,
    sillage: row.sillage,
    recommendation: row.recommendation,
    sizes: JSON.parse(row.sizes_json),
    bestFor: JSON.parse(row.bestFor_json),
    seasons: JSON.parse(row.seasons_json),
    tags: JSON.parse(row.tags_json),
    notes: JSON.parse(row.notes_json),
  }));
}
