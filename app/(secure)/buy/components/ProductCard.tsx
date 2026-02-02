'use client';

import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useShopCart } from '@/app/contexts/ShopCartContext';
import { toast } from 'react-toastify';
import {
  calculateApplicableDiscount,
  calculateFinalPrice,
  type Discount,
  type AppliedDiscount,
} from '@/app/utils/discountUtils';

interface ProductCardProps {
  product: any;
  discount?: Discount | null;
  onViewDetails: (product: any) => void;
  onFavorite?: (productId: string) => void;
}

export default function ProductCard({
  product,
  discount,
  onViewDetails,
  onFavorite,
}: ProductCardProps) {
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const { addToCart } = useShopCart();

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(product.product_id);
    }
  };

  // Quick add to cart with quantity 1
  // Handles both traditional discount and deal (i_deals)
  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);

    try {
		alert('c');
      const basePrice = parseFloat(product.i_price || '0');
      
      // Calculate discount + deal (automatically stacks if both exist)
      const appliedDiscount = calculateApplicableDiscount(
        basePrice,
        1,
        discount,
        product.i_deals  // Deal string: "10%", "$5", etc.
      );
      
      const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);

      const cartItem = {
        cartItemId: `${product.product_id}_${Date.now()}`,
        productId: product.product_id,
        productName: product.name,
        brand: product.cat_name,
        basePrice: basePrice,              // Original price BEFORE discount/deal
        price: finalPrice,                 // Final price AFTER discount/deal
        quantity: 1,
        imageUrl: product.image_url,
        business: product.business || 'Nature\'s High',
        discount: discount || undefined,   // Discount object
        dealString: product.i_deals || undefined,  // Deal string ("10%" or "$5")
        appliedDiscount: appliedDiscount || undefined,  // Full calculation result
      };
	  //console.log('product.i_deals'+product.i_deals);

     // addToCart(cartItem);
      
      // Show success message with savings info if applicable
      const savingsText = appliedDiscount && appliedDiscount.isApplicable 
        ? ` - Save ${appliedDiscount.discountDisplay}!`
        : '';
      toast.success(`Added 1 ${product.name} to cart!${savingsText}`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const basePrice = parseFloat(product.i_price || '0');
  
  // Calculate applicable discount + deal
  // If both exist, they automatically stack
  console.log(product.i_deals+'i_deals');
  const appliedDiscount = calculateApplicableDiscount(
    basePrice,
    1,
    discount,
    product.i_deals
  );
  
  const finalPrice = appliedDiscount ? calculateFinalPrice(basePrice, appliedDiscount) : basePrice;
  const imageUrl = product.image_url || '/images/placeholder-product.png';

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col"
    >
      <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {product.is_safe && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
            {product.is_safe}
          </div>
        )}

        {/* Discount/Deal Badge - Shows discount, deal, or both stacked */}
        {appliedDiscount && appliedDiscount.isApplicable && (
          <div className={`absolute top-2 right-2 text-white text-xs font-bold px-3 py-2 rounded shadow-lg border-2 ${
            appliedDiscount.source === 'deal' 
              ? 'bg-orange-600 border-orange-700'
              : appliedDiscount.source === 'combined'
              ? 'bg-red-600 border-red-700'
              : 'bg-green-600 border-green-700'
          }`}>
            <div className="text-center">
              <div className="text-lg font-bold">{appliedDiscount.discountDisplay}</div>
              <div className="text-xs">OFF</div>
              {appliedDiscount.source === 'deal' && (
                <div className="text-xs font-semibold mt-1">🎉 DEAL</div>
              )}
              {appliedDiscount.source === 'discount' && (
                <div className="text-xs font-semibold mt-1">💰 SAVE</div>
              )}
              {appliedDiscount.source === 'combined' && (
                <div className="text-xs font-semibold mt-1">🎊 COMBO</div>
              )}
            </div>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-2">
          {/* Quick Add Button */}
          <button
            onClick={handleQuickAddToCart}
            disabled={isAdding || parseInt(product.i_onhand || '0') === 0}
            className="w-10 h-10 rounded-full bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 text-white flex items-center justify-center transition-all shadow-lg hover:scale-110 disabled:scale-100"
            title="Quick add to cart"
          >
            <ShoppingCart size={18} />
          </button>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-700/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 transition-all"
            title="Add to favorites"
          >
            <Heart
              size={18}
              className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}
            />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {product.cat_name || 'Category'}
        </div>

        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
          {product.name}
        </h3>

        {(product.thc || product.cbd) && (
          <div className="flex gap-2 text-xs flex-wrap">
            {product.thc && (
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                THC: {product.thc}%
              </span>
            )}
            {product.cbd && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                CBD: {product.cbd}%
              </span>
            )}
          </div>
        )}

        {/* PRICING DISPLAY - Prominent with strikethrough for discounted price */}
        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-1">
            {appliedDiscount && appliedDiscount.isApplicable ? (
              <>
                {/* Show strikethrough original price */}
                <span 
                  style={{ textDecoration: 'line-through' }}
                  className="text-sm text-gray-400 dark:text-gray-500 font-medium"
                >
                  ${basePrice.toFixed(2)}
                </span>
                {/* Show final price prominently */}
                <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  ${finalPrice.toFixed(2)}
                </span>
                {/* Show savings amount */}
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                  Save ${appliedDiscount.discountValue.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                ${basePrice.toFixed(2)}
              </span>
            )}

            {product.med_measurements && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.med_measurements}
              </span>
            )}
          </div>
        </div>

        {product.i_onhand && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {product.i_onhand} in stock
          </div>
        )}
      </div>
    </div>
  );
}