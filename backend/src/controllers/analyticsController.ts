import { Request, Response } from 'express';
import { db } from '../models/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { CartAbandonment } from '../models/types';

export const trackCartState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, items, step, customerName, customerEmail, customerPhone } = req.body; // step: 'added_to_cart' | 'checkout_initiated'
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const userId = req.user?.id || null;

    // Resolve customer details from DB if logged in and not provided in body
    let resolvedName = customerName || null;
    let resolvedEmail = customerEmail || null;
    let resolvedPhone = customerPhone || null;

    if (userId) {
      const dbUser = await db.users.getById(userId);
      if (dbUser) {
        if (!resolvedName) resolvedName = dbUser.name;
        if (!resolvedEmail) resolvedEmail = dbUser.email;
        if (!resolvedPhone) resolvedPhone = dbUser.phone || null;
      }
    }

    let lostRevenue = 0;
    const mappedItems = items ? items.map((item: any) => {
      lostRevenue += (item.price * item.quantity);
      return {
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        image: item.image || item.images?.[0] || ''
      };
    }) : [];

    const existingSession = await db.cartAbandonment.getBySessionId(sessionId);
    if (existingSession) {
      // If already recovered, don't regress
      if (existingSession.step === 'recovered') {
        return res.status(200).json(existingSession);
      }
      const updated = await db.cartAbandonment.update(existingSession.id, {
        user_id: userId || existingSession.user_id,
        items: mappedItems,
        step,
        lost_revenue: lostRevenue,
        customer_name: resolvedName || existingSession.customer_name,
        customer_email: resolvedEmail || existingSession.customer_email,
        customer_phone: resolvedPhone || existingSession.customer_phone
      });
      return res.status(200).json(updated);
    } else {
      const newCA: CartAbandonment = {
        id: 'ca-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        session_id: sessionId,
        items: mappedItems,
        step,
        lost_revenue: lostRevenue,
        email_sent: false,
        customer_name: resolvedName,
        customer_email: resolvedEmail,
        customer_phone: resolvedPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await db.cartAbandonment.create(newCA);
      return res.status(201).json(newCA);
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Error tracking cart state', error: error.message });
  }
};

export const deleteAbandonedSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.cartAbandonment.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Session not found' });
    }
    return res.status(200).json({ message: 'Abandoned session deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting abandoned session', error: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const orders = await db.orders.getAll();
    const allUsers = await db.users.getAll();
    const users = allUsers.filter(u => u.role !== 'admin');
    const abandonments = await db.cartAbandonment.getAll();

    // 1. Calculations
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.payment_status === 'paid' || o.payment_method === 'cod');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.final_amount, 0);
    const totalCustomers = users.length;

    // Average Order Value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Cart Abandonment Rate
    const totalCartsCreated = abandonments.length;
    const abandonedCarts = abandonments.filter(c => c.step === 'added_to_cart' || c.step === 'checkout_initiated' || c.step === 'abandoned');
    const cartAbandonmentRate = totalCartsCreated > 0 ? Math.round((abandonedCarts.length / totalCartsCreated) * 100) : 0;
    const lostRevenue = abandonedCarts.reduce((sum, c) => sum + c.lost_revenue, 0);

    // Conversion Rate: completed orders / total checkout sessions (approximated as total orders + abandoned checkouts)
    const checkoutInitiated = abandonments.filter(c => c.step === 'checkout_initiated' || c.step === 'recovered').length;
    const conversionRate = checkoutInitiated > 0 ? Math.round((completedOrders.length / checkoutInitiated) * 100) : 0;

    // 2. Charts Data
    // Daily Orders & Sales (last 7 days helper)
    const dailySales: { [date: string]: { date: string; revenue: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dailySales[d.toDateString()] = { date: dateStr, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      const orderDate = new Date(o.created_at).toDateString();
      if (dailySales[orderDate]) {
        dailySales[orderDate].orders += 1;
        if (o.payment_status === 'paid' || o.payment_method === 'cod') {
          dailySales[orderDate].revenue += o.final_amount;
        }
      }
    });

    const salesTimeline = Object.values(dailySales);

    // Top Categories distribution
    const categoryStats: { [id: string]: { name: string; value: number } } = {};
    const dbCategories = await db.categories.getAll();
    dbCategories.forEach(cat => {
      categoryStats[cat.id] = { name: cat.name, value: 0 };
    });

    for (const o of orders) {
      for (const item of o.items) {
        const prod = await db.products.getById(item.product_id);
        if (prod && categoryStats[prod.category_id]) {
          categoryStats[prod.category_id].value += item.price * item.quantity;
        }
      }
    }

    const topCategories = Object.values(categoryStats).filter(c => c.value > 0);

    // Top Products
    const productSales: { [id: string]: { name: string; revenue: number; sales: number } } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.product_name, revenue: 0, sales: 0 };
        }
        productSales[item.product_id].sales += item.quantity;
        productSales[item.product_id].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.status(200).json({
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        cartAbandonmentRate,
        conversionRate,
        lostRevenue,
        abandonedCount: abandonedCarts.length
      },
      charts: {
        salesTimeline,
        topCategories,
        topProducts
      },
      abandonedSessions: abandonedCarts.map(c => ({
        id: c.id,
        sessionId: c.session_id,
        itemsCount: c.items.length,
        lostRevenue: c.lost_revenue,
        step: c.step,
        customerName: c.customer_name,
        customerEmail: c.customer_email,
        customerPhone: c.customer_phone,
        items: c.items,
        created_at: c.created_at
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving analytics', error: error.message });
  }
};
