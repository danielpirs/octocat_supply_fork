import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import CartDropdown from './CartDropdown';

export default function CartIcon() {
  const { totalItems, isCartOpen, setIsCartOpen } = useCart();
  const { darkMode } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsCartOpen(!isCartOpen)}
        className={`relative p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          totalItems > 0
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : darkMode
              ? 'text-light hover:text-blue-500'
              : 'text-gray-700 hover:text-blue-500'
        }`}
        aria-label={`Shopping cart with ${totalItems} items`}
        aria-expanded={isCartOpen}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {totalItems > 0 && (
          <span
            data-testid="cart-badge"
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {isCartOpen && <CartDropdown />}
    </div>
  );
}
