import { Request, Response } from 'express';
import { db } from '../models/db';
import { Product } from '../models/types';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subCategory,
      collection,
      minPrice,
      maxPrice,
      color,
      size,
      fabric,
      isFeatured,
      isBestseller,
      search,
      sort,
      page = '1',
      limit = '12'
    } = req.query;

    let products = await db.products.getAll();

    // 1. Filtering
    if (category) {
      products = products.filter(p => p.category_id === category);
    }
    if (subCategory) {
      products = products.filter(p => p.sub_category?.toLowerCase() === (subCategory as string).toLowerCase());
    }
    if (collection) {
      products = products.filter(p => p.collection?.toLowerCase() === (collection as string).toLowerCase());
    }
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice as string));
    }
    if (color) {
      const colStr = (color as string).toLowerCase();
      products = products.filter(p => p.colors.some(c => c.toLowerCase().includes(colStr)));
    }
    if (size) {
      const szStr = (size as string).toUpperCase();
      products = products.filter(p => p.sizes.some(s => s.toUpperCase() === szStr));
    }
    if (fabric) {
      const fabStr = (fabric as string).toLowerCase();
      products = products.filter(p => p.fabric?.toLowerCase().includes(fabStr));
    }
    if (isFeatured === 'true') {
      products = products.filter(p => p.is_featured);
    }
    if (isBestseller === 'true') {
      products = products.filter(p => p.is_bestseller);
    }
    if (search) {
      const s = (search as string).toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s)
      );
    }

    // 2. Sorting
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // default: popularity / created date
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // 3. Pagination
    const pNum = parseInt(page as string, 10);
    const lNum = parseInt(limit as string, 10);
    const total = products.length;
    const startIndex = (pNum - 1) * lNum;
    const paginatedProducts = products.slice(startIndex, startIndex + lNum);

    return res.status(200).json({
      total,
      page: pNum,
      limit: lNum,
      totalPages: Math.ceil(total / lNum),
      products: paginatedProducts
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await db.products.getById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get similar products in same category (excluding current product)
    const allProducts = await db.products.getAll();
    const similar = allProducts
      .filter(p => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, 4);

    return res.status(200).json({ product, similar });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category_id,
      sub_category,
      collection,
      description,
      price,
      sale_price,
      stock,
      images: rawImages,
      color_images: rawColorImages,
      videos,
      sizes,
      colors,
      color_stock,
      color_sizes,
      fabric,
      is_featured,
      is_bestseller
    } = req.body;

    if (!name || !sku || !category_id || !price || !stock) {
      return res.status(400).json({ message: 'Name, SKU, category_id, price, and stock are required' });
    }

    // Check SKU duplicate
    const allProducts = await db.products.getAll();
    const exists = allProducts.find(p => p.sku === sku);
    if (exists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Helper: upload a base64 string or URL to Cloudinary
    const uploadToCloudinary = async (src: string): Promise<string> => {
      if (!src) return src;
      // Already a hosted URL (https://res.cloudinary.com/... or https://...) — keep as-is
      if (src.startsWith('http://') || src.startsWith('https://')) return src;
      // It's a base64 data URL — upload to Cloudinary
      if (src.startsWith('data:')) {
        const cloudinary = (await import('../lib/cloudinaryConfig')).default;
        const result = await cloudinary.uploader.upload(src, {
          folder: 'paree/products',
          resource_type: 'image'
        });
        return result.secure_url;
      }
      return src;
    };

    // Upload all product images to Cloudinary
    const imageArray: string[] = Array.isArray(rawImages) ? rawImages : [];
    const imageUrls = await Promise.all(imageArray.map(uploadToCloudinary));

    // Upload color-specific images to Cloudinary
    let colorImageUrls: Record<string, string[]> = {};
    if (rawColorImages && typeof rawColorImages === 'object') {
      for (const [color, imgs] of Object.entries(rawColorImages)) {
        const arr = Array.isArray(imgs) ? (imgs as string[]) : [];
        colorImageUrls[color] = await Promise.all(arr.map(uploadToCloudinary));
      }
    }

    const newProduct: Product = {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name,
      sku,
      category_id,
      sub_category: sub_category || null,
      collection: collection || null,
      description: description || '',
      price: parseFloat(price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock: parseInt(stock, 10),
      images: imageUrls,
      color_images: colorImageUrls,
      color_stock: color_stock || {},
      color_sizes: color_sizes || {},
      videos: videos || [],
      sizes: sizes || ['Free Size'],
      colors: colors || [],
      fabric: fabric || '',
      is_featured: is_featured === true || is_featured === 'true',
      is_bestseller: is_bestseller === true || is_bestseller === 'true',
      created_at: new Date().toISOString()
    };

    await db.products.create(newProduct);
    return res.status(201).json(newProduct);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};


export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Convert fields if necessary
    const updates: Partial<Product> = { ...body };
    if (body.price) updates.price = parseFloat(body.price);
    if (body.sale_price !== undefined) updates.sale_price = body.sale_price ? parseFloat(body.sale_price) : null;
    if (body.stock !== undefined) updates.stock = parseInt(body.stock, 10);
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured === true || body.is_featured === 'true';
    if (body.is_bestseller !== undefined) updates.is_bestseller = body.is_bestseller === true || body.is_bestseller === 'true';

    // Helper: upload base64 to Cloudinary, keep existing URLs
    const uploadToCloudinary = async (src: string): Promise<string> => {
      if (!src) return src;
      if (src.startsWith('http://') || src.startsWith('https://')) return src;
      if (src.startsWith('data:')) {
        const cloudinary = (await import('../lib/cloudinaryConfig')).default;
        const result = await cloudinary.uploader.upload(src, {
          folder: 'paree/products',
          resource_type: 'image'
        });
        return result.secure_url;
      }
      return src;
    };

    // Upload any new base64 images in the images array
    if (Array.isArray(body.images)) {
      updates.images = await Promise.all(body.images.map(uploadToCloudinary));
    }

    // Upload any new base64 images in color_images
    if (body.color_images && typeof body.color_images === 'object') {
      const colorImageUrls: Record<string, string[]> = {};
      for (const [color, imgs] of Object.entries(body.color_images)) {
        const arr = Array.isArray(imgs) ? (imgs as string[]) : [];
        colorImageUrls[color] = await Promise.all(arr.map(uploadToCloudinary));
      }
      updates.color_images = colorImageUrls;
    }

    const updated = await db.products.update(id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.products.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
