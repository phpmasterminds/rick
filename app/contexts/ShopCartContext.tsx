// app/contexts/ShopCartContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  calculateApplicableDiscount,
  calculateFinalPrice,
  type Discount,
  type AppliedDiscount,
} from '@/app/utils/discountUtils';
import {
  type AppliedPromotion,
} from '@/app/utils/promotionUtils';

export interface CartItem {
  cartItemId: string; // Unique cart item ID
  productId: string; // Product ID
  productName: string; // Product name
  brand?: string; // Brand/Category
  price: number; // Current price (after discount/deal if applicable)
  basePrice?: number; // Original price before discount/deal
  quantity: number; // Quantity
  imageUrl?: string; // Product image
  selectedVariant?: string; // Selected variant
  selectedFlavor?: string; // Selected flavor
  sku?: string; // SKU/Product code
  business?: string; // Business name for grouping
  business_user_id?: number; // Business user ID
  page_id?: number; // Page ID
  is_sample?: number; // Is sample indicator
  customer_id?: number; // Customer ID
  sample_order?: number; // Sample order indicator
  name?: string; // Product name alternative
  med_image?: string; // Product image alternative
  total?: number; // Line item total (price * quantity)
  discount?: Discount | null; // Discount object for recalculation (IMPORTANT: Keep this!)
  dealString?: string | null; // i_deals string (e.g., "10%", "$5", "100")
  appliedDiscount?: AppliedDiscount; // Currently applied discount/deal
}

interface ShopCartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getTotalDiscount: () => number;
  clearCart: () => void;
  getCartItemWithDiscount: (item: CartItem) => CartItem;
  // NEW: Per-business promotion code methods
  appliedPromotions: Record<string, AppliedPromotion>; // Key: page_id, Value: AppliedPromotion
  setAppliedPromotionByBusiness: (pageId: string, promotion: AppliedPromotion | null) => void;
  getPromotionDiscountByBusiness: (pageId: string) => number;
  getTotalPromotionDiscount: () => number;
  getTotalSavings: () => number; // Combines all discounts + all promotions
}

const ShopCartContext = createContext<ShopCartContextType | undefined>(undefined);

/**
 * Calculate item price and discount with recalculation
 * 
 * IMPORTANT: This function recalculates the discount/deal based on:
 * 1. basePrice (original price)
 * 2. quantity (for threshold-based discounts)
 * 3. discount object (for traditional discounts with rules)
 * 4. dealString (for i_deals like "100", "10%", "$5")
 * 
 * The discount object MUST be preserved in cart items!
 */
const calculateItemTotal = (item: CartItem): CartItem => {
  const basePrice = item.basePrice || item.price;
  
  // CRITICAL: Both discount object AND dealString must be passed
  // to properly calculate stacked discounts
  const appliedDiscount = calculateApplicableDiscount(
    basePrice,
    item.quantity,
    item.discount,      // Traditional discount object (REQUIRED!)
    item.dealString     // Deal string from i_deals (REQUIRED!)
  );
  
  const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);

  return {
    ...item,
    basePrice: basePrice,  // Ensure basePrice is always set
    price: finalPrice,     // Update to final price after discount/deal
    appliedDiscount: appliedDiscount || undefined,
    total: finalPrice * (item.quantity || 0),
  };
};

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shopCart');
      const items = stored ? JSON.parse(stored) : [];
      // Recalculate totals on initialization to ensure discount/deal is applied
      return items.map(calculateItemTotal);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // NEW: Per-business applied promotions (Key: page_id, Value: AppliedPromotion)
  const [appliedPromotions, setAppliedPromotionsState] = useState<Record<string, AppliedPromotion>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('appliedPromotions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage whenever cart changes
  const saveToLocalStorage = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shopCart', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  };

  // NEW: Save applied promotions to localStorage
  const saveAppliedPromotions = (promotions: Record<string, AppliedPromotion>) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('appliedPromotions', JSON.stringify(promotions));
      } catch (error) {
        console.error('Error saving applied promotions to localStorage:', error);
      }
    }
  };

  const addToCart = (item: CartItem) => {
    try {
		console.log('Item added to cart:', item);
      setCartItems((prevItems) => {
        // Check if item already exists (by productId and options, not cartItemId)
        // This prevents duplicate entries when adding same product with same options
        const existingItemIndex = prevItems.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.selectedVariant === item.selectedVariant &&
            i.selectedFlavor === item.selectedFlavor &&
            i.business === item.business
        );

        let updatedItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Item exists - update quantity and recalculate with discount/deal
          updatedItems = prevItems.map((i, idx) => {
            if (idx === existingItemIndex) {
              // IMPORTANT: Preserve discount and dealString from new item
              // These contain the rules needed for proper calculation
              const updatedItem = {
                ...i,
                quantity: i.quantity + item.quantity,
                discount: item.discount || i.discount,      // Use new discount if provided
                dealString: item.dealString || i.dealString, // Use new deal if provided
              };
              return calculateItemTotal(updatedItem);
            }
            return i;
          });
        } else {
          // New item - add to cart with calculated total
          updatedItems = [...prevItems, calculateItemTotal(item)];
        }

        saveToLocalStorage(updatedItems);
        return updatedItems;
      });

      
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (cartItemId: string) => {
    try {
      setCartItems((prevItems) => {
        const updatedItems = prevItems.filter((item) => item.cartItemId !== cartItemId);
        saveToLocalStorage(updatedItems);
        return updatedItems;
      });

      console.log('Item removed from cart:', cartItemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateCartItemQuantity = (cartItemId: string, quantity: number) => {
    try {
      setCartItems((prevItems) => {
        if (quantity <= 0) {
          // Remove if quantity is 0 or less
          const updatedItems = prevItems.filter((item) => item.cartItemId !== cartItemId);
          saveToLocalStorage(updatedItems);
          return updatedItems;
        }

        // Update quantity and recalculate with discount/deal
        // This is important because some discounts are threshold-based
        // (e.g., "10% off orders >= $500") so changing quantity might change the discount
        const updatedItems = prevItems.map((item) => {
          if (item.cartItemId === cartItemId) {
            const updatedItem = { ...item, quantity };
            return calculateItemTotal(updatedItem);
          }
          return item;
        });

        saveToLocalStorage(updatedItems);
        return updatedItems;
      });

      console.log('Item quantity updated:', cartItemId, quantity);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const getCartItemsCount = (): number => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  /**
   * Get cart subtotal BEFORE discounts and deals
   * This is the sum of basePrice × quantity for all items
   */
  const getCartSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.basePrice || item.price;
      return total + basePrice * (item.quantity || 0);
    }, 0);
  };

  /**
   * Get total discount and deal savings across all cart items
   * This is the total amount saved from both discounts and deals
   */
  const getTotalDiscount = (): number => {
    return cartItems.reduce((total, item) => {
      return total + (item.appliedDiscount?.discountValue || 0) * (item.quantity || 0);
    }, 0);
  };

  /**
   * NEW: Get promotion discount for a specific business
   */
  const getPromotionDiscountByBusiness = (pageId: string): number => {
    const promotion = appliedPromotions[pageId];
    if (!promotion || !promotion.isApplicable) {
      return 0;
    }
    return promotion.discountValue;
  };

  /**
   * NEW: Get total promotion discount across all businesses
   */
  const getTotalPromotionDiscount = (): number => {
    return Object.values(appliedPromotions).reduce((total, promotion) => {
      if (!promotion || !promotion.isApplicable) {
        return total;
      }
      return total + promotion.discountValue;
    }, 0);
  };

  /**
   * NEW: Get total savings (discounts + deals + promotions)
   */
  const getTotalSavings = (): number => {
    return getTotalDiscount() + getTotalPromotionDiscount();
  };

  /**
   * Get cart total AFTER discounts, deals AND promotions
   * This is the amount customer will pay
   */
  const getCartTotal = (): number => {
    const subtotal = cartItems.reduce((total, item) => total + (item.total || 0), 0);
    const totalPromotionDiscount = getTotalPromotionDiscount();
    return Math.max(0, subtotal - totalPromotionDiscount);
  };

  const clearCart = () => {
    try {
      setCartItems([]);
      setAppliedPromotionsState({});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopCart');
        localStorage.removeItem('appliedPromotions');
      }
      console.log('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartItemWithDiscount = (item: CartItem): CartItem => {
    return calculateItemTotal(item);
  };

  // NEW: Update applied promotion for a specific business
  const handleSetAppliedPromotionByBusiness = (pageId: string, promotion: AppliedPromotion | null) => {
    setAppliedPromotionsState((prev) => {
      const updated = { ...prev };
      if (promotion) {
        updated[pageId] = promotion;
      } else {
        delete updated[pageId];
      }
      saveAppliedPromotions(updated);
      return updated;
    });
  };

  const value: ShopCartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartItemsCount,
    getCartTotal,
    getCartSubtotal,
    getTotalDiscount,
    clearCart,
    getCartItemWithDiscount,
    // NEW: Per-business promotion methods
    appliedPromotions,
    setAppliedPromotionByBusiness: handleSetAppliedPromotionByBusiness,
    getPromotionDiscountByBusiness,
    getTotalPromotionDiscount,
    getTotalSavings,
  };

  return (
    <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
  );
}

export function useShopCart(): ShopCartContextType {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error('useShopCart must be used within ShopCartProvider');
  }
  return context;
}