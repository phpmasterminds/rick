'use client';

import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';

interface ProductDetailModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (quantity: number, selectedVariant?: string, selectedFlavor?: string) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);

  if (!isOpen || !product) return null;

  const price = parseFloat(product.p_offer_price || '0');
  const imageUrl = product.image_url || '/images/placeholder-product.png';

  const flavors = product.flavors
    ? typeof product.flavors === 'string'
      ? product.flavors.split(',').map((f: string) => f.trim())
      : product.flavors
    : [];

  const variants = product.variants
    ? typeof product.variants === 'string'
      ? product.variants.split(',').map((v: string) => v.trim())
      : product.variants
    : [];

  const handleAddToCart = () => {
    onAddToCart(quantity, selectedVariant || undefined, selectedFlavor || undefined);
    setQuantity(1);
    setSelectedVariant('');
    setSelectedFlavor('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />

                {product.is_safe && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded">
                    {product.is_safe}
                  </div>
                )}

                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-700/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 transition-all"
                >
                  <Heart
                    size={20}
                    className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {product.cat_name}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                </div>

                {product.strain && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Strain: <span className="font-medium text-gray-900 dark:text-white">{product.strain}</span>
                    </p>
                  </div>
                )}

                {(product.thc || product.cbd) && (
                  <div className="flex gap-2">
                    {product.thc && (
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-300">THC</p>
                        <p className="font-bold text-green-700 dark:text-green-300">{product.thc}%</p>
                      </div>
                    )}
                    {product.cbd && (
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-300">CBD</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">{product.cbd}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-accent-50 dark:from-accent-900/20 to-accent-100 dark:to-accent-800/20 p-4 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Price</p>
                <p className="text-3xl font-bold text-accent-600 dark:text-accent-400">
                  ${price.toFixed(2)}
                </p>
              </div>

              {product.text_parsed && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {product.text_parsed}
                  </p>
                </div>
              )}

              {variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Variants
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Select option</option>
                    {variants.map((variant: string, idx: number) => (
                      <option key={idx} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {flavors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Flavors
                  </label>
                  <select
                    value={selectedFlavor}
                    onChange={(e) => setSelectedFlavor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Select option</option>
                    {flavors.map((flavor: string, idx: number) => (
                      <option key={idx} value={flavor}>
                        {flavor}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {product.i_onhand && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Available:{' '}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {product.i_onhand} in stock
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full accent-bg accent-hover text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Add to Cart
              </button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                {product.product_code && (
                  <p>
                    <span className="font-medium">SKU:</span> {product.product_code}
                  </p>
                )}
                {product.batch_id && (
                  <p>
                    <span className="font-medium">Batch:</span> {product.batch_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}