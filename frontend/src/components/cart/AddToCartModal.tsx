import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

interface AddToCartModalProps {
  product: {
    productId: number;
    name: string;
    price: number;
    imgName: string;
    discount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToCartModal({ product, isOpen, onClose }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { darkMode } = useTheme();
  const { addItem } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate effective price with discount
  const effectivePrice = product.price * (1 - (product.discount || 0));

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    // Reset quantity when modal opens
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleAddToCart = () => {
    if (quantity > 0) {
      addItem(
        {
          productId: product.productId,
          name: product.name,
          price: effectivePrice,
          imgName: product.imgName,
        },
        quantity
      );
      onClose();
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setQuantity(Math.max(0, Math.min(99, value)));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        ref={modalRef}
        data-testid="add-to-cart-modal"
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              id="modal-title"
              className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}
            >
              Add to Cart
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Product Preview */}
          <div className="flex gap-4 mb-6">
            <img
              src={`/products/${product.imgName}`}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/products/default.png';
              }}
            />
            <div className="flex-1">
              <h3 className={`font-medium ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                {product.name}
              </h3>
              <div className="mt-1">
                {product.discount && product.discount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-500">
                      {formatPrice(effectivePrice)}
                    </span>
                    <span className={`text-sm line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      -{Math.round(product.discount * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-blue-500">
                    {formatPrice(effectivePrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label
              htmlFor="quantity-input"
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-light hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                ref={inputRef}
                id="quantity-input"
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={handleQuantityChange}
                className={`w-20 h-10 text-center rounded-lg border-2 font-medium ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-light focus:border-cart'
                    : 'bg-white border-gray-300 text-gray-800 focus:border-cart'
                } focus:outline-none`}
              />
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-light hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div
            className={`flex justify-between items-center py-3 px-4 rounded-lg mb-6 ${
              darkMode ? 'bg-gray-700' : 'bg-blue-100'
            }`}
          >
            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subtotal:
            </span>
            <span className="text-xl font-bold text-blue-500">
              {formatPrice(effectivePrice * quantity)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-light hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={quantity <= 0}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
