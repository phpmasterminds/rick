'use client';

import React, { useState } from 'react';
import { ChevronDown, Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../../../contexts/ShopCartContext';

interface CartItemsByBusinessProps {
  business: string;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

export default function CartItemsByBusiness({
  business,
  items,
  onUpdateQuantity,
  onRemove,
}: CartItemsByBusinessProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate business total WITH discounts applied
  const businessTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity); // price already includes discount
  }, 0);

  // Calculate business subtotal BEFORE discounts
  const businessSubtotal = items.reduce((sum, item) => {
    const basePrice = item.basePrice || item.price;
    return sum + (basePrice * item.quantity);
  }, 0);

  // Calculate total discount for this business
  const totalDiscount = businessSubtotal - businessTotal;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            size={20}
            className={`text-gray-600 dark:text-gray-400 transition-transform ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {business}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900 dark:text-white">
            ${businessTotal.toFixed(2)}
          </p>
          {totalDiscount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
              Save ${totalDiscount.toFixed(2)}
            </p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {items.map((item, idx) => (
            <div
              key={item.cartItemId}
              className={`p-4 flex gap-4 ${
                idx !== items.length - 1
                  ? 'border-b border-gray-200 dark:border-gray-700'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {item.productName}
                </h4>

                <div className="flex gap-2 mb-2">
                  {item.selectedVariant && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                      {item.selectedVariant}
                    </span>
                  )}
                  {item.selectedFlavor && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                      {item.selectedFlavor}
                    </span>
                  )}
                  {/* NEW: Show discount badge if applicable */}
                  {item.appliedDiscount && item.appliedDiscount.isApplicable && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded font-semibold">
                      {item.appliedDiscount.discountDisplay} OFF
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.brand}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Minus size={14} className="text-gray-600 dark:text-gray-300" />
                  </button>

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(
                        item.cartItemId,
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="w-12 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                  />

                  <button
                    onClick={() =>
                      onUpdateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus size={14} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => onRemove(item.cartItemId)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="text-right">
                  {/* NEW: Show base price if discount applied */}
                  {item.basePrice && item.basePrice !== item.price && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-through">
                      ${item.basePrice.toFixed(2)}/each
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    ${item.price.toFixed(2)}/each
                  </p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Subtotal
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                ${businessSubtotal.toFixed(2)}
              </p>
            </div>

            {/* NEW: Show discount if applicable */}
            {totalDiscount > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Discount
                </p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  -${totalDiscount.toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                Business Total
              </p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                ${businessTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}