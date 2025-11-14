// app/contexts/ShopCartContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  cartItemId: string;           // Unique cart item ID
  productId: string;            // Product ID
  productName: string;          // Product name
  brand?: string;               // Brand/Category
  price: number;                // Current price
  quantity: number;             // Quantity
  imageUrl?: string;            // Product image
  selectedVariant?: string;     // Selected variant
  selectedFlavor?: string;      // Selected flavor
  sku?: string;                 // SKU/Product code
  business?: string;            // ⭐ Business name for grouping
}

interface ShopCartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
  clearCart: () => void;
}

const ShopCartContext = createContext<ShopCartContextType | undefined>(undefined);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shopCart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // ⭐ Save to localStorage whenever cart changes
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
        // Check if item already exists (by productId, not cartItemId)
        const existingItemIndex = prevItems.findIndex(
          (i) => i.productId === item.productId && 
                 i.selectedVariant === item.selectedVariant &&
                 i.selectedFlavor === item.selectedFlavor &&
                 i.business === item.business
        );

        let updatedItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedItems = prevItems.map((i, idx) =>
            idx === existingItemIndex
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          // Add new item
          updatedItems = [...prevItems, item];
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

        // Update quantity
        const updatedItems = prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        );

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

  const getCartTotal = (): number => {
    return cartItems.reduce(
      (total, item) => total + ((item.price || 0) * (item.quantity || 0)),
      0
    );
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

  const value: ShopCartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartItemsCount,
    getCartTotal,
    clearCart,
  };

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart(): ShopCartContextType {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error('useShopCart must be used within ShopCartProvider');
  }
  return context;
}