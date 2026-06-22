import { Request, Response } from 'express';
import { db } from '../models/db';
import { Category } from '../models/types';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const list = await db.categories.getAll();
    return res.status(200).json(list);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parent_id, image } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory: Category = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      name,
      slug,
      image: image || null,
      parent_id: parent_id || null,
      created_at: new Date().toISOString()
    };

    await db.categories.create(newCategory);
    return res.status(201).json(newCategory);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parent_id, image } = req.body;

    const updates: Partial<Category> = {};
    if (name) {
      updates.name = name;
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (parent_id !== undefined) {
      updates.parent_id = parent_id || null;
    }
    if (image !== undefined) {
      updates.image = image;
    }

    const updated = await db.categories.update(id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.categories.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
