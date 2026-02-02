/**
 * Discount Utilities - Matches Actual API Response Format
 * Handles all discount calculation and logic, plus product deals (i_deals)
 * 
 * FIX APPLIED:
 * 1. Added dealValue and dealDisplay to AppliedDiscount interface
 * 2. Added plain number parsing to parseDealString (e.g., "100" = $100)
 * 3. Updated calculateApplicableDiscount to set dealValue and dealDisplay
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
 * 
 * Deal (i_deals) Examples:
 * product.i_deals = "10%" or "$5" or "100" or "10.5%" or "$5.50"
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
  discountLine?: DiscountLine;
  discountValue: number; // Actual discount amount
  discountDisplay: string; // For UI display (e.g., "25%" or "$5.00")
  minimumPurchase?: number;
  isApplicable: boolean;
  // NEW: Discount identifiers for API
  discountId?: string; // discount.id - use for tracking/reporting
  appliesToId?: string; // discount.applies_to_id - the product/category id
  // NEW: Deal information
  source?: 'discount' | 'deal' | 'combined'; // Track if from discount, deal, or both
  // FIXED: Added these fields (missing before!)
  dealValue?: number; // Just the deal part
  dealDisplay?: string; // Just the deal display
}

/**
 * Parse deal string from i_deals field
 * 
 * FIXED: Now handles plain numbers like "100"
 * 
 * Formats supported:
 * - "10%" → 10% off
 * - "$5" → $5 off
 * - "100" → $100 off (FIXED!)
 * - "15.5%" → 15.5% off
 * - "$5.50" → $5.50 off
 */
export const parseDealString = (
  dealString: string | null | undefined
): { value: number; type: 'percentage' | 'amount' } | null => {
  if (!dealString || typeof dealString !== 'string') {
    return null;
  }

  const trimmed = dealString.trim();

  // Check for percentage format: "10%", "10.5%"
  if (trimmed.endsWith('%')) {
    const valueStr = trimmed.slice(0, -1).trim();
    const value = parseFloat(valueStr);
    if (!isNaN(value) && value > 0) {
      return { value, type: 'percentage' };
    }
  }

  // Check for dollar amount format: "$5", "$5.00"
  if (trimmed.startsWith('$')) {
    const valueStr = trimmed.slice(1).trim();
    const value = parseFloat(valueStr);
    if (!isNaN(value) && value > 0) {
      return { value, type: 'amount' };
    }
  }

  // FIXED: Check for plain number format: "100", "5.50"
  // Treat plain numbers as dollar amounts
  const plainValue = parseFloat(trimmed);
  if (!isNaN(plainValue) && plainValue > 0) {
    return { value: plainValue, type: 'amount' };
  }

  return null;
};

/**
 * Calculate discount value from deal info
 */
const calculateDealValue = (
  price: number,
  dealInfo: { value: number; type: 'percentage' | 'amount' }
): number => {
  if (dealInfo.type === 'percentage') {
    return (price * dealInfo.value) / 100;
  } else {
    return dealInfo.value;
  }
};

/**
 * Calculate applicable discount for a product based on purchase amount
 * Returns the best (highest) applicable discount
 * 
 * Supports both traditional discounts and product deals (i_deals)
 * If both exist, they stack for maximum savings
 */
export const calculateApplicableDiscount = (
  price: number,
  quantity: number,
  discount: Discount | null | undefined,
  dealString?: string | null
): AppliedDiscount | null => {
  let appliedDiscount: AppliedDiscount | null = null;

  // ==================== TRADITIONAL DISCOUNT ====================
  if (discount && discount.lines && discount.lines.length > 0) {
    // Calculate total cart value for this product
    const cartTotal = price * quantity;

    // Filter applicable discounts by minimum purchase threshold
    const applicableLines = discount.lines.filter((line) => {
      const minPurchase = parseFloat(line.minimum_purchase || '0');
      return cartTotal >= minPurchase;
    });

    // If discounts meet minimum purchase requirement
    if (applicableLines.length > 0) {
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

      appliedDiscount = {
        discountLine: bestDiscount,
        discountValue: bestValue,
        discountDisplay:
          bestDiscount.discount_type === 'percentage'
            ? `${bestDiscount.discount_value}%`
            : `$${parseFloat(bestDiscount.discount_value).toFixed(2)}`,
        minimumPurchase: minPurchase,
        isApplicable: cartTotal >= minPurchase,
        discountId: discount.id,
        appliesToId: discount.applies_to_id,
        source: 'discount',
      };
    }
  }

  // ==================== PRODUCT DEAL (i_deals) ====================
  const dealInfo = parseDealString(dealString);
  if (dealInfo) {
    // FIXED: Calculate deal value first
    const dealValue = calculateDealValue(price, dealInfo);
    const dealDisplay =
      dealInfo.type === 'percentage'
        ? `${dealInfo.value}%`
        : `$${dealInfo.value.toFixed(2)}`;

    if (dealValue > 0) {
      if (!appliedDiscount) {
        // No traditional discount, use deal only
        appliedDiscount = {
          discountValue: dealValue,
          discountDisplay: dealDisplay,
          isApplicable: true,
          source: 'deal',
          // FIXED: Set dealValue and dealDisplay
          dealValue: dealValue,
          dealDisplay: dealDisplay,
        };
      } else {
        // Both discount and deal exist - stack them for maximum savings
        appliedDiscount.discountValue += dealValue;
        appliedDiscount.discountDisplay = `${appliedDiscount.discountDisplay} + ${dealDisplay}`;
        appliedDiscount.source = 'combined';
        // FIXED: Set dealValue and dealDisplay
        appliedDiscount.dealValue = dealValue;
        appliedDiscount.dealDisplay = dealDisplay;
      }
    }
  }

  return appliedDiscount || null;
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
  if (!appliedDiscount || !appliedDiscount.isApplicable) {
    return price;
  }

  return Math.max(0, price - appliedDiscount.discountValue);
};

/**
 * Calculate cart total with discounts and deals
 * Applies applicable discounts and deals to each item and returns final total
 */
export const calculateCartTotalWithDiscounts = (
  cartItems: Array<{
    price: number;
    quantity: number;
    discount?: Discount | null;
    dealString?: string | null;
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
      item.discount,
      item.dealString
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
 * Handles discounts, deals, and combined offers
 */
export const getDiscountMessage = (appliedDiscount: AppliedDiscount | null): string => {
  if (!appliedDiscount) {
    return '';
  }

  if (appliedDiscount.source === 'deal') {
    return `🎉 Special deal available: Save ${appliedDiscount.discountDisplay}`;
  }

  if (appliedDiscount.source === 'combined') {
    return `🎊 Combined savings: ${appliedDiscount.discountDisplay}`;
  }

  // Traditional discount
  if (appliedDiscount.isApplicable) {
    return `💰 Save ${appliedDiscount.discountDisplay} on orders over $${(appliedDiscount.minimumPurchase || 0).toFixed(2)}`;
  }

  return `Spend $${(appliedDiscount.minimumPurchase || 0).toFixed(2)} more to unlock ${appliedDiscount.discountDisplay} discount`;
};

/**
 * Check if product has any available discounts
 */
export const hasAnyDiscount = (discount: Discount | null | undefined): boolean => {
  return !!(discount && discount.lines && discount.lines.length > 0);
};

/**
 * Check if product has any deal
 */
export const hasAnyDeal = (dealString: string | null | undefined): boolean => {
  return parseDealString(dealString) !== null;
};

/**
 * Get discount source badge text for UI
 */
export const getDiscountSourceBadgeText = (
  source?: 'discount' | 'deal' | 'combined'
): string => {
  switch (source) {
    case 'deal':
      return 'DEAL';
    case 'combined':
      return 'COMBO';
    case 'discount':
    default:
      return 'SAVE';
  }
};

/**
 * Get discount source badge color classes
 */
export const getDiscountSourceBadgeColor = (
  source?: 'discount' | 'deal' | 'combined'
): string => {
  switch (source) {
    case 'deal':
      return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300';
    case 'combined':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
    case 'discount':
    default:
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
  }
};