'use client';

import React, { useState } from 'react';
import { ChevronDown, Trash2, Plus, Minus, Check, X, Loader2 } from 'lucide-react';
import { CartItem, useShopCart } from '../../../contexts/ShopCartContext';
import {
  validateAndApplyPromotionCode,
} from '@/app/utils/promotionUtils';
import { toast } from 'react-toastify';

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
  const [promotionInput, setPromotionInput] = useState('');
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const [promotionError, setPromotionError] = useState('');

  const {
    appliedPromotions,
    setAppliedPromotionByBusiness,
    getPromotionDiscountByBusiness,
  } = useShopCart();

  // Get page_id from first item in this business group
  const pageId = items[0]?.page_id?.toString() || '';
  const appliedPromotion = pageId ? appliedPromotions[pageId] : null;
  const promotionDiscount = pageId ? getPromotionDiscountByBusiness(pageId) : 0;

  // Calculate business total WITH discounts/deals applied
  const businessTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Calculate business subtotal BEFORE discounts/deals
  const businessSubtotal = items.reduce((sum, item) => {
    const basePrice = item.basePrice || item.price;
    return sum + (basePrice * item.quantity);
  }, 0);

  // Calculate total discount/deal savings for this business (before promotion)
  const totalDiscountAndDeals = businessSubtotal - businessTotal;

  // Calculate business total AFTER discounts/deals BUT BEFORE promotions
  const businessTotalAfterDiscounts = businessTotal;

  // Calculate business total AFTER everything (discounts + deals + promotion)
  const businessTotalAfterAllSavings = businessTotalAfterDiscounts - promotionDiscount;

  // Breakdown by source (discount vs deal)
  const discountSavings = items.reduce((sum, item) => {
    if (item.appliedDiscount?.source === 'discount') {
      return sum + (item.appliedDiscount.discountValue * item.quantity);
    } else if (item.appliedDiscount?.source === 'combined') {
      // For combined, subtract deal value to get just discount part
      const justDiscount = item.appliedDiscount.discountValue - (item.appliedDiscount.dealValue || 0);
      return sum + (justDiscount * item.quantity);
    }
    return sum;
  }, 0);

  const dealSavings = items.reduce((sum, item) => {
    if (item.appliedDiscount?.source === 'deal') {
      return sum + (item.appliedDiscount.dealValue || item.appliedDiscount.discountValue) * item.quantity;
    } else if (item.appliedDiscount?.source === 'combined') {
      return sum + (item.appliedDiscount.dealValue || 0) * item.quantity;
    }
    return sum;
  }, 0);

  /**
   * Handle promotion code submission for this business
   */
  const handleApplyPromotion = async () => {
    if (!promotionInput.trim()) {
      setPromotionError('Please enter a promotion code');
      return;
    }

    if (!pageId) {
      setPromotionError('Business ID not found');
      return;
    }

    setIsValidatingPromotion(true);
    setPromotionError('');

    try {
      // Use business-specific total for promotion calculation
      const promotion = await validateAndApplyPromotionCode(
        promotionInput,
        businessTotalAfterDiscounts,
        pageId  // Pass single page_id for this business
      );

      if (promotion && promotion.isApplicable) {
        setAppliedPromotionByBusiness(pageId, promotion);
        setPromotionInput('');
        setPromotionError('');
        toast.success(`Promotion code "${promotionInput.toUpperCase()}" applied to ${business}!`, {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        const errorMsg = promotion?.errorMessage || 'Promotion code could not be applied';
        setPromotionError(errorMsg);
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMsg = 'Error applying promotion code. Please try again.';
      setPromotionError(errorMsg);
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 3000,
      });
      console.error('Promotion validation error:', error);
    } finally {
      setIsValidatingPromotion(false);
    }
  };

  /**
   * Handle removing promotion code
   */
  const handleRemovePromotion = () => {
    if (pageId) {
      setAppliedPromotionByBusiness(pageId, null);
      setPromotionInput('');
      setPromotionError('');
      toast.info(`Promotion code removed from ${business}`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  /**
   * Handle Enter key in promotion input
   */
  const handlePromotionKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyPromotion();
    }
  };

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
            ${businessTotalAfterAllSavings.toFixed(2)}
          </p>
          {(totalDiscountAndDeals > 0 || promotionDiscount > 0) && (
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
              Save ${(totalDiscountAndDeals + promotionDiscount).toFixed(2)}
            </p>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* PROMOTION CODE SECTION - AT TOP FOR EACH BUSINESS */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent border-b border-purple-200 dark:border-purple-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              💝 Promotion Code for {business}
            </label>

            {!appliedPromotion ? (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={promotionInput}
                    onChange={(e) => {
                      setPromotionInput(e.target.value.toUpperCase());
                      setPromotionError('');
                    }}
                    onKeyPress={handlePromotionKeyPress}
                    placeholder="Enter promotion code"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isValidatingPromotion}
                  />
                  <button
                    onClick={handleApplyPromotion}
                    disabled={isValidatingPromotion || !promotionInput.trim()}
                    className="px-4 py-2 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    {isValidatingPromotion ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>

                {/* Promotion error message */}
                {promotionError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                    <X size={14} className="flex-shrink-0" />
                    <span>{promotionError}</span>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Have a code? Enter it to get additional savings on this vendor's items!
                </p>
              </>
            ) : (
              // Show applied promotion
              <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Check size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                        {appliedPromotion.code ? `"${appliedPromotion.code}"` : 'Promotion'} Applied
                      </p>
                      <p className="text-xs text-purple-800 dark:text-purple-400">
                        Save {appliedPromotion.discountDisplay}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromotion}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-lg transition-colors flex-shrink-0"
                    title="Remove promotion code"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CART ITEMS */}
          {items.map((item, idx) => (
            <div
              key={item.cartItemId}
              className={`p-4 flex gap-4 ${
                idx !== items.length - 1
                  ? 'border-b border-gray-200 dark:border-gray-700'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
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

              <div className="flex-1 min-w-0 flex flex-col">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {item.productName}
                </h4>

                <div className="flex gap-2 mb-2 flex-wrap">
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

                  {/* Discount/Deal badges */}
                  {item.appliedDiscount && item.appliedDiscount.isApplicable && (
                    <>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        item.appliedDiscount.source === 'deal'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                          : item.appliedDiscount.source === 'combined'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                      }`}>
                        {item.appliedDiscount.discountDisplay} OFF
                      </span>
                      
                      {item.appliedDiscount.source === 'deal' && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 px-2 py-1 rounded font-semibold">
                          🎉 DEAL
                        </span>
                      )}
                      
                      {item.appliedDiscount.source === 'combined' && (
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 px-2 py-1 rounded font-semibold">
                          🎊 COMBO
                        </span>
                      )}
                      
                      {item.appliedDiscount.source === 'discount' && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded font-semibold">
                          💰 SAVE
                        </span>
                      )}
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {item.brand}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
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

              <div className="flex flex-col items-end justify-between gap-2">
                <button
                  onClick={() => onRemove(item.cartItemId)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                {/* PRICING - Prominent Display with Inline Strikethrough */}
                <div className="text-right">
                  {item.basePrice && item.basePrice !== item.price && (
                    <p 
                      style={{ textDecoration: 'line-through' }}
                      className="text-sm text-gray-400 dark:text-gray-500 mb-1 font-medium"
                    >
                      ${item.basePrice.toFixed(2)}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-accent-600 dark:text-accent-400 mb-1">
                    ${item.price.toFixed(2)} each
                  </p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  
                  {/* Show savings for this item if applicable */}
                  {item.appliedDiscount && item.appliedDiscount.isApplicable && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                      Save ${(item.appliedDiscount.discountValue * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Business Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Subtotal
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                ${businessSubtotal.toFixed(2)}
              </p>
            </div>

            {/* Show discount savings breakdown if any */}
            {discountSavings > 0 && (
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  💰 Discount Savings
                </p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  -${discountSavings.toFixed(2)}
                </p>
              </div>
            )}

            {/* Show deal savings breakdown if any */}
            {dealSavings > 0 && (
              <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  🎉 Deal Savings
                </p>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  -${dealSavings.toFixed(2)}
                </p>
              </div>
            )}

            {/* Show promotion savings breakdown if any */}
            {promotionDiscount > 0 && appliedPromotion && (
              <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  💝 Promotion Savings
                </p>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  -${promotionDiscount.toFixed(2)}
                </p>
              </div>
            )}

            {/* Show total savings if any */}
            {(totalDiscountAndDeals + promotionDiscount) > 0 && (
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Total Savings
                </p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  -${(totalDiscountAndDeals + promotionDiscount).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                Total
              </p>
              <p className="font-bold text-lg text-accent-600 dark:text-accent-400">
                ${businessTotalAfterAllSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}