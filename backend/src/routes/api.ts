import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { upload } from '../middleware/upload';
import { verifyToken, isAdmin, AuthenticatedRequest } from '../middleware/auth';
import { register, login, getMe, updateProfile, changePassword, sendOtp, verifyOtp, completeRegistration } from '../controllers/authController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon, getActiveCoupons } from '../controllers/couponController';
import { createOrder, verifyPayment, getMyOrders, getAdminOrders, updateOrderStatus, getInvoice } from '../controllers/orderController';
import { trackCartState, getDashboardStats, deleteAbandonedSession } from '../controllers/analyticsController';
import { getUsers, deleteUser, getUserPurchaseHistory } from '../controllers/userController';
import { db } from '../models/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'paree-luxury-secret-key-2026';

// Optional auth middleware
const verifyTokenOptional = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: 'admin' | 'user' };
      req.user = decoded;
    } catch (error) {
      // Ignore token validation error and proceed as guest
    }
  }
  next();
};

// 1. Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', verifyToken, getMe);
router.put('/auth/profile', verifyToken, updateProfile);
router.put('/auth/change-password', verifyToken, changePassword);
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/complete-registration', completeRegistration);

// 2. Category Routes
router.get('/categories', getCategories);
router.post('/categories', verifyToken, isAdmin, createCategory);
router.put('/categories/:id', verifyToken, isAdmin, updateCategory);
router.delete('/categories/:id', verifyToken, isAdmin, deleteCategory);

// 3. Product Routes
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', verifyToken, isAdmin, upload.single('images'), createProduct);
router.put('/products/:id', verifyToken, isAdmin, updateProduct);
router.delete('/products/:id', verifyToken, isAdmin, deleteProduct);

// 4. Coupon Routes
router.post('/coupons/validate', verifyTokenOptional, validateCoupon);
router.get('/coupons/active', getActiveCoupons);
router.get('/coupons', verifyToken, isAdmin, getCoupons);
router.post('/coupons', verifyToken, isAdmin, createCoupon);
router.put('/coupons/:id', verifyToken, isAdmin, updateCoupon);
router.delete('/coupons/:id', verifyToken, isAdmin, deleteCoupon);

// 5. Order Routes
router.post('/orders', verifyTokenOptional, createOrder);
router.post('/orders/verify-payment', verifyTokenOptional, verifyPayment);
router.get('/orders/my-orders', verifyToken, getMyOrders);
router.get('/orders/invoice/:id', getInvoice);
router.get('/orders', verifyToken, isAdmin, getAdminOrders);
router.put('/orders/:id/status', verifyToken, isAdmin, updateOrderStatus);

// 6. Cart Abandonment Tracking
router.post('/cart-abandonment/track', verifyTokenOptional, trackCartState);
router.delete('/cart-abandonment/:id', verifyToken, isAdmin, deleteAbandonedSession);

// 7. Admin Dashboard Analytics
router.get('/analytics/dashboard', verifyToken, isAdmin, getDashboardStats);

// 8. User Management Routes
router.get('/users', verifyToken, isAdmin, getUsers);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);
router.get('/users/:id/orders', verifyToken, isAdmin, getUserPurchaseHistory);

// 9. Addresses Routes
router.get('/addresses', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const addrs = await db.addresses.getByUserId(req.user.id);
    return res.status(200).json(addrs);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving addresses', error: error.message });
  }
});

router.post('/addresses', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const { name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    if (!name || !phone || !address_line1 || !city || !state || !postal_code) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    const newAddress = await db.addresses.create({
      id: 'addr-' + Math.random().toString(36).substr(2, 9),
      user_id: req.user.id,
      name,
      phone,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state,
      postal_code,
      country: country || 'India',
      is_default: !!is_default
    });
    return res.status(201).json(newAddress);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error saving address', error: error.message });
  }
});

router.delete('/addresses/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const addr = await db.addresses.getById(id);
    if (!addr || addr.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Address not found' });
    }
    const deleted = await db.addresses.delete(id);
    return res.status(200).json({ success: deleted });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

export default router;
