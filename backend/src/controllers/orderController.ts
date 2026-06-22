import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../models/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { Order, OrderItem, AddressData } from '../models/types';

// Razorpay SDK Init
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const isRazorpayConfigured = razorpayKeyId !== '' && razorpayKeySecret !== '';

let razorpay: any = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
}

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      guestName,
      guestEmail,
      guestPhone,
      items,
      couponCode,
      shippingAddress,
      billingAddress,
      paymentMethod,
      sessionId
    } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ message: 'Items and shipping address are required' });
    }

    const userId = req.user?.id || null;

    // 1. Calculate totals
    let subtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of items) {
      const dbProd = await db.products.getById(item.product_id);
      if (!dbProd) {
        return res.status(400).json({ message: `Product ${item.product_name} not found` });
      }
      if (dbProd.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${dbProd.name}` });
      }

      const itemPrice = dbProd.price;
      subtotal += itemPrice * item.quantity;
      validatedItems.push({
        product_id: dbProd.id,
        product_name: dbProd.name,
        sku: dbProd.sku,
        quantity: item.quantity,
        price: itemPrice,
        size: item.size || 'M',
        color: item.color || 'Default'
      });
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await db.coupons.getByCode(couponCode);
      if (coupon && new Date(coupon.expiry_date).getTime() > Date.now() && coupon.used_count < coupon.usage_limit) {
        if (subtotal >= coupon.min_cart_value) {
          if (coupon.discount_type === 'percentage') {
            if (coupon.value > 0 && coupon.value < 100) {
              discount = subtotal * (coupon.value / 100);
            }
          } else {
            discount = coupon.value;
          }
          // Increment coupon used count
          await db.coupons.update(coupon.id, { used_count: coupon.used_count + 1 });
        }
      }
    }

    const tax = Math.round((subtotal - discount) * 0.18); // 18% GST standard luxury wedding tax
    const shipping = subtotal - discount > 50000 ? 0 : 500; // Complimentary white glove shipping above ₹50,000
    const finalAmount = Math.max(0, subtotal - discount + tax + shipping);

    const newOrder: Order = {
      id: 'ord-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      guest_name: guestName || null,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      items: validatedItems,
      total_amount: subtotal,
      discount_amount: discount,
      tax_amount: tax,
      shipping_amount: shipping,
      final_amount: finalAmount,
      payment_status: 'pending',
      payment_method: paymentMethod || 'cod',
      order_status: 'Pending',
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      created_at: new Date().toISOString()
    };

    // Update stock levels
    for (const item of validatedItems) {
      const dbProd = await db.products.getById(item.product_id);
      if (dbProd) {
        await db.products.update(dbProd.id, { stock: dbProd.stock - item.quantity });
      }
    }

    // 2. COD checkout flow
    if (paymentMethod === 'cod') {
      newOrder.order_status = 'Confirmed';
      await db.orders.create(newOrder);

      // Track conversion in Cart Abandonment System
      let caSession = null;
      if (sessionId) {
        caSession = await db.cartAbandonment.getBySessionId(sessionId);
      }
      if (!caSession && userId) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => s.user_id === userId);
      }
      if (!caSession && (guestEmail || guestPhone)) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => 
          (guestEmail && s.customer_email === guestEmail) || 
          (guestPhone && s.customer_phone === guestPhone)
        );
      }
      if (caSession) {
        await db.cartAbandonment.update(caSession.id, { step: 'recovered' });
      }

      return res.status(201).json({
        message: 'Order placed successfully (Cash on Delivery)',
        order: newOrder
      });
    }

    // 3. Razorpay checkout flow
    if (paymentMethod === 'razorpay') {
      let rzpOrder: any = null;
      if (isRazorpayConfigured && razorpay) {
        const options = {
          amount: Math.round(finalAmount * 100), // Razorpay amount in paise
          currency: 'INR',
          receipt: newOrder.id
        };
        rzpOrder = await razorpay.orders.create(options);
        newOrder.razorpay_order_id = rzpOrder.id;
      } else {
        // Mock Razorpay order id offline
        newOrder.razorpay_order_id = 'rzp_order_' + Math.random().toString(36).substr(2, 9);
      }

      await db.orders.create(newOrder);

      // Track checkout initiated
      let caSession = null;
      if (sessionId) {
        caSession = await db.cartAbandonment.getBySessionId(sessionId);
      }
      if (!caSession && userId) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => s.user_id === userId);
      }
      if (!caSession && (guestEmail || guestPhone)) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => 
          (guestEmail && s.customer_email === guestEmail) || 
          (guestPhone && s.customer_phone === guestPhone)
        );
      }
      if (caSession) {
        await db.cartAbandonment.update(caSession.id, { step: 'checkout_initiated' });
      }

      return res.status(201).json({
        message: 'Razorpay order generated successfully',
        order: newOrder,
        razorpayKeyId: razorpayKeyId || 'rzp_test_mock_key',
        isMockMode: !isRazorpayConfigured
      });
    }

    return res.status(400).json({ message: 'Invalid payment method' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await db.orders.getById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!isRazorpayConfigured || !razorpaySignature) {
      // Mock validation succeeds immediately in offline mock development
      await db.orders.update(order.id, {
        payment_status: 'paid',
        order_status: 'Confirmed',
        razorpay_payment_id: razorpayPaymentId || 'rzp_payment_mock'
      });

      // Update abandonment stats to recovered
      let caSession = null;
      if (order.user_id) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => s.user_id === order.user_id);
      }
      if (!caSession && (order.guest_email || order.guest_phone)) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => 
          (order.guest_email && s.customer_email === order.guest_email) || 
          (order.guest_phone && s.customer_phone === order.guest_phone)
        );
      }
      if (caSession) {
        await db.cartAbandonment.update(caSession.id, { step: 'recovered' });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified (Mock mode offline verification successful)'
      });
    }

    // Cryptographic signature check
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      await db.orders.update(order.id, {
        payment_status: 'paid',
        order_status: 'Confirmed',
        razorpay_payment_id: razorpayPaymentId
      });

      // Update abandonment stats to recovered
      let caSession = null;
      if (order.user_id) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => s.user_id === order.user_id);
      }
      if (!caSession && (order.guest_email || order.guest_phone)) {
        const cartSessions = await db.cartAbandonment.getAll();
        caSession = cartSessions.find(s => 
          (order.guest_email && s.customer_email === order.guest_email) || 
          (order.guest_phone && s.customer_phone === order.guest_phone)
        );
      }
      if (caSession) {
        await db.cartAbandonment.update(caSession.id, { step: 'recovered' });
      }

      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      await db.orders.update(order.id, { payment_status: 'failed' });
      return res.status(400).json({ success: false, message: 'Invalid signature. Payment verification failed.' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const orders = await db.orders.getByUserId(req.user.id);
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving your orders', error: error.message });
  }
};

export const getAdminOrders = async (req: Request, res: Response) => {
  try {
    const orders = await db.orders.getAll();
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

    if (!status) {
      return res.status(400).json({ message: 'Status field is required' });
    }

    const updated = await db.orders.update(id, { order_status: status });
    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await db.orders.getById(id);
    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }


    const orderDate = new Date(order.created_at);
    const dateStr = orderDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = orderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const itemsRows = order.items
      .map(
        item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5;">
          <strong style="color: #063C21; font-family: 'Cinzel', serif;">${item.product_name}</strong><br/>
          <span style="font-size: 11px; color: #666;">SKU: ${item.sku} | Size: ${item.size} | Color: ${item.color}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
      )
      .join('');

    const htmlInvoice = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Montserrat', sans-serif;
            background-color: #FAF8F5;
            color: #1A1A1A;
            margin: 0;
            padding: 40px;
          }
          .no-print {
            text-align: center;
            margin-bottom: 24px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn-pdf {
            background: #063C21;
            color: #FAF8F5;
            border: 2px solid #D4AF37;
            padding: 12px 36px;
            font-family: 'Cinzel', serif;
            font-size: 13px;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-pdf:hover {
            background: #D4AF37;
            color: #063C21;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            background-color: #FFFFFF;
            border: 1px solid #D4AF37;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          }
          .brand-header {
            text-align: center;
            border-bottom: 2px solid #063C21;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand-title {
            font-family: 'Cinzel', serif;
            font-size: 36px;
            color: #063C21;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-family: 'Cinzel', serif;
            font-size: 12px;
            color: #D4AF37;
            letter-spacing: 2px;
            margin: 5px 0 0 0;
          }
          .date-time-banner {
            background: linear-gradient(135deg, #063C21 0%, #0a5a32 100%);
            border: 1px solid #D4AF37;
            border-radius: 2px;
            text-align: center;
            padding: 20px 24px;
            margin-bottom: 30px;
          }
          .date-time-banner .dt-label {
            font-family: 'Cinzel', serif;
            font-size: 9px;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: rgba(212,175,55,0.65);
            margin-bottom: 8px;
          }
          .date-time-banner .dt-date {
            font-family: 'Cinzel', serif;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #D4AF37;
            display: block;
          }
          .date-time-banner .dt-time {
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            color: rgba(212,175,55,0.85);
            display: block;
            margin-top: 6px;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .meta-column h4 {
            margin: 0 0 8px 0;
            color: #063C21;
            font-family: 'Cinzel', serif;
            letter-spacing: 1px;
          }
          .meta-column p {
            margin: 2px 0;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            font-family: 'Cinzel', serif;
            background-color: #063C21;
            color: #FFFFFF;
            padding: 12px;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .totals-table {
            width: 50%;
            margin-left: auto;
            font-size: 13px;
          }
          .totals-table td {
            padding: 8px;
          }
          .totals-title {
            font-weight: 600;
            color: #063C21;
          }
          .final-amount-row {
            border-top: 2px solid #D4AF37;
            font-size: 16px;
            font-weight: bold;
            color: #063C21;
          }
          .footer-note {
            text-align: center;
            font-size: 11px;
            color: #888;
            margin-top: 50px;
            border-top: 1px solid #E5E5E5;
            padding-top: 20px;
          }
          @media print {
            body {
              background-color: #FFFFFF;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .invoice-box {
              box-shadow: none;
              border: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="no-print">
          <button class="btn-pdf" onclick="window.print()">⬇ Download PDF / Print Receipt</button>
        </div>

        <div class="invoice-box">
          <div class="brand-header">
            <h1 class="brand-title">Paree</h1>
            <p class="brand-subtitle">Fashion for angels...</p>
          </div>

          <div class="date-time-banner">
            <div class="dt-label">Order Date &amp; Time</div>
            <span class="dt-date">${dateStr}</span>
            <span class="dt-time">${timeStr}</span>
          </div>
          
          <div class="meta-info">
            <div class="meta-column">
              <h4>Invoice Details</h4>
              <p><strong>Invoice ID:</strong> INV-${order.id.toUpperCase()}</p>
              <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
              <p><strong>Status:</strong> ${order.payment_status.toUpperCase()}</p>
            </div>
            <div class="meta-column" style="text-align: right;">
              <h4>Shipping Address</h4>
              <p>${order.shipping_address.name}</p>
              <p>${order.shipping_address.phone}</p>
              <p>${order.shipping_address.address_line1}</p>
              ${order.shipping_address.address_line2 ? `<p>${order.shipping_address.address_line2}</p>` : ''}
              <p>${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.postal_code}</p>
              <p>${order.shipping_address.country}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product Details</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Unit Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          
          <table class="totals-table">
            <tr>
              <td class="totals-title">Subtotal:</td>
              <td style="text-align: right;">₹${order.total_amount.toLocaleString('en-IN')}</td>
            </tr>
            ${
              order.discount_amount > 0
                ? `
            <tr>
              <td class="totals-title" style="color: #6E1A24;">Discount:</td>
              <td style="text-align: right; color: #6E1A24;">- ₹${order.discount_amount.toLocaleString('en-IN')}</td>
            </tr>`
                : ''
            }
            <tr>
              <td class="totals-title">GST (18%):</td>
              <td style="text-align: right;">₹${order.tax_amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td class="totals-title">Shipping:</td>
              <td style="text-align: right;">${order.shipping_amount === 0 ? 'Free' : `₹${order.shipping_amount}`}</td>
            </tr>
            <tr class="final-amount-row">
              <td>Total Amount:</td>
              <td style="text-align: right;">₹${order.final_amount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
          
          <div class="footer-note">
            <p>Thank you for choosing Paree for your special occasion.</p>
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
            <p>&copy; ${new Date().getFullYear()} Paree Wedding Boutique. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return res.status(200).send(htmlInvoice);
  } catch (error: any) {
    return res.status(500).send(`<h1>Error generating invoice: ${error.message}</h1>`);
  }
};
