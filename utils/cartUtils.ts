// cartUtils.ts
'use client';

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

/**
 * Get cart from localStorage
 */
export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
};

/**
 * Save cart to localStorage
 */
export const saveCart = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('cart', JSON.stringify(items));
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

/**
 * Get cart totals
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
