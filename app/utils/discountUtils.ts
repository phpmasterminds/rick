/**
 * Discount Utilities - Matches Actual API Response Format
 * Handles all discount calculation and logic
 * 
 * API Response Example:
 * {
 *   "id": "10",
 *   "business_id": "9398",
 *   "name": "Pack Discount",
 *   "status": "active",
 *   "applies_to_id": "6200",
 *   "applies_to_type": "product",
 *   "created_by": "26015",
 *   "created_at": "2026-01-29 09:10:13",
 *   "updated_at": "2026-01-29 11:49:31",
 *   "is_delete": "0",
 *   "lines": [
 *     {
 *       "id": "22",
 *       "discount_id": "10",
 *       "product_id": null,
 *       "category_id": null,
 *       "quantity": "0",
 *       "discount_value": "5.00",
 *       "discount_type": "percentage",
 *       "minimum_purchase": "500.00",
 *       "created_at": "2026-01-29 09:10:13",
 *       "updated_at": "2026-01-29 11:57:08"
 *     }
 *   ]
 * }
 */

export interface DiscountLine {
  id: string;
  discount_id: string;
  product_id: string | null;
  category_id: string | null;
  quantity: string;
  discount_value: string; // String from API, will parse to number
  discount_type: 'percentage' | 'amount';
  minimum_purchase: string; // String from API, will parse to number
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  business_id: string;
  name: string;
  status: string;
  applies_to_id: string;
  applies_to_type: 'product' | 'category';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_delete: string;
  lines: DiscountLine[];
}

export interface AppliedDiscount {
  discountLine: DiscountLine;
  discountValue: number; // Actual discount amount
  discountDisplay: string; // For UI display (e.g., "25%" or "$5.00")
  minimumPurchase: number;
  isApplicable: boolean;
  // NEW: Discount identifiers for API
  discountId: string; // discount.id - use for tracking/reporting
  appliesToId: string; // discount.applies_to_id - the product/category id
}

/**
 * Calculate applicable discount for a product based on purchase amount
 * Returns the best (highest) applicable discount
 * 
 * HOW IT WORKS:
 * 1. Check if discount object exists and has lines
 * 2. Calculate cart total (price × quantity)
 * 3. Filter discount lines by minimum_purchase threshold
 * 4. Find the discount with highest value (best for customer)
 * 5. Return applied discount info with display values
 * 
 * EXAMPLE:
 * price = 100
 * quantity = 5
 * cartTotal = 500
 * 
 * discount.lines = [
 *   { discount_value: "5", discount_type: "percentage", minimum_purchase: "500" }
 * ]
 * 
 * Result: discount applicable (500 >= 500)
 * discountValue = 5 (5% of 100)
 * discountDisplay = "5%"
 */
export const calculateApplicableDiscount = (
  price: number,
  quantity: number,
  discount: Discount | null | undefined
): AppliedDiscount | null => {
  // Safety check: discount must exist with lines
  if (!discount || !discount.lines || discount.lines.length === 0) {
    return null;
  }

  // Calculate total cart value for this product
  const cartTotal = price * quantity;

  // Filter applicable discounts by minimum purchase threshold
  // minimum_purchase comes as string from API, need to parse
  const applicableLines = discount.lines.filter((line) => {
    const minPurchase = parseFloat(line.minimum_purchase || '0');
    return cartTotal >= minPurchase;
  });

  // If no discounts meet minimum purchase requirement, return null
  if (applicableLines.length === 0) {
    return null;
  }

  // Find the discount with the highest value (best savings for customer)
  let bestDiscount = applicableLines[0];
  let bestValue = calculateDiscountValue(price, bestDiscount);

  for (let i = 1; i < applicableLines.length; i++) {
    const currentValue = calculateDiscountValue(price, applicableLines[i]);
    if (currentValue > bestValue) {
      bestValue = currentValue;
      bestDiscount = applicableLines[i];
    }
  }

  const minPurchase = parseFloat(bestDiscount.minimum_purchase || '0');

  return {
    discountLine: bestDiscount,
    discountValue: bestValue,
    discountDisplay:
      bestDiscount.discount_type === 'percentage'
        ? `${bestDiscount.discount_value}%`
        : `$${parseFloat(bestDiscount.discount_value).toFixed(2)}`,
    minimumPurchase: minPurchase,
    isApplicable: cartTotal >= minPurchase,
    // NEW: Include discount id and applies_to_id for API
    discountId: discount.id,
    appliesToId: discount.applies_to_id,
  };
};

/**
 * Calculate actual discount value for a single product price
 */
const calculateDiscountValue = (
  price: number,
  discountLine: DiscountLine
): number => {
  if (discountLine.discount_type === 'percentage') {
    return (price * parseFloat(discountLine.discount_value || '0')) / 100;
  } else {
    return parseFloat(discountLine.discount_value || '0');
  }
};

/**
 * Calculate final price after discount
 */
export const calculateFinalPrice = (
  price: number,
  appliedDiscount: AppliedDiscount | null
): number => {
  if (!appliedDiscount) {
    return price;
  }

  return Math.max(0, price - appliedDiscount.discountValue);
};

/**
 * Calculate cart total with discounts
 * Applies applicable discounts to each item and returns final total
 */
export const calculateCartTotalWithDiscounts = (
  cartItems: Array<{
    price: number;
    quantity: number;
    discount?: Discount | null;
  }>
): {
  subtotal: number;
  totalDiscount: number;
  total: number;
  discountBreakdown: Array<{
    itemPrice: number;
    itemDiscount: number;
    itemTotal: number;
  }>;
} => {
  let subtotal = 0;
  let totalDiscount = 0;
  const discountBreakdown = [];

  for (const item of cartItems) {
    const itemSubtotal = item.price * item.quantity;
    const appliedDiscount = calculateApplicableDiscount(
      item.price,
      item.quantity,
      item.discount
    );

    const itemDiscount = appliedDiscount ? appliedDiscount.discountValue * item.quantity : 0;
    const itemTotal = itemSubtotal - itemDiscount;

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;

    discountBreakdown.push({
      itemPrice: itemSubtotal,
      itemDiscount,
      itemTotal,
    });
  }

  return {
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
    discountBreakdown,
  };
};

/**
 * Get discount message for display
 */
export const getDiscountMessage = (appliedDiscount: AppliedDiscount | null): string => {
  if (!appliedDiscount) {
    return '';
  }

  if (appliedDiscount.isApplicable) {
    return `Save ${appliedDiscount.discountDisplay} on orders over $${appliedDiscount.minimumPurchase.toFixed(2)}`;
  }

  return `Spend $${(appliedDiscount.minimumPurchase).toFixed(2)} more to unlock ${appliedDiscount.discountDisplay} discount`;
};

/**
 * Check if product has any available discounts
 */
export const hasAnyDiscount = (discount: Discount | null | undefined): boolean => {
  return !!(discount && discount.lines && discount.lines.length > 0);
};