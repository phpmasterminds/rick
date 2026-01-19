// ============================================================================
// FINAL COMPLETE CODE - ProductModal.tsx
// ============================================================================
// File: /components/ProductModal.tsx
// Purpose: Product display with multi-dispensary cart management
// Features:
//   - User login requirement
//   - Dispensary conflict detection and confirmation
//   - Quantity selection
//   - Product navigation
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { X, Leaf, ChevronLeft, ChevronRight, Plus, Minus, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  addToCart,
  checkDispensaryConflict,
  replaceCartWithNewDispensary,
  getCurrentCartDispensaryId,
  getCart,
} from '@/utils/cartUtils';
import Cookies from 'js-cookie';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MedicineProduct {
  product_id: string;
  name: string;
  cat_name: string;
  value1: string;
  value2: string;
  med_image_url?: string | null;
  med_image?: string | null;
  med_img?: string | null;
  thc?: string;
  cbd?: string;
  terepenes?: string;
  strain?: string;
  business_name?: string;
  brand_name?: string | null;
  [key: string]: any;
}

interface Dispensary {
  id: string;
  name: string;
  address?: string;
}

interface ProductModalProps {
  selectedProduct: MedicineProduct | null;
  dispensary: Dispensary;
  medicineProducts: MedicineProduct[];
  selectedProductIndex: number;
  isPreview: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProductModal({
  selectedProduct,
  dispensary,
  medicineProducts,
  selectedProductIndex,
  isPreview,
  onClose,
  onPrevious,
  onNext,
}: ProductModalProps) {
  // ========== STATE ==========
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [showDispensaryConfirm, setShowDispensaryConfirm] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [currentCartDispensary, setCurrentCartDispensary] = useState<string | null>(null);

  // ========== EFFECTS ==========
  
  // ✅ Check if user is logged in by checking user_id cookie
  useEffect(() => {
    const userId = Cookies.get('user_id');
    setIsUserLoggedIn(!!userId);
  }, []);

  // ========== EARLY RETURN ==========
  
  if (!selectedProduct) return null;

  // ========== HANDLERS ==========
  /**
   * Main add to cart handler
   * Checks: login, quantity, dispensary conflict
   */
  const handleAddToCart = async () => {
    // ✅ Check if user is logged in
    const userId = Cookies.get('user_id');

    if (!userId) {
      // ✅ Show login popup if not logged in
      setShowLoginPopup(true);
      toast.warning('Please login to add items to cart', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    if (quantity <= 0) {
      toast.warning('Please select a valid quantity');
      return;
    }

    // ✅ Check for dispensary conflict
    const { canAdd, currentDispensaryId } = checkDispensaryConflict(dispensary.id);

    if (!canAdd) {
      // Show confirmation modal for different dispensary
      // Get current cart to find dispensary NAME (not ID)
      const currentCart = getCart();
      const currentDispensaryName = currentCart.length > 0 ? currentCart[0].dispensary_name : 'Your previous dispensary';
      
      setCurrentCartDispensary(currentDispensaryName);
      setPendingProduct({
        product_id: selectedProduct.product_id,
        name: selectedProduct.name,
        value2: selectedProduct.value2,
        value1: selectedProduct.value1,
        med_image_url: selectedProduct.med_image_url,
        med_image: selectedProduct.med_image,
        med_img: selectedProduct.med_img,
      });
      setPendingQuantity(quantity);
      setShowDispensaryConfirm(true);
      return;
    }

    // ✅ Same dispensary or cart is empty - proceed with adding
    await proceedAddToCart(quantity);
  };

  /**
   * Actually add the product to cart
   */
  const proceedAddToCart = async (qty: number) => {
    setIsAdding(true);
    try {
      const cartItem = addToCart(
        {
          product_id: selectedProduct.product_id,
          name: selectedProduct.name,
          value2: selectedProduct.value2,
          value1: selectedProduct.value1,
          med_image_url: selectedProduct.med_image_url,
          med_image: selectedProduct.med_image,
          med_img: selectedProduct.med_img,
        },
        {
          id: dispensary.id,
          name: dispensary.name,
        },
        qty
      );

      toast.success(`${qty} × ${selectedProduct.name} added to cart!`, {
        position: 'bottom-right',
        autoClose: 3000,
      });

      // Reset quantity
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Handle dispensary switch confirmation
   */
  const handleConfirmDispensarySwitch = async () => {
    if (!pendingProduct) return;

    setShowDispensaryConfirm(false);
    setIsAdding(true);

    try {
      // Clear cart and add item from new dispensary
      replaceCartWithNewDispensary(
        pendingProduct,
        {
          id: dispensary.id,
          name: dispensary.name,
        },
        pendingQuantity
      );

      toast.success(
        `Cart cleared. ${pendingQuantity} × ${pendingProduct.name} added from ${dispensary.name}!`,
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      // Reset state
      setQuantity(1);
      setPendingProduct(null);
      setPendingQuantity(1);
    } catch (error) {
      console.error('Error switching dispensary:', error);
      toast.error('Failed to update cart');
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Quantity controls
   */
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // ========== CALCULATIONS ==========
  
  const price = parseFloat(selectedProduct.value2);
  // ========== RENDER ==========
console.log(selectedProduct);
console.log(selectedProduct.med_image);
console.log(selectedProduct.cbd);
  return (
    <>
      {/* ===== MAIN PRODUCT MODAL ===== */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative dark:bg-gray-900">
          
          {/* Modal Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-bold dark:text-white">{selectedProduct.name}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
          {/* Modal Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* ===== LEFT: PRODUCT IMAGE & NAVIGATION ===== */}
            <div className="flex flex-col gap-4">
              {/* Product Image */}
              <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                {selectedProduct.med_image || selectedProduct.med_image_url || selectedProduct.med_img ? (
                  <img
                    src={(selectedProduct.med_image || selectedProduct.med_image_url || selectedProduct.med_img) as string}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="w-24 h-24 text-gray-400 dark:text-gray-600" />
                )}
              </div>
            </div>

            {/* ===== RIGHT: PRODUCT DETAILS & ACTIONS ===== */}
            <div className="flex flex-col gap-4">
              {/* Product Name & Details */}
              <div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.cat_name}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {selectedProduct.strain && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Strain</p>
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">{selectedProduct.strain}</p>
                    </div>
                  )}

                  {selectedProduct.thc && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">THC</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedProduct.thc}%</p>
                    </div>
                  )}

                  {selectedProduct.cbd && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">CBD</p>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-200">{selectedProduct.cbd}%</p>
                    </div>
                  )}

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Unit</p>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">{selectedProduct.value1}</p>
                  </div>
                </div>

                {/* Brand */}
                {selectedProduct.brand_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Brand:</strong> {selectedProduct.brand_name}
                  </p>
                )}

                {/* Dispensary */}
                <div>
                  <p className="text-lg font-semibold dark:text-white">{dispensary.name}</p>
                </div>
              </div>

           
              {/* Price & Quantity */}
              <div className="space-y-4">
                {/* Price */}
                {isPreview !== '1' && (
                  <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    per {selectedProduct.value1}
                  </span>
                  </div>
                )}


                {/* Quantity Selector */}
                {isPreview !== '1' && (
                      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              if (val > 0) setQuantity(val);
                            }}
                            className="w-16 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 px-2 py-1"
                            min="1"
                          />
                          <button
                            onClick={incrementQuantity}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                            ${(price * quantity).toFixed(2)} total
                          </span>
                        </div>
                      </div>
				        )}

                {/* Add to Cart Button */}
                {isPreview !== '1' && (
                  <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isAdding ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            Add {quantity} to Cart
                          </>
                        )}
                  </button>
                )}
                
              </div>              
            </div>
              {/* Description */}
              {selectedProduct.text_parsed && (
                <div className="mt-2 pt-2 dark:border-slate-700">
                  <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {selectedProduct.text_parsed}
                  </p>
                </div>
              )}

              {selectedProduct.description && (
                <div className="mt-2 pt-2 dark:border-slate-700">
                    <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedProduct.description}
                    </p>
                </div>
              )}
          </div>

          {/* Modal Footer - Navigation */}
            <div className="sticky bottom-0 flex items-center justify-between p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={onPrevious}
                disabled={selectedProductIndex <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {selectedProductIndex + 1} of {medicineProducts.length}
              </span>

              <button
                onClick={onNext}
                disabled={selectedProductIndex >= medicineProducts.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
        </div>
      </div>

      {/* ===== LOGIN POPUP MODAL ===== */}
      {showLoginPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowLoginPopup(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-50 to-slate-50 dark:from-teal-900/20 dark:to-slate-900/20 px-6 py-6 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Login Required</h2>
                </div>
                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  You need to be logged in to add items to your cart. Please login or create an account to continue shopping.
                </p>

                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                  <p className="text-sm text-teal-900 dark:text-teal-200 font-semibold">
                    Why login?
                  </p>
                  <ul className="text-xs text-teal-800 dark:text-teal-300 mt-2 space-y-1 ml-2">
                    <li>✓ Save your cart</li>
                    <li>✓ Faster checkout</li>
                    <li>✓ Track your orders</li>
                    <li>✓ Manage preferences</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <a
                  href="/login"
                  className="block w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Go to Login
                </a>

                <a
                  href="/register"
                  className="block w-full bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-900 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Create Account
                </a>

                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="w-full text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== MULTI-DISPENSARY CONFIRMATION MODAL ===== */}
      {showDispensaryConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={() => setShowDispensaryConfirm(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Header with Icon */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-6 py-6 border-b border-amber-200 dark:border-amber-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Different Dispensary</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Switch to a new dispensary?</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Current vs New Dispensary */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your cart currently has items from <strong className="text-amber-900 dark:text-amber-200">{currentCartDispensary}</strong>.
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Adding from <strong className="text-amber-900 dark:text-amber-200">{dispensary.name}</strong> will clear your current cart.
                  </p>
                </div>

                {/* What Will Happen */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                    This action will:
                  </p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-2">
                    <li>✓ Remove all items from current cart</li>
                    <li>✓ Add {pendingQuantity} × {pendingProduct?.name}</li>
                    <li>✓ Start fresh with {dispensary.name}</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3 flex flex-col gap-2">
                <button
                  onClick={handleConfirmDispensarySwitch}
                  disabled={isAdding}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      Yes, Switch Dispensary
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowDispensaryConfirm(false);
                    setPendingProduct(null);
                    setPendingQuantity(1);
                  }}
                  disabled={isAdding}
                  className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// END OF ProductModal.tsx
// ============================================================================