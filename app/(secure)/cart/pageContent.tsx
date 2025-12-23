'use client';

import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useShopCart } from "../../contexts/ShopCartContext";
import axios from "axios";
import Cookies from 'js-cookie';
import CartItemsByBusiness from './components/CartItemsByBusiness';
import CartSummary from './components/CartSummary';
import { toast } from 'react-toastify';

export default function PageContent() {

  const {
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
  } = useShopCart();

  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // ✨ FIX: Provide default value for undefined business
  const itemsByBusiness = cartItems.reduce(
    (acc, item) => {
      const business = item.business || "Nature's High";
      if (!acc[business]) {
        acc[business] = [];
      }
      acc[business].push(item);
      return acc;
    },
    {} as Record<string, typeof cartItems>
  );

  // ✨ Get page_id from cart items (all items should have same page_id or we handle multi-page orders)
  const getPageIdsFromCart = () => {
    const pageIds = new Set(cartItems.map(item => item.page_id).filter(Boolean));
    return Array.from(pageIds);
  };

  const pageIds = getPageIdsFromCart();

  const cartTotal = getCartTotal();
  const itemCount = getCartItemsCount();
  const businessCount = Object.keys(itemsByBusiness).length;

  // ✨ Log page IDs from cart for debugging
  console.log('🔍 Page IDs from cart items:', pageIds);
  console.log('📦 Cart items for reference:', cartItems);

  const handleCheckout = async () => {
    // ✨ Validation: Ensure all cart items have page_id
    if (!pageIds || pageIds.length === 0) {
      toast.error('Cart items are missing page_id. Please contact support.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setIsCheckoutProcessing(true);

    try {
      // ✨ Extract vanity_url from cookie (the business identifier)
      const vanityUrl = Cookies.get('vanity_url') || null;

      if (!vanityUrl) {
        toast.error('Business identifier (vanity_url) not found. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setIsCheckoutProcessing(false);
        return;
      }

      // ✨ Extract business_user_id from first item (or use page_id as fallback)
      const businessUserIdMap = new Map<string, string | null>();
      cartItems.forEach(item => {
        const pageIdKey = String(item.page_id);
        if (item.page_id && !businessUserIdMap.has(pageIdKey)) {
          businessUserIdMap.set(pageIdKey, item.business_user_id ? String(item.business_user_id) : null);
        }
      });

      // ✨ Prepare checkout payload with all cart items and their page_ids
      const checkoutPayload = {
        items: cartItems.map(item => ({
          id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
          business: vanityUrl, // ✨ Use vanity_url from cookie as business identifier
          product_id: item.productId,
          page_id: item.page_id, // ✨ Each item carries its own page_id
          business_user_id: item.business_user_id, // ✨ Each item carries its own business_user_id
          is_sample: item.is_sample,
          sample_order: item.sample_order,
          total: item.quantity * item.price,
          med_image: item.med_image,
        })),
        summary: {
          itemCount,
          businessCount,
          totalAmount: cartTotal,
          currency: 'USD',
        },
        vanity_url: vanityUrl, // ✨ Top-level business identifier
        page_ids: pageIds, // ✨ Array of all page_ids in the order
        business_user_ids: Object.fromEntries(businessUserIdMap), // ✨ Map of page_id -> business_user_id
        order_notes: orderNotes,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Checkout payload:', checkoutPayload);
      console.log('🎯 Business User ID Map:', Object.fromEntries(businessUserIdMap));
      console.log('🏪 Vanity URL (Business):', vanityUrl);

      // Send checkout request to your API
      const response = await axios.post('/api/business/master-catalog-cart', checkoutPayload);

      const result = response.data;
      
      toast.success('Order placed successfully! You will be redirected to payment.', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      clearCart();
      
      // Optional: Redirect to payment or order confirmation page
      // window.location.href = result.redirectUrl || '/order-confirmation';
    } catch (error) {
      console.error('❌ Checkout error:', error);
      toast.error('Failed to process checkout. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="mb-8">
          <Link
            href="/buy"
            className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 hover:underline mb-4"
          >
            <ArrowLeft size={18} />
            Back to Shop
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Your Cart
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your cart items
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ShoppingCart size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some products to get started with your order
            </p>
            <Link
              href="/buy"
              className="inline-block accent-bg accent-hover text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="mb-8">
        <Link
          href="/buy"
          className="inline-flex items-center gap-2 accent-bg accent-hover mb-4"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Your Cart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage your items
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(itemsByBusiness).map(([businessName, items]) => (
            <CartItemsByBusiness
              key={businessName}
              business={businessName}
              items={items}
              onUpdateQuantity={updateCartItemQuantity}
              onRemove={removeFromCart}
            />
          ))}

          {/* ✨ Order Notes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Notes
            </h3>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value.slice(0, 500))}
              placeholder="Add any special instructions or delivery notes for your order..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {orderNotes.length}/500 characters
            </p>
          </div>
        </div>

        <div>
          <CartSummary
            cartTotal={cartTotal}
            itemCount={itemCount}
            businessCount={businessCount}
            onCheckout={handleCheckout}
            onClear={clearCart}
            isProcessing={isCheckoutProcessing}
          />
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By clicking Checkout above, you agree to our{' '}
          <a href="#" className="text-accent-600 dark:text-accent-400 hover:underline">
            Terms of Service
          </a>{' '}
          including any applicable{' '}
          <a href="#" className="text-accent-600 dark:text-accent-400 hover:underline">
            cannabis regulations
          </a>
        </p>
      </div>
    </div>
  );
}