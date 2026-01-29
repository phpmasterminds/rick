// app/contexts/ShopCartContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  calculateApplicableDiscount,
  calculateFinalPrice,
  type Discount,
  type AppliedDiscount,
} from '@/app/utils/discountUtils';

export interface CartItem {
  cartItemId: string; // Unique cart item ID
  productId: string; // Product ID
  productName: string; // Product name
  brand?: string; // Brand/Category
  price: number; // Current price (after discount if applicable)
  basePrice?: number; // Original price before discount
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
  discount?: Discount | null; // Discount object for recalculation
  appliedDiscount?: AppliedDiscount; // Currently applied discount
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
  getCartItemWithDiscount: (item: CartItem) => CartItem; // Get item with updated discount
}

const ShopCartContext = createContext<ShopCartContextType | undefined>(undefined);

// Helper function to calculate item total with discount recalculation
const calculateItemTotal = (item: CartItem): CartItem => {
  // Recalculate discount based on quantity and base price
  const basePrice = item.basePrice || item.price;
  const appliedDiscount = calculateApplicableDiscount(basePrice, item.quantity, item.discount);
  const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);

  return {
    ...item,
    price: finalPrice, // Update price to final price after discount
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
      // Recalculate totals on initialization
      return items.map(calculateItemTotal);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
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

  const addToCart = (item: CartItem) => {
    try {
      setCartItems((prevItems) => {
        // Check if item already exists (by productId and options, not cartItemId)
        const existingItemIndex = prevItems.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.selectedVariant === item.selectedVariant &&
            i.selectedFlavor === item.selectedFlavor &&
            i.business === item.business
        );

        let updatedItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update existing item quantity and recalculate total
          updatedItems = prevItems.map((i, idx) => {
            if (idx === existingItemIndex) {
              // Preserve discount information from existing item or new item
              const updatedItem = {
                ...i,
                quantity: i.quantity + item.quantity,
                discount: item.discount || i.discount,
              };
              return calculateItemTotal(updatedItem);
            }
            return i;
          });
        } else {
          // Add new item with calculated total
          updatedItems = [...prevItems, calculateItemTotal(item)];
        }

        saveToLocalStorage(updatedItems);
        return updatedItems;
      });

      console.log('Item added to cart:', item);
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

        // Update quantity and recalculate total with discount
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

  const getCartSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.basePrice || item.price;
      return total + basePrice * (item.quantity || 0);
    }, 0);
  };

  const getTotalDiscount = (): number => {
    return cartItems.reduce((total, item) => {
      return total + (item.appliedDiscount?.discountValue || 0) * (item.quantity || 0);
    }, 0);
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((total, item) => total + (item.total || 0), 0);
  };

  const clearCart = () => {
    try {
      setCartItems([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shopCart');
      }
      console.log('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartItemWithDiscount = (item: CartItem): CartItem => {
    return calculateItemTotal(item);
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