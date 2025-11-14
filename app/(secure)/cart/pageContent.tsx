'use client';

import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useShopCart } from "../../contexts/ShopCartContext";

import CartItemsByBusiness from './components/CartItemsByBusiness';
import CartSummary from './components/CartSummary';

export default function PageContent() {

  const {
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
  } = useShopCart();

  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);

  // ⭐ FIX: Provide default value for undefined business
  const itemsByBusiness = cartItems.reduce(
    (acc, item) => {
      const business = item.business || "Nature's High";
      if (!acc[business]) {
        acc[business] = [];
      }
      acc[business].push(item);
      return acc;
    },
    {} as Record<string, typeof cartItems>
  );

  const cartTotal = getCartTotal();
  const itemCount = getCartItemsCount();
  const businessCount = Object.keys(itemsByBusiness).length;

  const handleCheckout = async () => {
    setIsCheckoutProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Order placed successfully! You will be redirected to payment.');
      clearCart();
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="mb-8">
          <Link
            href="/buy"
            className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 hover:underline mb-4"
          >
            <ArrowLeft size={18} />
            Back to Shop
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Your Cart
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your cart items
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ShoppingCart size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some products to get started with your order
            </p>
            <Link
              href="/shop"
              className="inline-block bg-accent-600 hover:bg-accent-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="mb-8">
        <Link
          href="/buy"
          className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 hover:underline mb-4"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Your Cart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage your items
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(itemsByBusiness).map(([businessName, items]) => (
            <CartItemsByBusiness
              key={businessName}
              business={businessName}
              items={items}
              onUpdateQuantity={updateCartItemQuantity}
              onRemove={removeFromCart}
            />
          ))}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Notes
            </h3>
            <textarea
              placeholder="Add any special instructions or delivery notes for your order..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={4}
            />
          </div>
        </div>

        <div>
          <CartSummary
            cartTotal={cartTotal}
            itemCount={itemCount}
            businessCount={businessCount}
            onCheckout={handleCheckout}
            onClear={clearCart}
            isProcessing={isCheckoutProcessing}
          />
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By clicking Checkout above, you agree to our{' '}
          <a href="#" className="text-accent-600 dark:text-accent-400 hover:underline">
            Terms of Service
          </a>{' '}
          including any applicable{' '}
          <a href="#" className="text-accent-600 dark:text-accent-400 hover:underline">
            cannabis regulations
          </a>
        </p>
      </div>
    </div>
  );
}