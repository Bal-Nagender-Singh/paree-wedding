import { Request, Response } from 'express';
import { db } from '../models/db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const userList = await db.users.getAll();
    const users = await Promise.all(userList.map(async u => {
      const addresses = await db.addresses.getByUserId(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        created_at: u.created_at,
        addresses
      };
    }));
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.users.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export const getUserPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orders = await db.orders.getByUserId(id);
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving user purchase history', error: error.message });
  }
};
