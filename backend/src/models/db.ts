import '../config/env';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { User, Category, Product, Coupon, Order, Address, CartAbandonment } from './types';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Configure PostgreSQL before starting the backend.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const backupPath = path.join(__dirname, '../../db_backup.json');

type TableName =
  | 'app_users'
  | 'categories'
  | 'products'
  | 'coupons'
  | 'orders'
  | 'addresses'
  | 'cart_abandonment';

type BackupDB = {
  users?: User[];
  categories?: Category[];
  products?: Product[];
  coupons?: Coupon[];
  orders?: Order[];
  addresses?: Address[];
  cart_abandonment?: CartAbandonment[];
};

const ensureConfigured = () => {
  if (!connectionString) {
    throw new Error('PostgreSQL is not configured. Set DATABASE_URL in backend/.env or the project .env.');
  }
};

const schemaSql = `
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image TEXT,
  parent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL,
  sub_category TEXT,
  collection TEXT,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL,
  sale_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_images JSONB NOT NULL DEFAULT '{}'::jsonb,
  color_sizes JSONB NOT NULL DEFAULT '{}'::jsonb,
  color_stock JSONB NOT NULL DEFAULT '{}'::jsonb,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  fabric TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_cart_value NUMERIC NOT NULL DEFAULT 0,
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  applicable_type TEXT NOT NULL DEFAULT 'all',
  applicable_id TEXT,
  applicable_product_id TEXT,
  display_on_site BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  order_status TEXT NOT NULL DEFAULT 'Pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS cart_abandonment (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  step TEXT NOT NULL,
  lost_revenue NUMERIC NOT NULL DEFAULT 0,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const asNumber = (value: any) => (value === null || value === undefined ? value : Number(value));
const asIso = (value: any) => (value ? new Date(value).toISOString() : value);

const mapUser = (row: any): User => ({
  ...row,
  created_at: asIso(row.created_at)
});

const mapCategory = (row: any): Category => ({
  ...row,
  created_at: asIso(row.created_at)
});

const mapProduct = (row: any): Product => ({
  ...row,
  price: asNumber(row.price),
  sale_price: asNumber(row.sale_price),
  stock: Number(row.stock),
  images: row.images || [],
  color_images: row.color_images || {},
  color_sizes: row.color_sizes || {},
  color_stock: row.color_stock || {},
  videos: row.videos || [],
  sizes: row.sizes || [],
  colors: row.colors || [],
  is_featured: !!row.is_featured,
  is_bestseller: !!row.is_bestseller,
  created_at: asIso(row.created_at)
});

const mapCoupon = (row: any): Coupon => ({
  ...row,
  value: asNumber(row.value),
  usage_limit: Number(row.usage_limit),
  used_count: Number(row.used_count),
  min_cart_value: asNumber(row.min_cart_value),
  first_order_only: !!row.first_order_only,
  display_on_site: !!row.display_on_site,
  expiry_date: asIso(row.expiry_date),
  created_at: asIso(row.created_at)
});

const mapOrder = (row: any): Order => ({
  ...row,
  items: row.items || [],
  total_amount: asNumber(row.total_amount),
  discount_amount: asNumber(row.discount_amount),
  tax_amount: asNumber(row.tax_amount),
  shipping_amount: asNumber(row.shipping_amount),
  final_amount: asNumber(row.final_amount),
  shipping_address: row.shipping_address,
  billing_address: row.billing_address,
  created_at: asIso(row.created_at)
});

const mapAddress = (row: any): Address => ({
  ...row,
  is_default: !!row.is_default
});

const mapCartAbandonment = (row: any): CartAbandonment => ({
  ...row,
  items: row.items || [],
  lost_revenue: asNumber(row.lost_revenue),
  email_sent: !!row.email_sent,
  created_at: asIso(row.created_at),
  updated_at: asIso(row.updated_at)
});

async function countRows(table: TableName) {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return Number(result.rows[0].count);
}

async function seedFromBackup() {
  if (!fs.existsSync(backupPath)) return;
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as BackupDB;

  if ((backup.users?.length || 0) > 0 && await countRows('app_users') === 0) {
    for (const item of backup.users || []) await db.users.create(item);
  }
  if ((backup.categories?.length || 0) > 0 && await countRows('categories') === 0) {
    for (const item of backup.categories || []) await db.categories.create(item);
  }
  if ((backup.products?.length || 0) > 0 && await countRows('products') === 0) {
    for (const item of backup.products || []) await db.products.create(item);
  }
  if ((backup.coupons?.length || 0) > 0 && await countRows('coupons') === 0) {
    for (const item of backup.coupons || []) await db.coupons.create(item);
  }
  if ((backup.orders?.length || 0) > 0 && await countRows('orders') === 0) {
    for (const item of backup.orders || []) await db.orders.create(item);
  }
  if ((backup.addresses?.length || 0) > 0 && await countRows('addresses') === 0) {
    for (const item of backup.addresses || []) await db.addresses.create(item);
  }
  if ((backup.cart_abandonment?.length || 0) > 0 && await countRows('cart_abandonment') === 0) {
    for (const item of backup.cart_abandonment || []) await db.cartAbandonment.create(item);
  }
}

let isInitializing = false;
async function initializeDatabase() {
  isInitializing = true;
  try {
    ensureConfigured();
    await pool.query(schemaSql);
    // Dynamically alter existing database table for columns
    await pool.query(`ALTER TABLE cart_abandonment ADD COLUMN IF NOT EXISTS customer_name TEXT`);
    await pool.query(`ALTER TABLE cart_abandonment ADD COLUMN IF NOT EXISTS customer_email TEXT`);
    await pool.query(`ALTER TABLE cart_abandonment ADD COLUMN IF NOT EXISTS customer_phone TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_sizes JSONB DEFAULT '{}'::jsonb`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_stock JSONB DEFAULT '{}'::jsonb`);
    await seedFromBackup();
  } finally {
    isInitializing = false;
  }
}

let initPromise: Promise<void>;

const ready = async () => {
  if (isInitializing) return;
  await initPromise;
};

export const db = {
  async query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[] }> {
    await ready();
    const result = await pool.query(text, params);
    return { rows: result.rows };
  },

  users: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM app_users ORDER BY created_at DESC');
      return res.rows.map(mapUser);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM app_users WHERE id = $1', [id]);
      return res.rows[0] ? mapUser(res.rows[0]) : null;
    },
    getByEmail: async (email: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM app_users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] ? mapUser(res.rows[0]) : null;
    },
    getByPhone: async (phone: string) => {
      await ready();
      // Normalize phone: strip all non-digits, match on last 10 digits
      const normalized = phone.replace(/\D/g, '').slice(-10);
      const res = await pool.query(
        `SELECT * FROM app_users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE $1`,
        [`%${normalized}`]
      );
      return res.rows[0] ? mapUser(res.rows[0]) : null;
    },
    create: async (user: User) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO app_users (id, name, email, phone, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [user.id, user.name, user.email, user.phone || null, user.password_hash, user.role, user.created_at]
      );
      return mapUser(res.rows[0]);
    },
    update: async (id: string, updates: Partial<User>) => {
      await ready();
      const current = await db.users.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      const res = await pool.query(
        `UPDATE app_users SET name=$2, email=$3, phone=$4, password_hash=$5, role=$6 WHERE id=$1 RETURNING *`,
        [id, next.name, next.email, next.phone || null, next.password_hash, next.role]
      );
      return mapUser(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM app_users WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  categories: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
      return res.rows.map(mapCategory);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      return res.rows[0] ? mapCategory(res.rows[0]) : null;
    },
    create: async (cat: Category) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO categories (id, name, slug, image, parent_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [cat.id, cat.name, cat.slug, cat.image || null, cat.parent_id || null, cat.created_at]
      );
      return mapCategory(res.rows[0]);
    },
    update: async (id: string, updates: Partial<Category>) => {
      await ready();
      const current = await db.categories.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      const res = await pool.query(
        `UPDATE categories SET name=$2, slug=$3, image=$4, parent_id=$5 WHERE id=$1 RETURNING *`,
        [id, next.name, next.slug, next.image || null, next.parent_id || null]
      );
      return mapCategory(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  products: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.rows.map(mapProduct);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return res.rows[0] ? mapProduct(res.rows[0]) : null;
    },
    create: async (prod: Product) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO products
         (id, name, sku, category_id, sub_category, collection, description, price, sale_price, stock, images, color_images, color_sizes, color_stock, videos, sizes, colors, fabric, is_featured, is_bestseller, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [
          prod.id, prod.name, prod.sku, prod.category_id, prod.sub_category || null, prod.collection || null,
          prod.description || '', prod.price, prod.sale_price ?? null, prod.stock,
          JSON.stringify(prod.images || []), JSON.stringify(prod.color_images || {}), JSON.stringify(prod.color_sizes || {}), JSON.stringify(prod.color_stock || {}), JSON.stringify(prod.videos || []),
          JSON.stringify(prod.sizes || []), JSON.stringify(prod.colors || []), prod.fabric || null,
          !!prod.is_featured, !!prod.is_bestseller, prod.created_at
        ]
      );
      return mapProduct(res.rows[0]);
    },
    update: async (id: string, updates: Partial<Product>) => {
      await ready();
      const current = await db.products.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      const res = await pool.query(
        `UPDATE products SET
          name=$2, sku=$3, category_id=$4, sub_category=$5, collection=$6, description=$7,
          price=$8, sale_price=$9, stock=$10, images=$11, color_images=$12, color_sizes=$13, color_stock=$14, videos=$15,
          sizes=$16, colors=$17, fabric=$18, is_featured=$19, is_bestseller=$20
         WHERE id=$1 RETURNING *`,
        [
          id, next.name, next.sku, next.category_id, next.sub_category || null, next.collection || null,
          next.description || '', next.price, next.sale_price ?? null, next.stock,
          JSON.stringify(next.images || []), JSON.stringify(next.color_images || {}), JSON.stringify(next.color_sizes || {}), JSON.stringify(next.color_stock || {}), JSON.stringify(next.videos || []),
          JSON.stringify(next.sizes || []), JSON.stringify(next.colors || []), next.fabric || null,
          !!next.is_featured, !!next.is_bestseller
        ]
      );
      return mapProduct(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  coupons: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
      return res.rows.map(mapCoupon);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
      return res.rows[0] ? mapCoupon(res.rows[0]) : null;
    },
    getByCode: async (code: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code]);
      return res.rows[0] ? mapCoupon(res.rows[0]) : null;
    },
    create: async (coupon: Coupon) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO coupons
         (id, code, discount_type, value, expiry_date, usage_limit, used_count, min_cart_value, first_order_only, applicable_type, applicable_id, applicable_product_id, display_on_site, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code
         RETURNING *`,
        [
          coupon.id, coupon.code, coupon.discount_type, coupon.value, coupon.expiry_date,
          coupon.usage_limit, coupon.used_count, coupon.min_cart_value, coupon.first_order_only,
          coupon.applicable_type || 'all', coupon.applicable_id || null, coupon.applicable_product_id || null,
          coupon.display_on_site, coupon.created_at
        ]
      );
      return mapCoupon(res.rows[0]);
    },
    update: async (id: string, updates: Partial<Coupon>) => {
      await ready();
      const current = await db.coupons.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      const res = await pool.query(
        `UPDATE coupons SET code=$2, discount_type=$3, value=$4, expiry_date=$5, usage_limit=$6,
          used_count=$7, min_cart_value=$8, first_order_only=$9, applicable_type=$10,
          applicable_id=$11, applicable_product_id=$12, display_on_site=$13
         WHERE id=$1 RETURNING *`,
        [
          id, next.code, next.discount_type, next.value, next.expiry_date, next.usage_limit,
          next.used_count, next.min_cart_value, next.first_order_only, next.applicable_type || 'all',
          next.applicable_id || null, next.applicable_product_id || null, next.display_on_site
        ]
      );
      return mapCoupon(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  orders: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows.map(mapOrder);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      return res.rows[0] ? mapOrder(res.rows[0]) : null;
    },
    getByUserId: async (userId: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows.map(mapOrder);
    },
    create: async (order: Order) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO orders
         (id, user_id, guest_name, guest_email, guest_phone, items, total_amount, discount_amount, tax_amount, shipping_amount, final_amount,
          payment_status, payment_method, order_status, razorpay_order_id, razorpay_payment_id, shipping_address, billing_address, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [
          order.id, order.user_id || null, order.guest_name || null, order.guest_email || null, order.guest_phone || null,
          JSON.stringify(order.items || []), order.total_amount, order.discount_amount, order.tax_amount, order.shipping_amount, order.final_amount,
          order.payment_status, order.payment_method, order.order_status, order.razorpay_order_id || null, order.razorpay_payment_id || null,
          JSON.stringify(order.shipping_address), JSON.stringify(order.billing_address), order.created_at
        ]
      );
      return mapOrder(res.rows[0]);
    },
    update: async (id: string, updates: Partial<Order>) => {
      await ready();
      const current = await db.orders.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      const res = await pool.query(
        `UPDATE orders SET payment_status=$2, payment_method=$3, order_status=$4,
          razorpay_order_id=$5, razorpay_payment_id=$6
         WHERE id=$1 RETURNING *`,
        [id, next.payment_status, next.payment_method, next.order_status, next.razorpay_order_id || null, next.razorpay_payment_id || null]
      );
      return mapOrder(res.rows[0]);
    }
  },

  addresses: {
    getByUserId: async (userId: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
      return res.rows.map(mapAddress);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM addresses WHERE id = $1', [id]);
      return res.rows[0] ? mapAddress(res.rows[0]) : null;
    },
    create: async (address: Address) => {
      await ready();
      if (address.is_default) {
        await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [address.user_id]);
      }
      const res = await pool.query(
        `INSERT INTO addresses (id, user_id, name, phone, address_line1, address_line2, city, state, postal_code, country, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [address.id, address.user_id, address.name, address.phone, address.address_line1, address.address_line2 || null, address.city, address.state, address.postal_code, address.country, address.is_default]
      );
      return mapAddress(res.rows[0]);
    },
    update: async (id: string, updates: Partial<Address>) => {
      await ready();
      const current = await db.addresses.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      if (next.is_default) {
        await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [next.user_id]);
      }
      const res = await pool.query(
        `UPDATE addresses SET name=$2, phone=$3, address_line1=$4, address_line2=$5,
          city=$6, state=$7, postal_code=$8, country=$9, is_default=$10
         WHERE id=$1 RETURNING *`,
        [id, next.name, next.phone, next.address_line1, next.address_line2 || null, next.city, next.state, next.postal_code, next.country, next.is_default]
      );
      return mapAddress(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM addresses WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  cartAbandonment: {
    getAll: async () => {
      await ready();
      const res = await pool.query('SELECT * FROM cart_abandonment ORDER BY updated_at DESC');
      return res.rows.map(mapCartAbandonment);
    },
    getById: async (id: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM cart_abandonment WHERE id = $1', [id]);
      return res.rows[0] ? mapCartAbandonment(res.rows[0]) : null;
    },
    getBySessionId: async (sid: string) => {
      await ready();
      const res = await pool.query('SELECT * FROM cart_abandonment WHERE session_id = $1', [sid]);
      return res.rows[0] ? mapCartAbandonment(res.rows[0]) : null;
    },
    create: async (ca: CartAbandonment) => {
      await ready();
      const res = await pool.query(
        `INSERT INTO cart_abandonment (id, user_id, session_id, items, step, lost_revenue, email_sent, customer_name, customer_email, customer_phone, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (session_id) DO UPDATE SET items=EXCLUDED.items, step=EXCLUDED.step, lost_revenue=EXCLUDED.lost_revenue, customer_name=EXCLUDED.customer_name, customer_email=EXCLUDED.customer_email, customer_phone=EXCLUDED.customer_phone, updated_at=EXCLUDED.updated_at
         RETURNING *`,
        [ca.id, ca.user_id || null, ca.session_id, JSON.stringify(ca.items || []), ca.step, ca.lost_revenue, ca.email_sent, ca.customer_name || null, ca.customer_email || null, ca.customer_phone || null, ca.created_at, ca.updated_at]
      );
      return mapCartAbandonment(res.rows[0]);
    },
    update: async (id: string, updates: Partial<CartAbandonment>) => {
      await ready();
      const current = await db.cartAbandonment.getById(id);
      if (!current) return null;
      const next = { ...current, ...updates, updated_at: new Date().toISOString() };
      const res = await pool.query(
        `UPDATE cart_abandonment SET user_id=$2, items=$3, step=$4, lost_revenue=$5,
          email_sent=$6, customer_name=$7, customer_email=$8, customer_phone=$9, updated_at=$10
         WHERE id=$1 RETURNING *`,
        [id, next.user_id || null, JSON.stringify(next.items || []), next.step, next.lost_revenue, next.email_sent, next.customer_name || null, next.customer_email || null, next.customer_phone || null, next.updated_at]
      );
      return mapCartAbandonment(res.rows[0]);
    },
    delete: async (id: string) => {
      await ready();
      const res = await pool.query('DELETE FROM cart_abandonment WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  }
};

initPromise = initializeDatabase().catch((error) => {
  console.error('PostgreSQL initialization failed:', error.message);
  throw error;
});
