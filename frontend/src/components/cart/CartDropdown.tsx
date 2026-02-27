import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useRef } from 'react';

export default function CartDropdown() {
  const { items, removeItem, updateQuantity, totalPrice, setIsCartOpen } = useCart();
  const { darkMode } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click is on the cart icon button
        const target = event.target as HTMLElement;
        if (!target.closest('[aria-label*="Shopping cart"]')) {
          setIsCartOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsCartOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCartOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setIsCartOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div
      ref={dropdownRef}
      data-testid="cart-dropdown"
      className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } z-50`}
      role="dialog"
      aria-label="Shopping cart"
    >
      <div className="p-4">
        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
          Shopping Cart
        </h3>

        {items.length === 0 ? (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Your cart is empty
          </p>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <img
                    src={`/products/${item.imgName}`}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/products/default.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        darkMode ? 'text-light' : 'text-gray-800'
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-sm text-blue-500 font-semibold">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                          darkMode
                            ? 'bg-gray-600 text-light hover:bg-gray-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={`text-sm ${darkMode ? 'text-light' : 'text-gray-700'}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                          darkMode
                            ? 'bg-gray-600 text-light hover:bg-gray-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                  Total:
                </span>
                <span className="text-lg font-bold text-blue-500">{formatPrice(totalPrice)}</span>
              </div>

              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
