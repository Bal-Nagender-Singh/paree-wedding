export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parent_id?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  sub_category?: string | null;
  collection?: string | null;
  description: string;
  price: number;
  sale_price?: number | null;
  stock: number;
  images: string[];
  color_images?: Record<string, string[]>;
  color_sizes?: Record<string, string[]>;
  color_stock?: Record<string, number>;
  videos?: string[] | null;
  sizes: string[];
  colors: string[];
  fabric?: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  value: number;
  expiry_date: string;
  usage_limit: number;
  used_count: number;
  min_cart_value: number;
  first_order_only: boolean;
  applicable_type: 'all' | 'category' | 'collection';
  applicable_id: string | null;
  applicable_product_id?: string | null;
  display_on_site: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

export interface AddressData {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  final_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: 'cod' | 'razorpay';
  order_status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  shipping_address: AddressData;
  billing_address: AddressData;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface CartAbandonment {
  id: string;
  user_id?: string | null;
  session_id: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  step: 'added_to_cart' | 'checkout_initiated' | 'abandoned' | 'recovered';
  lost_revenue: number;
  email_sent: boolean;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  created_at: string;
  updated_at: string;
}
