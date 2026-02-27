/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - cartItemId
 *         - cartId
 *         - productId
 *         - quantity
 *         - unitPrice
 *       properties:
 *         cartItemId:
 *           type: integer
 *           description: The unique identifier for the cart item
 *         cartId:
 *           type: integer
 *           description: The ID of the parent cart
 *         productId:
 *           type: integer
 *           description: The ID of the product in the cart
 *         quantity:
 *           type: integer
 *           description: The quantity of the product
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: The price per unit at time of adding to cart
 *     CartItemWithProduct:
 *       type: object
 *       required:
 *         - cartItemId
 *         - cartId
 *         - productId
 *         - quantity
 *         - unitPrice
 *         - productName
 *         - imgName
 *       properties:
 *         cartItemId:
 *           type: integer
 *           description: The unique identifier for the cart item
 *         cartId:
 *           type: integer
 *           description: The ID of the parent cart
 *         productId:
 *           type: integer
 *           description: The ID of the product in the cart
 *         quantity:
 *           type: integer
 *           description: The quantity of the product
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: The price per unit at time of adding to cart
 *         productName:
 *           type: string
 *           description: The name of the product
 *         imgName:
 *           type: string
 *           description: The image filename of the product
 */
export interface CartItem {
  cartItemId: number;
  cartId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CartItemWithProduct extends CartItem {
  productName: string;
  imgName: string;
}
