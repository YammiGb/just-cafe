import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-2xl font-playfair font-medium text-cafe-dark mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-cafe-accent text-white px-6 py-3 rounded-full hover:bg-cafe-espresso transition-all duration-200"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          aria-label="Back"
          className="flex items-center text-gray-600 hover:text-cafe-accent transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-cafe-dark whitespace-nowrap">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-cafe-accent hover:text-cafe-espresso transition-colors duration-200 whitespace-nowrap"
        >
          Clear All
        </button>
      </div>

      <div className="bg-cafe-light rounded-xl shadow-sm overflow-hidden mb-8 border border-cafe-latte">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-cafe-latte' : ''}`}>
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-lg font-playfair font-medium text-cafe-dark mb-1">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-sm text-gray-500 mb-1">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-gray-500 mb-1">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-lg font-semibold text-cafe-dark">₱{item.totalPrice} each</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3 bg-cafe-beige rounded-full p-1 border border-cafe-latte">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-2 hover:bg-cafe-latte rounded-full transition-colors duration-200"
                >
                  <Minus className="h-4 w-4 text-cafe-accent" />
                </button>
                <span className="font-semibold text-cafe-dark min-w-[32px] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-2 hover:bg-cafe-latte rounded-full transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 text-cafe-accent" />
                </button>
              </div>

              <div className="flex items-center space-x-4 ml-auto">
                <p className="text-lg font-semibold text-cafe-dark">₱{item.totalPrice * item.quantity}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-cafe-accent hover:text-cafe-espresso hover:bg-cafe-beige rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
        <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark mb-6">
          <span>Total:</span>
          <span className="text-cafe-accent">₱{parseFloat(getTotalPrice() || 0).toFixed(2)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-cafe-accent text-white py-4 rounded-xl hover:bg-cafe-espresso transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;