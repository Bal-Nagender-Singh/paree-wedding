import { Request, Response } from 'express';
import { db } from '../models/db';
import { Coupon } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, cartSubtotal, cartItems } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await db.coupons.getByCode(code);
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (coupon.discount_type === 'percentage' && (coupon.value <= 0 || coupon.value >= 100)) {
      return res.status(400).json({ message: 'Invalid percentage discount value' });
    }

    // Check expiry
    if (new Date(coupon.expiry_date).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Check usage limits
    if (coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon usage limit has been reached' });
    }

    // Check category/collection applicability if restricted
    if (coupon.applicable_type === 'category') {
      if (coupon.applicable_product_id) {
        const productItems = (cartItems || []).filter((item: any) => item.product_id === coupon.applicable_product_id);
        const productSubtotal = productItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        if (productSubtotal === 0) {
          const prod = await db.products.getById(coupon.applicable_product_id);
          return res.status(400).json({ message: `This coupon is only applicable to: ${prod?.name || 'a specific product'}` });
        }
        if (productSubtotal < coupon.min_cart_value) {
          return res.status(400).json({
            message: `Minimum subtotal of ₹${coupon.min_cart_value} for this product is required to use this coupon`
          });
        }
      } else {
      const categoryItems = [];
      for (const item of cartItems || []) {
        const prod = await db.products.getById(item.product_id);
        if (prod && prod.category_id === coupon.applicable_id) categoryItems.push(item);
      }
      const categorySubtotal = categoryItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      if (categorySubtotal === 0) {
        return res.status(400).json({ message: 'This coupon is not applicable to any items in your cart' });
      }
      if (categorySubtotal < coupon.min_cart_value) {
        return res.status(400).json({
          message: `Minimum subtotal of ₹${coupon.min_cart_value} for qualifying category items is required to use this coupon`
        });
      }
      }
    } else if (coupon.applicable_type === 'collection') {
      const collectionItems = [];
      for (const item of cartItems || []) {
        const prod = await db.products.getById(item.product_id);
        if (prod && prod.collection && prod.collection.toLowerCase() === coupon.applicable_id?.toLowerCase()) collectionItems.push(item);
      }
      const collectionSubtotal = collectionItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      if (collectionSubtotal === 0) {
        return res.status(400).json({ message: 'This coupon is not applicable to any items in your cart' });
      }
      if (collectionSubtotal < coupon.min_cart_value) {
        return res.status(400).json({
          message: `Minimum subtotal of ₹${coupon.min_cart_value} for qualifying collection items is required to use this coupon`
        });
      }
    } else {
      // Check minimum cart value (all products)
      if (cartSubtotal && cartSubtotal < coupon.min_cart_value) {
        return res.status(400).json({
          message: `Minimum subtotal of ₹${coupon.min_cart_value} is required to use this coupon`
        });
      }
    }

    // Check first order only
    if (coupon.first_order_only && req.user) {
      const userOrders = await db.orders.getByUserId(req.user.id);
      const paidOrCompletedOrders = userOrders.filter(o => o.payment_status === 'paid');
      if (paidOrCompletedOrders.length > 0) {
        return res.status(400).json({ message: 'This coupon is only valid for your first order' });
      }
    }

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      value: coupon.value,
      min_cart_value: coupon.min_cart_value,
      applicable_type: coupon.applicable_type,
      applicable_id: coupon.applicable_id
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await db.coupons.getAll();
    return res.status(200).json(coupons);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const getActiveCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await db.coupons.getAll();
    const active = coupons.filter(c => c.display_on_site);
    return res.status(200).json(active);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching active coupons', error: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      discount_type,
      value,
      expiry_date,
      usage_limit,
      min_cart_value,
      first_order_only,
      applicable_type,
      applicable_id,
      applicable_product_id,
      display_on_site
    } = req.body;

    if (!code || !discount_type || value === undefined) {
      return res.status(400).json({ message: 'Coupon code, discount_type, and value are required' });
    }

    const discountValue = parseFloat(value);
    if (discount_type === 'percentage' && (discountValue <= 0 || discountValue >= 100)) {
      return res.status(400).json({ message: 'Percentage discount must be greater than 0 and below 100' });
    }
    if (discount_type === 'flat' && discountValue <= 0) {
      return res.status(400).json({ message: 'Flat discount value must be greater than 0' });
    }

    const exists = await db.coupons.getByCode(code);
    if (exists) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }

    const newCoupon: Coupon = {
      id: 'cpn-' + Math.random().toString(36).substr(2, 9),
      code: code.toUpperCase(),
      discount_type,
      value: discountValue,
      expiry_date: expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit: usage_limit ? parseInt(usage_limit, 10) : 100,
      used_count: 0,
      min_cart_value: min_cart_value ? parseFloat(min_cart_value) : 0,
      first_order_only: first_order_only === true || first_order_only === 'true',
      applicable_type: applicable_type || 'all',
      applicable_id: applicable_type === 'all' ? null : applicable_id,
      applicable_product_id: applicable_type === 'category' ? applicable_product_id || null : null,
      display_on_site: display_on_site === true || display_on_site === 'true',
      created_at: new Date().toISOString()
    };

    await db.coupons.create(newCoupon);
    return res.status(201).json(newCoupon);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Partial<Coupon> = { ...body };
    if (body.value !== undefined) updates.value = parseFloat(body.value);
    if (body.usage_limit !== undefined) updates.usage_limit = parseInt(body.usage_limit, 10);
    if (body.min_cart_value !== undefined) updates.min_cart_value = parseFloat(body.min_cart_value);
    if (body.first_order_only !== undefined) updates.first_order_only = body.first_order_only === true || body.first_order_only === 'true';
    if (body.display_on_site !== undefined) updates.display_on_site = body.display_on_site === true || body.display_on_site === 'true';

    const updated = await db.coupons.update(id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.coupons.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    return res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};
