/**
 * Repository for carts data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { Cart } from '../models/cart';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class CartsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all carts
   */
  async findAll(): Promise<Cart[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM carts ORDER BY cart_id');
      return mapDatabaseRows<Cart>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get cart by ID
   */
  async findById(id: number): Promise<Cart | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM carts WHERE cart_id = ?', [id]);
      return row ? objectToCamelCase<Cart>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get cart by user ID
   */
  async findByUserId(userId: string): Promise<Cart | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM carts WHERE user_id = ?', [userId]);
      return row ? objectToCamelCase<Cart>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Create a new cart
   */
  async create(cart: Omit<Cart, 'cartId' | 'createdAt' | 'updatedAt'>): Promise<Cart> {
    try {
      const now = new Date().toISOString();
      const cartWithTimestamps = {
        ...cart,
        createdAt: now,
        updatedAt: now,
      };
      const { sql, values } = buildInsertSQL('carts', cartWithTimestamps);
      const result = await this.db.run(sql, values);

      const createdCart = await this.findById(result.lastID || 0);
      if (!createdCart) {
        throw new Error('Failed to retrieve created cart');
      }

      return createdCart;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update cart's updated_at timestamp
   */
  async touch(id: number): Promise<Cart> {
    try {
      const now = new Date().toISOString();
      const { sql, values } = buildUpdateSQL('carts', { updatedAt: now }, 'cart_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError('Cart', id);
      }

      const updatedCart = await this.findById(id);
      if (!updatedCart) {
        throw new Error('Failed to retrieve updated cart');
      }

      return updatedCart;
    } catch (error) {
      handleDatabaseError(error, 'Cart', id);
    }
  }

  /**
   * Delete cart by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM carts WHERE cart_id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('Cart', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'Cart', id);
    }
  }

  /**
   * Check if cart exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const row = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM carts WHERE cart_id = ?', [id]);
      return (row?.count ?? 0) > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

/**
 * Factory function to get a CartsRepository instance
 */
export async function getCartsRepository(isTest: boolean = false): Promise<CartsRepository> {
  const db = await getDatabase(isTest);
  return new CartsRepository(db);
}
