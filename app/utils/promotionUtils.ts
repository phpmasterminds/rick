/**
 * Promotion Utilities - Handles promotion codes and automatic business promotions
 * 
 * Features:
 * 1. Promotion code validation and application
 * 2. Automatic promotion lookup by business
 * 3. Promotion stacking with discounts/deals
 * 4. Error handling and user feedback
 */

export interface PromotionCode {
  id: string;
  code: string;
  business_id: string;
  page_id: string;  // ← Added: matches your API
  discount_type: 'percentage' | 'amount';
  discount_value: string;  // ← String from backend (e.g., "40.00")
  minimum_order_type: 'no_minimum' | 'amount' | 'products';  // ← Added
  minimum_amount: string;  // ← Added: matches minimum_order_type
  valid_from: string;  // ← Added: date when promo starts
  valid_to: string;  // ← Added: date when promo expires
  promo_code_required: string;  // ← Added: "0" or "1"
  unlimited_use: string;  // ← Added: "0" or "1"
  display_on_menu: string;  // ← Added: "0" or "1"
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
  created_by: string;
  minimum_purchase: string;
  is_delete: string;  // ← Added: "0" or "1"
}

export interface AppliedPromotion {
  promotionId?: string;
  code?: string;
  businessId?: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  discountDisplay: string; // For UI display (e.g., "25%" or "$5.00")
  minimumPurchase?: number;
  isApplicable: boolean;
  errorMessage?: string;
  source: 'manual' | 'automatic'; // Track if manual code or auto-applied
}

/**
 * Validate promotion code format (basic client-side validation)
 * Business logic validation should happen on backend
 */
export const validatePromotionCodeFormat = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  // Promotion codes are typically alphanumeric, 3-20 characters
  const codeRegex = /^[A-Z0-9]{3,20}$/i;
  return codeRegex.test(code.trim());
};

/**
 * Validate and apply promotion code
 * Calls backend API to validate the code against actual promotion data
 * 
 * Backend Response Format:
 * Success: { promotion: { id, code, business_id, page_id, discount_type, discount_value, ... } }
 * Failed: {} (empty object or falsy)
 * 
 * @param code - Promotion code entered by user
 * @param cartSubtotal - Cart subtotal amount
 * @param businessId - Single business ID or comma-separated IDs (e.g., "9398,9399")
 */
export const validateAndApplyPromotionCode = async (
  code: string,
  cartSubtotal: number,
  businessId: string
): Promise<AppliedPromotion | null> => {
  // Basic format validation
  if (!validatePromotionCodeFormat(code)) {
    return {
      discountType: 'percentage',
      discountValue: 0,
      discountDisplay: '',
      isApplicable: false,
      errorMessage: 'Invalid promotion code format. Codes must be 3-20 alphanumeric characters.',
      source: 'manual',
    };
  }

  try {
    // Call backend API to validate promotion code
    // Your endpoint: POST /api/business/promotions
    const response = await fetch('/api/business/promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        cartSubtotal,
        businessId: businessId || null,
        action: 'validate'  // Specify validation action
      }),
    });

    if (!response.ok) {
      console.error('Promotion validation API error:', response.status);
      return {
        discountType: 'percentage',
        discountValue: 0,
        discountDisplay: '',
        isApplicable: false,
        errorMessage: 'Error connecting to promotion service. Please try again.',
        source: 'manual',
      };
    }

    const data = await response.json();
    // Check if promotion data was returned
    // Backend returns promotion data directly (not wrapped in data.promotion)
    // Empty response = {} or null means code not found
    if (!data || Object.keys(data).length === 0 || !data.data.id) {
      return {
        discountType: 'percentage',
        discountValue: 0,
        discountDisplay: '',
        isApplicable: false,
        errorMessage: 'Promotion code is invalid or expired.',
        source: 'manual',
      };
    }

    // Promotion data returned directly from backend
    const promotion = data.data as PromotionCode;

    // Calculate discount value based on type and current subtotal
    const discountValue = calculatePromotionDiscount(
      cartSubtotal,
      promotion.discount_type,
      parseFloat(promotion.discount_value)  // Backend returns as string
    );

    // Determine minimum purchase requirement
    const minimumPurchase = promotion.minimum_order_type === 'no_minimum' 
      ? 0 
      : parseFloat(promotion.minimum_amount || '0');

    // Check if code is currently applicable
    const isApplicable = cartSubtotal >= minimumPurchase;

    // Check if code is valid and active
    if (promotion.status !== 'active') {
      return {
        discountType: promotion.discount_type as 'percentage' | 'amount',
        discountValue: 0,
        discountDisplay: '',
        isApplicable: false,
        errorMessage: 'Promotion code is no longer active.',
        source: 'manual',
      };
    }

    // Check if code has expired
    if (promotion.valid_to) {
      const expiryDate = new Date(promotion.valid_to);
      if (expiryDate < new Date()) {
        return {
          discountType: promotion.discount_type as 'percentage' | 'amount',
          discountValue: 0,
          discountDisplay: '',
          isApplicable: false,
          errorMessage: 'Promotion code has expired.',
          source: 'manual',
        };
      }
    }

    // Return applied promotion
    return {
      promotionId: promotion.id,
      code: promotion.code,
      businessId: promotion.business_id,
      discountType: promotion.discount_type as 'percentage' | 'amount',
      discountValue,
      discountDisplay:
        promotion.discount_type === 'percentage'
          ? `${promotion.discount_value}%`
          : `$${parseFloat(promotion.discount_value).toFixed(2)}`,
      minimumPurchase,
      isApplicable,
      source: 'manual',
    };

  } catch (error) {
    console.error('Error validating promotion code:', error);
    return {
      discountType: 'percentage',
      discountValue: 0,
      discountDisplay: '',
      isApplicable: false,
      errorMessage: 'Error connecting to promotion service. Please try again.',
      source: 'manual',
    };
  }
};

/**
 * Calculate promotion discount value
 */
const calculatePromotionDiscount = (
  subtotal: number,
  discountType: 'percentage' | 'amount',
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return (subtotal * discountValue) / 100;
  } else {
    return discountValue;
  }
};

/**
 * Fetch automatic promotions for a business
 * Applied automatically on page load, no code needed
 * 
 * Call this when component mounts or cart changes
 */
export const fetchBusinessPromotions = async (
  businessId: string,
  cartSubtotal: number
): Promise<AppliedPromotion | null> => {
  try {
    const response = await fetch(
      `/api/promotions/auto?businessId=${businessId}&subtotal=${cartSubtotal}`
    );

   

    const data = await response.json();

    if (data.success && data.promotion) {
      const promotion = data.promotion as PromotionCode;
      const discountValue = calculatePromotionDiscount(
        cartSubtotal,
        promotion.discount_type,
        parseFloat(promotion.discount_value)  // Convert string to number
      );

      return {
        promotionId: promotion.id,
        businessId: promotion.business_id,
        discountType: promotion.discount_type,
        discountValue,
        discountDisplay:
          promotion.discount_type === 'percentage'
            ? `${promotion.discount_value}%`
            : `$${parseFloat(promotion.discount_value).toFixed(2)}`,
        minimumPurchase: promotion.minimum_order_type === 'no_minimum' ? 0 : parseFloat(promotion.minimum_amount || '0'),
		isApplicable: cartSubtotal >= (promotion.minimum_order_type === 'no_minimum' ? 0 : parseFloat(promotion.minimum_amount || '0')),
        source: 'automatic',
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching automatic promotions:', error);
    return null;
  }
};

/**
 * Fetch all available promotions for a business (for display purposes)
 * Shows customers what promotions they can use
 */
export const fetchAvailablePromotions = async (
  businessId: string
): Promise<PromotionCode[]> => {
  try {
    const response = await fetch(`/api/promotions/available?businessId=${businessId}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.promotions || [];
  } catch (error) {
    console.error('Error fetching available promotions:', error);
    return [];
  }
};

/**
 * Calculate total savings from promotion (similar to discount/deal)
 */
export const calculatePromotionSavings = (
  promotion: AppliedPromotion | null,
  quantity: number = 1
): number => {
  if (!promotion || !promotion.isApplicable) {
    return 0;
  }
  return promotion.discountValue * quantity;
};

/**
 * Get promotion message for display
 */
export const getPromotionMessage = (promotion: AppliedPromotion | null): string => {
  if (!promotion) {
    return '';
  }

  if (!promotion.isApplicable) {
    if (promotion.minimumPurchase) {
      const needed = promotion.minimumPurchase;
      return `Spend $${needed.toFixed(2)} more to unlock ${promotion.discountDisplay} promotion`;
    }
    return 'Promotion code not applicable';
  }

  if (promotion.source === 'automatic') {
    return `🎉 Automatic promotion applied: Save ${promotion.discountDisplay}`;
  }

  return `✅ Promotion code ${promotion.code} applied: Save ${promotion.discountDisplay}`;
};

/**
 * Check if promotion should be removed (e.g., if minimum purchase no longer met)
 */
export const shouldRemovePromotion = (
  promotion: AppliedPromotion | null,
  newCartSubtotal: number
): boolean => {
  if (!promotion || !promotion.minimumPurchase) {
    return false;
  }

  return newCartSubtotal < promotion.minimumPurchase;
};

/**
 * Combine all savings (discounts + deals + promotions)
 * For total savings display in cart
 */
export const calculateTotalSavings = (
  discountAmount: number,
  promotionAmount: number
): { total: number; breakdown: string } => {
  const total = discountAmount + promotionAmount;

  let breakdown = '';
  if (discountAmount > 0) {
    breakdown += `Discounts & Deals: $${discountAmount.toFixed(2)}`;
  }
  if (promotionAmount > 0) {
    if (breakdown) breakdown += ' + ';
    breakdown += `Promotions: $${promotionAmount.toFixed(2)}`;
  }

  return { total, breakdown };
};