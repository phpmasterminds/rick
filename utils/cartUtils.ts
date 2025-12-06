// ============================================================================
// FINAL COMPLETE CODE - cartUtils.ts
// ============================================================================
// File: /utils/cartUtils.ts (or /lib/cartUtils.ts)
// Purpose: User-specific cart management with dispensary isolation
// ============================================================================

'use client';

import Cookies from 'js-cookie';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  dispensary_id: string;
  dispensary_name: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user-specific storage key based on user_id cookie
 * Format: cart_[user_id] to isolate carts per user
 */
const getUserCartKey = (): string => {
  const userId = Cookies.get('user_id');
  if (!userId) {
    return 'cart_temp_session'; // Guest cart
  }
  return `cart_${userId}`; // User-specific cart
};

// ============================================================================
// CORE CART FUNCTIONS
// ============================================================================

/**
 * Get cart from localStorage (user-specific)
 */
export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  const key = getUserCartKey();
  const cart = localStorage.getItem(key);
  return cart ? JSON.parse(cart) : [];
};

/**
 * Save cart to localStorage (user-specific)
 */
export const saveCart = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  const key = getUserCartKey();
  localStorage.setItem(key, JSON.stringify(items));
  // Dispatch event for other components to listen
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
};

/**
 * Add item to cart with dispensary info
 */
export const addToCart = (
  product: {
    med_id: string;
    name: string;
    value2: string;
    value1?: string;
    med_image_url?: string | null;
    med_image?: string | null;
    med_img?: string | null;
  },
  dispensary: {
    id: string;
    name: string;
  },
  quantity: number = 1
): CartItem => {
  const cart = getCart();
  const price = parseFloat(product.value2);
  
  // Create unique ID based on product and dispensary
  const itemId = `${dispensary.id}_${product.med_id}`;
  
  // Check if item already exists in this dispensary
  const existingItemIndex = cart.findIndex(item => item.id === itemId);
  
  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem: CartItem = {
      id: itemId,
      name: product.name,
      price: price,
      quantity: quantity,
      unit: product.value1 || 'unit',
      image: (product.med_image_url || product.med_img) as string | undefined,
      dispensary_id: dispensary.id,
      dispensary_name: dispensary.name,
    };
    cart.push(newItem);
  }
  
  saveCart(cart);
  return cart[cart.findIndex(item => item.id === itemId)];
};

/**
 * Remove item from cart
 */
export const removeFromCart = (itemId: string): void => {
  const cart = getCart();
  const filtered = cart.filter(item => item.id !== itemId);
  saveCart(filtered);
};

/**
 * Update item quantity
 */
export const updateQuantity = (itemId: string, quantity: number): void => {
  let cart = getCart();
  
  if (quantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  
  cart = cart.map(item =>
    item.id === itemId ? { ...item, quantity } : item
  );
  
  saveCart(cart);
};

/**
 * Clear entire cart
 */
export const clearCart = (): void => {
  saveCart([]);
};

// ============================================================================
// DISPENSARY MANAGEMENT
// ============================================================================

/**
 * Get the current cart's dispensary ID (if any)
 * Returns null if cart is empty
 */
export const getCurrentCartDispensaryId = (): string | null => {
  const cart = getCart();
  if (cart.length === 0) return null;
  return cart[0]?.dispensary_id || null;
};

/**
 * Check if user can add product from different dispensary
 * Returns { canAdd: boolean, currentDispensaryId: string | null }
 */
export const checkDispensaryConflict = (newDispensaryId: string): { canAdd: boolean; currentDispensaryId: string | null } => {
  const currentDispensaryId = getCurrentCartDispensaryId();
  
  // If cart is empty, can add
  if (!currentDispensaryId) {
    return { canAdd: true, currentDispensaryId: null };
  }
  
  // If same dispensary, can add
  if (currentDispensaryId === newDispensaryId) {
    return { canAdd: true, currentDispensaryId };
  }
  
  // Different dispensary - cannot add without confirmation
  return { canAdd: false, currentDispensaryId };
};

/**
 * Clear cart and add item from new dispensary
 * Used when user confirms they want to switch dispensaries
 */
export const replaceCartWithNewDispensary = (
  product: {
    med_id: string;
    name: string;
    value2: string;
    value1?: string;
    med_image_url?: string | null;
    med_image?: string | null;
    med_img?: string | null;
  },
  dispensary: {
    id: string;
    name: string;
  },
  quantity: number = 1
): CartItem => {
  // Clear existing cart
  clearCart();
  
  // Add new item
  return addToCart(product, dispensary, quantity);
};

// ============================================================================
// CART CALCULATIONS
// ============================================================================

/**
 * Get cart totals (items, subtotal, tax, total)
 */
export const getCartTotals = () => {
  const cart = getCart();
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.045; // 4.5% tax
  const total = subtotal + tax;
  
  return {
    itemCount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

/**
 * Group cart items by dispensary
 */
export const groupByDispensary = (cart: CartItem[] = []) => {
  const items = cart.length ? cart : getCart();
  
  return items.reduce((acc, item) => {
    if (!acc[item.dispensary_id]) {
      acc[item.dispensary_id] = {
        dispensary_name: item.dispensary_name,
        dispensary_id: item.dispensary_id,
        items: [],
      };
    }
    acc[item.dispensary_id].items.push(item);
    return acc;
  }, {} as Record<string, { dispensary_name: string; dispensary_id: string; items: CartItem[] }>);
};

/**
 * Validate cart (check for required data)
 */
export const validateCart = (): { valid: boolean; errors: string[] } => {
  const cart = getCart();
  const errors: string[] = [];
  
  if (cart.length === 0) {
    errors.push('Cart is empty');
    return { valid: false, errors };
  }
  
  cart.forEach((item, index) => {
    if (!item.dispensary_id) errors.push(`Item ${index + 1}: Missing dispensary ID`);
    if (!item.name) errors.push(`Item ${index + 1}: Missing product name`);
    if (item.quantity <= 0) errors.push(`Item ${index + 1}: Invalid quantity`);
    if (item.price < 0) errors.push(`Item ${index + 1}: Invalid price`);
  });
  
  return { valid: errors.length === 0, errors };
};

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Listen for cart updates
 */
export const onCartUpdate = (callback: (items: CartItem[]) => void): (() => void) => {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent) {
      callback(event.detail);
    }
  };
  
  window.addEventListener('cartUpdated', handler);
  
  // Return unsubscribe function
  return () => window.removeEventListener('cartUpdated', handler);
};

// ============================================================================
// LOGIN / LOGOUT MIGRATIONS
// ============================================================================

/**
 * Migrate old cart to user-specific cart when user logs in
 * Call this after user authentication is successful
 */
export const migrateOldCartOnLogin = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if there's a session cart
  const oldCart = localStorage.getItem('cart_temp_session');
  if (oldCart) {
    try {
      const items = JSON.parse(oldCart);
      // Save to new user-specific key
      const newKey = getUserCartKey();
      localStorage.setItem(newKey, oldCart);
      // Remove old session cart
      localStorage.removeItem('cart_temp_session');
      // Dispatch event
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
    } catch (error) {
      console.error('Error migrating cart on login:', error);
    }
  }
};

/**
 * Clear user-specific cart when user logs out
 * Call this before clearing the user session
 */
export const clearUserCartOnLogout = (): void => {
  if (typeof window === 'undefined') return;
  
  const key = getUserCartKey();
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
};

// ============================================================================
// END OF cartUtils.ts
// ============================================================================