// ProductModal.tsx - Enhanced with real-time cart updates
'use client';

import React, { useState, useEffect } from 'react';
import { X, Leaf, ChevronLeft, ChevronRight, Plus, Minus, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart } from '@/utils/cartUtils';
import Cookies from 'js-cookie';

interface MedicineProduct {
  med_id: string;
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
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ProductModal({
  selectedProduct,
  dispensary,
  medicineProducts,
  selectedProductIndex,
  onClose,
  onNext,
  onPrevious,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // ✅ Check if user is logged in by checking user_id cookie
  useEffect(() => {
    const userId = Cookies.get('user_id');
    setIsUserLoggedIn(!!userId);
  }, []);

  if (!selectedProduct) return null;

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

    setIsAdding(true);
    try {
      const cartItem = addToCart(
        {
          med_id: selectedProduct.med_id,
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
        quantity
      );

      toast.success(
        `${quantity} × ${selectedProduct.name} added to cart!`,
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );

      // ✅ Dispatch custom event to notify other components of cart update
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: currentCart }));

      // Reset quantity
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const price = parseFloat(selectedProduct.value2);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Product Image */}
            <div className="flex flex-col gap-4">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {selectedProduct.med_image_url || selectedProduct.med_img ? (
                  <img
                    src={(selectedProduct.med_image_url || selectedProduct.med_img) as string}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="w-24 h-24 text-gray-300" />
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">{selectedProduct.cat_name}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedProduct.name}
                </h2>

                {/* Price and Unit */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-teal-600">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-600">/ {selectedProduct.value1}</span>
                </div>

                {/* Brand */}
                {selectedProduct.brand_name && (
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Brand:</strong> {selectedProduct.brand_name}
                  </p>
                )}
              </div>

              {/* Cannabinoid Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProduct.thc && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">THC</p>
                    <p className="text-xl font-bold text-green-700">
                      {selectedProduct.thc}%
                    </p>
                  </div>
                )}
                {selectedProduct.cbd && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">CBD</p>
                    <p className="text-xl font-bold text-blue-700">
                      {selectedProduct.cbd}%
                    </p>
                  </div>
                )}
                {selectedProduct.terepenes && (
                  <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Terpenes</p>
                    <p className="text-sm text-purple-700">{selectedProduct.terepenes}</p>
                  </div>
                )}
              </div>

              {/* Strain Info */}
              {selectedProduct.strain && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Strain:</strong> {selectedProduct.strain}
                  </p>
                </div>
              )}

              {/* Business Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Sold By</h3>
                <p className="text-sm text-gray-700">{dispensary?.name}</p>
                {dispensary?.address && (
                  <p className="text-xs text-gray-600 mt-1">{dispensary.address}</p>
                )}
              </div>

              {/* Quantity Selector and Add to Cart */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-900 block mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 ml-auto">
                      ${(price * quantity).toFixed(2)} total
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-4 rounded-lg mb-4 transition-colors flex items-center justify-center gap-2"
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
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onPrevious}
              disabled={selectedProductIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Previous</span>
            </button>

            <span className="text-sm text-gray-600">
              {selectedProductIndex + 1} of {medicineProducts.length}
            </span>

            <button
              onClick={onNext}
              disabled={selectedProductIndex >= medicineProducts.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Login Popup Modal */}
      {showLoginPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowLoginPopup(false)}
          />

          {/* Login Popup */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-50 to-slate-50 px-6 py-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Login Required</h2>
                </div>
                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  You need to be logged in to add items to your cart. Please login or create an account to continue shopping.
                </p>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm text-teal-900">
                    <strong>Why login?</strong>
                  </p>
                  <ul className="text-xs text-teal-800 mt-2 space-y-1 ml-2">
                    <li>✓ Save your cart</li>
                    <li>✓ Faster checkout</li>
                    <li>✓ Track your orders</li>
                    <li>✓ Manage preferences</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
                <a
                  href="/login"
                  className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Go to Login
                </a>

                <a
                  href="/register"
                  className="block w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  Create Account
                </a>

                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="w-full text-slate-600 hover:text-slate-900 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}