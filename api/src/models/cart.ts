/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       required:
 *         - cartId
 *       properties:
 *         cartId:
 *           type: integer
 *           description: The unique identifier for the cart
 *         userId:
 *           type: string
 *           description: The ID of the user who owns the cart (nullable for guest carts)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the cart was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the cart was last updated
 */
export interface Cart {
  cartId: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}
