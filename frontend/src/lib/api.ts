const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get authorization token
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('paree_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  return {};
};

// Local storage keys
const MOCK_DB_KEY = 'paree_client_mock_db_v2';

// Initial seed mock state matching the database exactly
const defaultMockDB = {
  users: [
    {
      id: 'admin-user',
      name: 'Paree Admin',
      email: 'admin@paree.com',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Bridal Lehengas', slug: 'bridal-lehengas', image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600', parent_id: null, created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Wedding Sarees', slug: 'wedding-sarees', image: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=600', parent_id: null, created_at: new Date().toISOString() },
    { id: 'cat-3', name: 'Gowns & Anarkalis', slug: 'gowns-anarkalis', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', parent_id: null, created_at: new Date().toISOString() },
    { id: 'cat-4', name: 'Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600', parent_id: null, created_at: new Date().toISOString() }
  ],
  products: [
    {
      id: 'prod-1',
      name: 'Ruby Noor Velvet Lehenga',
      sku: 'PR-LH-001',
      category_id: 'cat-1',
      sub_category: 'Royal Collection',
      collection: 'Mehfil Edit',
      description: 'Heirloom-grade deep crimson velvet lehenga adorned with antique zari embroidery, hand-sewn sequins, and heavy gold borders. Comes with a matching embellished blouse and custom silk organza dupatta.',
      price: 84999,
      sale_price: 109999,
      stock: 5,
      images: [
        'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=1200'
      ],
      videos: [],
      sizes: ['S', 'M', 'L'],
      colors: ['Ruby Red', 'Deep Maroon'],
      fabric: 'Premium Velvet & Silk Organza',
      is_featured: true,
      is_bestseller: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prod-2',
      name: 'Emerald Mehr Couture Lehenga',
      sku: 'PR-LH-002',
      category_id: 'cat-1',
      sub_category: 'Royal Collection',
      collection: 'Mehfil Edit',
      description: 'Stunning forest green hand-embroidered lehenga in pure raw silk. Features elaborate dori and gota patti work with intricate peacock motifs. Pair it with double dupatta for a majestic bridal statement.',
      price: 96500,
      sale_price: 124000,
      stock: 3,
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
      ],
      videos: [],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Emerald Green', 'Forest Green'],
      fabric: 'Raw Silk',
      is_featured: true,
      is_bestseller: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'prod-3',
      name: 'Ivory Vow Pearl Lehenga',
      sku: 'PR-LH-003',
      category_id: 'cat-1',
      sub_category: 'Royal Collection',
      collection: 'Mehfil Edit',
      description: 'Elegant champagne ivory georgette lehenga with delicate white pearl and silver thread embroidery. Specially crafted for engagement ceremonies and modern day-wedding themes.',
      price: 78000,
      sale_price: 98000,
      stock: 8,
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
      ],
      videos: [],
      sizes: ['S', 'M', 'L'],
      colors: ['Ivory', 'Champagne Gold'],
      fabric: 'Georgette & Net',
      is_featured: true,
      is_bestseller: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'prod-4',
      name: 'Rose Saanjh Banarasi Saree',
      sku: 'PR-SR-001',
      category_id: 'cat-2',
      sub_category: 'Banarasi Silk',
      collection: 'Heritage Edit',
      description: 'Exquisite blush pink Banarasi silk saree woven with real gold and silver zari threads (Zari brocade). Features traditional floral patterns (Jal) with an ornate pallu.',
      price: 32500,
      sale_price: 41000,
      stock: 12,
      images: [
        'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=800'
      ],
      videos: [],
      sizes: ['Free Size'],
      colors: ['Blush Pink', 'Coral Rose'],
      fabric: 'Pure Banarasi Silk',
      is_featured: false,
      is_bestseller: true,
      created_at: new Date().toISOString()
    }
  ],
  coupons: [
    { id: 'c-1', code: 'PAREE10', discount_type: 'percentage', value: 10, min_cart_value: 5000, expiry_date: '2028-12-31T23:59:59Z', applicable_type: 'all', applicable_id: null, applicable_product_id: null, display_on_site: false },
    { id: 'c-2', code: 'WELCOME15', discount_type: 'percentage', value: 15, min_cart_value: 10000, expiry_date: '2028-12-31T23:59:59Z', applicable_type: 'all', applicable_id: null, applicable_product_id: null, display_on_site: true },
    { id: 'c-3', code: 'ROYAL20', discount_type: 'flat', value: 2000, min_cart_value: 20000, expiry_date: '2028-12-31T23:59:59Z', applicable_type: 'all', applicable_id: null, applicable_product_id: null, display_on_site: true }
  ],
  orders: [] as any[],
  abandonments: [] as any[],
  addresses: [] as any[]
};

// Retrieve client mock database helper
const getMockDB = () => {
  if (typeof window === 'undefined') return defaultMockDB;
  const dbStr = localStorage.getItem(MOCK_DB_KEY);
  if (!dbStr) {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(defaultMockDB));
    return defaultMockDB;
  }
  return JSON.parse(dbStr);
};

const saveMockDB = (db: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
  }
};

// Check if server is reachable, fallback to mock DB otherwise
async function request(url: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP error! Status: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true') {
      console.warn(`[Paree API Client] Server fetch failed for ${url}. Error: ${error.message}. Triggering client mock fallback.`);
      return handleMockRequest(url, options);
    }
    throw error;
  }
}

// Emulate backend logic inside the client if the backend is offline
function handleMockRequest(url: string, options: RequestInit = {}): any {
  const db = getMockDB();
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth routes
  if (url === '/auth/login') {
    const { email, password } = body;
    if (email === 'admin@paree.com' && password === 'admin123') {
      localStorage.setItem('paree_token', 'mock_admin_token');
      localStorage.setItem('paree_user', JSON.stringify({ id: 'admin-user', name: 'Paree Admin', email: 'admin@paree.com', role: 'admin' }));
      return { token: 'mock_admin_token', user: { id: 'admin-user', name: 'Paree Admin', email: 'admin@paree.com', role: 'admin' } };
    }
    // Simple user credentials fallback
    const mockUser = { id: 'usr-1', name: 'Luxury Bride', email: email, role: 'user' };
    localStorage.setItem('paree_token', 'mock_user_token');
    localStorage.setItem('paree_user', JSON.stringify(mockUser));
    return { token: 'mock_user_token', user: mockUser };
  }

  if (url === '/auth/register') {
    const { name, email } = body;
    const mockUser = { id: 'usr-' + Math.random().toString(36).substr(2, 5), name, email, role: 'user' };
    localStorage.setItem('paree_token', 'mock_user_token');
    localStorage.setItem('paree_user', JSON.stringify(mockUser));
    return { token: 'mock_user_token', user: mockUser };
  }

  if (url === '/auth/me') {
    const userStr = localStorage.getItem('paree_user');
    if (userStr) return JSON.parse(userStr);
    return { id: 'usr-guest', name: 'Guest User', email: 'guest@paree.com', role: 'user' };
  }

  if (url === '/auth/send-otp') {
    const { phone } = body;
    if (!phone) throw new Error('Phone number is required');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('paree_mock_otp_' + phone, JSON.stringify({ otp, phone }));
    return { success: true, simulatedOtp: otp, realSmsSent: false, message: 'Simulated OTP generated successfully' };
  }

  if (url === '/auth/verify-otp') {
    const { phone, otp } = body;
    const storedStr = localStorage.getItem('paree_mock_otp_' + phone);
    if (!storedStr) throw new Error('Verification session expired or invalid');
    const record = JSON.parse(storedStr);
    if (record.otp !== otp) throw new Error('Incorrect OTP code entered');
    // Mark as verified for registration completion
    localStorage.setItem('paree_mock_otp_' + phone, JSON.stringify({ ...record, verified: true }));

    // Check if user exists with this phone
    const existingUser = db.users.find((u: any) => {
      const storedPhone = (u.phone || '').replace(/\D/g, '').slice(-10);
      const inputPhone = phone.replace(/\D/g, '').slice(-10);
      return storedPhone === inputPhone && storedPhone.length === 10;
    });
    if (existingUser) {
      localStorage.removeItem('paree_mock_otp_' + phone);
      localStorage.setItem('paree_token', 'mock_user_token');
      localStorage.setItem('paree_user', JSON.stringify(existingUser));
      return { success: true, newUser: false, token: 'mock_user_token', user: existingUser };
    }
    // New user - frontend should ask for name
    return { success: true, newUser: true, phone, message: 'Phone verified. Please provide your name to complete registration.' };
  }

  if (url === '/auth/complete-registration') {
    const { phone, name, email } = body;
    const storedStr = localStorage.getItem('paree_mock_otp_' + phone);
    if (!storedStr) throw new Error('Phone not verified. Please complete OTP verification first.');
    const record = JSON.parse(storedStr);
    if (!record.verified) throw new Error('Phone number has not been verified.');
    localStorage.removeItem('paree_mock_otp_' + phone);
    const mockUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 5),
      name,
      email: email || (phone.replace(/\D/g, '').slice(-10) + '@paree.user'),
      phone,
      role: 'user',
      created_at: new Date().toISOString()
    };
    db.users.push(mockUser);
    saveMockDB(db);
    localStorage.setItem('paree_token', 'mock_user_token');
    localStorage.setItem('paree_user', JSON.stringify(mockUser));
    return { success: true, token: 'mock_user_token', user: mockUser };
  }

  // Categories routes
  if (url === '/categories') {
    if (method === 'GET') return db.categories;
    if (method === 'POST') {
      const newCat = {
        id: 'cat-' + Math.random().toString(36).substr(2, 5),
        name: body.name,
        slug: body.name.toLowerCase().replace(/ /g, '-'),
        image: body.image || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600',
        parent_id: body.parent_id || null,
        created_at: new Date().toISOString()
      };
      db.categories.push(newCat);
      saveMockDB(db);
      return newCat;
    }
  }

  if (url.startsWith('/categories/') && method === 'PUT') {
    const id = url.split('/').pop();
    const idx = db.categories.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      db.categories[idx] = { 
        ...db.categories[idx], 
        ...body, 
        slug: body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : db.categories[idx].slug
      };
      saveMockDB(db);
      return db.categories[idx];
    }
  }

  if (url.startsWith('/categories/') && method === 'DELETE') {
    const id = url.split('/').pop();
    db.categories = db.categories.filter((c: any) => c.id !== id);
    saveMockDB(db);
    return { message: 'Category deleted' };
  }

  if (url.startsWith('/products') && method === 'GET') {
    // Parse query params from url
    const qStart = url.indexOf('?');
    const params = new URLSearchParams(qStart >= 0 ? url.slice(qStart + 1) : '');
    let results = [...db.products];

    const categoryId = params.get('category') || params.get('category_id');
    if (categoryId) results = results.filter((p: any) => p.category_id === categoryId);

    const isFeatured = params.get('isFeatured');
    if (isFeatured === 'true') results = results.filter((p: any) => p.is_featured);

    const isBestseller = params.get('isBestseller');
    if (isBestseller === 'true') results = results.filter((p: any) => p.is_bestseller);

    const isPremium = params.get('isPremium');
    if (isPremium === 'true') results = results.filter((p: any) => p.is_premium);

    const search = params.get('search');
    if (search) results = results.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

    // Sorting
    const sort = params.get('sort');
    if (sort === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else {
      // default: newest
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const limit = parseInt(params.get('limit') || '0', 10);
    const page = parseInt(params.get('page') || '1', 10);
    const total = results.length;
    if (limit > 0) {
      const start = (page - 1) * limit;
      results = results.slice(start, start + limit);
    }

    if (url.split('?')[0] === '/products') {
      return {
        products: results,
        total,
        page,
        limit: limit || total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1
      };
    }
  }
  // Product routes - POST / single-product GET, PUT, DELETE
  if (url.startsWith('/products')) {
    if (url === '/products' && method === 'POST') {
      const newProd = {
        id: 'prod-' + Math.random().toString(36).substr(2, 5),
        ...body,
        created_at: new Date().toISOString()
      };
      db.products.push(newProd);
      saveMockDB(db);
      return newProd;
    }
    // Single product or editing
    const id = url.split('?')[0].split('/').pop();
    if (method === 'GET') {
      const product = db.products.find((p: any) => p.id === id);
      const similar = db.products.filter((p: any) => p.id !== id).slice(0, 4);
      return { product, similar };
    }
    if (method === 'PUT') {
      const idx = db.products.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        db.products[idx] = { ...db.products[idx], ...body };
        saveMockDB(db);
        return db.products[idx];
      }
    }
    if (method === 'DELETE') {
      db.products = db.products.filter((p: any) => p.id !== id);
      saveMockDB(db);
      return { message: 'Product deleted' };
    }
  }

  // Coupons routes
  if (url === '/coupons/active' && method === 'GET') {
    return db.coupons.filter((c: any) => c.display_on_site);
  }

  if (url === '/coupons/validate') {
    const { code, cartSubtotal, cartItems } = body;
    const cpn = db.coupons.find((c: any) => c.code.toUpperCase() === code.toUpperCase());
    if (!cpn) throw new Error('Invalid coupon code');
    if (cpn.discount_type === 'percentage' && (cpn.value <= 0 || cpn.value >= 100)) {
      throw new Error('Invalid percentage discount value');
    }
    
    if (cpn.applicable_type === 'category') {
      // If scoped to a specific product within the category
      if (cpn.applicable_product_id) {
        const productItems = (cartItems || []).filter((item: any) => item.product_id === cpn.applicable_product_id);
        const productSubtotal = productItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        if (productSubtotal === 0) {
          const prod = db.products.find((p: any) => p.id === cpn.applicable_product_id);
          throw new Error(`This coupon is only applicable to: ${prod?.name || 'a specific product'}`);
        }
        if (productSubtotal < cpn.min_cart_value) throw new Error(`Minimum subtotal of ₹${cpn.min_cart_value} for this product required`);
      } else {
        // Category-wide
        const categoryItems = (cartItems || []).filter((item: any) => {
          const prod = db.products.find((p: any) => p.id === item.product_id);
          return prod && prod.category_id === cpn.applicable_id;
        });
        const categorySubtotal = categoryItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        if (categorySubtotal === 0) throw new Error('This coupon is not applicable to any items in your cart');
        if (categorySubtotal < cpn.min_cart_value) throw new Error(`Minimum subtotal of ₹${cpn.min_cart_value} for qualifying category items required`);
      }
    } else {
      if (cartSubtotal < cpn.min_cart_value) throw new Error(`Minimum subtotal of ₹${cpn.min_cart_value} required`);
    }

    return { valid: true, ...cpn };
  }

  if (url === '/coupons') {
    if (method === 'GET') return db.coupons;
    if (method === 'POST') {
      const discountValue = parseFloat(body.value);
      if (body.discount_type === 'percentage' && (discountValue <= 0 || discountValue >= 100)) {
        throw new Error('Percentage discount must be greater than 0 and below 100');
      }
      if (body.discount_type === 'flat' && discountValue <= 0) {
        throw new Error('Flat discount value must be greater than 0');
      }

      const newCpn = {
        id: 'cpn-' + Math.random().toString(36).substr(2, 5),
        code: body.code.toUpperCase(),
        discount_type: body.discount_type,
        value: discountValue,
        min_cart_value: parseFloat(body.min_cart_value || '0'),
        expiry_date: body.expiry_date || '2028-12-31T23:59:59Z',
        applicable_type: body.applicable_type || 'all',
        applicable_id: body.applicable_type === 'all' ? null : body.applicable_id,
        applicable_product_id: body.applicable_product_id || null,
        display_on_site: body.display_on_site === true
      };
      db.coupons.push(newCpn);
      saveMockDB(db);
      return newCpn;
    }
  }

  if (url.startsWith('/coupons/') && method === 'PUT') {
    const id = url.split('/').pop();
    const idx = db.coupons.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      db.coupons[idx] = { 
        ...db.coupons[idx], 
        ...body,
        value: body.value !== undefined ? parseFloat(body.value) : db.coupons[idx].value,
        min_cart_value: body.min_cart_value !== undefined ? parseFloat(body.min_cart_value) : db.coupons[idx].min_cart_value
      };
      saveMockDB(db);
      return db.coupons[idx];
    }
    throw new Error('Coupon not found');
  }

  if (url.startsWith('/coupons/') && method === 'DELETE') {
    const id = url.split('/').pop();
    db.coupons = db.coupons.filter((c: any) => c.id !== id);
    saveMockDB(db);
    return { message: 'Coupon deleted' };
  }

  // Orders routes
  if (url === '/orders' && method === 'POST') {
    const newOrder = {
      id: 'ord-' + Math.random().toString(36).substr(2, 9),
      ...body,
      total_amount: body.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
      payment_status: body.paymentMethod === 'cod' ? 'pending' : 'paid',
      order_status: 'Confirmed',
      created_at: new Date().toISOString()
    };
    db.orders.push(newOrder);
    saveMockDB(db);
    return { message: 'Order generated successfully', order: newOrder };
  }

  if (url === '/orders/my-orders') {
    return db.orders;
  }

  if (url === '/orders' && method === 'GET') {
    return db.orders;
  }

  if (url.includes('/status') && method === 'PUT') {
    const id = url.split('/')[2];
    const { status } = body;
    const idx = db.orders.findIndex((o: any) => o.id === id);
    if (idx !== -1) {
      db.orders[idx].order_status = status;
      saveMockDB(db);
      return db.orders[idx];
    }
  }

  // Cart Abandonment Tracking
  if (url === '/cart-abandonment/track') {
    const existing = db.abandonments.find((a: any) => a.sessionId === body.sessionId);
    if (existing) {
      existing.step = body.step;
      existing.items = body.items;
      existing.updated_at = new Date().toISOString();
      existing.customerName = body.customerName;
      existing.customerEmail = body.customerEmail;
      existing.customerPhone = body.customerPhone;
    } else {
      db.abandonments.push({
        id: 'ca-' + Math.random().toString(36).substr(2, 5),
        sessionId: body.sessionId,
        step: body.step,
        items: body.items,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        lost_revenue: body.items ? body.items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) : 0,
        created_at: new Date().toISOString()
      });
    }
    saveMockDB(db);
    return { tracked: true };
  }

  // Cart Abandonment Session Deletion
  if (url.startsWith('/cart-abandonment/') && method === 'DELETE') {
    const id = url.split('/').pop();
    const exists = db.abandonments.some((a: any) => a.id === id);
    if (!exists) throw new Error('Session not found');
    db.abandonments = db.abandonments.filter((a: any) => a.id !== id);
    saveMockDB(db);
    return { message: 'Abandoned session deleted successfully' };
  }

  // Analytics routes
  if (url === '/analytics/dashboard') {
    const totalOrders = db.orders.length;
    const totalRevenue = db.orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    const totalCustomers = 4; // Mock value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const cartAbandonmentRate = 35; // 35% mock rate
    const conversionRate = 65; // 65% mock rate

    // Sales timeline mock
    const salesTimeline = [
      { date: '10 Jun', revenue: totalRevenue * 0.1, orders: 1 },
      { date: '11 Jun', revenue: totalRevenue * 0.15, orders: 1 },
      { date: '12 Jun', revenue: totalRevenue * 0.2, orders: 2 },
      { date: '13 Jun', revenue: totalRevenue * 0.18, orders: 1 },
      { date: '14 Jun', revenue: totalRevenue * 0.22, orders: 3 },
      { date: '15 Jun', revenue: totalRevenue * 0.15, orders: 2 }
    ];

    const topCategories = [
      { name: 'Bridal Lehengas', value: totalRevenue * 0.6 },
      { name: 'Wedding Sarees', value: totalRevenue * 0.25 },
      { name: 'Gowns & Anarkalis', value: totalRevenue * 0.15 }
    ];

    const topProducts = db.products.slice(0, 3).map((p: any) => ({
      name: p.name,
      revenue: p.price * 2,
      sales: 2
    }));

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        cartAbandonmentRate,
        conversionRate,
        lostRevenue: totalRevenue * 0.35,
        abandonedCount: db.abandonments.length
      },
      charts: {
        salesTimeline,
        topCategories,
        topProducts
      },
      abandonedSessions: db.abandonments.map((c: any) => ({
        id: c.id,
        sessionId: c.sessionId,
        itemsCount: c.items ? c.items.length : 0,
        lostRevenue: c.lost_revenue,
        step: c.step,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
        items: c.items,
        created_at: c.created_at || new Date().toISOString()
      }))
    };
  }

  // Users routes
  if (url === '/users') {
    return [
      { id: 'usr-1', name: 'Nisha Sharma', email: 'nisha@gmail.com', role: 'user', created_at: new Date().toISOString() },
      { id: 'usr-2', name: 'Aishwarya Roy', email: 'aishwarya@gmail.com', role: 'user', created_at: new Date().toISOString() },
      { id: 'usr-3', name: 'Megha Gupta', email: 'megha@gmail.com', role: 'user', created_at: new Date().toISOString() }
    ];
  }

  // Addresses routes
  if (url === '/addresses' && method === 'GET') {
    const userStr = localStorage.getItem('paree_user');
    const currUser = userStr ? JSON.parse(userStr) : null;
    if (!currUser) return [];
    
    if (!db.addresses) {
      db.addresses = [];
    }
    if (db.addresses.length === 0) {
      db.addresses = [
        {
          id: 'mock-addr-1',
          user_id: currUser.id,
          name: currUser.name || 'Luxury Bride',
          phone: currUser.phone || '+91 98765 43210',
          address_line1: 'Flat 402, Royal Residency',
          address_line2: 'Jubilee Hills, Road No. 36',
          city: 'Hyderabad',
          state: 'Telangana',
          postal_code: '500033',
          country: 'India',
          is_default: true
        }
      ];
      saveMockDB(db);
    }
    return db.addresses.filter((a: any) => a.user_id === currUser.id);
  }

  if (url === '/addresses' && method === 'POST') {
    const userStr = localStorage.getItem('paree_user');
    const currUser = userStr ? JSON.parse(userStr) : null;
    if (!currUser) throw new Error('Unauthorized');
    if (!db.addresses) db.addresses = [];
    
    const newAddr = {
      id: 'mock-addr-' + Math.random().toString(36).substr(2, 5),
      user_id: currUser.id,
      name: body.name,
      phone: body.phone,
      address_line1: body.address_line1,
      address_line2: body.address_line2 || null,
      city: body.city,
      state: body.state,
      postal_code: body.postal_code,
      country: body.country || 'India',
      is_default: !!body.is_default
    };
    db.addresses.push(newAddr);
    saveMockDB(db);
    return newAddr;
  }

  if (url.startsWith('/addresses/') && method === 'DELETE') {
    const id = url.split('/').pop();
    if (!db.addresses) db.addresses = [];
    db.addresses = db.addresses.filter((a: any) => a.id !== id);
    saveMockDB(db);
    return { success: true };
  }

  return {};
}

// Main API Export Object
export const api = {
  // Authentication
  login: (credentials: { email: string; password?: string }) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: { name: string; email: string; password?: string; phone?: string }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  sendOtp: (data: { phone: string }) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: { phone: string; otp: string }) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  completeRegistration: (data: { phone: string; name: string; email?: string }) => request('/auth/complete-registration', { method: 'POST', body: JSON.stringify(data) }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data: any) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (filters: any = {}) => {
    const query = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query.append(key, String(filters[key]));
      }
    });
    const queryStr = query.toString();
    return request(`/products${queryStr ? `?${queryStr}` : ''}`);
  },
  getProductById: (id: string) => request(`/products/${id}`),
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  // Coupons
  validateCoupon: (code: string, cartSubtotal: number, cartItems: any[]) => request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, cartSubtotal, cartItems }) }),
  getCoupons: () => request('/coupons'),
  getActiveCoupons: () => request('/coupons/active'),
  createCoupon: (data: any) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: any) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => request(`/coupons/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data: any) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data: any) => request('/orders/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => request('/orders/my-orders'),
  getAdminOrders: () => request('/orders'),
  updateOrderStatus: (id: string, status: string) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getInvoiceUrl: (id: string) => `${API_BASE_URL}/orders/invoice/${id}`,

  // Cart Abandonment
  trackCartState: (sessionId: string, items: any[], step: string, customerName?: string, customerEmail?: string, customerPhone?: string) => 
    request('/cart-abandonment/track', { 
      method: 'POST', 
      body: JSON.stringify({ sessionId, items, step, customerName, customerEmail, customerPhone }) 
    }),
  deleteAbandonedSession: (id: string) => request(`/cart-abandonment/${id}`, { method: 'DELETE' }),

  // Analytics
  getDashboardStats: () => request('/analytics/dashboard'),

  // Users
  getUsers: () => request('/users'),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  getUserOrders: (id: string) => request(`/users/${id}/orders`),

  // Addresses
  getAddresses: () => request('/addresses'),
  createAddress: (data: any) => request('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  deleteAddress: (id: string) => request(`/addresses/${id}`, { method: 'DELETE' })
};
