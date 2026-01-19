'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from './components/ProductCard';
import { useShopCart, CartItem } from "../../contexts/ShopCartContext";

// Helper function to get product image URL
const getProductImageUrl = (product: any): string => {
  // Try med_image_path first (from API)
  if (product.med_image_path && typeof product.med_image_path === 'string') {
    if (product.med_image_path.trim()) {
      return product.med_image_path;
    }
  }
  
  // Try image_url
  if (product.image_url && typeof product.image_url === 'string') {
    if (product.image_url.trim()) {
      return product.image_url;
    }
  }
  
  // Default fallback
  return 'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
};

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
  med_image_path?: string;
  flavors?: any[] | string[];
  variants?: string | string[];
  product_code?: string;
  batch_id?: string;
  med_measurements?: string;
  enable_product?: string | number;
  bus_title?: string;
  business_url?: string;
  business_user_id?: string;
  page_id?: string;
  is_sample?: string | number;
  med_image?: string;
}

interface Category {
  cat_id: string;
  cat_name: string;
  sub?: Category[];
}

interface PageCache {
  products: Product[];
  total: number;
  totalPages: number;
}

export default function PageContent() {
  const { addToCart } = useShopCart();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedSeller, setSelectedSeller] = useState('All');
  
  // Pagination state - 30 products per page (from API)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 30; // Display 30 per page (API limit)

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cache for page data to avoid redundant API calls
  const pageCache = useRef<Map<number, PageCache>>(new Map());
  const lastTotalRef = useRef<number>(0);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
    fetchCategories();
  }, []);

  // Apply filters when products, search, category, sort, or seller changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [products, searchTerm, selectedCategory, sortBy, selectedSeller]);

  // Fetch products for a specific page with caching
  const fetchProducts = async (page: number = 1) => {
    try {
      // Check if page is already cached
      const cachedPage = pageCache.current.get(page);
      if (cachedPage) {
        console.log(`📦 Using cached data for page ${page}`);
        setProducts(cachedPage.products);
        setTotalProducts(cachedPage.total);
        setTotalPages(cachedPage.totalPages);
        setCurrentPage(page);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`📥 Fetching products for page ${page}...`);

      // Try multiple possible endpoints
      let response;
      const endpoints = [
        `/api/business/business-products?page=${page}&limit=30`,
        `/api/business/products?page=${page}&limit=30`,
        `/api/products?page=${page}&limit=30`,
        `/api/shop/products?page=${page}&limit=30`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success! Endpoint: ${endpoint}`);
          break;
        } catch (err) {
          lastError = err;
          console.log(`❌ Failed: ${endpoint}`);
          continue;
        }
      }

      if (!response) {
        throw lastError;
      }

      let productsData: Product[] = [];
      let total = 0;

      // Parse response based on structure
      if (response.data.data?.products && Array.isArray(response.data.data.products)) {
        productsData = response.data.data.products;
        total = response.data.data.total || 0;
        console.log(`✅ Extracted from: data.data.products`);
      } else if (response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
        total = response.data.total || 0;
        console.log(`✅ Extracted from: data.products`);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        total = response.data.total || 0;
        console.log(`✅ Extracted from: data.data`);
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
        total = response.data.length;
        console.log(`✅ Extracted from: direct array`);
      }

      console.log(`📊 Page ${page}: ${productsData.length} products received`);
      console.log(`📊 Total available: ${total}`);

      // Filter only enabled products
      const enabledProducts = productsData.filter(
        (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
      );

      console.log(`✅ Enabled products: ${enabledProducts.length}`);

      // Calculate total pages
      const calculatedTotalPages = total > 0 ? Math.ceil(total / 30) : 1;

      // Store in cache
      const cacheData: PageCache = {
        products: enabledProducts,
        total: total,
        totalPages: calculatedTotalPages,
      };
      pageCache.current.set(page, cacheData);

      // Check if total changed - if so, clear cache and update pagination
      if (lastTotalRef.current !== 0 && lastTotalRef.current !== total) {
        console.log(`⚠️ Total products changed from ${lastTotalRef.current} to ${total}. Updating pagination...`);
        pageCache.current.clear();
        pageCache.current.set(page, cacheData);
      }

      lastTotalRef.current = total;

      setProducts(enabledProducts);
      setTotalProducts(total);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('❌ Error fetching products:', err.message);
      console.error('Error response:', err.response?.data);
      
      setError(err.message || 'Failed to fetch products');
      toast.error('Failed to load products', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log('📥 Fetching categories...');
      const response = await axios.get('/api/business/non-empty-categories');
      
      if (response.data.data) {
        const categoryArray = Object.values(response.data.data) as Category[];
        setCategories(categoryArray);
        console.log(`✅ Loaded ${categoryArray.length} categories`);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Extract unique sellers from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueSellers = Array.from(
        new Set(
          products
            .filter((p) => p.bus_title && p.bus_title.trim())
            .map((p) => p.bus_title)
        )
      ).sort() as string[];
      setSellers(uniqueSellers);
      console.log(`✅ Extracted ${uniqueSellers.length} unique sellers`);
    }
  }, [products]);

  // Apply filters and sort
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.cat_name === selectedCategory);
    }

    // Filter by seller
    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.p_offer_price || '0') - parseFloat(b.p_offer_price || '0'));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.p_offer_price || '0') - parseFloat(a.p_offer_price || '0'));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy, selectedSeller]);

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const nextPage = currentPage - 1;
      const isCached = pageCache.current.has(nextPage);
      console.log(`⬅️ ${isCached ? '📦 Using cached' : '📥 Fetching'} page ${nextPage}`);
      fetchProducts(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const isCached = pageCache.current.has(nextPage);
      console.log(`➡️ ${isCached ? '📦 Using cached' : '📥 Fetching'} page ${nextPage}`);
      fetchProducts(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
	  console.log(product);
    const cartItem: CartItem = {
      productId: product.product_id,
      cartItemId: product.product_id,
      productName: product.name,
      price: parseFloat(product.p_offer_price || '0'),
      brand: product.cat_name,
      quantity: 1,
      imageUrl: getProductImageUrl(product),
      business: product.bus_title,
      business_user_id: product.business_user_id ? parseInt(product.business_user_id, 10) : undefined,
      name: product.name,
      page_id: product.page_id ? parseInt(product.page_id, 10) : undefined,
      is_sample: typeof product.is_sample === 'string' ? parseInt(product.is_sample, 10) : product.is_sample,
      med_image: product.med_image,
    };
    addToCart(cartItem);
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };
  
  // In your product card or add to cart function
	/*const handleAddToCart = (product: any, businessData: any) => {
	  const cartItem = {
		cartItemId: `${product.id}-${Date.now()}`, // Unique ID
		productId: product.id,
		productName: product.title || product.name,
		price: product.price,
		quantity: 1,
		imageUrl: product.image_path || product.imageUrl, // Product image
		business: businessData?.title || "Nature's High",
		businessImage: businessData?.image_path,        // 🆕 Business logo/image
		businessId: businessData?.type_id,              // 🆕 Business ID
	  };

	  addToCart(cartItem);
	  // Show success toast
	  toast.success(`Added to cart from ${businessData?.title}`,{position: 'bottom-right',
      autoClose: 2000,});
	};*/

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Handle previous product in modal
  const handlePreviousProduct = () => {
    const currentIndex = displayProducts.findIndex(
      (p) => p.product_id === selectedProduct?.product_id
    );
    if (currentIndex > 0) {
      setSelectedProduct(displayProducts[currentIndex - 1]);
    }
  };

  // Handle next product in modal
  const handleNextProduct = () => {
    const currentIndex = displayProducts.findIndex(
      (p) => p.product_id === selectedProduct?.product_id
    );
    if (currentIndex < displayProducts.length - 1) {
      setSelectedProduct(displayProducts[currentIndex + 1]);
    }
  };

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  // Calculate current product index and total for modal
  const currentProductIndex = displayProducts.findIndex(
    (p) => p.product_id === selectedProduct?.product_id
  );
  const totalProductsInModal = displayProducts.length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Shop Products</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and add products</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name, category, strain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'All'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-800 dark:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.cat_id}
                onClick={() => setSelectedCategory(cat.cat_name)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  selectedCategory === cat.cat_name
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-800 dark:text-white'
                }`}
              >
                {cat.cat_name}
              </button>
            ))}
          </div>


          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>

            {/* Seller Dropdown */}
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="All">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {displayProducts.length > 0 ? 'filtered results' : `${displayProducts.length} of ${products.length} products`} 
          (from {totalProducts} total products, page {currentPage} of {totalPages} available)
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin mr-2" size={24} />
            <span className="dark:text-white">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">Error</h3>
              <p className="text-red-500 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* No Products State */}
        {!loading && !error && displayProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No products found</p>
          </div>
        )}

        {/* Products Grid - Display 30 per page */}
        {!loading && !error && displayProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {displayProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[1/1] overflow-hidden">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-contain hover:scale-105 transition"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                      }}
                    />
                    {product.thc && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                        THC: {product.thc}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.cat_name}</p>
                    <h3 className="font-semibold text-sm dark:text-white line-clamp-2 mb-2">
                      {product.name}
                    </h3>
					{product.bus_title && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">
                        {product.bus_title}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                        ${product.p_offer_price}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {product.i_onhand} in stock
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="flex-1 accent-bg accent-hover text-white py-1 rounded text-sm font-medium transition"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(product);
                        }}
                        className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white py-1 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between py-6 border-t dark:border-slate-800">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
              📦 {totalProducts} total products available • {totalPages} pages
            </div>
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-bold dark:text-white">{selectedProduct.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain hover:scale-105 transition"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                    }}
                  />
                </div>

                {/* Details */}
				
				
                <div className="space-y-4">
					
				
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.cat_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      ${selectedProduct.p_offer_price}
                    </p>
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
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">In Stock</p>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">{selectedProduct.i_onhand}</p>
                  </div>
                </div>
				{/*
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.i_onhand} units</p>
                  </div>

                  {selectedProduct.thc && (
					<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">THC</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedProduct.thc}%</p>
                    </div>
					
                  )}

                  {selectedProduct.cbd && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CBD</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.cbd}%</p>
                    </div>
				)}*/}
                  {selectedProduct.bus_title && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.bus_title}</p>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      handleCloseModal();
                    }}
                    className="w-full accent-bg accent-hover text-white py-2 rounded-lg font-semibold transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.text_parsed && (
                <div className="mt-6 pt-6 border-t dark:border-slate-700">
                  <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedProduct.text_parsed}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Navigation */}
            <div className="sticky bottom-0 flex items-center justify-between p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={handlePreviousProduct}
                disabled={currentProductIndex <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {currentProductIndex + 1} of {totalProductsInModal}
              </span>

              <button
                onClick={handleNextProduct}
                disabled={currentProductIndex >= displayProducts.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}