'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import { useShopCart, CartItem } from "../../contexts/ShopCartContext";


interface Product {
  product_id: string;
  name: string;
  cat_name: string;
  strain?: string;
  p_offer_price: string;
  i_onhand: string;
  thc?: string;
  cbd?: string;
  is_safe?: string;
  text_parsed?: string;
  image_url?: string;
  flavors?: string | string[];
  variants?: string | string[];
  product_code?: string;
  batch_id?: string;
  med_measurements?: string;
}

interface Category {
  cat_id: string;
  cat_name: string;
}

export default function PageContent() {
  const { addToCart } = useShopCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    setCurrentPage(1);
  }, [products, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
	  setProducts(SAMPLE_PRODUCTS);
/*
      const response = await axios.get(
        `/api/business/products?enable_page=1`
      );

      let productsData: Product[] = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }

      const enabledProducts = productsData.filter(
        (p: any) => p.enable_product === '1' || p.enable_product === 1
      );

      setProducts(enabledProducts);*/
    } catch (err: any) {
      console.error('Error fetching products:', err);

      if (err.response?.status === 404 || err.response?.status === 405) {
        setProducts(SAMPLE_PRODUCTS);
        toast.warning('Using sample data for demo', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch products';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'bottom-center',
          autoClose: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      /*const response = await axios.get(
        `/api/business/categories`
      );

      let categoriesData: Category[] = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }

      setCategories(categoriesData);*/
	  setCategories(SAMPLE_CATEGORIES);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(SAMPLE_CATEGORIES);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.cat_name?.toLowerCase().includes(term) ||
          product.strain?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((product) => product.cat_name === selectedCategory);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort(
          (a, b) =>
            parseFloat(a.p_offer_price || '0') - parseFloat(b.p_offer_price || '0')
        );
        break;
      case 'price-high':
        filtered.sort(
          (a, b) =>
            parseFloat(b.p_offer_price || '0') - parseFloat(a.p_offer_price || '0')
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'default':
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleAddToCart = (quantity: number, variant?: string, flavor?: string) => {
    if (!selectedProduct) return;

    const cartItem: CartItem = {
      cartItemId: `${selectedProduct.product_id}_${Date.now()}`,
      productId: selectedProduct.product_id,
      productName: selectedProduct.name,
      brand: selectedProduct.cat_name,
      price: parseFloat(selectedProduct.p_offer_price || '0'),
      quantity,
      imageUrl: selectedProduct.image_url,
      selectedVariant: variant,
      selectedFlavor: flavor,
      sku: selectedProduct.product_code,
    };

    addToCart(cartItem);
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-accent-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Shop Products
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and add products
        </p>
      </div>

      {error && !products.length && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
              Error Loading Products
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 size-5" />
            <input
              type="text"
              placeholder="Search products by name, category, strain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-accent-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category.cat_id}
                  onClick={() => setSelectedCategory(category.cat_name)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category.cat_name
                      ? 'bg-accent-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.cat_name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="default">Default</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedProducts.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{' '}
          {filteredProducts.length} results
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            No products found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onViewDetails={(prod) => {
                  setSelectedProduct(prod);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-accent-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

// 🛒 COPY THIS ENTIRE CODE AND REPLACE YOUR SAMPLE_PRODUCTS IN pageContent.tsx

const SAMPLE_PRODUCTS = [
  // ========== BUSINESS 1: Nature's High ==========
  {
    product_id: '1',
    name: 'SAP STIX 1.3G * ROSIN INFUSED*',
    cat_name: 'Pre-Rolls',
    p_offer_price: '57.50',
    i_onhand: '10',
    thc: '35-50',
    is_safe: 'MED',
    text_parsed: 'Premium rosin infused pre-roll',
    image_url: 'https://images.unsplash.com/photo-1516382738819-a64cc1b20753?w=400&h=400&fit=crop',
    med_measurements: '1.3G',
    business: "Nature's High",
  },
  {
    product_id: '2',
    name: 'BLUNTZ | 35% - 50% THC | 2 GRAM',
    cat_name: 'Pre-Rolls',
    p_offer_price: '45.00',
    i_onhand: '15',
    thc: '35-50',
    is_safe: 'MED',
    text_parsed: 'High potency blunt wrap',
    image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
    med_measurements: '2G',
    business: "Nature's High",
  },

  // ========== BUSINESS 2: Green Leaf Dispensary ==========
  {
    product_id: '3',
    name: 'CHERRY GARCIA FLOWER | 28% THC',
    cat_name: 'Flower',
    p_offer_price: '65.00',
    i_onhand: '8',
    thc: '25-30',
    cbd: '2-3',
    is_safe: 'MED',
    text_parsed: 'Smooth cherry flavor with balanced effects',
    image_url: 'https://images.unsplash.com/photo-1615849287179-b3e04a78f926?w=400&h=400&fit=crop',
    strain: 'Cherry Garcia',
    med_measurements: 'Eighth (3.5G)',
    business: 'Green Leaf Dispensary',
  },
  {
    product_id: '4',
    name: 'LEMON HAZE EDIBLES | 100MG THC',
    cat_name: 'Edibles',
    p_offer_price: '22.00',
    i_onhand: '25',
    thc: '100',
    is_safe: 'REC',
    text_parsed: 'Tangy lemon flavored gummies, 10 pieces per package',
    image_url: 'https://images.unsplash.com/photo-1599599810694-b3474f00cf43?w=400&h=400&fit=crop',
    strain: 'Lemon Haze',
    med_measurements: '100MG',
    business: 'Green Leaf Dispensary',
  },

  // ========== BUSINESS 3: Premium Cannabis Co ==========
  {
    product_id: '5',
    name: 'CONCENTRATE DIAMONDS | 90% THC',
    cat_name: 'Concentrates',
    p_offer_price: '85.00',
    i_onhand: '5',
    thc: '85-95',
    is_safe: 'MED',
    text_parsed: 'Pure THC-A diamonds for dabbing or infusing',
    image_url: 'https://images.unsplash.com/photo-1585238341710-57b0570b6947?w=400&h=400&fit=crop',
    strain: 'White Widow',
    med_measurements: '1G',
    business: 'Premium Cannabis Co',
  },
  {
    product_id: '6',
    name: 'LIVE RESIN SAUCE | 80% THC',
    cat_name: 'Concentrates',
    p_offer_price: '75.00',
    i_onhand: '12',
    thc: '75-85',
    is_safe: 'MED',
    text_parsed: 'Fresh terpy sauce with cannabinoid crystals',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400&h=400&fit=crop',
    strain: 'Blue Dream',
    med_measurements: '1G',
    business: 'Premium Cannabis Co',
  },
];

const SAMPLE_CATEGORIES = [
  { cat_id: '1', cat_name: 'Flower' },
  { cat_id: '2', cat_name: 'Pre-Rolls' },
  { cat_id: '3', cat_name: 'Edibles' },
  { cat_id: '4', cat_name: 'Concentrates' },
];