'use client';

import React, { useState } from 'react';
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CartSummaryProps {
  cartTotal: number;
  itemCount: number;
  onCheckout: () => void;
  onClear: () => void;
  isProcessing?: boolean;
  businessCount: number;
  isBusinessSelected?: boolean; // ✨ NEW: Business selection state
}

export default function CartSummary({
  cartTotal,
  itemCount,
  onCheckout,
  onClear,
  isProcessing = false,
  businessCount,
  isBusinessSelected = false, // ✨ NEW: Default to false
}: CartSummaryProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const shippingCost = 0;
  const tax = (cartTotal * 0.0725).toFixed(2);
  const finalTotal = (cartTotal + parseFloat(tax) + shippingCost).toFixed(2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Cart Summary
      </h2>

      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="text-gray-900 dark:text-white">
            ${cartTotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className="text-gray-900 dark:text-white">
            ${shippingCost.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tax (7.25%)</span>
          <span className="text-gray-900 dark:text-white">${tax}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Total
          </span>
          <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            ${finalTotal}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {itemCount} item{itemCount !== 1 ? 's' : ''} from{' '}
          {businessCount} business{businessCount !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* ✨ NEW: Business Selection Warning */}
      {!isBusinessSelected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex gap-2">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 dark:text-red-300">
            Please select a business above to proceed with checkout
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          ℹ️ Please review the vendor payment options for your orders before
          checkout
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={onCheckout}
          disabled={isProcessing || itemCount === 0 || !isBusinessSelected}
          className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              Proceed to Checkout
            </>
          )}
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={itemCount === 0}
          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-2 rounded-lg transition-colors"
        >
          Clear Cart
        </button>

        <Link
          href="/shop"
          className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold py-2 rounded-lg transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Clear Cart?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove all items from your cart? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}